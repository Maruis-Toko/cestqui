# C'est Qui ? — installer et jouer

## Où vont les fichiers
L'archive `cestqui-front.zip` reproduit l'arborescence de ton projet. Extrais-la **à la racine de `cestqui/`**
(le dossier qui contient `package.json`, `src/` et `supabase/`). Accepte de remplacer les fichiers existants.

```
cestqui/
├── .env.example                      → modèle de variables (à copier en .env.local)
├── FRONT.md                          → ce fichier
├── src/
│   ├── proxy.ts                      → rafraîchit la session (Next 16)
│   ├── app/
│   │   ├── layout.tsx, page.tsx, globals.css      (remplacent les tiens)
│   │   ├── nouveau/page.tsx          → créer un salon
│   │   └── s/[code]/page.tsx, error.tsx            → le salon (lien /s/ABC123)
│   ├── components/
│   │   ├── ui.tsx, captcha.tsx, emoji-picker.tsx, join-by-code.tsx, create-room-form.tsx
│   │   └── room/ join-panel, room-screen, views, live, invite-bar, start-round-panel,
│   │             host-controls, secret-form, guess-cards (.tsx)
│   └── lib/
│       ├── messages.ts, cx.ts
│       ├── supabase/ client.ts, server.ts, proxy.ts
│       ├── auth/session.ts
│       └── game/ api.ts, load-room.ts, types.ts
└── supabase/migrations/
    ├── 20261108140000_purge_anonymous_users.sql   → nettoyage des comptes anonymes
    └── 20261108150000_min_players.sql             → minimum 2 joueurs
```
(Les migrations 0001-0005 déjà poussées ne sont PAS dans l'archive : ne les recrée pas.)

## 1. Installer
```bash
pnpm add @supabase/supabase-js @supabase/ssr @marsidev/react-turnstile
```

## 2. Variables d'environnement
Copie `.env.example` en `.env.local` et remplis les 3 valeurs (Supabase → bouton Connect ; Cloudflare → Turnstile).

## 3. Pousser les 2 nouvelles migrations
```bash
pnpm supabase db push --remote --dry-run   # doit lister les 2 migrations
pnpm supabase db push --remote
```

## 4. Vérifier le code
```bash
pnpm exec tsc --noEmit
pnpm lint
```

## 5. Jouer
**Seul, pour tester (2 fenêtres suffisent maintenant)**
```bash
pnpm dev
```
1. Ouvre http://localhost:3000 → « Créer un salon » → pseudo + emoji.
2. Copie le lien du salon, ouvre-le dans une **fenêtre de navigation privée** → choisis un autre pseudo.
3. Dans la 1re fenêtre (hôte) : thème, rythme **Rapide**, « Lancer la manche ».
4. Chaque fenêtre écrit un secret → devine l'auteur → attends la révélation (ou l'hôte clôt la phase).

**Avec les copains** : ils ne peuvent pas atteindre ton `localhost`. Il faut déployer :
1. `git add . && git commit -m "feat: C'est Qui" && git push` (Vercel est déjà lié au dépôt GitHub).
2. Vercel → projet → Settings → Environment Variables : ajoute les 3 variables (Production et Preview), puis redéploie.
3. Ouvre `https://cest-qui.vercel.app`, crée un salon, appuie sur « Inviter sur WhatsApp ».

## Limites connues
- Horaires calculés avec l'horloge de l'appareil de l'hôte : si elle est fausse → « horaires invalides ».
- Supabase limite les connexions anonymes à 30 par heure et par IP.
- Avatars = emojis ; pas d'aperçu de lien WhatsApp personnalisé.
