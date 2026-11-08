-- Supabase ne supprime pas automatiquement les comptes anonymes (doc : « Automatic cleanup not available »).
-- On étend la purge nocturne : salons expirés, puis comptes anonymes orphelins (> 2 jours, aucun salon).
create or replace function public.purge_expired_rooms() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  delete from public.rooms where expires_at < now();
  get diagnostics n = row_count;

  delete from auth.users au
   where au.is_anonymous
     and au.created_at < now() - interval '2 days'
     and not exists (select 1 from public.players p where p.user_id = au.id);

  return n;
end $$;
