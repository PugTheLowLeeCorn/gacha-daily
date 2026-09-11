export default function DailyProgress({ completedCount, total, percent, allComplete }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-medium text-zinc-500">Today's Progress</h2>
      <p className="mt-2 font-display text-4xl font-bold">
        {completedCount} / {total}
      </p>
      <p className="mt-1 text-lg text-zinc-500">{percent}%</p>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {allComplete ? <p className="mt-4 font-semibold text-emerald-500">🎉 All dailies completed!</p> : null}
    </section>
  )
}
