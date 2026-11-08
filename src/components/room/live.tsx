"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { advanceRound } from "@/lib/game/api"
import { createClient } from "@/lib/supabase/client"

/**
 * Rafraîchit la page quand la salle ou la manche change (Realtime), avec une limite d'un
 * rafraîchissement toutes les 3 s (économie de données). Rafraîchit aussi au retour sur l'onglet :
 * les mobiles coupent les connexions en arrière-plan.
 */
export function LiveRefresh({ roomId }: { roomId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let last = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const refresh = () => {
      if (timer) return
      const wait = Math.max(0, 3000 - (Date.now() - last))
      timer = setTimeout(() => {
        timer = undefined
        last = Date.now()
        router.refresh()
      }, wait)
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds", filter: `room_id=eq.${roomId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` }, refresh)
      .subscribe()

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [roomId, router])

  return null
}

/**
 * À l'échéance : (si `advance`) demande au serveur de passer à la phase suivante, puis rafraîchit.
 * Réessaie quelques fois si l'horloge de l'appareil devance celle du serveur.
 */
export function PhaseTicker({ roundId, at, advance }: { roundId: string; at: string; advance: boolean }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let tries = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const fire = async () => {
      if (cancelled) return
      if (advance) {
        try {
          await advanceRound(supabase, roundId)
        } catch {
          // la phase sera revérifiée au prochain rafraîchissement
        }
      }
      router.refresh()
      if (advance && ++tries < 6) timer = setTimeout(fire, 4000)
    }

    const ms = new Date(at).getTime() - Date.now()
    timer = setTimeout(fire, Math.min(Math.max(ms, 0) + 800, 2_000_000_000))

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [roundId, at, advance, router])

  return null
}

function format(totalSeconds: number): string {
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (d > 0) return `${d} j ${h} h`
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")} min`
  return `${m}:${String(s).padStart(2, "0")}`
}

export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  if (now === null) return <span>…</span>
  return <span className="font-mono tabular-nums">{format(Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000)))}</span>
}
