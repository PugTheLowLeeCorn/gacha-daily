import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getFirebaseAuth, getDb, isFirebaseConfigured } from '../firebase/config'
import { logOut, signInWithGoogle } from '../services/authService'
import { ensureUserProfile, mapUserDoc } from '../services/userService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const configured = isFirebaseConfigured()
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(configured)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return undefined
    }

    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }
      try {
        await ensureUserProfile(user)
        setError(null)
      } catch (profileError) {
        console.error('Failed to ensure user profile', profileError)
        setError(profileError)
        setLoading(false)
      }
    })
    return unsubscribe
  }, [configured])

  useEffect(() => {
    if (!configured || !firebaseUser) return undefined
    const ref = doc(getDb(), 'users', firebaseUser.uid)
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(mapUserDoc(snapshot.id, snapshot.data()))
        }
        setLoading(false)
      },
      (snapshotError) => {
        console.error('Failed to subscribe to user profile', snapshotError)
        setError(snapshotError)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [configured, firebaseUser])

  const value = useMemo(
    () => ({
      configured,
      firebaseUser,
      profile,
      loading,
      error,
      signIn: signInWithGoogle,
      signOut: logOut,
    }),
    [configured, firebaseUser, profile, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
