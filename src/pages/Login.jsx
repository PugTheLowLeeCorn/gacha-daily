import { useState } from 'react'
import { AlertCircle, Sparkles, ShieldCheck } from 'lucide-react'
import { Navigate } from 'react-router-dom'
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
    <main className="relative min-h-svh overflow-hidden bg-[#080a0f] text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(245,185,55,0.10),transparent_32%),radial-gradient(circle_at_15%_85%,rgba(124,58,237,0.10),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(14,165,233,0.07),transparent_25%)]" />

        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-amber-300/8 blur-[110px]" />

        <div className="absolute bottom-[-180px] left-[-120px] h-[380px] w-[380px] rounded-full bg-violet-500/8 blur-[120px]" />

        <div className="absolute right-[-120px] top-[18%] h-[320px] w-[320px] rounded-full bg-sky-400/6 blur-[120px]" />

        <div className="absolute left-[10%] top-[18%] h-1 w-1 rounded-full bg-white/50 shadow-[120px_70px_0_rgba(255,255,255,0.35),310px_140px_0_rgba(255,255,255,0.20),520px_30px_0_rgba(255,255,255,0.25),760px_220px_0_rgba(255,255,255,0.20)]" />
      </div>

      <div className="relative z-10 flex min-h-svh items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[430px]">

          {/* Brand */}
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/8 shadow-[0_0_40px_rgba(245,185,55,0.12)] backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-amber-300" />
              </div>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              Gacha Daily
            </h1>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
              Keep every daily in check.
              <br />
              Never lose the chain again.
            </p>
          </div>

          {/* Login Card */}
          <section className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[#0d1017]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">

            {/* Card glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-300/6 to-transparent" />

            {/* Doro */}
            <div className="relative flex justify-center">
              <div className="absolute bottom-3 h-16 w-40 rounded-full bg-amber-300/8 blur-2xl" />

              <div className="relative -mt-2 flex h-[165px] items-center justify-center">
                <img
                  src="/doro.gif"
                  alt="Doro"
                  className="h-[165px] w-auto object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
                />
              </div>
            </div>

            <div className="relative text-center">
              <p className="text-xl font-semibold tracking-tight text-white">
                Welcome back
              </p>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Sign in to sync your games, streaks, history, and reminders.
              </p>
            </div>

            {/* Firebase warning */}
            {!configured ? (
              <div className="mt-6 flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/7 p-4 text-left">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                <p className="text-sm leading-5 text-amber-200">
                  Firebase is not configured yet. Add the VITE_FIREBASE_*
                  values before signing in.
                </p>
              </div>
            ) : null}

            {/* Error */}
            {error ? (
              <div className="mt-4 flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/7 p-4 text-left">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />

                <p className="text-sm leading-5 text-rose-300">
                  {error}
                </p>
              </div>
            ) : null}

            {/* Google button */}
            <button
              type="button"
              onClick={handleSignIn}
              disabled={!configured || busy}
              className="group mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-5 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-xl hover:shadow-black/30 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-55"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base font-bold">
                <span className="bg-gradient-to-r from-blue-500 via-red-500 to-green-500 bg-clip-text text-transparent">
                  G
                </span>
              </span>

              <span>
                {busy ? 'Opening Google...' : 'Continue with Google'}
              </span>
            </button>

            {/* Security */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Your progress is securely synced to your account.</span>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs tracking-wide text-zinc-700">
              Genshin Impact · HSR · ZZZ · Wuthering Waves · more
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}