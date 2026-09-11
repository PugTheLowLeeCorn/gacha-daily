export default function StreakCard({ streak }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-500">Overall Streak</p>
      <p className="mt-2 font-display text-4xl font-bold">🔥 {streak} days</p>
      <p className="mt-2 text-sm text-zinc-500">Perfect days in a row. Don't break the chain.</p>
    </section>
  )
}
