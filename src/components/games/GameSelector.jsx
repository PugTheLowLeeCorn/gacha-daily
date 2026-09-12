import { GameArt } from './GameCard'
import Loading from '../common/Loading'
import EmptyState from '../common/EmptyState'
import ErrorState from '../common/ErrorState'

export default function GameSelector({
  query,
  onQueryChange,
  results,
  searching,
  searchError,
  searchWarning,
  onSelect,
  busyId,
  trackedIds,
}) {
  return (
    <div>
      <label htmlFor="game-search" className="mb-2 block text-sm font-medium">
        Search game
      </label>
      <input
        id="game-search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search Genshin, Star Rail, Arknights..."
        className="focus-ring w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="mt-4 min-h-40">
        {searchWarning && !searchError ? (
          <p className="mb-3 text-sm text-amber-600 dark:text-amber-300">
            Live RAWG search is unavailable. Showing saved catalog games.
          </p>
        ) : null}
        {searching ? <Loading label="Searching games..." /> : null}
        {searchError ? (
          <ErrorState
            message={searchError.message || 'The game search service is unavailable.'}
            onRetry={() => onQueryChange(query)}
          />
        ) : null}
        {!searching && !searchError && results.length === 0 ? (
          <EmptyState
            title={query.trim() ? 'No matching games' : 'Search a game'}
            description={
              query.trim()
                ? 'Try a different title or spelling.'
                : 'Type a title. Results come from the Firestore game catalog.'
            }
          />
        ) : null}
        <ul className="space-y-2">
          {results.map((game) => {
            const tracked = trackedIds.has(game.id)
            return (
              <li key={game.id}>
                <button
                  type="button"
                  disabled={tracked || busyId === game.id || busyId === game.sourceId}
                  onClick={() => onSelect(game)}
                  className="focus-ring flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-3 py-3 text-left hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <GameArt src={game.iconUrl || game.coverUrl} name={game.name} className="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{game.name}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {[game.released, game.publisher, (game.platforms || []).slice(0, 2).join(', ')]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-amber-600">
                    {tracked ? 'Added' : busyId === game.id ? 'Adding...' : 'Select'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
