// src/lib/site.ts
export const SITE = {
  name: "C'est Qui ?",
  // À définir sur votre hébergeur (ex. https://cestqui.example). Sert aux liens de partage.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  author: {
    name: "Cedric", // adaptez
    url: "", // portfolio ou profil public (facultatif)
  },
  whatsapp: {
    // Format international : chiffres uniquement, indicatif du pays inclus,
    // sans « + », sans espaces, sans « 0 » initial.
    number: "237656695293",
    message: "Bonjour, je t'écris à propos de C'est Qui ?",
  },
} as const;
