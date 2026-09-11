import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useTracker } from '../context/TrackerContext'
import { getCatalogGame, importGame, searchGames } from '../services/gameService'
import { addUserGame, removeUserGame } from '../services/userGameService'

export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useGames() {
  const { firebaseUser, configured } = useAuth()
  const { userGames, enabledGames, catalogById, loading, error, refreshCatalog } = useTracker()
  const { push } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchWarning, setSearchWarning] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const debouncedQuery = useDebouncedValue(searchTerm, 400)

  useEffect(() => {
    if (!configured) return undefined
    const queryText = debouncedQuery.trim()
    if (!queryText) {
      setResults([])
      setSearching(false)
      setSearchError(null)
      setSearchWarning(null)
      return undefined
    }

    let cancelled = false
    setSearching(true)
    setSearchError(null)
    setSearchWarning(null)
    searchGames(queryText)
      .then((payload) => {
        if (cancelled) return
        setResults(payload.results || [])
        if (payload.warning) setSearchWarning(payload.warning)
      })
      .catch((requestError) => {
        console.error('Game search failed', requestError)
        if (!cancelled) {
          setSearchError(requestError)
          setResults([])
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false)
      })
    return () => {
      cancelled = true
    }
  }, [configured, debouncedQuery])

  const addGame = useCallback(
    async (normalizedGame) => {
      if (!firebaseUser) return
      setBusyId(normalizedGame.id || normalizedGame.sourceId)
      try {
        let gameId = normalizedGame.id
        const catalogEntry = gameId ? await getCatalogGame(gameId) : null
        if (!catalogEntry) {
          const imported = await importGame(normalizedGame)
          gameId = imported.id
        }
        const existing = userGames.find((game) => game.gameId === gameId)
        await addUserGame(firebaseUser.uid, gameId, existing)
        await refreshCatalog()
        push(`${normalizedGame.name || 'Game'} added to your list.`)
      } catch (addError) {
        console.error('Failed to add game', addError)
        push(addError.message || 'Could not add that game.', 'error')
        throw addError
      } finally {
        setBusyId(null)
      }
    },
    [firebaseUser, userGames, refreshCatalog, push],
  )

  const removeGame = useCallback(
    async (gameId) => {
      if (!firebaseUser) return
      setBusyId(gameId)
      try {
        await removeUserGame(firebaseUser.uid, gameId)
        push('Game removed from future daily tracking.')
      } catch (removeError) {
        console.error('Failed to remove game', removeError)
        push(removeError.message || 'Could not remove that game.', 'error')
        throw removeError
      } finally {
        setBusyId(null)
      }
    },
    [firebaseUser, push],
  )

  const trackedWithCatalog = useMemo(
    () =>
      userGames.map((game) => ({
        ...game,
        catalog: catalogById.get(game.gameId) || null,
      })),
    [userGames, catalogById],
  )

  return {
    userGames: trackedWithCatalog,
    enabledGames,
    catalogById,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    results,
    searching,
    searchError,
    searchWarning,
    busyId,
    addGame,
    removeGame,
  }
}
