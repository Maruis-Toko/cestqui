-- Le jeu est ouvert à tous les effectifs : minimum 2 joueurs (au lieu de 5).
-- Une manche est annulée s'il y a moins de 2 secrets. Avec peu de joueurs, l'anonymat est évidemment plus faible.

create or replace function public._advance(p_round_id uuid) returns public.round_phase
language plpgsql security definer set search_path = '' as $$
declare v_round public.rounds;
begin
  select * into v_round from public.rounds where id = p_round_id for update;
  if not found then raise exception 'round_not_found'; end if;

  if v_round.phase = 'writing' and now() >= v_round.writing_ends_at then
    -- Moins de 2 secrets : l'anonymat serait trivial à percer → manche annulée.
    if v_round.secrets_count < 2 then
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
  if v_count < 2 then raise exception 'not_enough_players'; end if;

  select coalesce(max(number), 0) + 1 into v_number from public.rounds where room_id = p_room_id;

  insert into public.rounds (room_id, number, theme, writing_ends_at, guessing_ends_at, reveal_at)
  values (p_room_id, v_number, v_theme, p_writing_ends_at, p_guessing_ends_at, p_reveal_at)
  returning id into v_round_id;

  update public.rooms set expires_at = greatest(expires_at, now() + interval '30 days') where id = p_room_id;
  return v_round_id;
end $$;
