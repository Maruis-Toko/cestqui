import { Card, LinkButton, Shell } from "@/components/ui"
import { fr } from "@/lib/messages"

export default function NotFound() {
  return (
    <Shell>
      <Card className="grid gap-4 text-center">
        <p className="text-5xl" aria-hidden="true">🙈</p>
        <h1 className="text-2xl font-extrabold">{fr.notFound.title}</h1>
        <p className="text-muted">{fr.notFound.hint}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <LinkButton href="/">{fr.nav.home}</LinkButton>
          <LinkButton href="/salons" variant="ghost">
            {fr.nav.rooms}
          </LinkButton>
        </div>
      </Card>
    </Shell>
  )
}
