-- 0005_realtime_cron.sql

-- Temps réel : changement de phase, compteurs (rounds) et arrivées (players).
-- Realtime applique les politiques RLS : un client ne reçoit que ce qu'il peut lire.
alter publication supabase_realtime add table public.rounds, public.players;

-- Tâches planifiées (pg_cron). À activer APRÈS avoir activé l'extension pg_cron
-- dans le tableau de bord (Database → Extensions). Vérifier la syntaxe dans la doc Supabase.
--
-- select cron.schedule('cestqui-advance', '*/5 * * * *', $$select public.advance_due_rounds()$$);
-- select cron.schedule('cestqui-purge',   '0 3 * * *',   $$select public.purge_expired_rooms()$$);