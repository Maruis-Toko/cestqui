import Link from "next/link"
import { fr } from "@/lib/messages"

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted">
        <p>{fr.nav.footerNote}</p>
        <nav aria-label={fr.nav.footerLabel} className="flex gap-4">
          <Link href="/" className="hover:text-ink">{fr.nav.home}</Link>
          <Link href="/salons" className="hover:text-ink">{fr.nav.rooms}</Link>
          <Link href="/regles" className="hover:text-ink">{fr.nav.rules}</Link>
        </nav>
      </div>
    </footer>
  )
}
