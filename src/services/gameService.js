import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

import { getDb } from '../firebase/config'

export function catalogGameRef(gameId) {
  return doc(getDb(), 'games', gameId)
}

export function mapCatalogGame(id, data) {
  return {
    id,
    name: data.name,
    slug: data.slug,
    icon: data.icon || data.iconUrl || data.coverUrl || '',
    iconUrl: data.iconUrl || data.icon || data.coverUrl || '',
    coverUrl: data.coverUrl || data.iconUrl || data.icon || '',
    description: data.description || '',
    publisher: data.publisher || '',
    source: data.source || 'manual',
    sourceId: data.sourceId || id,
    active: data.active !== false,
    released: data.released || null,
    platforms: data.platforms || [],
  }
}

export async function getCatalogGame(gameId) {
  const snapshot = await getDoc(catalogGameRef(gameId))

  if (!snapshot.exists()) {
    return null
  }

  return mapCatalogGame(snapshot.id, snapshot.data())
}

export async function getCatalogGamesByIds(gameIds) {
  const unique = Array.from(new Set(gameIds.filter(Boolean)))

  const games = await Promise.all(
    unique.map((id) => getCatalogGame(id)),
  )

  return games.filter(Boolean)
}

export async function listActiveCatalogGames() {
  const snapshot = await getDocs(
    query(
      collection(getDb(), 'games'),
      where('active', '==', true),
    ),
  )

  return snapshot.docs.map((item) =>
    mapCatalogGame(item.id, item.data()),
  )
}

export function filterCatalogGames(games, queryText) {
  const needle = queryText.trim().toLowerCase()

  if (!needle) {
    return games
  }

  return games.filter((game) =>
    `${game.name} ${game.slug}`
      .toLowerCase()
      .includes(needle),
  )
}

export async function searchGames(queryText) {
  const catalog = await listActiveCatalogGames()

  return {
    results: filterCatalogGames(catalog, queryText),
    source: 'catalog',
  }
}

export async function seedCatalog() {
  return {
    seeded: 0,
    skipped: true,
    source: 'firestore-catalog',
  }
}

export async function importGame(normalizedGame) {
  const existing = await getCatalogGame(normalizedGame.id)

  if (existing) {
    return existing
  }

  throw new Error(
    'This game is not in the Firestore catalog yet. Add it under games/{gameId} first.',
  )
}