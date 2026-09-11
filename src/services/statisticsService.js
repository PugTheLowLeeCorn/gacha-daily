import { buildGameStats, buildMonthlyActivity, buildOverview, rankingFromGameStats } from '../utils/statisticsUtils'

export function computeStatistics({ userGames, catalogById, logs, todayKey }) {
  const gameStats = userGames.map((userGame) =>
    buildGameStats(userGame, catalogById.get(userGame.gameId), logs, todayKey),
  )
  const overview = buildOverview(userGames, logs, todayKey)
  const ranking = rankingFromGameStats(gameStats)
  const monthly = buildMonthlyActivity(userGames, logs, todayKey)

  return {
    overview,
    gameStats,
    ranking,
    monthly,
    mostCompleted: [...gameStats].sort((a, b) => b.completedDays - a.completedDays)[0] || null,
    mostMissed: [...gameStats].sort((a, b) => b.missedDays - a.missedDays)[0] || null,
  }
}
