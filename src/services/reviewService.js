import { apiClient, IS_SUPABASE } from '../config/api'
import { invalidateQueryCache } from '../utils/queryCache'

const REACTION_STORAGE_KEY = 'bore_barrel_review_reactions'

function readReactions() {
  const raw = localStorage.getItem(REACTION_STORAGE_KEY)
  if (!raw) return {}
  const reactions = JSON.parse(raw)
  if (!reactions || typeof reactions !== 'object' || Array.isArray(reactions)) {
    throw new Error('Review reaction data is invalid.')
  }
  return reactions
}

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings.
// Supports both Supabase (public.reviews) and university API (/api/v1/recipes/:id/reviews).
// ---------------------------------------------------------------------------

class ReviewService {
  /**
   * Fetch all reviews for a given product.
   */
  async getReviews(gunId) {
    if (IS_SUPABASE) {
      const data = await apiClient.get(
        `/rest/v1/reviews?product_id=eq.${gunId}&select=*&order=created_at.desc`,
      )
      const list = Array.isArray(data)
        ? data.map((r) => ({
            id: r.id,
            product_id: r.product_id,
            user_identifier: r.user_id || '',
            user_id: r.user_id || '',
            rating: r.rating,
            comment: r.comment || '',
            created_at: r.created_at,
          }))
        : []

      return { success: true, data: list }
    }

    return apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
  }

  /**
   * Submit a new review.
   * @param {string|number} gunId
   * @param {Object} reviewData  { user_identifier, rating, comment }
   */
  async createReview(gunId, reviewData) {
    if (IS_SUPABASE) {
      const payload = {
        product_id: Number(gunId),
        user_id: reviewData.user_id || reviewData.user_identifier,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
      }

      const res = await apiClient.post('/rest/v1/reviews', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      invalidateQueryCache('reviews:')
      return { success: true, data: created }
    }

    const response = await apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
    invalidateQueryCache('reviews:')
    return response
  }

  /**
   * Edit an existing review.
   */
  async updateReview(reviewId, reviewData) {
    if (!reviewData.user_identifier) {
      throw new Error('A user identifier is required to update a review.')
    }

    if (IS_SUPABASE) {
      const res = await apiClient.patch(
        `/rest/v1/reviews?id=eq.${reviewId}&user_id=eq.${encodeURIComponent(reviewData.user_identifier)}`,
        {
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
        },
        { headers: { Prefer: 'return=representation' } },
      )
      invalidateQueryCache('reviews:')
      return { success: true, data: Array.isArray(res) ? res[0] : res }
    }

    const response = await apiClient.put(`/api/v1/reviews/${reviewId}`, reviewData)
    invalidateQueryCache('reviews:')
    return response
  }

  /**
   * Delete a review.
   */
  async deleteReview(reviewId, userIdentifier) {
    if (!userIdentifier) {
      throw new Error('A user identifier is required to delete a review.')
    }

    if (IS_SUPABASE) {
      await apiClient.delete(
        `/rest/v1/reviews?id=eq.${reviewId}&user_id=eq.${encodeURIComponent(userIdentifier)}`,
      )
      invalidateQueryCache('reviews:')
      return { success: true }
    }

    const response = await apiClient.delete(`/api/v1/reviews/${reviewId}`)
    invalidateQueryCache('reviews:')
    return response
  }

  getReaction(reviewId, userIdentifier) {
    const reactions = readReactions()[String(reviewId)] || { up: [], down: [] }
    return {
      thumbsUp: reactions.up.length,
      thumbsDown: reactions.down.length,
      myVote: reactions.up.includes(userIdentifier)
        ? 'up'
        : reactions.down.includes(userIdentifier)
          ? 'down'
          : null,
    }
  }

  toggleReaction(reviewId, direction, userIdentifier) {
    if (!['up', 'down'].includes(direction)) {
      throw new Error('Review reaction must be up or down.')
    }
    if (!reviewId || !userIdentifier) {
      throw new Error('A review and user identifier are required to react.')
    }

    const reactions = readReactions()
    const current = reactions[String(reviewId)] || { up: [], down: [] }
    const priorVote = current.up.includes(userIdentifier)
      ? 'up'
      : current.down.includes(userIdentifier)
        ? 'down'
        : null
    current.up = current.up.filter((id) => id !== userIdentifier)
    current.down = current.down.filter((id) => id !== userIdentifier)
    if (priorVote !== direction) current[direction].push(userIdentifier)

    reactions[String(reviewId)] = current
    localStorage.setItem(REACTION_STORAGE_KEY, JSON.stringify(reactions))
    return this.getReaction(reviewId, userIdentifier)
  }
}

export default new ReviewService()
