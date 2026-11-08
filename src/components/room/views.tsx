// Vues serveur du salon : une par phase. Aucune logique d'accès ici, seulement de l'affichage.
import { Card } from "@/components/ui"
import { Countdown } from "@/components/room/live"
import { HostAdvanceButton } from "@/components/room/host-controls"
import { InviteBar } from "@/components/room/invite-bar"
import { SecretForm } from "@/components/room/secret-form"
import { GuessCards } from "@/components/room/guess-cards"
import { StartRoundPanel } from "@/components/room/start-round-panel"
import type { Results, RoomState } from "@/lib/game/load-room"
import type { Player } from "@/lib/game/types"
import { fr } from "@/lib/messages"

const playing = (players: Player[]) => players.filter((p) => p.role !== "spectator")

export function PlayerList({ players, meId }: { players: Player[]; meId: string }) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium text-muted">
        {fr.room.players} · {players.length}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {players.map((p) => (
          <li key={p.id} className="rounded-full border border-line bg-card-2 px-3 py-1.5 text-sm">
            {p.emoji} {p.nickname}
            {p.role === "host" ? ` · ${fr.room.host}` : ""}
            {p.id === meId ? ` · ${fr.room.you}` : ""}
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function LobbyView({ state, showPlayers }: { state: RoomState; showPlayers: boolean }) {
  const { room, players, me, round } = state
  const isHost = me.role === "host"
  return (
    <>
      {showPlayers ? <PlayerList players={players} meId={me.id} /> : null}
      <InviteBar code={room.code} name={room.name} />
      {isHost ? (
        <StartRoundPanel roomId={room.id} playerCount={playing(players).length} isNext={round !== null} />
      ) : (
        <p className="text-center text-muted">{fr.room.waiting}</p>
      )}
    </>
  )
}

export function WritingView({ state }: { state: RoomState }) {
  const { round, players, me, mySecret } = state
  if (!round) return null
  const isHost = me.role === "host"
  return (
    <>
      <Card className="grid gap-1">
        <p className="text-sm text-muted">{round.theme}</p>
        <h2 className="text-2xl font-extrabold">{fr.writing.title}</h2>
        <p className="text-sm text-muted">{fr.writing.subtitle}</p>
      </Card>

      {me.role === "spectator" ? (
        <Card>{fr.room.spectator}</Card>
      ) : (
        <Card>
          <SecretForm roundId={round.id} initial={mySecret?.body ?? null} />
        </Card>
      )}

      <Card className="flex items-center justify-between text-sm">
        <span>{fr.writing.progress(round.secrets_count, playing(players).length)}</span>
        <span className="text-muted">
          {fr.writing.endsIn} <Countdown to={round.writing_ends_at} />
        </span>
      </Card>

      {isHost ? <HostAdvanceButton roundId={round.id} label={fr.writing.hostClose} /> : null}
    </>
  )
}

export function GuessingView({ state }: { state: RoomState }) {
  const { round, players, me, secrets, mySecret, myGuesses, guessingClosed: closed } = state
  if (!round) return null
  const isHost = me.role === "host"
  const choices = playing(players).filter((p) => p.id !== me.id)
  const guessable = secrets.filter((s) => s.id !== mySecret?.id).length
  const answered = Object.keys(myGuesses).length

  return (
    <>
      <Card className="grid gap-1">
        <p className="text-sm text-muted">{round.theme}</p>
        <h2 className="text-2xl font-extrabold">{closed ? fr.guessing.closedTitle : fr.guessing.title}</h2>
        <p className="text-sm text-muted">{closed ? "" : fr.guessing.subtitle}</p>
      </Card>

      <Card className="flex items-center justify-between text-sm">
        <span>{fr.guessing.progress(answered, guessable)}</span>
        <span className="text-muted">
          {closed ? fr.guessing.revealIn : fr.guessing.endsIn}{" "}
          <Countdown to={closed ? round.reveal_at : round.guessing_ends_at} />
        </span>
      </Card>

      {me.role === "spectator" ? (
        <Card>{fr.room.spectator}</Card>
      ) : (
        <GuessCards
          secrets={secrets}
          choices={choices}
          mySecretId={mySecret?.id ?? null}
          initialGuesses={myGuesses}
          isHost={isHost}
          closed={closed}
        />
      )}

      {isHost ? <HostAdvanceButton roundId={round.id} label={fr.guessing.hostClose} /> : null}
    </>
  )
}

export function ResultsView({ results, players }: { results: Results; players: Player[] }) {
  const byId = new Map(players.map((p) => [p.id, p]))
  const name = (id: string) => {
    const p = byId.get(id)
    return p ? `${p.emoji} ${p.nickname}` : "?"
  }
  const roundRanking = [...results.roundScores].sort((a, b) => b.points - a.points)
  const overallRanking = [...results.leaderboard].sort((a, b) => b.total_points - a.total_points)

  return (
    <>
      <h2 className="text-3xl font-extrabold">{fr.results.title}</h2>

      <div className="grid gap-4">
        {results.reveals.map((r, i) => {
          const right = results.guesses.filter(
            (g) => g.secret_id === r.secret_id && g.guessed_player_id === r.author_player_id
          )
          const ghost = r.guess_count >= 3 && r.correct_count / r.guess_count < 0.2
          return (
            <Card key={r.secret_id} className="animate-pop grid gap-2" style={{ animationDelay: `${i * 0.2}s` }}>
              <p className="text-lg font-semibold leading-snug">« {r.body} »</p>
              <p className="text-sm">
                {fr.results.wrote} <strong className="text-accent">{name(r.author_player_id)}</strong>
                {ghost ? <span className="ml-2 text-pink">{fr.results.ghost}</span> : null}
              </p>
              <p className="text-sm text-muted">
                {fr.results.guessedRight} :{" "}
                {right.length ? right.map((g) => name(g.guesser_id)).join(", ") : fr.results.nobody}
              </p>
            </Card>
          )
        })}
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-medium text-muted">{fr.results.roundScores}</h3>
        <ol className="grid gap-1.5">
          {roundRanking.map((s) => (
            <li key={s.player_id} className="flex justify-between">
              <span>{name(s.player_id)}</span>
              <span className="font-mono">
                {s.points} {fr.results.pts}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-medium text-muted">{fr.results.leaderboard}</h3>
        <ol className="grid gap-1.5">
          {overallRanking.map((s, i) => (
            <li key={s.player_id} className="flex justify-between">
              <span>
                {i + 1}. {name(s.player_id)}
              </span>
              <span className="font-mono">
                {s.total_points} {fr.results.pts}
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  )
}
