import Link from "next/link"
import { Card, Shell } from "@/components/ui"
import { LiveRefresh, PhaseTicker } from "@/components/room/live"
import { GuessingView, LobbyView, ResultsView, WritingView } from "@/components/room/views"
import type { RoomState } from "@/lib/game/load-room"
import { fr } from "@/lib/messages"

export function RoomScreen({ state }: { state: RoomState }) {
  const { room, players, round, results, guessingClosed } = state

  return (
    <Shell>
      <LiveRefresh roomId={room.id} />

      {round?.phase === "writing" ? (
        <PhaseTicker roundId={round.id} at={round.writing_ends_at} advance />
      ) : null}
      {round?.phase === "guessing" ? (
        <>
          {!guessingClosed ? (
            <PhaseTicker roundId={round.id} at={round.guessing_ends_at} advance={false} />
          ) : null}
          <PhaseTicker roundId={round.id} at={round.reveal_at} advance />
        </>
      ) : null}

      <Link href="/salons" className="w-fit text-sm text-muted underline-offset-4 hover:underline">
        {fr.nav.backToRooms}
      </Link>

      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">C&apos;est Qui ?</p>
          <h1 className="text-2xl font-extrabold leading-tight">{room.name}</h1>
        </div>
        <div className="text-right text-xs text-muted">
          <p>
            {fr.room.code} <span className="font-mono text-sm tracking-widest text-ink">{room.code}</span>
          </p>
          <p>
            {players.length} {fr.join.players}
          </p>
        </div>
      </header>

      {round?.phase === "writing" ? <WritingView state={state} /> : null}
      {round?.phase === "guessing" ? <GuessingView state={state} /> : null}

      {!round || round.phase === "revealed" || round.phase === "cancelled" ? (
        <>
          {round?.phase === "revealed" && results ? <ResultsView results={results} players={players} /> : null}
          {round?.phase === "cancelled" ? <Card>{fr.results.cancelled}</Card> : null}
          <LobbyView state={state} showPlayers={!round} />
        </>
      ) : null}
    </Shell>
  )
}
