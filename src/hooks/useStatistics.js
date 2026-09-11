import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTracker } from '../context/TrackerContext'
import { computeStatistics } from '../services/statisticsService'
import { buildHistoryDays, heatmapCells } from '../utils/statisticsUtils'
import { DEFAULT_TIMEZONE, getTodayKey } from '../utils/dateUtils'
import { overallCurrentStreak } from '../utils/streakUtils'

const EMPTY_FILTERS = { gameId: '', month: '', status: 'all' }

export function useStatistics(filters = EMPTY_FILTERS) {
  const { profile } = useAuth()
  const { userGames, logs, catalogById, loading, error } = useTracker()
  const timeZone = profile?.timezone || DEFAULT_TIMEZONE
  const todayKey = getTodayKey(timeZone)

  const stats = useMemo(
    () => computeStatistics({ userGames, catalogById, logs, todayKey }),
    [userGames, catalogById, logs, todayKey],
  )

  const history = useMemo(
    () => buildHistoryDays(userGames, catalogById, logs, todayKey, filters),
    [userGames, catalogById, logs, todayKey, filters],
  )

  const heatmap = useMemo(() => heatmapCells(userGames, logs, todayKey), [userGames, logs, todayKey])

  return {
    todayKey,
    loading,
    error,
    overallStreak: overallCurrentStreak(userGames, logs, todayKey),
    ...stats,
    history,
    heatmap,
  }
}
