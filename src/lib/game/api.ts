// Appels RPC vers les fonctions SQL (0003_functions). Utilisable côté navigateur et côté serveur.
// Les erreurs SQL sont des codes (ex. « own_secret ») : on les convertit en GameError.
import type { SupabaseClient } from "@supabase/supabase-js"
import { fr } from "@/lib/messages"

export class GameError extends Error {
  constructor(public code: string) {
    super(code)
    this.name = "GameError"
  }
}

function toGameError(message: string): GameError {
  return new GameError(message in fr.errors ? message : "unexpected")
}

async function call<T>(
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T> {
  const { data, error } = await query
  if (error) throw toGameError(error.message)
  return data as T
}

export async function createRoom(
  sb: SupabaseClient,
  a: { name: string; nickname: string; emoji: string }
) {
  const rows = await call<{ out_room_id: string; out_code: string }[]>(
    sb.rpc("create_room", { p_name: a.name, p_nickname: a.nickname, p_emoji: a.emoji })
  )
  const row = rows?.[0]
  if (!row) throw new GameError("unexpected")
  return { roomId: row.out_room_id, code: row.out_code }
}

export async function getRoomPreview(sb: SupabaseClient, code: string) {
  const rows = await call<
    { out_name: string; out_player_count: number; out_max_players: number; out_is_member: boolean }[]
  >(sb.rpc("get_room_preview", { p_code: code }))
  const row = rows?.[0]
  if (!row) return null
  return {
    name: row.out_name,
    playerCount: row.out_player_count,
    maxPlayers: row.out_max_players,
    isMember: row.out_is_member,
  }
}

export const joinRoom = (sb: SupabaseClient, a: { code: string; nickname: string; emoji: string }) =>
  call<string>(sb.rpc("join_room", { p_code: a.code, p_nickname: a.nickname, p_emoji: a.emoji }))

export const startRound = (
  sb: SupabaseClient,
  a: { roomId: string; theme: string; writingEndsAt: Date; guessingEndsAt: Date; revealAt: Date }
) =>
  call<string>(
    sb.rpc("start_round", {
      p_room_id: a.roomId,
      p_theme: a.theme,
      p_writing_ends_at: a.writingEndsAt.toISOString(),
      p_guessing_ends_at: a.guessingEndsAt.toISOString(),
      p_reveal_at: a.revealAt.toISOString(),
    })
  )

export const submitSecret = (sb: SupabaseClient, roundId: string, body: string) =>
  call<string>(sb.rpc("submit_secret", { p_round_id: roundId, p_body: body }))

export async function getMySecret(sb: SupabaseClient, roundId: string) {
  const rows = await call<{ out_secret_id: string; out_body: string }[]>(
    sb.rpc("get_my_secret", { p_round_id: roundId })
  )
  const row = rows?.[0]
  return row ? { id: row.out_secret_id, body: row.out_body } : null
}

export const submitGuess = (sb: SupabaseClient, secretId: string, guessedPlayerId: string) =>
  call<null>(sb.rpc("submit_guess", { p_secret_id: secretId, p_guessed_player_id: guessedPlayerId }))

export const advanceRound = (sb: SupabaseClient, roundId: string) =>
  call<string>(sb.rpc("advance_round", { p_round_id: roundId }))

export const hostAdvanceRound = (sb: SupabaseClient, roundId: string) =>
  call<string>(sb.rpc("host_advance_round", { p_round_id: roundId }))

export const reportSecret = (sb: SupabaseClient, secretId: string, reason: string) =>
  call<null>(sb.rpc("report_secret", { p_secret_id: secretId, p_reason: reason }))

export const hostSetSecretHidden = (sb: SupabaseClient, secretId: string, hidden: boolean) =>
  call<null>(sb.rpc("host_set_secret_hidden", { p_secret_id: secretId, p_hidden: hidden }))
