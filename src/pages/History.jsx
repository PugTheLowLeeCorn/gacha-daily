import { useMemo, useState } from 'react'
import ActivityHeatmap from '../components/history/ActivityHeatmap'
import HistoryFilters from '../components/history/HistoryFilters'
import HistoryList from '../components/history/HistoryList'
import MissedDailies from '../components/history/MissedDailies'
import ErrorState from '../components/common/ErrorState'
import Loading from '../components/common/Loading'
import { useTracker } from '../context/TrackerContext'
import { useStatistics } from '../hooks/useStatistics'
import { missedDatesForGame } from '../utils/statisticsUtils'

export default function History() {
  const { userGames, catalogById, logs } = useTracker()
  const [filters, setFilters] = useState({ gameId: '', month: '', status: 'all' })
  const stats = useStatistics(filters)

  const missed = useMemo(
    () =>
      userGames
        .flatMap((game) =>
          missedDatesForGame(game, logs, stats.todayKey).map((date) => ({
            date,
            gameId: game.gameId,
          })),
        )
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [userGames, logs, stats.todayKey],
  )

  if (stats.loading) return <Loading label="Loading history..." />
  if (stats.error) return <ErrorState message={stats.error.message} onRetry={() => window.location.reload()} />

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">History</h1>
      <HistoryFilters
        filters={filters}
        onChange={setFilters}
        games={userGames.map((game) => ({
          ...game,
          catalog: catalogById.get(game.gameId),
        }))}
      />
      <ActivityHeatmap cells={stats.heatmap} userGames={userGames} logs={logs} catalogById={catalogById} />
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="font-display text-lg font-semibold">Missed Dailies</h2>
        <div className="mt-4">
          <MissedDailies items={missed} catalogById={catalogById} />
        </div>
      </section>
      <HistoryList days={stats.history} />
    </div>
  )
}
