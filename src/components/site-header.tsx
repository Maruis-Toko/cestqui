"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cx } from "@/lib/cx"
import { fr } from "@/lib/messages"

const LINKS = [
  { href: "/salons", label: fr.nav.rooms },
  { href: "/regles", label: fr.nav.rules },
] as const

export function SiteHeader() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const linkClass = (active: boolean) =>
    cx(
      "rounded-xl px-3 py-1.5 text-sm font-medium transition",
      active ? "bg-card-2 text-ink" : "text-muted hover:text-ink"
    )

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between gap-3 px-5">
        <Link href="/" aria-label={fr.nav.home} className="flex items-center gap-2 text-lg font-black tracking-tight">
          <span aria-hidden="true">🤫</span>
          <span>
            C&apos;est <span className="text-accent">Qui</span> ?
          </span>
        </Link>

        {/* Écrans moyens et grands : liens en ligne */}
        <nav aria-label={fr.nav.label} className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(isActive(l.href))} aria-current={isActive(l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          <Link href="/nouveau" className="ml-2 rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink">
            {fr.nav.create}
          </Link>
        </nav>

        {/* Mobile : menu déroulant sans JavaScript. La clé le referme à chaque changement de page. */}
        <details key={pathname} className="relative sm:hidden">
          <summary
            aria-label={fr.nav.menu}
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-xl border border-line bg-card text-xl [&::-webkit-details-marker]:hidden"
          >
            ☰
          </summary>
          <nav
            aria-label={fr.nav.label}
            className="absolute right-0 top-12 grid w-56 gap-1 rounded-2xl border border-line bg-card p-2 shadow-xl"
          >
            <Link href="/" className={linkClass(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>
              {fr.nav.home}
            </Link>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(isActive(l.href))} aria-current={isActive(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
            <Link href="/nouveau" className="mt-1 rounded-xl bg-accent px-3 py-2 text-center text-sm font-semibold text-accent-ink">
              {fr.nav.create}
            </Link>
          </nav>
        </details>
      </div>
    </header>
  )
}
