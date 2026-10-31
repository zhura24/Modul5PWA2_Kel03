import { useState, useEffect, useCallback } from 'react'
import reviewService from '../services/reviewService'
import { getUserIdentifier } from '../services/userService'
import { getCachedQuery } from '../utils/queryCache'

export function useReviews(gunId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const userIdentifier = getUserIdentifier()

  const fetchReviews = useCallback(async (force = false) => {
    if (!gunId) {
      setReviews([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await getCachedQuery(
        `reviews:${gunId}`,
        async () => {
          const result = await reviewService.getReviews(gunId)
          if (!result.success) throw new Error(result.message || 'Failed to fetch reviews.')
          return result
        },
        30000,
        force,
      )

      setReviews((response.data || []).map((review) => ({
        ...review,
        ...reviewService.getReaction(review.id, userIdentifier),
      })))
    } catch (err) {
      setError(err.message || 'An error occurred while fetching reviews.')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [gunId, userIdentifier])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return {
    reviews,
    loading,
    error,
    refetch: () => fetchReviews(true),
  }
}

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const userIdentifier = getUserIdentifier()

  const runAction = async (action, failureMessage) => {
    try {
      setLoading(true)
      setError(null)
      return await action()
    } catch (err) {
      setError(err.message || failureMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const createReview = (gunId, reviewData) => runAction(async () => {
    const response = await reviewService.createReview(gunId, {
      ...reviewData,
      user_identifier: userIdentifier,
    })
    if (!response.success) throw new Error(response.message || 'Failed to submit review.')
    return response.data
  }, 'An error occurred while submitting the review.')

  const updateReview = (reviewId, reviewData) => runAction(async () => {
    const response = await reviewService.updateReview(reviewId, {
      ...reviewData,
      user_identifier: userIdentifier,
    })
    if (!response.success) throw new Error(response.message || 'Failed to update review.')
    return response.data
  }, 'An error occurred while updating the review.')

  const deleteReview = (reviewId) => runAction(async () => {
    const response = await reviewService.deleteReview(reviewId, userIdentifier)
    if (response?.success === false) throw new Error(response.message || 'Failed to delete review.')
    return response || { success: true }
  }, 'An error occurred while deleting the review.')

  const voteReview = (reviewId, direction) => runAction(async () => (
    reviewService.toggleReaction(reviewId, direction, userIdentifier)
  ), 'Could not save your reaction.')

  return { createReview, updateReview, deleteReview, voteReview, loading, error }
}
