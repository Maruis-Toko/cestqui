// src/app/s/[code]/page.tsx

import type { Metadata } from "next";
import { JoinPanel } from "@/components/room/join-panel";
import { RoomScreen } from "@/components/room/room-screen";
import { Card, LinkButton, Shell } from "@/components/ui";
import { loadRoom } from "@/lib/game/load-room";
import { CODE_RE } from "@/lib/game/types";
import { fr } from "@/lib/messages";
import { SITE } from "@/lib/site";

// Les salons sont privés : jamais indexés. La page dépend de la session Supabase,
// qui vérifie l'expiration avec Date.now() lors de la pré-rendu. On marque la route
// comme blocking pour autoriser un rendu dynamique compatible avec Next 16.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const code = (await params).code.toUpperCase()
  const valid = CODE_RE.test(code)
  return {
    title: "Salon",
    robots: { index: false, follow: false },
    ...(valid && {
      openGraph: {
        type: "website",
        locale: "fr_FR",
        siteName: SITE.name,
        title: `Rejoins le salon ${code}`,
        description: fr.home.pitch,
      },
    }),
  }
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();

  if (!CODE_RE.test(code)) {
    return (
      <Shell>
        <Card>{fr.join.invalidCode}</Card>
        <LinkButton href="/" variant="ghost">
          {fr.join.home}
        </LinkButton>
      </Shell>
    );
  }

  const state = await loadRoom(code);
  if (!state) {
    return (
      <Shell>
        <JoinPanel code={code} />
      </Shell>
    );
  }
  return <RoomScreen state={state} />;
}
