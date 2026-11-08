"use client"

import { Turnstile } from "@marsidev/react-turnstile"

/**
 * Turnstile en mode « interaction-only » : invisible, sauf si Cloudflare doute.
 * Pour obtenir un nouveau jeton (ils sont à usage unique), remonter le composant avec une autre `key`.
 */
export function Captcha({ onToken }: { onToken: (token: string | null) => void }) {
  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      options={{ appearance: "interaction-only", size: "flexible", language: "fr" }}
      onSuccess={onToken}
      onExpire={() => onToken(null)}
      onError={() => onToken(null)}
    />
  )
}
