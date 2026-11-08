"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { Captcha } from "@/components/captcha"
import { EmojiPicker, EMOJIS } from "@/components/emoji-picker"
import { Button, Card, ErrorBox, Label, LinkButton, inputClass } from "@/components/ui"
import { hasSession, signInAnonymously } from "@/lib/auth/session"
import { GameError, getRoomPreview, joinRoom } from "@/lib/game/api"
import { errorText, fr } from "@/lib/messages"
import { createClient } from "@/lib/supabase/client"

type Step = "init" | "captcha" | "loading" | "ready" | "notfound" | "error"
interface Preview { name: string; playerCount: number; maxPlayers: number }

const msg = (err: unknown) => errorText(err instanceof GameError ? err.code : "unexpected")

/**
 * Porte d'entrée depuis un lien WhatsApp : ouvre une session anonyme (si besoin),
 * montre le nom du salon, puis demande un pseudo.
 */
export function JoinPanel({ code }: { code: string }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [step, setStep] = useState<Step>("init")
  const [preview, setPreview] = useState<Preview | null>(null)
  const [nickname, setNickname] = useState("")
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const signingIn = useRef(false) // Turnstile peut rappeler onSuccess : une seule connexion par visite

  const loadPreview = useCallback(async () => {
    setStep("loading")
    try {
      const p = await getRoomPreview(supabase, code)
      if (!p) return setStep("notfound")
      if (p.isMember) return router.refresh()
      setPreview(p)
      setStep("ready")
    } catch (err) {
      setError(msg(err))
      setStep("error")
    }
  }, [supabase, code, router])

  useEffect(() => {
    let alive = true
    hasSession(supabase).then((ok) => {
      if (!alive) return
      if (ok) void loadPreview()
      else setStep("captcha")
    })
    return () => {
      alive = false
    }
  }, [supabase, loadPreview])

  async function onToken(token: string | null) {
    if (!token || signingIn.current) return
    signingIn.current = true
    setStep("loading")
    try {
      await signInAnonymously(supabase, token)
      await loadPreview()
    } catch (err) {
      setError(msg(err))
      setStep("error")
    }
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await joinRoom(supabase, { code, nickname, emoji })
      router.refresh()
    } catch (err) {
      setError(msg(err))
      setBusy(false)
    }
  }

  if (step === "init" || step === "loading") {
    return <p className="py-10 text-center text-muted">{fr.join.loading}</p>
  }

  if (step === "captcha") {
    return (
      <div className="py-10 text-center">
        <Captcha onToken={onToken} />
        <p className="mt-3 text-muted">{fr.join.captcha}</p>
      </div>
    )
  }

  if (step === "notfound" || step === "error") {
    return (
      <Card className="grid gap-4">
        <p className="text-lg font-semibold">{step === "notfound" ? fr.join.notFound : error}</p>
        {step === "notfound" ? <p className="text-muted">{fr.join.notFoundHint}</p> : null}
        <div className="flex gap-2">
          {step === "error" ? (
            <Button variant="ghost" onClick={() => window.location.reload()}>
              {fr.join.retry}
            </Button>
          ) : null}
          <LinkButton href="/" variant="ghost">
            {fr.join.home}
          </LinkButton>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={onJoin} className="grid gap-5">
        <div>
          <p className="text-sm text-muted">{fr.join.invited}</p>
          <h1 className="text-2xl font-extrabold">{preview?.name}</h1>
          <p className="text-sm text-muted">
            {preview?.playerCount}/{preview?.maxPlayers} {fr.join.players}
          </p>
        </div>
        <div>
          <Label htmlFor="join-nickname">{fr.create.nickname}</Label>
          <input
            id="join-nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            autoComplete="off"
            placeholder={fr.create.nicknamePh}
            className={inputClass}
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-muted">{fr.create.emoji}</p>
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </div>
        {error ? <ErrorBox>{error}</ErrorBox> : null}
        <Button type="submit" disabled={busy || nickname.trim().length < 2}>
          {fr.join.submit}
        </Button>
      </form>
    </Card>
  )
}
