import { addDays, eachDateKey, subtractDays } from './dateUtils'

function isCompleted(status) {
  return status === 'completed'
}

export function currentStreak(completedDateSet, todayKey) {
  if (!completedDateSet.size) return 0

  let cursor = completedDateSet.has(todayKey) ? todayKey : subtractDays(todayKey, 1)
  if (!completedDateSet.has(cursor)) return 0

  let streak = 0
  while (completedDateSet.has(cursor)) {
    streak += 1
    cursor = subtractDays(cursor, 1)
  }
  return streak
}

export function longestStreak(sortedCompletedKeys) {
  if (!sortedCompletedKeys.length) return 0

  let best = 1
  let run = 1

  for (let index = 1; index < sortedCompletedKeys.length; index += 1) {
    const previous = sortedCompletedKeys[index - 1]
    const current = sortedCompletedKeys[index]
    if (addDays(previous, 1) === current) {
      run += 1
      best = Math.max(best, run)
    } else if (current !== previous) {
      run = 1
    }
  }

  return best
}

export function completedDateSetFromLogs(logs, gameId = null) {
  const set = new Set()
  logs.forEach((log) => {
    if (!isCompleted(log.status)) return
    if (gameId && log.gameId !== gameId) return
    set.add(log.date)
  })
  return set
}

export function sortedKeys(dateSet) {
  return Array.from(dateSet).sort()
}

export function gameWasTrackedOn(userGame, dateKey) {
  const startKey = userGame.trackingStartDate || userGame.trackingStartedAtDate
  if (!startKey || dateKey < startKey) return false
  if (userGame.enabled) return true
  const endKey = userGame.trackingEndDate
  return Boolean(endKey && dateKey < endKey)
}

export function gamesTrackedOnDate(userGames, dateKey) {
  return userGames.filter((game) => gameWasTrackedOn(game, dateKey))
}

export function isPerfectDay(userGames, logsByDate, dateKey) {
  const tracked = gamesTrackedOnDate(userGames, dateKey)
  if (!tracked.length) return false
  const logs = logsByDate.get(dateKey) || []
  return tracked.every((game) =>
    logs.some((log) => log.gameId === game.gameId && isCompleted(log.status)),
  )
}

export function perfectDaySet(userGames, logs, startKey, endKey) {
  const logsByDate = groupLogsByDate(logs)
  const perfect = new Set()
  eachDateKey(startKey, endKey).forEach((dateKey) => {
    if (isPerfectDay(userGames, logsByDate, dateKey)) {
      perfect.add(dateKey)
    }
  })
  return perfect
}

export function groupLogsByDate(logs) {
  const map = new Map()
  logs.forEach((log) => {
    if (!map.has(log.date)) map.set(log.date, [])
    map.get(log.date).push(log)
  })
  return map
}

export function overallCurrentStreak(userGames, logs, todayKey) {
  const startKeys = userGames
    .map((game) => game.trackingStartDate)
    .filter(Boolean)
    .sort()
  if (!startKeys.length) return 0
  const perfect = perfectDaySet(userGames, logs, startKeys[0], todayKey)
  return currentStreak(perfect, todayKey)
}

export function overallLongestStreak(userGames, logs, todayKey) {
  const startKeys = userGames
    .map((game) => game.trackingStartDate)
    .filter(Boolean)
    .sort()
  if (!startKeys.length) return 0
  const perfect = perfectDaySet(userGames, logs, startKeys[0], todayKey)
  return longestStreak(sortedKeys(perfect))
}
