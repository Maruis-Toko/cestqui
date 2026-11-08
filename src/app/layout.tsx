import type { Metadata, Viewport } from "next"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"
import { SITE } from "@/lib/site";
import { Credit } from "@/components/credit";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  applicationName: SITE.name,
  authors: [{ name: SITE.author.name, url: SITE.author.url || undefined }],
  creator: SITE.author.name,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE.name,
    title: SITE.name,
    description: "Le jeu des secrets anonymes : écris, devine, révèle.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14102b",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex min-h-dvh flex-col antialiased">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <Credit />
        <SiteFooter />
      </body>
    </html>
  )
}
