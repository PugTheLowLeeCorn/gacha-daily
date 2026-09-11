import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { getDb } from '../firebase/config'
import { DEFAULT_REMINDER_TIME, DEFAULT_TIMEZONE } from '../utils/dateUtils'

function userRef(uid) {
  return doc(getDb(), 'users', uid)
}

export async function ensureUserProfile(user) {
  const ref = userRef(user.uid)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || 'Player',
      email: user.email || '',
      photoURL: user.photoURL || '',
      timezone: DEFAULT_TIMEZONE,
      reminderEnabled: true,
      reminderTime: DEFAULT_REMINDER_TIME,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return
  }

  const existing = snapshot.data()
  const patch = {
    email: user.email || existing.email || '',
    updatedAt: serverTimestamp(),
  }
  if (!existing.photoURL && user.photoURL) {
    patch.photoURL = user.photoURL
  }
  if (!existing.displayName && user.displayName) {
    patch.displayName = user.displayName
  }
  await updateDoc(ref, patch)
}

export async function updateUserProfile(uid, values) {
  await updateDoc(userRef(uid), {
    ...values,
    updatedAt: serverTimestamp(),
  })
}

export function mapUserDoc(uid, data) {
  return {
    uid,
    displayName: data.displayName || 'Player',
    email: data.email || '',
    photoURL: data.photoURL || '',
    timezone: data.timezone || DEFAULT_TIMEZONE,
    reminderEnabled: data.reminderEnabled !== false,
    reminderTime: data.reminderTime || DEFAULT_REMINDER_TIME,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  }
}
