import { useEffect, useState } from 'react'
import Button from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import { updateUserProfile } from '../services/userService'
import { COMMON_TIMEZONES } from '../utils/dateUtils'

export default function Settings() {
  const { profile, firebaseUser, signOut } = useAuth()
  const { preference, setTheme } = useTheme()
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [reminderEnabled, setReminderEnabled] = useState(profile?.reminderEnabled !== false)
  const [reminderTime, setReminderTime] = useState(profile?.reminderTime || '23:30')
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Ho_Chi_Minh')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName || '')
    setReminderEnabled(profile.reminderEnabled !== false)
    setReminderTime(profile.reminderTime || '23:30')
    setTimezone(profile.timezone || 'Asia/Ho_Chi_Minh')
  }, [profile])

  async function saveReminders(event) {
    event.preventDefault()
    if (!firebaseUser) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await updateUserProfile(firebaseUser.uid, {
        displayName: displayName.trim() || 'Player',
        reminderEnabled,
        reminderTime,
        timezone,
      })
      setMessage('Settings saved.')
    } catch (saveError) {
      console.error('Failed to save settings', saveError)
      setError(saveError.message || 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Settings</h1>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <img src={profile?.photoURL || '/favicon.svg'} alt="" className="h-16 w-16 rounded-full object-cover" />
          <div>
            <p className="font-semibold">{profile?.displayName}</p>
            <p className="text-sm text-zinc-500">{profile?.email}</p>
          </div>
        </div>
        <label className="mt-4 block text-sm">
          Display name
          <input
            className="focus-ring mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
      </section>

      <form
        onSubmit={saveReminders}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="font-display text-lg font-semibold">Reminder</h2>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(event) => setReminderEnabled(event.target.checked)}
          />
          Email me if dailies are still incomplete
        </label>
        <label className="block text-sm">
          Reminder time
          <input
            type="time"
            className="focus-ring mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={reminderTime}
            onChange={(event) => setReminderTime(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          Timezone
          <select
            className="focus-ring mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          >
            {COMMON_TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        {message ? <p className="text-sm text-emerald-500">{message}</p> : null}
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save profile and reminders'}
        </Button>
      </form>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="font-display text-lg font-semibold">Theme</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['light', 'dark', 'system'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              className={`rounded-xl border px-3 py-2 capitalize ${
                preference === option
                  ? 'border-amber-400 bg-amber-400/15'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="font-display text-lg font-semibold">Account</h2>
        <Button className="mt-4" variant="secondary" onClick={signOut}>
          Logout
        </Button>
      </section>
    </div>
  )
}
