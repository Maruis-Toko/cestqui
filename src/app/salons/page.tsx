import type { Metadata } from "next"
import Link from "next/link"
import { Card, LinkButton, Shell } from "@/components/ui"
import { loadMyRooms } from "@/lib/game/load-my-rooms"
import { fr } from "@/lib/messages"

// Cette page dépend de la session Supabase (cookies) et doit être rendue à la demande
// sous Next 16 pour éviter le blocage de prerendering.
export const instant = false

export const metadata: Metadata = { title: "Mes salons", robots: { index: false, follow: false } }

export default async function MyRoomsPage() {
  const { rooms } = await loadMyRooms()

  return (
    <Shell>
      <h1 className="text-3xl font-extrabold">{fr.rooms.title}</h1>

      {rooms.length === 0 ? (
        <Card className="grid gap-4">
          <p className="text-lg font-semibold">{fr.rooms.empty}</p>
          <p className="text-muted">{fr.rooms.emptyHint}</p>
          <LinkButton href="/nouveau">{fr.nav.create}</LinkButton>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {rooms.map((r) => (
            <li key={r.id}>
              <Link
                href={`/s/${r.code}`}
                className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-card p-5 transition active:scale-[0.99]"
              >
                <span className="grid gap-0.5">
                  <span className="text-lg font-bold">{r.name}</span>
                  <span className="text-sm text-muted">
                    {r.playerCount} {fr.rooms.players} · {fr.rooms.expires} {r.expiresOn}
                  </span>
                </span>
                <span className="font-mono text-sm tracking-widest text-accent">{r.code}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-muted">{fr.rooms.browserNote}</p>
    </Shell>
  )
}
