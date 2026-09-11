import { collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDb } from '../firebase/config'

export function dailyLogId(dateKey, gameId) {
  return `${dateKey}_${gameId}`
}

export function dailyLogsCollection(uid) {
  return collection(getDb(), 'users', uid, 'dailyLogs')
}

export function dailyLogRef(uid, dateKey, gameId) {
  return doc(getDb(), 'users', uid, 'dailyLogs', dailyLogId(dateKey, gameId))
}

export async function completeDaily(uid, gameId, dateKey) {
  const ref = dailyLogRef(uid, dateKey, gameId)
  const existing = await getDoc(ref)
  if (existing.exists() && existing.data().status === 'completed') {
    return { id: ref.id, ...existing.data(), alreadyCompleted: true }
  }

  await setDoc(
    ref,
    {
      gameId,
      date: dateKey,
      status: 'completed',
      completedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return { id: ref.id, gameId, date: dateKey, status: 'completed' }
}

export function mapDailyLog(id, data) {
  return {
    id,
    gameId: data.gameId,
    date: data.date,
    status: data.status,
    completedAt: data.completedAt || null,
  }
}
