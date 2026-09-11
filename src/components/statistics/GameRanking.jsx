export default function GameRanking({ ranking }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="font-display text-lg font-semibold">Completion ranking</h2>
      {!ranking?.length ? <p className="mt-4 text-sm text-zinc-500">No ranked games yet.</p> : null}
      <ol className="mt-4 space-y-3">
        {ranking.map((game, index) => (
          <li key={game.gameId} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {index + 1}. {game.name}
            </span>
            <span className="shrink-0 font-semibold">{game.completionRate}%</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
