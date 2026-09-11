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

  if (daily.loading) return <Loading label="Loading daily checklist..." />
  if (daily.error) {
    return <ErrorState message={daily.error.message} onRetry={() => window.location.reload()} />
  }

  const firstName = (profile?.displayName || 'Player').split(' ')[0]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">
          {greetingForHour(new Date(), profile?.timezone)}, {firstName} 👋
        </h1>
        <p className="mt-1 text-zinc-500">{formatDisplayDate(daily.todayKey, { weekday: 'long' })}</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <DailyProgress
          completedCount={daily.completedCount}
          total={daily.total}
          percent={daily.percent}
          allComplete={daily.allComplete}
        />
        <StreakCard streak={overallStreak} />
      </div>
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Tracked games</h2>
        <DailyChecklist
          items={daily.checklist}
          onComplete={daily.markComplete}
          completingId={daily.completingId}
          onAddGames={() => navigate('/games')}
        />
      </section>
    </div>
  )
}
