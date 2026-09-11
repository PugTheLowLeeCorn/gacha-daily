import {
  eachDateKey,
  getMonthKey,
  inclusiveDayCount,
  subtractDays,
} from './dateUtils'
import {
  completedDateSetFromLogs,
  currentStreak,
  gamesTrackedOnDate,
  groupLogsByDate,
  isPerfectDay,
  longestStreak,
  overallCurrentStreak,
  overallLongestStreak,
  sortedKeys,
} from './streakUtils'

function roundRate(value) {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 10) / 10
}

export function completionRate(completedDays, expectedDays) {
  if (!expectedDays) return 0
  return roundRate((completedDays / expectedDays) * 100)
}

export function expectedTrackedDays(startDate, endKey) {
  return inclusiveDayCount(startDate, endKey)
}

export function missedDatesForGame(userGame, logs, todayKey) {
  if (!userGame.trackingStartDate) return []
  const completed = completedDateSetFromLogs(logs, userGame.gameId)
  const skipped = new Set(
    logs.filter((log) => log.gameId === userGame.gameId && log.status === 'skipped').map((log) => log.date),
  )
  const endKey = userGame.enabled ? subtractDays(todayKey, 0) : subtractDays(userGame.trackingEndDate || todayKey, 1)
  const lastCountable = userGame.enabled ? subtractDays(todayKey, 1) : endKey
  if (!lastCountable || lastCountable < userGame.trackingStartDate) return []

  return eachDateKey(userGame.trackingStartDate, lastCountable).filter((dateKey) => {
    if (!userGame.enabled && userGame.trackingEndDate && dateKey >= userGame.trackingEndDate) {
      return false
    }
    return !completed.has(dateKey) && !skipped.has(dateKey)
  })
}

export function buildGameStats(userGame, catalogGame, logs, todayKey) {
  const gameLogs = logs.filter((log) => log.gameId === userGame.gameId)
  const completedSet = completedDateSetFromLogs(gameLogs)
  const endKey = userGame.enabled
    ? todayKey
    : subtractDays(userGame.trackingEndDate || todayKey, 1)
  const completedDays = Array.from(completedSet).filter(
    (dateKey) => dateKey >= userGame.trackingStartDate && (!endKey || dateKey <= endKey),
  ).length
  const expected = expectedTrackedDays(userGame.trackingStartDate, endKey)
  const missed = missedDatesForGame(userGame, logs, todayKey)

  return {
    gameId: userGame.gameId,
    name: catalogGame?.name || userGame.gameId,
    iconUrl: catalogGame?.iconUrl || catalogGame?.coverUrl || '',
    currentStreak: currentStreak(completedSet, todayKey),
    longestStreak: longestStreak(sortedKeys(completedSet)),
    completedDays,
    missedDays: missed.length,
    expectedDays: expected,
    completionRate: completionRate(completedDays, expected),
    enabled: userGame.enabled,
  }
}

export function dayStatus(userGames, logsByDate, dateKey) {
  const tracked = gamesTrackedOnDate(userGames, dateKey)
  if (!tracked.length) return 'empty'
  const logs = logsByDate.get(dateKey) || []
  const completedCount = tracked.filter((game) =>
    logs.some((log) => log.gameId === game.gameId && log.status === 'completed'),
  ).length
  if (completedCount === tracked.length) return 'perfect'
  if (completedCount === 0) return 'missed'
  return 'partial'
}

export function buildOverview(userGames, logs, todayKey) {
  const logsByDate = groupLogsByDate(logs)
  const startKeys = userGames.map((game) => game.trackingStartDate).filter(Boolean).sort()
  const rangeStart = startKeys[0]
  const perfectDates = rangeStart
    ? eachDateKey(rangeStart, todayKey).filter((dateKey) => isPerfectDay(userGames, logsByDate, dateKey))
    : []

  const allMissed = []
  userGames.forEach((game) => {
    missedDatesForGame(game, logs, todayKey).forEach((date) => {
      allMissed.push({ date, gameId: game.gameId })
    })
  })

  const totalCompleted = logs.filter((log) => log.status === 'completed').length
  const uniqueDaysWithTracking = rangeStart
    ? eachDateKey(rangeStart, todayKey).filter((dateKey) => gamesTrackedOnDate(userGames, dateKey).length > 0)
    : []
  const expectedAll = uniqueDaysWithTracking.reduce((sum, dateKey) => sum + gamesTrackedOnDate(userGames, dateKey).length, 0)

  return {
    currentStreak: overallCurrentStreak(userGames, logs, todayKey),
    longestStreak: overallLongestStreak(userGames, logs, todayKey),
    completionRate: completionRate(totalCompleted, expectedAll),
    totalCompleted,
    missedDailies: allMissed.length,
    perfectDays: perfectDates.length,
    averageDailyCompletion: uniqueDaysWithTracking.length
      ? roundRate(
          uniqueDaysWithTracking.reduce((sum, dateKey) => {
            const logsForDay = logsByDate.get(dateKey) || []
            return sum + logsForDay.filter((log) => log.status === 'completed').length
          }, 0) / uniqueDaysWithTracking.length,
        )
      : 0,
  }
}

export function buildMonthlyActivity(userGames, logs, todayKey) {
  const logsByDate = groupLogsByDate(logs)
  const months = new Map()

  const startKeys = userGames.map((game) => game.trackingStartDate).filter(Boolean).sort()
  if (!startKeys.length) return []

  eachDateKey(startKeys[0], todayKey).forEach((dateKey) => {
    const tracked = gamesTrackedOnDate(userGames, dateKey)
    if (!tracked.length) return
    const month = getMonthKey(dateKey)
    if (!months.has(month)) {
      months.set(month, { month, expected: 0, completed: 0 })
    }
    const bucket = months.get(month)
    bucket.expected += tracked.length
    const dayLogs = logsByDate.get(dateKey) || []
    bucket.completed += tracked.filter((game) =>
      dayLogs.some((log) => log.gameId === game.gameId && log.status === 'completed'),
    ).length
  })

  return Array.from(months.values()).map((item) => ({
    ...item,
    rate: completionRate(item.completed, item.expected),
    label: item.month,
  }))
}

export function buildHistoryDays(userGames, catalogById, logs, todayKey, filters = {}) {
  const logsByDate = groupLogsByDate(logs)
  const startKeys = userGames.map((game) => game.trackingStartDate).filter(Boolean).sort()
  if (!startKeys.length) return []

  let start = startKeys[0]
  let end = todayKey
  if (filters.month) {
    const [year, month] = filters.month.split('-').map(Number)
    const monthStart = `${filters.month}-01`
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const monthEnd = `${filters.month}-${String(lastDay).padStart(2, '0')}`
    start = monthStart > start ? monthStart : start
    end = monthEnd < end ? monthEnd : end
  }

  return eachDateKey(start, end)
    .map((dateKey) => {
      const tracked = gamesTrackedOnDate(userGames, dateKey).filter((game) => {
        if (!filters.gameId) return true
        return game.gameId === filters.gameId
      })
      if (!tracked.length) return null
      const dayLogs = logsByDate.get(dateKey) || []
      const entries = tracked.map((game) => {
        const log = dayLogs.find((item) => item.gameId === game.gameId)
        const status = log?.status === 'completed' ? 'completed' : log?.status === 'skipped' ? 'skipped' : 'missed'
        const catalog = catalogById.get(game.gameId)
        return {
          gameId: game.gameId,
          name: catalog?.name || game.gameId,
          iconUrl: catalog?.iconUrl || catalog?.coverUrl || '',
          status,
        }
      })
      const completedCount = entries.filter((entry) => entry.status === 'completed').length
      const dayStatusValue =
        completedCount === entries.length ? 'perfect' : completedCount === 0 ? 'missed' : 'partial'

      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'completed' && completedCount === 0) return null
        if (filters.status === 'missed' && !entries.some((entry) => entry.status === 'missed')) return null
        if (filters.status === 'partial' && dayStatusValue !== 'partial') return null
        if (filters.status === 'perfect' && dayStatusValue !== 'perfect') return null
      }

      return {
        date: dateKey,
        entries,
        completedCount,
        total: entries.length,
        status: dayStatusValue,
      }
    })
    .filter(Boolean)
    .reverse()
}

export function heatmapCells(userGames, logs, todayKey, weeks = 16) {
  const logsByDate = groupLogsByDate(logs)
  const start = subtractDays(todayKey, weeks * 7 - 1)
  return eachDateKey(start, todayKey).map((dateKey) => ({
    date: dateKey,
    status: dayStatus(userGames, logsByDate, dateKey),
    tracked: gamesTrackedOnDate(userGames, dateKey).length,
    completed: (logsByDate.get(dateKey) || []).filter((log) => log.status === 'completed').length,
  }))
}

export function rankingFromGameStats(gameStats) {
  return [...gameStats].sort((a, b) => b.completionRate - a.completionRate || b.completedDays - a.completedDays)
}
