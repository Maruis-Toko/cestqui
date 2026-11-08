"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button, ErrorBox } from "@/components/ui"
import { GameError, hostAdvanceRound } from "@/lib/game/api"
import { errorText, fr } from "@/lib/messages"
import { createClient } from "@/lib/supabase/client"

export function HostAdvanceButton({ roundId, label }: { roundId: string; label: string }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    if (!window.confirm(fr.writing.confirmClose)) return
    setBusy(true)
    setError(null)
    try {
      await hostAdvanceRound(supabase, roundId)
      router.refresh()
    } catch (err) {
      setError(errorText(err instanceof GameError ? err.code : "unexpected"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-2">
      <Button variant="ghost" onClick={onClick} disabled={busy}>
        {label}
      </Button>
      {error ? <ErrorBox>{error}</ErrorBox> : null}
    </div>
  )
}
