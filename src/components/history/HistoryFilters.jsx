export default function HistoryFilters({ filters, onChange, games }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm">
        Game
        <select
          className="focus-ring mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={filters.gameId}
          onChange={(event) => onChange({ ...filters, gameId: event.target.value })}
        >
          <option value="">All games</option>
          {games.map((game) => (
            <option key={game.gameId} value={game.gameId}>
              {game.catalog?.name || game.gameId}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Month
        <input
          type="month"
          className="focus-ring mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={filters.month}
          onChange={(event) => onChange({ ...filters, month: event.target.value })}
        />
      </label>
      <label className="text-sm">
        Status
        <select
          className="focus-ring mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: event.target.value })}
        >
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="missed">Missed</option>
          <option value="partial">Partial</option>
          <option value="perfect">Perfect</option>
        </select>
      </label>
    </div>
  )
}
