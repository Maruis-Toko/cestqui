-- 0003_functions.sql — Toute la logique de jeu. Les erreurs sont des CODES (message = code),
-- que l'interface traduit. Toutes les fonctions : SECURITY DEFINER + search_path vide.
-- Points de points : modifier les constantes dans _reveal_round.

-- ---------- Utilitaires internes (non exposés) ----------

create or replace function public._clean_text(p_text text, p_min int, p_max int, p_error text)
returns text language plpgsql immutable set search_path = '' as $$
declare v text := btrim(regexp_replace(coalesce(p_text, ''), '[[:cntrl:]]+', ' ', 'g'));
begin
  if char_length(v) < p_min or char_length(v) > p_max then
    raise exception '%', p_error;
  end if;
  return v;
end $$;

-- Code d'invitation : 6 octets d'un UUID v4 (entièrement aléatoires), 32 symboles → aucun biais.
create or replace function public._generate_room_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  result text := '';
  i int;
begin
  for i in 0..5 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return result;
end $$;

create or replace function public._active_player(p_room_id uuid) returns public.players
language plpgsql stable security definer set search_path = '' as $$
declare v_player public.players;
begin
  select * into v_player from public.players
   where room_id = p_room_id and user_id = (select auth.uid()) and removed_at is null;
  if not found then raise exception 'not_a_member'; end if;
  return v_player;
end $$;

-- ---------- Révélation (appelée seulement par _advance) ----------

create or replace function public._reveal_round(p_round_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c_points_correct   constant int     := 10;   -- bonne devinette
  c_points_ghost     constant int     := 5;    -- secret « fantôme » (auteur introuvable)
  c_ghost_threshold  constant numeric := 0.2;  -- moins de 20 % de bonnes réponses
  c_ghost_min_guesses constant int    := 3;
  v_round public.rounds;
begin
  select * into v_round from public.rounds where id = p_round_id for update;
  if not found or v_round.phase <> 'guessing' then return; end if;  -- idempotent

  insert into public.secret_reveals (secret_id, round_id, author_player_id, correct_count, guess_count)
  select s.id, s.round_id, a.player_id,
         (count(g.id) filter (where g.guessed_player_id = a.player_id))::int,
         count(g.id)::int
    from public.secrets s
    join public.secret_authors a on a.secret_id = s.id
    left join public.guesses g on g.secret_id = s.id
   where s.round_id = p_round_id and not s.hidden   -- un secret masqué n'est jamais révélé
   group by s.id, s.round_id, a.player_id
  on conflict (secret_id) do nothing;

  insert into public.round_scores (round_id, player_id, points, correct_guesses, ghost_points)
  select p_round_id, p.id,
         coalesce(c.correct, 0) * c_points_correct + coalesce(gh.ghosts, 0) * c_points_ghost,
         coalesce(c.correct, 0),
         coalesce(gh.ghosts, 0) * c_points_ghost
    from public.players p
    left join (
      select g.guesser_id, count(*)::int as correct
        from public.guesses g
        join public.secret_reveals sr on sr.secret_id = g.secret_id and sr.round_id = p_round_id
       where g.guessed_player_id = sr.author_player_id
       group by g.guesser_id
    ) c on c.guesser_id = p.id
    left join (
      select sr.author_player_id, count(*)::int as ghosts
        from public.secret_reveals sr
       where sr.round_id = p_round_id
         and sr.guess_count >= c_ghost_min_guesses
         and sr.correct_count::numeric / sr.guess_count < c_ghost_threshold
       group by sr.author_player_id
    ) gh on gh.author_player_id = p.id
   where p.room_id = v_round.room_id and p.removed_at is null and p.role in ('host', 'player')
  on conflict (round_id, player_id) do nothing;

  update public.rounds set phase = 'revealed', revealed_at = now() where id = p_round_id;
end $$;

-- ---------- Machine à états, idempotente ----------
-- Calcule la phase attendue d'après l'heure. Rejouer l'appel ne change rien.

create or replace function public._advance(p_round_id uuid) returns public.round_phase
language plpgsql security definer set search_path = '' as $$
declare v_round public.rounds;
begin
  select * into v_round from public.rounds where id = p_round_id for update;
  if not found then raise exception 'round_not_found'; end if;

  if v_round.phase = 'writing' and now() >= v_round.writing_ends_at then
    -- Moins de 3 secrets : l'anonymat serait trivial à percer → manche annulée.
    if v_round.secrets_count < 3 then
      update public.rounds set phase = 'cancelled' where id = p_round_id;
      return 'cancelled'::public.round_phase;
    end if;
    update public.rounds set phase = 'guessing' where id = p_round_id;
    v_round.phase := 'guessing'::public.round_phase;
  end if;

  if v_round.phase = 'guessing' and now() >= v_round.reveal_at then
    perform public._reveal_round(p_round_id);
    return 'revealed'::public.round_phase;
  end if;

  return v_round.phase;
end $$;

-- Filet de sécurité pour pg_cron (voir 0005).
create or replace function public.advance_due_rounds() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in
    select id from public.rounds
     where (phase = 'writing' and now() >= writing_ends_at)
        or (phase = 'guessing' and now() >= reveal_at)
  loop
    perform public._advance(r.id);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.purge_expired_rooms() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  delete from public.rooms where expires_at < now();
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- API appelée par l'application ----------

create or replace function public.create_room(p_name text, p_nickname text, p_emoji text)
returns table (out_room_id uuid, out_code text)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_name text; v_nick text; v_emoji text;
  v_code text; v_room_id uuid; v_attempts int := 0;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_name  := public._clean_text(p_name, 2, 40, 'invalid_room_name');
  v_nick  := public._clean_text(p_nickname, 2, 20, 'invalid_nickname');
  v_emoji := public._clean_text(p_emoji, 1, 16, 'invalid_emoji');

  if (select count(*) from public.rooms r where r.host_user_id = v_uid and r.expires_at > now()) >= 5 then
    raise exception 'too_many_rooms';
  end if;

  loop
    v_code := public._generate_room_code();
    begin
      insert into public.rooms (code, name, host_user_id)
      values (v_code, v_name, v_uid) returning id into v_room_id;
      exit;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts >= 5 then raise exception 'code_generation_failed'; end if;
    end;
  end loop;

  insert into public.players (room_id, user_id, nickname, emoji, role)
  values (v_room_id, v_uid, v_nick, v_emoji, 'host'::public.player_role);

  return query select v_room_id, v_code;
end $$;

-- Aperçu pour l'écran d'invitation (nom, nombre de joueurs). Réservé aux utilisateurs connectés (même anonymes).
create or replace function public.get_room_preview(p_code text)
returns table (out_name text, out_player_count int, out_max_players int, out_is_member boolean)
language sql stable security definer set search_path = '' as $$
  select r.name,
         (select count(*)::int from public.players p where p.room_id = r.id and p.removed_at is null),
         r.max_players,
         public.is_room_member(r.id)
    from public.rooms r
   where r.code = upper(btrim(coalesce(p_code, ''))) and r.expires_at > now();
$$;

create or replace function public.join_room(p_code text, p_nickname text, p_emoji text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_room public.rooms; v_player public.players;
  v_nick text; v_emoji text; v_count int; v_active public.round_phase; v_role public.player_role;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_room from public.rooms
   where code = upper(btrim(coalesce(p_code, ''))) for update;   -- verrou : pas de dépassement de capacité
  if not found or v_room.expires_at <= now() then raise exception 'room_not_found'; end if;

  select * into v_player from public.players where room_id = v_room.id and user_id = v_uid;
  if found then
    if v_player.removed_at is not null then raise exception 'removed_from_room'; end if;
    return v_room.id;   -- déjà membre
  end if;

  v_nick  := public._clean_text(p_nickname, 2, 20, 'invalid_nickname');
  v_emoji := public._clean_text(p_emoji, 1, 16, 'invalid_emoji');

  select count(*) into v_count from public.players where room_id = v_room.id and removed_at is null;
  if v_count >= v_room.max_players then raise exception 'room_full'; end if;

  if exists (select 1 from public.players
              where room_id = v_room.id and removed_at is null and lower(nickname) = lower(v_nick)) then
    raise exception 'nickname_taken';
  end if;

  -- Arrivée pendant les devinettes : spectateur jusqu'à la prochaine manche.
  select r.phase into v_active from public.rounds r
   where r.room_id = v_room.id and r.phase in ('writing', 'guessing') limit 1;
  v_role := case when v_active = 'guessing' then 'spectator'::public.player_role
                 else 'player'::public.player_role end;

  insert into public.players (room_id, user_id, nickname, emoji, role)
  values (v_room.id, v_uid, v_nick, v_emoji, v_role);

  return v_room.id;
end $$;

create or replace function public.start_round(
  p_room_id uuid, p_theme text,
  p_writing_ends_at timestamptz, p_guessing_ends_at timestamptz, p_reveal_at timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_room public.rooms; v_theme text; v_count int; v_number int; v_round_id uuid;
begin
  if not public.is_room_host(p_room_id) then raise exception 'not_host'; end if;

  select * into v_room from public.rooms where id = p_room_id for update;
  if not found or v_room.expires_at <= now() then raise exception 'room_not_found'; end if;

  v_theme := public._clean_text(p_theme, 2, 80, 'invalid_theme');

  if exists (select 1 from public.rounds where room_id = p_room_id and phase in ('writing', 'guessing')) then
    raise exception 'round_in_progress';
  end if;

  if not (now() < p_writing_ends_at and p_writing_ends_at < p_guessing_ends_at
          and p_guessing_ends_at <= p_reveal_at and p_reveal_at <= now() + interval '14 days') then
    raise exception 'invalid_schedule';
  end if;

  update public.players set role = 'player'
   where room_id = p_room_id and role = 'spectator' and removed_at is null;

  select count(*) into v_count from public.players
   where room_id = p_room_id and removed_at is null and role in ('host', 'player');
  if v_count < 5 then raise exception 'not_enough_players'; end if;

  select coalesce(max(number), 0) + 1 into v_number from public.rounds where room_id = p_room_id;

  insert into public.rounds (room_id, number, theme, writing_ends_at, guessing_ends_at, reveal_at)
  values (p_room_id, v_number, v_theme, p_writing_ends_at, p_guessing_ends_at, p_reveal_at)
  returning id into v_round_id;

  update public.rooms set expires_at = greatest(expires_at, now() + interval '30 days') where id = p_room_id;
  return v_round_id;
end $$;

create or replace function public.advance_round(p_round_id uuid) returns public.round_phase
language plpgsql security definer set search_path = '' as $$
declare v_room_id uuid;
begin
  select room_id into v_room_id from public.rounds where id = p_round_id;
  if v_room_id is null or not public.is_room_member(v_room_id) then raise exception 'round_not_found'; end if;
  return public._advance(p_round_id);
end $$;

-- L'hôte peut clore la phase en cours plus tôt.
create or replace function public.host_advance_round(p_round_id uuid) returns public.round_phase
language plpgsql security definer set search_path = '' as $$
declare v_round public.rounds;
begin
  select * into v_round from public.rounds where id = p_round_id for update;
  if not found or not public.is_room_host(v_round.room_id) then raise exception 'not_host'; end if;

  if v_round.phase = 'writing' then
    update public.rounds set writing_ends_at = least(writing_ends_at, now()) where id = p_round_id;
  elsif v_round.phase = 'guessing' then
    update public.rounds
       set guessing_ends_at = least(guessing_ends_at, now()), reveal_at = least(reveal_at, now())
     where id = p_round_id;
  end if;
  return public._advance(p_round_id);
end $$;

create or replace function public.submit_secret(p_round_id uuid, p_body text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_room_id uuid; v_round public.rounds; v_player public.players; v_body text; v_secret_id uuid;
begin
  select room_id into v_room_id from public.rounds where id = p_round_id;
  if v_room_id is null then raise exception 'round_not_found'; end if;

  v_player := public._active_player(v_room_id);
  if v_player.role = 'spectator' then raise exception 'spectator_cannot_play'; end if;

  perform public._advance(p_round_id);
  select * into v_round from public.rounds where id = p_round_id;
  if v_round.phase <> 'writing' or now() >= v_round.writing_ends_at then raise exception 'writing_closed'; end if;

  v_body := public._clean_text(p_body, 3, 280, 'invalid_secret');

  select a.secret_id into v_secret_id from public.secret_authors a
   where a.round_id = p_round_id and a.player_id = v_player.id;

  if found then
    update public.secrets set body = v_body where id = v_secret_id;   -- modifiable pendant l'écriture
  else
    insert into public.secrets (round_id, body) values (p_round_id, v_body) returning id into v_secret_id;
    insert into public.secret_authors (secret_id, round_id, player_id) values (v_secret_id, p_round_id, v_player.id);
    update public.rounds set secrets_count = secrets_count + 1 where id = p_round_id;
  end if;
  return v_secret_id;
end $$;

-- Pour retrouver SON secret (l'hôte voit tous les textes, donc ne peut pas se repérer par la lecture seule).
create or replace function public.get_my_secret(p_round_id uuid)
returns table (out_secret_id uuid, out_body text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.body
    from public.secret_authors a
    join public.secrets s on s.id = a.secret_id
    join public.players p on p.id = a.player_id
   where a.round_id = p_round_id and p.user_id = (select auth.uid()) and p.removed_at is null;
$$;

create or replace function public.submit_guess(p_secret_id uuid, p_guessed_player_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_secret public.secrets; v_round public.rounds;
  v_player public.players; v_target public.players; v_author uuid;
begin
  select * into v_secret from public.secrets where id = p_secret_id;
  if not found then raise exception 'secret_not_found'; end if;
  select * into v_round from public.rounds where id = v_secret.round_id;

  v_player := public._active_player(v_round.room_id);
  if v_player.role = 'spectator' then raise exception 'spectator_cannot_play'; end if;

  perform public._advance(v_round.id);
  select * into v_round from public.rounds where id = v_round.id;
  if v_round.phase <> 'guessing' or now() >= v_round.guessing_ends_at then raise exception 'guessing_closed'; end if;
  if v_secret.hidden then raise exception 'secret_hidden'; end if;

  select player_id into v_author from public.secret_authors where secret_id = p_secret_id;
  if v_author = v_player.id then raise exception 'own_secret'; end if;

  select * into v_target from public.players
   where id = p_guessed_player_id and room_id = v_round.room_id
     and removed_at is null and role in ('host', 'player');
  if not found or v_target.id = v_player.id then raise exception 'invalid_guess_target'; end if;

  begin
    insert into public.guesses (secret_id, guesser_id, guessed_player_id)
    values (p_secret_id, v_player.id, v_target.id);
  exception when unique_violation then
    raise exception 'already_guessed';
  end;

  update public.rounds set guesses_count = guesses_count + 1 where id = v_round.id;
end $$;

create or replace function public.report_secret(p_secret_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_secret public.secrets; v_round public.rounds; v_player public.players; v_reason text;
begin
  select * into v_secret from public.secrets where id = p_secret_id;
  if not found then raise exception 'secret_not_found'; end if;
  select * into v_round from public.rounds where id = v_secret.round_id;

  v_player := public._active_player(v_round.room_id);
  if v_round.phase not in ('guessing', 'revealed') then raise exception 'secret_not_visible'; end if;
  v_reason := public._clean_text(p_reason, 2, 200, 'invalid_reason');

  insert into public.reports (secret_id, reporter_id, reason)
  values (p_secret_id, v_player.id, v_reason)
  on conflict (secret_id, reporter_id) do nothing;

  -- 3 signalements distincts : masqué automatiquement.
  if (select count(*) from public.reports where secret_id = p_secret_id) >= 3 then
    update public.secrets set hidden = true where id = p_secret_id;
  end if;
end $$;

create or replace function public.host_set_secret_hidden(p_secret_id uuid, p_hidden boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_room_id uuid;
begin
  select r.room_id into v_room_id
    from public.secrets s join public.rounds r on r.id = s.round_id where s.id = p_secret_id;
  if v_room_id is null or not public.is_room_host(v_room_id) then raise exception 'not_host'; end if;
  update public.secrets set hidden = p_hidden where id = p_secret_id;
end $$;

create or replace function public.remove_player(p_player_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_target public.players;
begin
  select * into v_target from public.players where id = p_player_id;
  if not found or not public.is_room_host(v_target.room_id) then raise exception 'not_host'; end if;
  if v_target.role = 'host' then raise exception 'cannot_remove_host'; end if;
  update public.players set removed_at = now() where id = p_player_id;
end $$;

create or replace function public.delete_room(p_room_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_room_host(p_room_id) then raise exception 'not_host'; end if;
  delete from public.rooms where id = p_room_id;
end $$;