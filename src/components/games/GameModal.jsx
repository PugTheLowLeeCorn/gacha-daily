import Modal from '../common/Modal'
import GameSelector from './GameSelector'

export default function GameModal({
  open,
  onClose,
  query,
  onQueryChange,
  results,
  searching,
  searchError,
  searchWarning,
  onSelect,
  busyId,
  trackedIds,
}) {
  if (!open) return null
  return (
    <Modal title="Add Game" onClose={onClose}>
      <GameSelector
        query={query}
        onQueryChange={onQueryChange}
        results={results}
        searching={searching}
        searchError={searchError}
        searchWarning={searchWarning}
        onSelect={onSelect}
        busyId={busyId}
        trackedIds={trackedIds}
      />
    </Modal>
  )
}
