import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { getFirebaseAuth, getGoogleProvider } from '../firebase/config'

export async function signInWithGoogle() {
  const auth = getFirebaseAuth()
  const provider = getGoogleProvider()
  try {
    return await signInWithPopup(auth, provider)
  } catch (error) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, provider)
      return null
    }
    throw error
  }
}

export async function logOut() {
  return signOut(getFirebaseAuth())
}

export { GoogleAuthProvider }
