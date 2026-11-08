import Link from "next/link"
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react"
import { cx } from "@/lib/cx"

type Variant = "primary" | "ghost" | "pink"

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink",
  ghost: "border border-line bg-card text-ink",
  pink: "bg-pink text-white",
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={cx(base, variants[variant], className)} {...props} />
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string
  variant?: Variant
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={cx(base, variants[variant], className)}>
      {children}
    </Link>
  )
}

export function Card({
  className,
  style,
  children,
}: {
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <section style={style} className={cx("rounded-3xl border border-line bg-card p-5", className)}>
      {children}
    </section>
  )
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-bad/40 bg-bad/15 px-4 py-3 text-sm">
      {children}
    </p>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-5 py-8">{children}</main>
}

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-muted">
      {children}
    </label>
  )
}

export const inputClass =
  "w-full rounded-xl border border-line bg-card-2 px-4 py-3 text-base text-ink outline-none placeholder:text-muted focus:border-accent"
