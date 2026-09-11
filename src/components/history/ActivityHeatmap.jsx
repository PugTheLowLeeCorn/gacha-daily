import { useMemo, useState } from 'react'
import { formatDisplayDate } from '../../utils/dateUtils'
import { gamesTrackedOnDate, groupLogsByDate } from '../../utils/streakUtils'
import Modal from '../common/Modal'

const colors = {
  perfect: 'bg-emerald-500',
  partial: 'bg-amber-400',
  missed: 'bg-rose-500',
  empty: 'bg-zinc-300 dark:bg-zinc-800',
}

export default function ActivityHeatmap({ cells, userGames, logs, catalogById }) {
  const [selected, setSelected] = useState(null)
  const logsByDate = useMemo(() => groupLogsByDate(logs), [logs])

  const weeks = []
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7))
  }

  const detail = selected
    ? {
        date: selected,
        games: gamesTrackedOnDate(userGames, selected).map((game) => {
          const catalog = catalogById.get(game.gameId)
          const log = (logsByDate.get(selected) || []).find((item) => item.gameId === game.gameId)
          return {
            gameId: game.gameId,
            name: catalog?.name || game.gameId,
            completed: log?.status === 'completed',
          }
        }),
      }
    : null

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="font-display text-lg font-semibold">Activity heatmap</h2>
      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((cell) => (
                <button
                  key={cell.date}
                  type="button"
                  title={cell.date}
                  aria-label={`${cell.date}: ${cell.status}`}
                  onClick={() => setSelected(cell.date)}
                  className={`h-3.5 w-3.5 rounded-sm ${colors[cell.status] || colors.empty}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-3 text-xs text-zinc-500">
        <span>Green: all complete</span>
        <span>Yellow: partial</span>
        <span>Red: missed</span>
        <span>Gray: none tracked</span>
      </div>
      {detail ? (
        <Modal title={formatDisplayDate(detail.date)} onClose={() => setSelected(null)}>
          {detail.games.length ? (
            <>
              <ul className="space-y-2">
                {detail.games.map((game) => (
                  <li key={game.gameId}>
                    {game.name} {game.completed ? '✅' : '❌'}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-zinc-500">
                {detail.games.filter((game) => game.completed).length} / {detail.games.length} completed
              </p>
            </>
          ) : (
            <p>No tracked games on this date.</p>
          )}
        </Modal>
      ) : null}
    </section>
  )
}
