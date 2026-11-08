"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { Captcha } from "@/components/captcha"
import { EmojiPicker, EMOJIS } from "@/components/emoji-picker"
import { Button, ErrorBox, Label, inputClass } from "@/components/ui"
import { hasSession, signInAnonymously } from "@/lib/auth/session"
import { createRoom, GameError } from "@/lib/game/api"
import { errorText, fr } from "@/lib/messages"
import { createClient } from "@/lib/supabase/client"

export function CreateRoomForm() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [name, setName] = useState("")
  const [nickname, setNickname] = useState("")
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [session, setSession] = useState<"loading" | "yes" | "no">("loading")
  const [token, setToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    hasSession(supabase).then((ok) => alive && setSession(ok ? "yes" : "no"))
    return () => {
      alive = false
    }
  }, [supabase])

  const needsCaptcha = session === "no"
  const ready =
    session !== "loading" &&
    (!needsCaptcha || token !== null) &&
    name.trim().length >= 2 &&
    nickname.trim().length >= 2

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (needsCaptcha) {
        if (!token) throw new GameError("captcha_missing")
        await signInAnonymously(supabase, token)
        setSession("yes")
      }
      const { code } = await createRoom(supabase, { name, nickname, emoji })
      router.push(`/s/${code}`)
    } catch (err) {
      setError(errorText(err instanceof GameError ? err.code : "unexpected"))
      setToken(null)
      setCaptchaKey((k) => k + 1)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div>
        <Label htmlFor="room-name">{fr.create.roomName}</Label>
        <input
          id="room-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder={fr.create.roomNamePh}
          className={inputClass}
        />
      </div>
      <div>
        <Label htmlFor="nickname">{fr.create.nickname}</Label>
        <input
          id="nickname"
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

      {needsCaptcha ? (
        <div>
          <Captcha key={captchaKey} onToken={setToken} />
          {token === null ? <p className="mt-2 text-sm text-muted">{fr.create.verifying}</p> : null}
        </div>
      ) : null}

      {error ? <ErrorBox>{error}</ErrorBox> : null}

      <Button type="submit" disabled={!ready || busy}>
        {fr.create.submit}
      </Button>
    </form>
  )
}
