const { Resend } = require('resend')

function reminderHtml({ displayName, incompleteNames, streak, dashboardUrl }) {
  const list = incompleteNames.map((name) => `❌ ${name}`).join('<br />')
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <p>Hello ${displayName || 'Player'} 👋</p>
      <p>You still need to complete:</p>
      <p>${list}</p>
      <p>🔥 Current streak: ${streak} days</p>
      <p>Don't break the chain!</p>
      <p>
        <a href="${dashboardUrl}" style="display:inline-block;background:#e8b84a;color:#111827;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">
          Open Gacha Daily
        </a>
      </p>
    </div>
  `
}

async function sendReminderEmail({ apiKey, from, to, displayName, incompleteNames, streak, dashboardUrl }) {
  const resend = new Resend(apiKey)
  return resend.emails.send({
    from,
    to,
    subject: '⚠️ You still have daily tasks remaining',
    html: reminderHtml({ displayName, incompleteNames, streak, dashboardUrl }),
    text: [
      `Hello ${displayName || 'Player'}`,
      '',
      'You still need to complete:',
      ...incompleteNames.map((name) => `- ${name}`),
      '',
      `Current streak: ${streak} days`,
      "Don't break the chain!",
      dashboardUrl,
    ].join('\n'),
  })
}

function formatDateKey(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function localMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0)
  return hour * 60 + minute
}

function timeToMinutes(hhmm) {
  const [hour, minute] = String(hhmm || '23:30').split(':').map(Number)
  return hour * 60 + minute
}

function isInReminderWindow(now, timeZone, reminderTime, windowMinutes = 15) {
  const nowMinutes = localMinutes(now, timeZone)
  const target = timeToMinutes(reminderTime)
  if (target + windowMinutes <= 24 * 60) {
    return nowMinutes >= target && nowMinutes < target + windowMinutes
  }
  const overflow = target + windowMinutes - 24 * 60
  return nowMinutes >= target || nowMinutes < overflow
}

function currentStreak(completedDates, todayKey) {
  const set = new Set(completedDates)
  let cursor = set.has(todayKey) ? todayKey : shiftDate(todayKey, -1)
  if (!set.has(cursor)) return 0
  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor = shiftDate(cursor, -1)
  }
  return streak
}

function shiftDate(dateKey, amount) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day + amount))
  return utc.toISOString().slice(0, 10)
}

function overallPerfectStreak(trackedGameIds, logs, todayKey) {
  if (!trackedGameIds.length) return 0
  const byDate = new Map()
  logs.forEach((log) => {
    if (log.status !== 'completed') return
    if (!byDate.has(log.date)) byDate.set(log.date, new Set())
    byDate.get(log.date).add(log.gameId)
  })
  let cursor = todayKey
  let streak = 0
  const todaySet = byDate.get(todayKey) || new Set()
  const todayPerfect = trackedGameIds.every((id) => todaySet.has(id))
  if (!todayPerfect) cursor = shiftDate(todayKey, -1)
  while (true) {
    const set = byDate.get(cursor) || new Set()
    const perfect = trackedGameIds.every((id) => set.has(id))
    if (!perfect) break
    streak += 1
    cursor = shiftDate(cursor, -1)
  }
  return streak
}

module.exports = {
  sendReminderEmail,
  formatDateKey,
  isInReminderWindow,
  currentStreak,
  overallPerfectStreak,
}
