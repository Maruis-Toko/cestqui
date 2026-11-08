-- 0001_schema.sql — « C'est Qui ? » : tables, types, index.
-- Les règles d'accès (RLS) sont dans 0002, les fonctions de jeu dans 0003.

create type public.player_role as enum ('host', 'player', 'spectator');
create type public.round_phase as enum ('writing', 'guessing', 'revealed', 'cancelled');

create table public.rooms (
  id           uuid primary key default gen_random_uuid(),
  -- 6 caractères sans I, O, 0, 1 (ambigus) : ~1 milliard de combinaisons.
  code         text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  name         text not null check (char_length(name) between 2 and 40),
  host_user_id uuid not null references auth.users (id) on delete cascade,
  max_players  int  not null default 20 check (max_players between 5 and 20),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '30 days'
);

create table public.players (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  nickname   text not null check (char_length(nickname) between 2 and 20),
  emoji      text not null check (char_length(emoji) between 1 and 16),
  role       public.player_role not null default 'player',
  joined_at  timestamptz not null default now(),
  removed_at timestamptz,
  unique (room_id, user_id)
);
create unique index players_room_nickname_uniq
  on public.players (room_id, lower(nickname)) where removed_at is null;
create index players_user_idx on public.players (user_id);

create table public.rounds (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid not null references public.rooms (id) on delete cascade,
  number          int  not null,
  theme           text not null check (char_length(theme) between 2 and 80),
  phase           public.round_phase not null default 'writing',
  writing_ends_at timestamptz not null,
  guessing_ends_at timestamptz not null,
  reveal_at       timestamptz not null,
  -- Compteurs publics (jamais de noms) : diffusés en temps réel via la table.
  secrets_count   int not null default 0,
  guesses_count   int not null default 0,
  revealed_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (room_id, number),
  check (writing_ends_at <= guessing_ends_at and guessing_ends_at <= reveal_at)
);
-- Une seule manche active par salon.
create unique index rounds_one_active_per_room
  on public.rounds (room_id) where phase in ('writing', 'guessing');

create table public.secrets (
  id         uuid primary key default gen_random_uuid(),
  round_id   uuid not null references public.rounds (id) on delete cascade,
  body       text not null check (char_length(body) between 3 and 280),
  hidden     boolean not null default false,  -- masqué par modération
  created_at timestamptz not null default now()
);
create index secrets_round_idx on public.secrets (round_id);

-- LA table sensible : aucun client ne peut jamais la lire (voir 0002).
create table public.secret_authors (
  secret_id uuid primary key references public.secrets (id) on delete cascade,
  round_id  uuid not null references public.rounds (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  unique (round_id, player_id)  -- un secret par joueur et par manche
);

create table public.guesses (
  id                uuid primary key default gen_random_uuid(),
  secret_id         uuid not null references public.secrets (id) on delete cascade,
  guesser_id        uuid not null references public.players (id) on delete cascade,
  guessed_player_id uuid not null references public.players (id) on delete cascade,
  created_at        timestamptz not null default now(),
  unique (secret_id, guesser_id),
  check (guesser_id <> guessed_player_id)
);
create index guesses_guesser_idx on public.guesses (guesser_id);

-- Remplie uniquement à la révélation : c'est ici que l'auteur devient public.
create table public.secret_reveals (
  secret_id        uuid primary key references public.secrets (id) on delete cascade,
  round_id         uuid not null references public.rounds (id) on delete cascade,
  author_player_id uuid not null references public.players (id) on delete cascade,
  correct_count    int not null default 0,
  guess_count      int not null default 0
);
create index secret_reveals_round_idx on public.secret_reveals (round_id);

create table public.round_scores (
  round_id        uuid not null references public.rounds (id) on delete cascade,
  player_id       uuid not null references public.players (id) on delete cascade,
  points          int not null default 0,
  correct_guesses int not null default 0,
  ghost_points    int not null default 0,
  primary key (round_id, player_id)
);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  secret_id   uuid not null references public.secrets (id) on delete cascade,
  reporter_id uuid not null references public.players (id) on delete cascade,
  reason      text not null check (char_length(reason) between 2 and 200),
  created_at  timestamptz not null default now(),
  unique (secret_id, reporter_id)
);

-- security_invoker : la vue applique les règles RLS de l'utilisateur qui l'interroge.
create view public.room_leaderboard with (security_invoker = true) as
select r.room_id,
       s.player_id,
       sum(s.points)::int          as total_points,
       sum(s.correct_guesses)::int as correct_guesses,
       sum(s.ghost_points)::int    as ghost_points,
       count(*)::int               as rounds_played
from public.round_scores s
join public.rounds r on r.id = s.round_id
group by r.room_id, s.player_id;