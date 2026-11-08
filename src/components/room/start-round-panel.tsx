"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { Button, Card, ErrorBox, Label, inputClass } from "@/components/ui"
import { GameError, startRound } from "@/lib/game/api"
import { MIN_PLAYERS } from "@/lib/game/types"
import { errorText, fr } from "@/lib/messages"
import { createClient } from "@/lib/supabase/client"

// [minutes d'écriture, minutes de devinettes]. La révélation tombe à la fin des devinettes.
const PRESETS = { quick: [10, 10], hour: [60, 60], day: [1440, 1440] } as const
type PresetId = keyof typeof PRESETS

export function StartRoundPanel({
  roomId,
  playerCount,
  isNext,
}: {
  roomId: string
  playerCount: number
  isNext: boolean
}) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [theme, setTheme] = useState("")
  const [preset, setPreset] = useState<PresetId>("hour")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const enough = playerCount >= MIN_PLAYERS

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const [writeMin, guessMin] = PRESETS[preset]
      const writingEndsAt = new Date(Date.now() + writeMin * 60_000)
      const guessingEndsAt = new Date(writingEndsAt.getTime() + guessMin * 60_000)
      await startRound(supabase, { roomId, theme, writingEndsAt, guessingEndsAt, revealAt: guessingEndsAt })
      router.refresh()
    } catch (err) {
      setError(errorText(err instanceof GameError ? err.code : "unexpected"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="grid gap-4">
        <h2 className="text-lg font-bold">{isNext ? fr.start.next : fr.start.title}</h2>
        <div>
          <Label htmlFor="theme">{fr.start.theme}</Label>
          <input
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            maxLength={80}
            placeholder={fr.start.themePh}
            className={inputClass}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {fr.start.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTheme(s)}
                className="rounded-full border border-line bg-card-2 px-3 py-1 text-sm text-muted active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="preset">{fr.start.speed}</Label>
          <select
            id="preset"
            value={preset}
            onChange={(e) => setPreset(e.target.value as PresetId)}
            className={inputClass}
          >
            {(Object.keys(PRESETS) as PresetId[]).map((id) => (
              <option key={id} value={id}>
                {fr.start.presets[id]}
              </option>
            ))}
          </select>
        </div>
        {!enough ? <p className="text-sm text-muted">{fr.room.needPlayers}</p> : null}
        {enough && playerCount < 2 ? <p className="text-sm text-muted">{fr.room.smallGroup}</p> : null}
        {error ? <ErrorBox>{error}</ErrorBox> : null}
        <Button type="submit" disabled={busy || !enough || theme.trim().length < 2}>
          {fr.start.submit}
        </Button>
      </form>
    </Card>
  )
}
