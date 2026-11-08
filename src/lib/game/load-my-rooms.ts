// Salons dont l'utilisateur connecté est membre (RLS : on ne reçoit que les siens).
import { createClient } from "@/lib/supabase/server"

export interface MyRoom {
  id: string
  code: string
  name: string
  playerCount: number
  expiresOn: string
}

export async function loadMyRooms(): Promise<{ signedIn: boolean; rooms: MyRoom[] }> {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) return { signedIn: false, rooms: [] }

  const { data, error } = await supabase
    .from("rooms")
    .select("id, code, name, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
  if (error) throw error

  const rooms = (data ?? []) as { id: string; code: string; name: string; expires_at: string }[]
  if (rooms.length === 0) return { signedIn: true, rooms: [] }

  const { data: playerRows, error: playersError } = await supabase
    .from("players")
    .select("room_id")
    .in("room_id", rooms.map((r) => r.id))
    .is("removed_at", null)
  if (playersError) throw playersError

  const counts = new Map<string, number>()
  for (const row of (playerRows ?? []) as { room_id: string }[]) {
    counts.set(row.room_id, (counts.get(row.room_id) ?? 0) + 1)
  }

  const format = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" })
  return {
    signedIn: true,
    rooms: rooms.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      playerCount: counts.get(r.id) ?? 1,
      expiresOn: format.format(new Date(r.expires_at)),
    })),
  }
}
