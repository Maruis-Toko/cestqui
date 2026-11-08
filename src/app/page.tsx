import { JoinByCode } from "@/components/join-by-code"
import { Card, LinkButton, Shell } from "@/components/ui"
import { fr } from "@/lib/messages"

export default function Home() {
  return (
    <Shell>
      <div className="grid gap-4 pt-8 text-center">
        <p className="text-6xl" aria-hidden="true">🤫</p>
        <h1 className="text-5xl font-black tracking-tight">
          C&apos;est <span className="text-accent">Qui</span> ?
        </h1>
        <p className="text-lg text-muted">{fr.home.pitch}</p>
      </div>

      <LinkButton href="/nouveau" className="py-4 text-lg">
        {fr.home.create}
      </LinkButton>

      <Card className="grid gap-3">
        <h2 className="text-sm font-medium text-muted">{fr.home.haveCode}</h2>
        <JoinByCode />
      </Card>

      <ol className="grid gap-3 text-muted">
        {fr.home.steps.map((s, i) => (
          <li key={s} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-card-2 font-bold text-accent">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </Shell>
  )
}
