const cache = new Map()
const pendingQueries = new Map()

export function getCachedQueryData(key, staleTime = 30000) {
  const cached = cache.get(key)
  if (!cached || Date.now() - cached.createdAt >= staleTime) return null
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
        cache.set(key, { data, createdAt: Date.now() })
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
}
