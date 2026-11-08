-- 0004_grants.sql — Qui peut appeler quoi. Par défaut : personne. À relancer si une fonction est ajoutée.

alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  -- utilisées par les politiques RLS (exécutées avec les droits de l'utilisateur)
  public.is_room_member(uuid),
  public.is_room_host(uuid),
  public.owns_secret(uuid),
  -- API de jeu
  public.create_room(text, text, text),
  public.get_room_preview(text),
  public.join_room(text, text, text),
  public.start_round(uuid, text, timestamptz, timestamptz, timestamptz),
  public.submit_secret(uuid, text),
  public.get_my_secret(uuid),
  public.submit_guess(uuid, uuid),
  public.advance_round(uuid),
  public.host_advance_round(uuid),
  public.report_secret(uuid, text),
  public.host_set_secret_hidden(uuid, boolean),
  public.remove_player(uuid),
  public.delete_room(uuid)
to authenticated;

-- Jamais exposées aux clients : _clean_text, _generate_room_code, _active_player, _advance,
-- _reveal_round, advance_due_rounds, purge_expired_rooms (réservées à pg_cron / propriétaire).