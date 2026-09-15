import { useNavigate } from 'react-router-dom'
import DailyChecklist from '../components/dashboard/DailyChecklist'
import DailyProgress from '../components/dashboard/DailyProgress'
import StreakCard from '../components/dashboard/StreakCard'
import ErrorState from '../components/common/ErrorState'
import Loading from '../components/common/Loading'
import { useAuth } from '../hooks/useAuth'
import { useDaily } from '../hooks/useDaily'
import { useStatistics } from '../hooks/useStatistics'
import { formatDisplayDate, greetingForHour } from '../utils/dateUtils'

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const daily = useDaily()
  const { overallStreak } = useStatistics()

  if (daily.loading) {
    return <Loading label="Loading daily checklist..." />
  }

  if (daily.error) {
    return (
      <ErrorState
        message={daily.error.message}
        onRetry={() => window.location.reload()}
      />
    )
  }

  const firstName = (profile?.displayName || 'Player').split(' ')[0]

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-amber-500/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-500/[0.025] blur-3xl" />

      <div className="relative space-y-8">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/80 px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)] lg:px-8 lg:py-8">
          <div className="pointer-events-none absolute right-[-80px] top-[-100px] h-64 w-64 rounded-full bg-amber-400/[0.07] blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                Gacha Daily
              </div>

              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {greetingForHour(new Date(), profile?.timezone)},{' '}
                <span className="text-amber-400">{firstName}</span> 👋
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                Ready to clear today's dailies and keep your streak alive?
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                <span className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-1.5">
                  {formatDisplayDate(daily.todayKey, {
                    weekday: 'long',
                  })}
                </span>

                <span className="hidden text-zinc-700 sm:inline">•</span>

                <span className="text-zinc-500">
                  {daily.total} tracked {daily.total === 1 ? 'game' : 'games'}
                </span>
              </div>
            </div>

            {/* Today mini status */}
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-zinc-800 bg-black/20 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-lg">
                ✦
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Today's status
                </p>

                <p className="mt-0.5 text-sm font-semibold text-zinc-200">
                  {daily.allComplete ? 'All cleared' : 'Run not finished'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Summary cards */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-400/[0.035] blur-3xl transition-opacity duration-300 group-hover:bg-amber-400/[0.06]" />

            <DailyProgress
              completedCount={daily.completedCount}
              total={daily.total}
              percent={daily.percent}
              allComplete={daily.allComplete}
            />
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-400/[0.025] blur-3xl transition-opacity duration-300 group-hover:bg-orange-400/[0.05]" />

            <StreakCard streak={overallStreak} />
          </div>
        </section>

        {/* Daily run */}
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-amber-400" />
                <h2 className="font-display text-xl font-semibold text-white">
                  Today's run
                </h2>
              </div>

              <p className="pl-3 text-sm text-zinc-500">
                Clear every game before the day resets.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/games')}
              className="self-start rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white sm:self-auto"
            >
              Manage games
            </button>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.14)] sm:p-4">
            <DailyChecklist
              items={daily.checklist}
              onComplete={daily.markComplete}
              completingId={daily.completingId}
              onAddGames={() => navigate('/games')}
            />
          </div>
        </section>
      </div>
    </div>
  )
}