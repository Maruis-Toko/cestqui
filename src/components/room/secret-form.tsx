"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { Button, ErrorBox, inputClass } from "@/components/ui"
import { GameError, submitSecret } from "@/lib/game/api"
import { errorText, fr } from "@/lib/messages"
import { createClient } from "@/lib/supabase/client"

export function SecretForm({ roundId, initial }: { roundId: string; initial: string | null }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [body, setBody] = useState(initial ?? "")
  const [saved, setSaved] = useState(initial !== null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await submitSecret(supabase, roundId, body)
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(errorText(err instanceof GameError ? err.code : "unexpected"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value)
          setSaved(false)
        }}
        rows={4}
        maxLength={280}
        placeholder={fr.writing.placeholder}
        aria-label={fr.writing.title}
        className={`${inputClass} resize-none`}
      />
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{saved ? fr.writing.saved : ""}</span>
        <span>{body.length}/280</span>
      </div>
      {error ? <ErrorBox>{error}</ErrorBox> : null}
      <Button type="submit" disabled={busy || body.trim().length < 3}>
        {initial !== null || saved ? fr.writing.update : fr.writing.save}
      </Button>
    </form>
  )
}
