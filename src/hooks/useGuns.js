import { useState, useEffect, useCallback } from 'react'
import gunService from '../services/gunService'
import { getCachedQuery, getCachedQueryData } from '../utils/queryCache'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API.
//
// Returns { guns, loading, error, pagination, refetch }.
// When the API is unreachable the `error` string will be set and `guns`
// will remain an empty array so the UI can show a proper error state.
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const paramKey = JSON.stringify(params)
  const cacheKey = `guns:${paramKey}`
  const [guns, setGuns] = useState(() => getCachedQueryData(cacheKey)?.data || [])
  const [loading, setLoading] = useState(() => !getCachedQueryData(cacheKey))
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  // Serialise params so the effect re-runs when they change.
  const fetchGuns = useCallback(async (force = false) => {
    try {
      const cached = !force && getCachedQueryData(cacheKey)
      if (cached) {
        setGuns(cached.data || [])
        setPagination(cached.pagination || null)
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const response = await getCachedQuery(
        cacheKey,
        async () => {
          const result = await gunService.getGuns(params)
          if (!result.success) throw new Error(result.message || 'Failed to fetch products.')
          return result
        },
        30000,
        force,
      )

      if (response.success) {
        setGuns(response.data || [])
        setPagination(response.pagination || null)
      } else {
        throw new Error(response.message || 'Failed to fetch products.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching products.')
      setGuns([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, paramKey])

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  return {
    guns,
    loading,
    error,
    pagination,
    refetch: () => fetchGuns(true),
  }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its UUID.
//
// Returns { gun, loading, error, refetch }.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const cacheKey = `gun:${id}`
  const cachedGunResponse = id ? getCachedQueryData(cacheKey) : null
  const [gun, setGun] = useState(() => cachedGunResponse?.data || null)
  const [loading, setLoading] = useState(() => Boolean(id) && !cachedGunResponse)
  const [error, setError] = useState(null)

  const fetchGun = useCallback(async (force = false) => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      const cached = !force && getCachedQueryData(cacheKey)
      if (cached) {
        setGun(cached.data)
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const response = await getCachedQuery(
        cacheKey,
        async () => {
          const result = await gunService.getGunById(id)
          if (!result.success) throw new Error(result.message || 'Product not found.')
          return result
        },
        30000,
        force,
      )

      if (response.success) {
        setGun(response.data)
      } else {
        setError(response.message || 'Product not found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load product details.')
      setGun(null)
    } finally {
      setLoading(false)
    }
  }, [cacheKey, id])

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  return { gun, loading, error, refetch: () => fetchGun(true) }
}
