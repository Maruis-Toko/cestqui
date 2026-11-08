"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { Button, ErrorBox, inputClass } from "@/components/ui"
import { fr } from "@/lib/messages"
import { CODE_RE } from "@/lib/game/types"

export function JoinByCode() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = code.trim().toUpperCase()
    if (!CODE_RE.test(clean)) return setError(true)
    router.push(`/s/${clean}`)
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError(false)
          }}
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-label={fr.home.haveCode}
          placeholder={fr.home.codePlaceholder}
          className={`${inputClass} text-center font-mono text-lg tracking-[0.3em]`}
        />
        <Button type="submit" variant="ghost">
          {fr.home.join}
        </Button>
      </div>
      {error ? <ErrorBox>{fr.home.codeInvalid}</ErrorBox> : null}
    </form>
  )
}
