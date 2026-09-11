import GameCard from '../games/GameCard'
import EmptyState from '../common/EmptyState'

export default function DailyChecklist({ items, onComplete, completingId, onAddGames }) {
  if (!items.length) {
    return (
      <EmptyState
        title="No games tracked yet"
        description="Add the gacha games you play to build today's checklist."
        actionLabel="+ Add Game"
        onAction={onAddGames}
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <GameCard
          key={item.gameId}
          game={item}
          streak={item.streak}
          completed={item.completed}
          busy={completingId === item.gameId}
          onComplete={onComplete}
        />
      ))}
    </div>
  )
}
