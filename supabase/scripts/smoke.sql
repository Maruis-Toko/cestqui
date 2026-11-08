-- smoke.sql — Test de bout en bout d'une manche complète, avec 7 faux utilisateurs.
-- ⚠️ À lancer sur un projet de DÉVELOPPEMENT (jamais en production). Tout est annulé à la fin (rollback).
-- Lancement : psql "$DB_URL" -f supabase/tests/smoke.sql   (ou coller dans l'éditeur SQL de Supabase)
-- Succès = message « OK : tous les tests sont passes ». Échec = « TEST FAILED : … ».

begin;

-- Aides : usurper un utilisateur (rôle `authenticated` + JWT), revenir admin, attendre une erreur précise.
create function public.__t_as(p_uid uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'is_anonymous', false)::text, true);
  execute 'set local role authenticated';
end $$;

create function public.__t_admin() returns void language plpgsql as $$
begin execute 'reset role'; end $$;

create function public.__t_expect(p_sql text, p_expected text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'TEST FAILED: erreur attendue % mais la requete a reussi : %', p_expected, p_sql;
exception when others then
  if sqlerrm = p_expected or sqlstate = p_expected then return; end if;
  raise exception 'TEST FAILED: attendu %, obtenu % (%) pour : %', p_expected, sqlerrm, sqlstate, p_sql;
end $$;

grant execute on function public.__t_as(uuid), public.__t_admin(), public.__t_expect(text, text) to authenticated;

do $$
declare
  u   uuid[] := array(select gen_random_uuid() from generate_series(1, 7));
  pid uuid[] := '{}';
  v_room_id uuid; v_code text; v_round_id uuid; v_phase public.round_phase;
  v_tmp uuid; v_own uuid; v_s3 uuid; v_s4 uuid; v_s5 uuid; v_n int; i int;
begin
  -- 0. Utilisateurs de test
  perform public.__t_admin();
  for i in 1..7 loop
    insert into auth.users (id, aud, role, email)
    values (u[i], 'authenticated', 'authenticated', 'cestqui-test-' || i || '@example.invalid');
  end loop;

  -- 1. Salon (u1 = hôte) + 5 joueurs
  perform public.__t_as(u[1]);
  select out_room_id, out_code into v_room_id, v_code from public.create_room('Salon test', 'Host', '😎');
  for i in 2..6 loop
    perform public.__t_as(u[i]);
    perform public.join_room(v_code, 'Joueur' || i, '🙂');
  end loop;

  perform public.__t_as(u[7]);
  perform public.__t_expect(format('select public.join_room(%L, %L, %L)', v_code, 'joueur2', '🙂'), 'nickname_taken');
  perform public.__t_expect(format('select public.join_room(%L, %L, %L)', 'ZZZZZZ', 'Autre', '🙂'), 'room_not_found');

  -- 2. Démarrage : seul l'hôte peut lancer
  perform public.__t_as(u[2]);
  perform public.__t_expect(format(
    'select public.start_round(%L, %L, now() + interval ''1 day'', now() + interval ''2 days'', now() + interval ''2 days'')',
    v_room_id, 'Theme'), 'not_host');
  perform public.__t_as(u[1]);
  v_round_id := public.start_round(v_room_id, 'Confessions',
    now() + interval '1 day', now() + interval '2 days', now() + interval '2 days');

  -- 3. Écriture
  for i in 1..6 loop
    perform public.__t_as(u[i]);
    perform public.submit_secret(v_round_id, 'Secret numero ' || i);
  end loop;
  perform public.__t_as(u[2]);
  perform public.submit_secret(v_round_id, 'Secret numero 2 modifie');   -- modification, pas un doublon

  select count(*) into v_n from public.secrets;
  if v_n <> 1 then raise exception 'TEST FAILED: un joueur ne doit voir que son secret pendant l ecriture (vu: %)', v_n; end if;
  perform public.__t_as(u[1]);
  select count(*) into v_n from public.secrets;
  if v_n <> 6 then raise exception 'TEST FAILED: l hote doit voir les 6 textes (vu: %)', v_n; end if;
  perform public.__t_expect('select * from public.secret_authors', '42501');   -- permission refusee
  perform public.__t_admin();
  select secrets_count into v_n from public.rounds where id = v_round_id;
  if v_n <> 6 then raise exception 'TEST FAILED: secrets_count doit valoir 6 (obtenu: %)', v_n; end if;

  -- 4. Passage en devinettes (now() est fige dans la transaction : on « voyage dans le temps » par les dates)
  update public.rounds set writing_ends_at = now() - interval '1 minute' where id = v_round_id;
  perform public.__t_as(u[2]);
  v_phase := public.advance_round(v_round_id);
  if v_phase <> 'guessing' then raise exception 'TEST FAILED: phase attendue guessing, obtenue %', v_phase; end if;
  select count(*) into v_n from public.secrets;
  if v_n <> 6 then raise exception 'TEST FAILED: les 6 secrets doivent etre visibles en devinettes (vu: %)', v_n; end if;

  perform public.__t_admin();
  for i in 1..6 loop
    select id into v_tmp from public.players where room_id = v_room_id and user_id = u[i];
    pid[i] := v_tmp;
  end loop;
  select secret_id into v_s3 from public.secret_authors where player_id = pid[3];
  select secret_id into v_s4 from public.secret_authors where player_id = pid[4];
  select secret_id into v_s5 from public.secret_authors where player_id = pid[5];

  -- 5. Devinettes (u2)
  perform public.__t_as(u[2]);
  select out_secret_id into v_own from public.get_my_secret(v_round_id);
  perform public.__t_expect(format('select public.submit_guess(%L, %L)', v_own, pid[3]), 'own_secret');
  perform public.submit_guess(v_s3, pid[3]);   -- bonne reponse
  perform public.submit_guess(v_s4, pid[5]);   -- mauvaise reponse
  perform public.__t_expect(format('select public.submit_guess(%L, %L)', v_s3, pid[4]), 'already_guessed');
  perform public.__t_expect(format('select public.submit_guess(%L, %L)', v_s5, pid[2]), 'invalid_guess_target');

  -- Avant la revelation : u3 ne voit ni les devinettes des autres ni les auteurs
  perform public.__t_as(u[3]);
  select count(*) into v_n from public.guesses;
  if v_n <> 0 then raise exception 'TEST FAILED: devinettes d autrui visibles avant revelation (vu: %)', v_n; end if;
  select count(*) into v_n from public.secret_reveals;
  if v_n <> 0 then raise exception 'TEST FAILED: auteurs visibles avant revelation (vu: %)', v_n; end if;

  -- 6. Revelation
  perform public.__t_admin();
  update public.rounds
     set guessing_ends_at = now() - interval '1 minute', reveal_at = now() - interval '1 minute'
   where id = v_round_id;
  perform public.__t_as(u[3]);
  v_phase := public.advance_round(v_round_id);
  if v_phase <> 'revealed' then raise exception 'TEST FAILED: phase attendue revealed, obtenue %', v_phase; end if;

  select count(*) into v_n from public.secret_reveals;
  if v_n <> 6 then raise exception 'TEST FAILED: 6 revelations attendues (vu: %)', v_n; end if;
  select count(*) into v_n from public.guesses;
  if v_n <> 2 then raise exception 'TEST FAILED: 2 devinettes visibles apres revelation (vu: %)', v_n; end if;
  select count(*) into v_n from public.round_scores;
  if v_n <> 6 then raise exception 'TEST FAILED: 6 lignes de score attendues (vu: %)', v_n; end if;
  select total_points into v_n from public.room_leaderboard where player_id = pid[2];
  if v_n is distinct from 10 then raise exception 'TEST FAILED: u2 doit avoir 10 points (obtenu: %)', v_n; end if;

  -- 7. Apres la revelation, plus de devinette possible
  perform public.__t_as(u[4]);
  perform public.__t_expect(format('select public.submit_guess(%L, %L)', v_s3, pid[5]), 'guessing_closed');

  perform public.__t_admin();
  raise notice 'OK : tous les tests sont passes';
end $$;

rollback;