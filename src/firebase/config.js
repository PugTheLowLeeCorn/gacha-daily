import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}

export function isFirebaseConfigured() {
  const config = getFirebaseConfig()
  return Boolean(config.apiKey && config.projectId && config.appId && config.authDomain)
}

let app
let auth
let db
let googleProvider

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* values as described in FIREBASE_SETUP.md.')
  }
  if (!app) {
    app = initializeApp(getFirebaseConfig())
  }
  return app
}

export function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}

export function getDb() {
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}

export function getGoogleProvider() {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider()
    googleProvider.setCustomParameters({ prompt: 'select_account' })
  }
  return googleProvider
}
