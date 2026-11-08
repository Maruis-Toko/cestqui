export type Phase = "writing" | "guessing" | "revealed" | "cancelled"
export type Role = "host" | "player" | "spectator"

export interface Room {
  id: string
  code: string
  name: string
  max_players: number
  expires_at: string
}

export interface Player {
  id: string
  user_id: string
  nickname: string
  emoji: string
  role: Role
}

export interface Round {
  id: string
  room_id: string
  number: number
  theme: string
  phase: Phase
  writing_ends_at: string
  guessing_ends_at: string
  reveal_at: string
  secrets_count: number
  guesses_count: number
}

export interface SecretRow { id: string; body: string }
export interface GuessRow { secret_id: string; guesser_id: string; guessed_player_id: string }
export interface RevealRow { secret_id: string; author_player_id: string; correct_count: number; guess_count: number }
export interface ScoreRow { player_id: string; points: number; correct_guesses: number; ghost_points: number }
export interface LeaderRow { player_id: string; total_points: number; correct_guesses: number; ghost_points: number; rounds_played: number }

export const CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/
export const MIN_PLAYERS = 2
