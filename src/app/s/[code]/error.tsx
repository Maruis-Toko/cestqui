"use client"

import { Button, Card, Shell } from "@/components/ui"
import { fr } from "@/lib/messages"

export default function RoomError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Shell>
      <Card className="grid gap-4">
        <p className="text-lg font-semibold">{fr.errors.unexpected}</p>
        <Button onClick={reset}>{fr.join.retry}</Button>
      </Card>
    </Shell>
  )
}
