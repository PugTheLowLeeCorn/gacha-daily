import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Button from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { firebaseUser, configured, signIn, loading } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (configured && firebaseUser && !loading) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSignIn() {
    setBusy(true)
    setError(null)
    try {
      await signIn()
    } catch (signInError) {
      console.error('Google sign-in failed', signInError)
      setError(signInError.message || 'Google sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#0b0e14] px-4 text-zinc-100">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <p className="font-display text-3xl font-bold">Gacha Daily</p>
        <p className="mt-3 text-zinc-400">
          Track dailies across every gacha you play. Sign in with Google to keep streaks, history, and reminders in
          sync.
        </p>
        {!configured ? (
          <p className="mt-6 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
            Firebase is not configured yet. Add the VITE_FIREBASE_* values from FIREBASE_SETUP.md before signing in.
          </p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
        <Button className="mt-8 w-full" onClick={handleSignIn} disabled={!configured || busy}>
          {busy ? 'Opening Google...' : 'Continue with Google'}
        </Button>
      </div>
    </div>
  )
}
