const cache = new Map()
const pendingQueries = new Map()
const STORAGE_PREFIX = 'bore-barrel:query:'

function readStoredQuery(key) {
  try {
    const value = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!value) return null

    const cached = JSON.parse(value)
    if (!Number.isFinite(cached.createdAt) || !Object.hasOwn(cached, 'data')) {
      throw new Error('Stored query cache has an invalid format.')
    }
    return cached
  } catch (error) {
    console.warn(`[queryCache] Could not read cached query "${key}".`, error)
    return null
  }
}

function removeStoredQuery(key) {
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  } catch (error) {
    console.warn(`[queryCache] Could not remove cached query "${key}".`, error)
  }
}

function storeQuery(key, value) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (error) {
    console.warn(`[queryCache] Could not persist query "${key}".`, error)
  }
}

export function getCachedQueryData(key, staleTime = 30000) {
  const cached = cache.get(key) || readStoredQuery(key)
  if (!cached) return null
  if (Date.now() - cached.createdAt >= staleTime) {
    cache.delete(key)
    removeStoredQuery(key)
    return null
  }
  cache.set(key, cached)
  return cached.data
}

export async function getCachedQuery(key, query, staleTime = 30000, force = false) {
  const cached = getCachedQueryData(key, staleTime)
  if (!force && cached) return cached

  if (!force && pendingQueries.has(key)) {
    return pendingQueries.get(key)
  }

  const pending = Promise.resolve()
    .then(query)
    .then((data) => {
      if (pendingQueries.get(key) === pending) {
        const cached = { data, createdAt: Date.now() }
        cache.set(key, cached)
        storeQuery(key, cached)
      }
      return data
    })
    .finally(() => {
      if (pendingQueries.get(key) === pending) pendingQueries.delete(key)
    })

  pendingQueries.set(key, pending)
  return pending
}

export function invalidateQueryCache(prefix = '') {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
  for (const key of pendingQueries.keys()) {
    if (key.startsWith(prefix)) pendingQueries.delete(key)
  }
  try {
    const keysToRemove = []
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(`${STORAGE_PREFIX}${prefix}`)) keysToRemove.push(key)
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key))
  } catch (error) {
    console.warn('[queryCache] Could not invalidate persisted queries.', error)
  }
}
