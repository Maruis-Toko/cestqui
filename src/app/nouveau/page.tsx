import type { Metadata } from "next"
import { CreateRoomForm } from "@/components/create-room-form"
import { Card, LinkButton, Shell } from "@/components/ui"
import { fr } from "@/lib/messages"

export const metadata: Metadata = { title: "Nouveau salon" }

export default function NewRoomPage() {
  return (
    <Shell>
      <h1 className="text-3xl font-extrabold">{fr.create.title}</h1>
      <Card>
        <CreateRoomForm />
      </Card>
      <LinkButton href="/" variant="ghost">
        {fr.join.home}
      </LinkButton>
    </Shell>
  )
}
