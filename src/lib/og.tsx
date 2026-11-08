import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

const BG = "#14102b" // même valeur que votre themeColor
const FG = "#ffffff" // à adapter à votre thème
const ACCENT = "#REMPLACEZ" // copiez votre couleur --accent

// Police facultative (option B, @fontsource/inter) : absente → police par défaut, sans erreur.
const font = await readFile(
  join(process.cwd(), "node_modules/@fontsource/inter/files/inter-latin-800-normal.woff")
).catch(() => null)

function Brand({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", columnGap: size * 0.25, fontSize: size }}>
      <span>C&apos;est</span>
      <span style={{ color: ACCENT }}>Qui</span>
      <span>?</span>
    </div>
  )
}

interface OgOptions {
  /** Sans titre : la marque « C'est Qui ? » sert de titre (page d'accueil). */
  title?: string
  kicker?: string
  subtitle?: string
  titleColor?: string
  titleSize?: number
  letterSpacing?: number
}

export function renderOg({
  title,
  kicker,
  subtitle,
  titleColor = FG,
  titleSize = 130,
  letterSpacing = 0,
}: OgOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: BG,
          color: FG,
          padding: 80,
          fontFamily: font ? "Inter" : undefined,
        }}
      >
        {title && (
          <div style={{ position: "absolute", top: 56, left: 72, display: "flex" }}>
            <Brand size={40} />
          </div>
        )}
        {kicker && (
          <div style={{ fontSize: 44, opacity: 0.75, marginBottom: 12 }}>{kicker}</div>
        )}
        {title ? (
          <div style={{ fontSize: titleSize, color: titleColor, letterSpacing, textAlign: "center" }}>
            {title}
          </div>
        ) : (
          <Brand size={140} />
        )}
        {subtitle && (
          <div style={{ marginTop: 32, maxWidth: 900, textAlign: "center", fontSize: 38, opacity: 0.8 }}>
            {subtitle}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(font
        ? { fonts: [{ name: "Inter", data: font, style: "normal" as const, weight: 800 as const }] }
        : {}),
    }
  )
}