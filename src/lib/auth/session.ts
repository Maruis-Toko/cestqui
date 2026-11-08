// Côté navigateur uniquement.
import type { SupabaseClient } from "@supabase/supabase-js"
import { GameError } from "@/lib/game/api"

/** Lecture locale (rapide) : sert à décider s'il faut ouvrir une session, jamais à autoriser quoi que ce soit. */
export async function hasSession(sb: SupabaseClient): Promise<boolean> {
  const { data } = await sb.auth.getSession()
  return Boolean(data.session)
}

/** Les jetons Turnstile sont à usage unique : un jeton par connexion. */
export async function signInAnonymously(sb: SupabaseClient, captchaToken: string): Promise<void> {
  const { error } = await sb.auth.signInAnonymously({ options: { captchaToken } })
  if (error) throw new GameError("auth_failed")
}
