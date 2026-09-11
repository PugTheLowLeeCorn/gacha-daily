import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useTracker } from '../context/TrackerContext'
import { completeDaily } from '../services/dailyService'
import { DEFAULT_TIMEZONE, getTodayKey } from '../utils/dateUtils'
import { currentStreak, completedDateSetFromLogs } from '../utils/streakUtils'

export function useDaily() {
  const { firebaseUser, profile } = useAuth()
  const { enabledGames, logs, catalogById, loading, error } = useTracker()
  const { push } = useToast()
  const [completingId, setCompletingId] = useState(null)
  const timeZone = profile?.timezone || DEFAULT_TIMEZONE
  const todayKey = getTodayKey(timeZone)

  const checklist = useMemo(() => {
    return enabledGames.map((game) => {
      const catalog = catalogById.get(game.gameId)
      const todayLog = logs.find((log) => log.date === todayKey && log.gameId === game.gameId)
      const completedSet = completedDateSetFromLogs(logs, game.gameId)
      return {
        ...game,
        catalog,
        completed: todayLog?.status === 'completed',
        skipped: todayLog?.status === 'skipped',
        streak: currentStreak(completedSet, todayKey),
      }
    })
  }, [enabledGames, catalogById, logs, todayKey])

  const completedCount = checklist.filter((item) => item.completed).length
  const total = checklist.length
  const percent = total ? Math.round((completedCount / total) * 1000) / 10 : 0

  const markComplete = useCallback(
    async (gameId) => {
      if (!firebaseUser) return
      setCompletingId(gameId)
      try {
        const result = await completeDaily(firebaseUser.uid, gameId, todayKey)
        if (result.alreadyCompleted) {
          push('Already completed for today.')
        } else {
          push('Daily completed. Keep the chain going.')
        }
      } catch (completeError) {
        console.error('Failed to complete daily', completeError)
        push(completeError.message || 'Could not save completion.', 'error')
        throw completeError
      } finally {
        setCompletingId(null)
      }
    },
    [firebaseUser, todayKey, push],
  )

  return {
    todayKey,
    checklist,
    completedCount,
    total,
    percent,
    allComplete: total > 0 && completedCount === total,
    loading,
    error,
    completingId,
    markComplete,
  }
}
