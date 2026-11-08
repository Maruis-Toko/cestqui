// Chargement serveur de l'état d'un salon. Les lectures passent par RLS : on ne reçoit que ce qu'on a le droit de voir.
import { createClient } from "@/lib/supabase/server"
import { advanceRound, getMySecret } from "@/lib/game/api"
import type {
  GuessRow, LeaderRow, Player, RevealRow, Room, Round, ScoreRow, SecretRow,
} from "@/lib/game/types"

export interface Results {
  reveals: (RevealRow & { body: string })[]
  guesses: GuessRow[]
  roundScores: ScoreRow[]
  leaderboard: LeaderRow[]
}

export interface RoomState {
  room: Room
  players: Player[]
  me: Player
  round: Round | null
  mySecret: { id: string; body: string } | null
  secrets: SecretRow[]
  myGuesses: Record<string, string>
  results: Results | null
  /** Calculé côté serveur, une fois, pour garder le rendu pur. */
  guessingClosed: boolean
}

const ROUND_COLS =
  "id, room_id, number, theme, phase, writing_ends_at, guessing_ends_at, reveal_at, secrets_count, guesses_count"

function isDue(r: Round, now: number) {
  return (
    (r.phase === "writing" && now >= Date.parse(r.writing_ends_at)) ||
    (r.phase === "guessing" && now >= Date.parse(r.reveal_at))
  )
}

/** null = pas connecté, pas membre, ou salon introuvable → l'appelant affiche l'écran d'invitation. */
export async function loadRoom(code: string): Promise<RoomState | null> {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return null

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, code, name, max_players, expires_at")
    .eq("code", code)
    .maybeSingle()
  if (roomError) throw roomError
  if (!room) return null

  const { data: playersData, error: playersError } = await supabase
    .from("players")
    .select("id, user_id, nickname, emoji, role")
    .eq("room_id", room.id)
    .is("removed_at", null)
    .order("joined_at")
  if (playersError) throw playersError
  const players = (playersData ?? []) as Player[]

  const me = players.find((p) => p.user_id === userId)
  if (!me) return null

  const fetchRound = async () => {
    const { data, error } = await supabase
      .from("rounds")
      .select(ROUND_COLS)
      .eq("room_id", room.id)
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return (data ?? null) as Round | null
  }

  let round = await fetchRound()

  // Échéance dépassée : on avance la phase maintenant (idempotent), pour ne pas afficher un écran périmé.
  if (round && isDue(round, Date.now())) {
    try {
      await advanceRound(supabase, round.id)
      round = await fetchRound()
    } catch {
      // le PhaseTicker réessaiera côté navigateur
    }
  }

  const state: RoomState = {
    room: room as Room, players, me, round,
    mySecret: null, secrets: [], myGuesses: {}, results: null,
    guessingClosed: round ? Date.now() >= Date.parse(round.guessing_ends_at) : false,
  }
  if (!round) return state

  if (round.phase === "writing") {
    state.mySecret = await getMySecret(supabase, round.id)
  }

  if (round.phase === "guessing") {
    state.mySecret = await getMySecret(supabase, round.id)
    const [secretsRes, guessesRes] = await Promise.all([
      supabase.from("secrets").select("id, body").eq("round_id", round.id).eq("hidden", false).order("id"),
      supabase.from("guesses").select("secret_id, guessed_player_id"),
    ])
    if (secretsRes.error) throw secretsRes.error
    if (guessesRes.error) throw guessesRes.error
    state.secrets = (secretsRes.data ?? []) as SecretRow[]
    const myGuesses = (guessesRes.data ?? []) as { secret_id: string; guessed_player_id: string }[]
    state.myGuesses = Object.fromEntries(myGuesses.map((g) => [g.secret_id, g.guessed_player_id]))
  }

  if (round.phase === "revealed") {
    const { data: revealsData, error: revealsError } = await supabase
      .from("secret_reveals")
      .select("secret_id, author_player_id, correct_count, guess_count")
      .eq("round_id", round.id)
    if (revealsError) throw revealsError
    const reveals = (revealsData ?? []) as RevealRow[]

    const ids = reveals.map((r) => r.secret_id)
    const [bodiesRes, guessesRes, scoresRes, leaderRes] = await Promise.all([
      supabase.from("secrets").select("id, body").in("id", ids),
      supabase.from("guesses").select("secret_id, guesser_id, guessed_player_id").in("secret_id", ids),
      supabase.from("round_scores").select("player_id, points, correct_guesses, ghost_points").eq("round_id", round.id),
      supabase.from("room_leaderboard").select("player_id, total_points, correct_guesses, ghost_points, rounds_played").eq("room_id", room.id),
    ])
    for (const r of [bodiesRes, guessesRes, scoresRes, leaderRes]) if (r.error) throw r.error

    const bodies = new Map(((bodiesRes.data ?? []) as SecretRow[]).map((s) => [s.id, s.body]))
    state.results = {
      reveals: reveals
        .map((r) => ({ ...r, body: bodies.get(r.secret_id) ?? "" }))
        .sort((a, b) => a.correct_count - b.correct_count), // les plus introuvables d'abord : suspense
      guesses: (guessesRes.data ?? []) as GuessRow[],
      roundScores: (scoresRes.data ?? []) as ScoreRow[],
      leaderboard: (leaderRes.data ?? []) as LeaderRow[],
    }
  }

  return state
}
