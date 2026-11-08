-- 0002_rls.sql — Règles d'accès. Principe : aucune écriture directe, lecture filtrée par RLS.

alter table public.rooms          enable row level security;
alter table public.players        enable row level security;
alter table public.rounds         enable row level security;
alter table public.secrets        enable row level security;
alter table public.secret_authors enable row level security;
alter table public.guesses        enable row level security;
alter table public.secret_reveals enable row level security;
alter table public.round_scores   enable row level security;
alter table public.reports        enable row level security;

-- Privilèges : on part de zéro, puis on ouvre la lecture seulement. Les écritures passent par les fonctions (0003).
revoke all on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;

grant select on public.rooms, public.players, public.rounds, public.secrets, public.guesses,
                public.secret_reveals, public.round_scores, public.reports, public.room_leaderboard
  to authenticated;
-- public.secret_authors : volontairement AUCUN privilège ni politique.

-- Fonctions d'aide. SECURITY DEFINER pour éviter la récursion entre politiques ;
-- search_path vide pour éviter le détournement de fonctions.
create or replace function public.is_room_member(p_room_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.players p
    where p.room_id = p_room_id and p.user_id = (select auth.uid()) and p.removed_at is null
  );
$$;

create or replace function public.is_room_host(p_room_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.players p
    where p.room_id = p_room_id and p.user_id = (select auth.uid())
      and p.role = 'host' and p.removed_at is null
  );
$$;

create or replace function public.owns_secret(p_secret_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.secret_authors a
    join public.players p on p.id = a.player_id
    where a.secret_id = p_secret_id and p.user_id = (select auth.uid()) and p.removed_at is null
  );
$$;

create policy rooms_select on public.rooms for select to authenticated
  using (public.is_room_member(id));

create policy players_select on public.players for select to authenticated
  using (public.is_room_member(room_id));

create policy rounds_select on public.rounds for select to authenticated
  using (public.is_room_member(room_id));

-- Un secret est lisible : par son auteur ; par l'hôte (modération, texte seulement) ;
-- par les membres dès la phase de devinettes, sauf s'il est masqué.
create policy secrets_select on public.secrets for select to authenticated
using (
  public.owns_secret(id)
  or exists (
    select 1 from public.rounds r
    where r.id = secrets.round_id
      and public.is_room_member(r.room_id)
      and (
        public.is_room_host(r.room_id)
        or (r.phase in ('guessing', 'revealed') and not secrets.hidden)
      )
  )
);

-- Ses propres devinettes toujours ; celles de tous une fois la manche révélée.
create policy guesses_select on public.guesses for select to authenticated
using (
  exists (select 1 from public.players p
          where p.id = guesses.guesser_id and p.user_id = (select auth.uid()))
  or exists (select 1 from public.secrets s
             join public.rounds r on r.id = s.round_id
             where s.id = guesses.secret_id and r.phase = 'revealed'
               and public.is_room_member(r.room_id))
);

create policy secret_reveals_select on public.secret_reveals for select to authenticated
using (exists (select 1 from public.rounds r
               where r.id = secret_reveals.round_id and public.is_room_member(r.room_id)));

create policy round_scores_select on public.round_scores for select to authenticated
using (exists (select 1 from public.rounds r
               where r.id = round_scores.round_id and public.is_room_member(r.room_id)));

-- Signalements : visibles par l'hôte et par la personne qui a signalé. Jamais l'auteur du secret.
create policy reports_select on public.reports for select to authenticated
using (
  exists (select 1 from public.secrets s
          join public.rounds r on r.id = s.round_id
          where s.id = reports.secret_id and public.is_room_host(r.room_id))
  or exists (select 1 from public.players p
             where p.id = reports.reporter_id and p.user_id = (select auth.uid()))
);