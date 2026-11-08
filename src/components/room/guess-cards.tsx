"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card } from "@/components/ui"
import { cx } from "@/lib/cx"
import { GameError, hostSetSecretHidden, reportSecret, submitGuess } from "@/lib/game/api"
import { errorText, fr } from "@/lib/messages"
import { createClient } from "@/lib/supabase/client"

interface Choice { id: string; nickname: string; emoji: string }

export function GuessCards({
  secrets,
  choices,
  mySecretId,
  initialGuesses,
  isHost,
  closed,
}: {
  secrets: { id: string; body: string }[]
  choices: Choice[]
  mySecretId: string | null
  initialGuesses: Record<string, string>
  isHost: boolean
  closed: boolean
}) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [guesses, setGuesses] = useState(initialGuesses)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [reported, setReported] = useState<Record<string, true>>({})

  async function pick(secretId: string, playerId: string) {
    setErrors((e) => ({ ...e, [secretId]: "" }))
    try {
      await submitGuess(supabase, secretId, playerId)
      setGuesses((g) => ({ ...g, [secretId]: playerId }))
    } catch (err) {
      setErrors((e) => ({ ...e, [secretId]: errorText(err instanceof GameError ? err.code : "unexpected") }))
    }
  }

  async function report(secretId: string) {
    try {
      await reportSecret(supabase, secretId, fr.guessing.reportReason)
      setReported((r) => ({ ...r, [secretId]: true }))
    } catch (err) {
      setErrors((e) => ({ ...e, [secretId]: errorText(err instanceof GameError ? err.code : "unexpected") }))
    }
  }

  async function hide(secretId: string) {
    try {
      await hostSetSecretHidden(supabase, secretId, true)
      router.refresh()
    } catch (err) {
      setErrors((e) => ({ ...e, [secretId]: errorText(err instanceof GameError ? err.code : "unexpected") }))
    }
  }

  if (secrets.length === 0) return <p className="text-muted">{fr.guessing.noSecrets}</p>

  return (
    <div className="grid gap-4">
      {secrets.map((s) => {
        const mine = s.id === mySecretId
        const picked = guesses[s.id]
        return (
          <Card key={s.id} className="grid gap-3">
            <p className="text-lg font-semibold leading-snug">« {s.body} »</p>

            {mine ? (
              <p className="text-sm text-muted">{fr.guessing.yours}</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {choices.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={Boolean(picked) || closed}
                      onClick={() => pick(s.id, c.id)}
                      className={cx(
                        "rounded-full border px-3 py-1.5 text-sm transition active:scale-95 disabled:cursor-not-allowed",
                        picked === c.id
                          ? "border-accent bg-accent font-semibold text-accent-ink"
                          : "border-line bg-card-2 disabled:opacity-40"
                      )}
                    >
                      {c.emoji} {c.nickname}
                    </button>
                  ))}
                </div>
                {picked ? <p className="text-sm text-ok">{fr.guessing.picked}</p> : null}
              </>
            )}

            {errors[s.id] ? <p className="text-sm text-bad">{errors[s.id]}</p> : null}

            {!mine ? (
              <div className="flex gap-4 text-xs text-muted">
                <button type="button" onClick={() => report(s.id)} disabled={reported[s.id]} className="underline disabled:no-underline">
                  {reported[s.id] ? fr.guessing.reported : fr.guessing.report}
                </button>
                {isHost ? (
                  <button type="button" onClick={() => hide(s.id)} className="underline">
                    {fr.guessing.hide}
                  </button>
                ) : null}
              </div>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
