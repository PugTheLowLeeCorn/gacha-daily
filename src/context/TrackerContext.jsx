import { collection, onSnapshot } from 'firebase/firestore'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getDb } from '../firebase/config'
import { mapDailyLog } from '../services/dailyService'
import { getCatalogGamesByIds, seedCatalog } from '../services/gameService'
import { DEFAULT_TIMEZONE, timestampToDateKey } from '../utils/dateUtils'
import { useAuth } from './AuthContext'

const TrackerContext = createContext(null)

function mapUserGame(id, data, timeZone) {
  const trackingStartDate = timestampToDateKey(data.trackingStartedAt, timeZone)
  const trackingEndDate = timestampToDateKey(data.trackingEndedAt, timeZone)
  return {
    id,
    gameId: data.gameId || id,
    enabled: data.enabled !== false,
    trackingStartedAt: data.trackingStartedAt || null,
    trackingEndedAt: data.trackingEndedAt || null,
    addedAt: data.addedAt || null,
    updatedAt: data.updatedAt || null,
    trackingStartDate,
    trackingEndDate,
  }
}

export function TrackerProvider({ children }) {
  const { firebaseUser, profile, configured } = useAuth()
  const timeZone = profile?.timezone || DEFAULT_TIMEZONE
  const [userGames, setUserGames] = useState([])
  const [logs, setLogs] = useState([])
  const [catalogById, setCatalogById] = useState(new Map())
  const [loadingGames, setLoadingGames] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!configured || !firebaseUser) {
      setUserGames([])
      setLogs([])
      setLoadingGames(false)
      setLoadingLogs(false)
      return undefined
    }

    seedCatalog().catch((seedError) => {
      console.error('Catalog seed skipped', seedError)
    })

    setLoadingGames(true)
    const unsubscribe = onSnapshot(
      collection(getDb(), 'users', firebaseUser.uid, 'games'),
      (snapshot) => {
        setUserGames(snapshot.docs.map((item) => mapUserGame(item.id, item.data(), timeZone)))
        setLoadingGames(false)
        setError(null)
      },
      (snapshotError) => {
        console.error('Failed to load tracked games', snapshotError)
        setError(snapshotError)
        setLoadingGames(false)
      },
    )
    return unsubscribe
  }, [configured, firebaseUser, timeZone])

  useEffect(() => {
    if (!configured || !firebaseUser) return undefined
    setLoadingLogs(true)
    const unsubscribe = onSnapshot(
      collection(getDb(), 'users', firebaseUser.uid, 'dailyLogs'),
      (snapshot) => {
        setLogs(snapshot.docs.map((item) => mapDailyLog(item.id, item.data())))
        setLoadingLogs(false)
        setError(null)
      },
      (snapshotError) => {
        console.error('Failed to load daily logs', snapshotError)
        setError(snapshotError)
        setLoadingLogs(false)
      },
    )
    return unsubscribe
  }, [configured, firebaseUser])

  useEffect(() => {
    const ids = userGames.map((game) => game.gameId)
    if (!ids.length) {
      setCatalogById(new Map())
      return undefined
    }
    let cancelled = false
    getCatalogGamesByIds(ids)
      .then((games) => {
        if (cancelled) return
        setCatalogById(new Map(games.map((game) => [game.id, game])))
      })
      .catch((catalogError) => {
        console.error('Failed to load game catalog entries', catalogError)
        if (!cancelled) setError(catalogError)
      })
    return () => {
      cancelled = true
    }
  }, [userGames])

  const value = useMemo(
    () => ({
      userGames,
      enabledGames: userGames.filter((game) => game.enabled),
      logs,
      catalogById,
      loading: loadingGames || loadingLogs,
      error,
      refreshCatalog: async () => {
        const games = await getCatalogGamesByIds(userGames.map((game) => game.gameId))
        setCatalogById(new Map(games.map((game) => [game.id, game])))
      },
    }),
    [userGames, logs, catalogById, loadingGames, loadingLogs, error],
  )

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
}

export function useTracker() {
  const context = useContext(TrackerContext)
  if (!context) throw new Error('useTracker must be used within TrackerProvider')
  return context
}
