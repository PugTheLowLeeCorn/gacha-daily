import { useState } from 'react'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import ErrorState from '../components/common/ErrorState'
import Loading from '../components/common/Loading'
import Modal from '../components/common/Modal'
import GameModal from '../components/games/GameModal'
import { GameArt } from '../components/games/GameCard'
import { useGames } from '../hooks/useGames'
import { formatShortDate } from '../utils/dateUtils'

export default function Games() {
  const {
    userGames,
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
  } = useGames()
  const [open, setOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState(null)

  if (loading) return <Loading label="Loading your games..." />
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />

  const enabled = userGames.filter((game) => game.enabled)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My Games</h1>
          <p className="text-zinc-500">Only enabled games appear on today's checklist.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Add Game</Button>
      </div>

      {!enabled.length ? (
        <EmptyState
          title="No tracked games"
          description="Search the game database and add titles you play."
          actionLabel="+ Add Game"
          onAction={() => setOpen(true)}
        />
      ) : (
        <ul className="space-y-3">
          {enabled.map((game) => {
            const name = game.catalog?.name || game.gameId
            return (
              <li
                key={game.gameId}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <GameArt src={game.catalog?.iconUrl || game.catalog?.coverUrl} name={name} />
                  <div>
                    <p className="font-display font-semibold">{name}</p>
                    <p className="text-sm text-zinc-500">Tracking</p>
                    <p className="text-xs text-zinc-500">
                      Started {game.trackingStartDate ? formatShortDate(game.trackingStartDate) : 'today'}
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setPendingRemove(game)}>
                  Remove
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <GameModal
        open={open}
        onClose={() => setOpen(false)}
        query={searchTerm}
        onQueryChange={setSearchTerm}
        results={results}
        searching={searching}
        searchError={searchError}
        searchWarning={searchWarning}
        busyId={busyId}
        trackedIds={new Set(enabled.map((game) => game.gameId))}
        onSelect={async (game) => {
          await addGame(game)
          setOpen(false)
          setSearchTerm('')
        }}
      />

      {pendingRemove ? (
        <Modal title={`Remove ${pendingRemove.catalog?.name || pendingRemove.gameId}?`} onClose={() => setPendingRemove(null)}>
          <p className="text-zinc-500">Your previous daily history will be preserved.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await removeGame(pendingRemove.gameId)
                setPendingRemove(null)
              }}
            >
              Remove
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
