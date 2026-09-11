import { formatDisplayDate } from '../../utils/dateUtils'

export default function HistoryList({ days }) {
  if (!days.length) {
    return <p className="text-zinc-500">No history matches these filters.</p>
  }

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <section key={day.date} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="font-display font-semibold">{formatDisplayDate(day.date)}</h3>
          <p className="text-xs text-zinc-500">
            {day.completedCount} / {day.total} completed
          </p>
          <ul className="mt-3 space-y-2">
            {day.entries.map((entry) => (
              <li key={entry.gameId} className="flex items-center gap-3 text-sm">
                {entry.iconUrl ? (
                  <img src={entry.iconUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800">
                    {entry.name.slice(0, 1)}
                  </span>
                )}
                <span>
                  {entry.status === 'completed' ? '✅' : entry.status === 'skipped' ? '⏭️' : '❌'} {entry.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
