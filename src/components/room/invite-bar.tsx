"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { fr } from "@/lib/messages"

export function InviteBar({ code, name }: { code: string; name: string }) {
  const [copied, setCopied] = useState(false)
  const link = () => `${window.location.origin}/s/${code}`

  function shareWhatsApp() {
    const text = fr.room.inviteText(name, link())
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copie ce lien :", link())
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button onClick={shareWhatsApp}>{fr.room.invite}</Button>
      <Button variant="ghost" onClick={copy}>
        {copied ? fr.room.copied : fr.room.copy}
      </Button>
    </div>
  )
}
