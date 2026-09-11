const INITIAL_GAMES = [
  {
    id: 'genshin-impact',
    name: 'Genshin Impact',
    slug: 'genshin-impact',
    publisher: 'HoYoverse',
    description: 'Open-world action RPG with elemental combat and daily commissions.',
  },
  {
    id: 'zenless-zone-zero',
    name: 'Zenless Zone Zero',
    slug: 'zenless-zone-zero',
    publisher: 'HoYoverse',
    description: 'Urban fantasy action RPG set in New Eridu.',
  },
  {
    id: 'honkai-star-rail',
    name: 'Honkai: Star Rail',
    slug: 'honkai-star-rail',
    publisher: 'HoYoverse',
    description: 'Turn-based space fantasy RPG with daily training and simulated universe runs.',
  },
  {
    id: 'wuthering-waves',
    name: 'Wuthering Waves',
    slug: 'wuthering-waves',
    publisher: 'Kuro Games',
    description: 'Open-world action RPG with Resonator combat and daily activities.',
  },
  {
    id: 'arknights',
    name: 'Arknights',
    slug: 'arknights',
    publisher: 'Hypergryph',
    description: 'Tower-defense strategy game with daily sanity spending and annihilation.',
  },
  {
    id: 'nikke',
    name: 'NIKKE',
    slug: 'nikke',
    publisher: 'Shift Up',
    description: 'Side-scrolling shooter RPG with daily simulation and tribe tower progress.',
  },
  {
    id: 'blue-archive',
    name: 'Blue Archive',
    slug: 'blue-archive',
    publisher: 'Nexon',
    description: 'School-themed tactical RPG with daily missions and raids.',
  },
  {
    id: 'punishing-gray-raven',
    name: 'Punishing: Gray Raven',
    slug: 'punishing-gray-raven',
    publisher: 'Kuro Games',
    description: 'Action combat RPG with daily serum spending and event stages.',
  },
  {
    id: 'reverse-1999',
    name: 'Reverse: 1999',
    slug: 'reverse-1999',
    publisher: 'Bluepoch',
    description: 'Turn-based time-travel RPG with daily insight and wilderness tasks.',
  },
]

function normalizeRawgGame(game, details = {}) {
  const publishers = (details.publishers || game.publishers || [])
    .map((item) => item.name)
    .filter(Boolean)
  const developers = (details.developers || game.developers || [])
    .map((item) => item.name)
    .filter(Boolean)
  const platforms = (game.platforms || details.platforms || [])
    .map((item) => item.platform?.name || item.name)
    .filter(Boolean)

  return {
    id: `rawg-${game.id}`,
    name: game.name,
    slug: game.slug || String(game.id),
    iconUrl: details.background_image || game.background_image || '',
    coverUrl: details.background_image || game.background_image || '',
    icon: details.background_image || game.background_image || '',
    description: details.description_raw || game.description_raw || '',
    publisher: publishers[0] || developers[0] || '',
    source: 'rawg',
    sourceId: game.id,
    released: game.released || details.released || null,
    platforms,
    active: true,
  }
}

function catalogDocument(normalized) {
  return {
    name: normalized.name,
    slug: normalized.slug,
    icon: normalized.icon || normalized.iconUrl || '',
    iconUrl: normalized.iconUrl || normalized.icon || '',
    coverUrl: normalized.coverUrl || normalized.iconUrl || '',
    description: normalized.description || '',
    publisher: normalized.publisher || '',
    source: normalized.source || 'manual',
    sourceId: normalized.sourceId || normalized.slug || normalized.id,
    released: normalized.released || null,
    platforms: normalized.platforms || [],
    active: true,
  }
}

async function fetchRawg(path, apiKey) {
  const url = new URL(`https://api.rawg.io/api/${path}`)
  url.searchParams.set('key', apiKey)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (response.status === 429) {
      const error = new Error('RAWG rate limit reached. Try again in a moment.')
      error.code = 'resource-exhausted'
      throw error
    }
    if (!response.ok) {
      const error = new Error(`RAWG request failed (${response.status}).`)
      error.code = 'unavailable'
      throw error
    }
    return response.json()
  } finally {
    clearTimeout(timer)
  }
}

module.exports = {
  INITIAL_GAMES,
  normalizeRawgGame,
  catalogDocument,
  fetchRawg,
}
