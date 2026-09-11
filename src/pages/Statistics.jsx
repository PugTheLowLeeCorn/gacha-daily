import ActivityChart from '../components/statistics/ActivityChart'
import ComparisonChart from '../components/statistics/ComparisonChart'
import CompletionChart from '../components/statistics/CompletionChart'
import GameRanking from '../components/statistics/GameRanking'
import StatCard from '../components/statistics/StatCard'
import ErrorState from '../components/common/ErrorState'
import Loading from '../components/common/Loading'
import { useStatistics } from '../hooks/useStatistics'

export default function Statistics() {
  const { loading, error, overview, gameStats, ranking, monthly, mostCompleted, mostMissed } = useStatistics()

  if (loading) return <Loading label="Calculating statistics..." />
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Statistics</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Current Streak" value={`${overview.currentStreak} days`} />
        <StatCard label="Longest Streak" value={`${overview.longestStreak} days`} />
        <StatCard label="Completion Rate" value={`${overview.completionRate}%`} />
        <StatCard label="Total Completed" value={overview.totalCompleted} />
        <StatCard label="Missed Dailies" value={overview.missedDailies} />
        <StatCard label="Perfect Days" value={overview.perfectDays} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <StatCard label="Average daily completion" value={`${overview.averageDailyCompletion} games/day`} />
        <StatCard label="Most completed" value={mostCompleted?.name || '—'} hint={mostCompleted ? `${mostCompleted.completedDays} dailies` : ''} />
        <StatCard label="Most missed" value={mostMissed?.name || '—'} hint={mostMissed ? `${mostMissed.missedDays} missed` : ''} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CompletionChart data={gameStats} />
        <ActivityChart data={monthly} />
      </div>
      <ComparisonChart data={gameStats} />
      <GameRanking ranking={ranking} />

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Per-game statistics</h2>
        {!gameStats.length ? <p className="text-sm text-zinc-500">Track a game to unlock per-game stats.</p> : null}
        {gameStats.map((game) => (
          <article key={game.gameId} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="font-display text-lg font-semibold">{game.name}</h3>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>Current Streak: {game.currentStreak} days</div>
              <div>Longest Streak: {game.longestStreak} days</div>
              <div>Completed: {game.completedDays}</div>
              <div>Missed: {game.missedDays}</div>
              <div>Completion Rate: {game.completionRate}%</div>
            </dl>
          </article>
        ))}
      </section>
    </div>
  )
}
