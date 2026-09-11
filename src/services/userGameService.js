import { collection, deleteField, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDb } from '../firebase/config'

export function userGamesCollection(uid) {
  return collection(getDb(), 'users', uid, 'games')
}

export function userGameRef(uid, gameId) {
  return doc(getDb(), 'users', uid, 'games', gameId)
}

export async function addUserGame(uid, gameId, existing = null) {
  const ref = userGameRef(uid, gameId)
  if (existing?.enabled) {
    return { id: gameId, ...existing, alreadyTracked: true }
  }

  await setDoc(
    ref,
    {
      gameId,
      enabled: true,
      trackingStartedAt: serverTimestamp(),
      trackingEndedAt: deleteField(),
      addedAt: existing?.addedAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return { gameId, enabled: true }
}

export async function removeUserGame(uid, gameId) {
  await setDoc(
    userGameRef(uid, gameId),
    {
      gameId,
      enabled: false,
      trackingEndedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
