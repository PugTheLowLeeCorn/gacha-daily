function GameArt({ src, name, className = 'h-14 w-14' }) {
  if (src) {
    return <img src={src} alt="" className={`${className} rounded-xl object-cover`} />
  }
  return (
    <div
      className={`${className} flex items-center justify-center rounded-xl bg-zinc-200 font-display text-lg font-bold dark:bg-zinc-800`}
      aria-hidden="true"
    >
      {(name || '?').slice(0, 1)}
    </div>
  )
}

export default function GameCard({ game, streak, completed, onComplete, busy }) {
  const name = game.catalog?.name || game.gameId
  const art = game.catalog?.iconUrl || game.catalog?.icon || game.catalog?.coverUrl

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <GameArt src={art} name={name} />
        <div>
          <h3 className="font-display text-lg font-semibold">{name}</h3>
          <p className="text-sm text-zinc-500">🔥 {streak} day streak</p>
        </div>
      </div>
      {completed ? (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
          ✅ Daily Completed
        </p>
      ) : (
        <button
          type="button"
          onClick={() => onComplete(game.gameId)}
          disabled={busy}
          className="focus-ring rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:opacity-60"
        >
          {busy ? 'Saving...' : 'Complete Daily'}
        </button>
      )}
    </article>
  )
}

export { GameArt }
