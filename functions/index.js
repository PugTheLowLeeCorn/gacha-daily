const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret, defineString } = require('firebase-functions/params')
const admin = require('firebase-admin')
const { INITIAL_GAMES, normalizeRawgGame, catalogDocument, fetchRawg } = require('./games')
const { sendReminderEmail, formatDateKey, isInReminderWindow, overallPerfectStreak } = require('./email')

admin.initializeApp()
const db = admin.firestore()

const rawgApiKey = defineSecret('RAWG_API_KEY')
const resendApiKey = defineSecret('RESEND_API_KEY')
const appUrl = defineString('APP_URL', { default: 'http://localhost:5173' })
const resendFrom = defineString('RESEND_FROM', { default: 'Gacha Daily <alerts@example.com>' })

function requireAuth(request) {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in to continue.')
  }
}

const callableOptions = {
  secrets: [rawgApiKey],
  cors: true,
  invoker: 'public',
  region: 'us-central1',
}

exports.searchGames = onCall(callableOptions, async (request) => {
  requireAuth(request)
  const queryText = String(request.data?.query || '').trim()
  if (!queryText) {
    throw new HttpsError('invalid-argument', 'Enter a game name to search.')
  }

  const catalogSnap = await db.collection('games').where('active', '==', true).get()
  const catalogMatches = catalogSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((game) => {
      const haystack = `${game.name} ${game.slug}`.toLowerCase()
      return haystack.includes(queryText.toLowerCase())
    })
    .slice(0, 12)

  let rawgResults = []
  try {
    const payload = await fetchRawg(
      `games?search=${encodeURIComponent(queryText)}&page_size=8&search_precise=true`,
      rawgApiKey.value(),
    )
    rawgResults = (payload.results || []).map((game) => normalizeRawgGame(game))
  } catch (error) {
    if (!catalogMatches.length) {
      throw new HttpsError(error.code || 'unavailable', error.message || 'Game search is unavailable.')
    }
    return {
      results: catalogMatches,
      source: 'catalog',
      warning: error.message || 'RAWG is unavailable.',
    }
  }

  const merged = [...catalogMatches]
  rawgResults.forEach((game) => {
    if (!merged.some((item) => item.id === game.id || item.sourceId === game.sourceId)) {
      merged.push(game)
    }
  })

  return { results: merged.slice(0, 12), source: rawgResults.length ? 'catalog+rawg' : 'catalog' }
})

exports.importGame = onCall(callableOptions, async (request) => {
  requireAuth(request)
  const incoming = request.data?.game
  if (!incoming?.name) {
    throw new HttpsError('invalid-argument', 'A normalized game payload is required.')
  }

  const gameId =
    incoming.id ||
    (incoming.source === 'rawg' && incoming.sourceId ? `rawg-${incoming.sourceId}` : incoming.slug)
  if (!gameId) {
    throw new HttpsError('invalid-argument', 'The selected game is missing an id.')
  }

  const ref = db.collection('games').doc(String(gameId))
  const existing = await ref.get()
  if (existing.exists) {
    return { id: ref.id, ...existing.data() }
  }

  let normalized = {
    ...incoming,
    id: String(gameId),
    source: incoming.source || 'rawg',
  }

  if (incoming.source === 'rawg' && incoming.sourceId) {
    try {
      const details = await fetchRawg(`games/${incoming.sourceId}`, rawgApiKey.value())
      normalized = normalizeRawgGame({ id: incoming.sourceId, ...incoming }, details)
    } catch (error) {
      console.error('RAWG details lookup failed; storing search payload', error)
    }
  }

  const payload = {
    ...catalogDocument(normalized),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }
  await ref.set(payload)
  return {
    id: ref.id,
    name: payload.name,
    slug: payload.slug,
    iconUrl: payload.iconUrl,
    coverUrl: payload.coverUrl,
    description: payload.description,
    publisher: payload.publisher,
    source: payload.source,
    sourceId: payload.sourceId,
    active: true,
  }
})

exports.seedCatalog = onCall({ cors: true, invoker: 'public', region: 'us-central1' }, async (request) => {
  requireAuth(request)
  const batch = db.batch()
  let created = 0

  for (const game of INITIAL_GAMES) {
    const ref = db.collection('games').doc(game.id)
    const snap = await ref.get()
    if (snap.exists) continue
    batch.set(ref, {
      ...catalogDocument({ ...game, source: 'manual', iconUrl: '', coverUrl: '', icon: '' }),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    created += 1
  }

  if (created) await batch.commit()
  return { created, total: INITIAL_GAMES.length }
})

exports.processReminders = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'UTC',
    region: 'us-central1',
    secrets: [resendApiKey],
  },
  async () => {
    const now = new Date()
    const usersSnap = await db.collection('users').get()

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data()
      if (user.reminderEnabled === false || !user.email) continue
      const timeZone = user.timezone || 'Asia/Ho_Chi_Minh'
      const reminderTime = user.reminderTime || '23:30'
      if (!isInReminderWindow(now, timeZone, reminderTime)) continue

      const dateKey = formatDateKey(now, timeZone)
      const reminderRef = userDoc.ref.collection('reminderLogs').doc(dateKey)
      const alreadySent = await reminderRef.get()
      if (alreadySent.exists) continue

      const gamesSnap = await userDoc.ref.collection('games').where('enabled', '==', true).get()
      const tracked = gamesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      if (!tracked.length) continue

      const logsSnap = await userDoc.ref.collection('dailyLogs').where('date', '==', dateKey).get()
      const completedIds = new Set(
        logsSnap.docs.filter((doc) => doc.data().status === 'completed').map((doc) => doc.data().gameId),
      )
      const incomplete = tracked.filter((game) => !completedIds.has(game.gameId || game.id))
      if (!incomplete.length) continue

      const catalog = await Promise.all(
        incomplete.map(async (game) => {
          const catalogDoc = await db.collection('games').doc(game.gameId || game.id).get()
          return catalogDoc.exists ? catalogDoc.data().name : game.gameId
        }),
      )

      const historySnap = await userDoc.ref.collection('dailyLogs').get()
      const logs = historySnap.docs.map((doc) => doc.data())
      const streak = overallPerfectStreak(
        tracked.map((game) => game.gameId || game.id),
        logs,
        dateKey,
      )

      const dashboardUrl = `${appUrl.value().replace(/\/$/, '')}/dashboard`
      try {
        await sendReminderEmail({
          apiKey: resendApiKey.value(),
          from: resendFrom.value(),
          to: user.email,
          displayName: user.displayName,
          incompleteNames: catalog,
          streak,
          dashboardUrl,
        })
        await reminderRef.set({
          date: dateKey,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          incompleteGameIds: incomplete.map((game) => game.gameId || game.id),
        })
      } catch (error) {
        console.error(`Failed to send reminder to ${userDoc.id}`, error)
      }
    }
  },
)
