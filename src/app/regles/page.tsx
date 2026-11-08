import type { Metadata } from "next"
import { Card, LinkButton, Shell } from "@/components/ui"
import { fr } from "@/lib/messages"

export const metadata: Metadata = { title: "Comment jouer" }

export default function RulesPage() {
  return (
    <Shell>
      <h1 className="text-3xl font-extrabold">{fr.rules.title}</h1>

      {fr.rules.sections.map((section) => (
        <Card key={section.title} className="grid gap-2">
          <h2 className="text-lg font-bold text-accent">{section.title}</h2>
          {section.body.map((line) => (
            <p key={line} className="text-muted">
              {line}
            </p>
          ))}
        </Card>
      ))}

      <LinkButton href="/nouveau">{fr.nav.create}</LinkButton>
    </Shell>
  )
}
