export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh'
export const DEFAULT_REMINDER_TIME = '23:30'
export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidDateKey(value) {
  return typeof value === 'string' && DATE_KEY_PATTERN.test(value)
}

export function formatDateKey(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function getTodayKey(timeZone = DEFAULT_TIMEZONE) {
  return formatDateKey(new Date(), timeZone)
}

export function timestampToDateKey(value, timeZone = DEFAULT_TIMEZONE) {
  if (!value) return null
  if (typeof value === 'string' && isValidDateKey(value.slice(0, 10))) {
    return value.slice(0, 10)
  }
  const date = value.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return formatDateKey(date, timeZone)
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return { year, month, day }
}

export function addDays(dateKey, amount) {
  const { year, month, day } = parseDateKey(dateKey)
  const utc = new Date(Date.UTC(year, month - 1, day + amount))
  return utc.toISOString().slice(0, 10)
}

export function subtractDays(dateKey, amount) {
  return addDays(dateKey, -amount)
}

export function daysBetween(startKey, endKey) {
  const start = Date.UTC(...Object.values(parseDateKey(startKey)).map((value, index) => (index === 1 ? value - 1 : value)))
  const end = Date.UTC(...Object.values(parseDateKey(endKey)).map((value, index) => (index === 1 ? value - 1 : value)))
  return Math.round((end - start) / 86400000)
}

export function inclusiveDayCount(startKey, endKey) {
  if (!startKey || !endKey || startKey > endKey) return 0
  return daysBetween(startKey, endKey) + 1
}

export function eachDateKey(startKey, endKey) {
  if (!startKey || !endKey || startKey > endKey) return []
  const keys = []
  let current = startKey
  while (current <= endKey) {
    keys.push(current)
    current = addDays(current, 1)
  }
  return keys
}

export function monthRange(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number)
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    start,
    end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function getMonthKey(dateKey) {
  return dateKey.slice(0, 7)
}

export function formatDisplayDate(dateKey, options = {}) {
  const { year, month, day } = parseDateKey(dateKey)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('en-US', {
    weekday: options.weekday,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatShortDate(dateKey) {
  const { year, month, day } = parseDateKey(dateKey)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function greetingForHour(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    }).format(date),
  )
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function getLocalTimeParts(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  return { hour, minute, hhmm: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` }
}

export function timeToMinutes(hhmm) {
  const [hour, minute] = hhmm.split(':').map(Number)
  return hour * 60 + minute
}

export const COMMON_TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Jakarta',
  'Asia/Manila',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'UTC',
]
