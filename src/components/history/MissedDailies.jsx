import { formatShortDate } from '../../utils/dateUtils'

export default function MissedDailies({ items, catalogById }) {
  const grouped = items.reduce((map, item) => {
    if (!map.has(item.date)) map.set(item.date, [])
    map.get(item.date).push(item)
    return map
  }, new Map())

  const dates = Array.from(grouped.keys()).sort().reverse()

  if (!dates.length) {
    return <p className="text-sm text-zinc-500">No missed dailies in the tracking window.</p>
  }

  return (
    <div className="space-y-4">
      {dates.map((date) => (
        <section key={date}>
          <h3 className="font-semibold">{formatShortDate(date)}</h3>
          <ul className="mt-2 space-y-2">
            {grouped.get(date).map((item) => {
              const game = catalogById.get(item.gameId)
              return (
                <li key={`${date}-${item.gameId}`} className="flex items-center gap-3 text-sm">
                  {game?.iconUrl ? (
                    <img src={game.iconUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  ) : null}
                  <span>
                    ❌ {game?.name || item.gameId}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
