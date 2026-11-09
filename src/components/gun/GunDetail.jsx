import { useState } from 'react'
import { ArrowLeft, Star, Send, Loader, Share2, ShoppingBag, ThumbsUp, ThumbsDown, Pencil, Trash2, Check, X } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { getUserIdentifier, getUserProfile } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import { shareGunLink } from '../../utils/share'
import { getCatalogImages } from '../../utils/catalogImages'

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onArchive] — trigger archive flow
 */
export default function GunDetail({ gun, onBack, onEdit, onArchive, onAddToCart }) {
  const imageUrls = getCatalogImages(gun)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const imgSrc = imageUrls.includes(selectedImageUrl) ? selectedImageUrl : imageUrls[0] || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0
  const canReview = Boolean(gun.id) && !String(gun.id).startsWith('local-')
  const canShare = Boolean(gun.id)

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const {
    createReview,
    updateReview,
    deleteReview,
    voteReview,
    loading: submitting,
  } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [shareMessage, setShareMessage] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const userIdentifier = getUserIdentifier()
  const profile = getUserProfile()

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (!canReview) {
      setReviewError('Reviews require a server-generated product ID.')
      return
    }
    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const reviewData = {
      rating,
      comment: comment.trim(),
    }
    const result = editingReviewId
      ? await updateReview(editingReviewId, reviewData)
      : await createReview(gun.id, reviewData)

    if (result) {
      setReviewSuccess(editingReviewId ? 'Review updated.' : 'Review submitted!')
      setEditingReviewId(null)
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  const handleShare = async () => {
    if (!canShare) {
      setShareMessage('This item does not have a shareable server ID.')
      return
    }

    try {
      const result = await shareGunLink(gun)
      setShareMessage(result === 'shared' ? 'Link shared.' : 'Unique link copied.')
    } catch (error) {
      if (error.name !== 'AbortError') {
        setShareMessage(error.message || 'Could not share the link. Check browser permissions.')
      }
    }
    window.setTimeout(() => setShareMessage(''), 3000)
  }

  const handleEditReview = (review) => {
    setEditingReviewId(review.id)
    setRating(Number(review.rating) || 5)
    setComment(review.comment || '')
    setReviewError('')
    setReviewSuccess('')
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    const result = await deleteReview(reviewId)
    if (result) {
      setReviewSuccess('Review deleted.')
      refetchReviews()
    } else {
      setReviewError('Could not delete the review.')
    }
  }

  const handleVote = async (reviewId, direction) => {
    const result = await voteReview(reviewId, direction)
    if (result) refetchReviews()
    else setReviewError('Could not save your reaction.')
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-gallery">
          <img className="detail-img" src={imgSrc} alt={gun.name} />
          {imageUrls.length > 1 && (
            <div className="detail-gallery-thumbnails" aria-label="Product images">
              {imageUrls.map((url, index) => (
                <button
                  type="button"
                  key={url}
                  className={imgSrc === url ? 'detail-gallery-thumb is-selected' : 'detail-gallery-thumb'}
                  onClick={() => setSelectedImageUrl(url)}
                  aria-label={`Show image ${index + 1} of ${imageUrls.length}`}
                  aria-pressed={imgSrc === url}
                >
                  <img src={url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            {onAddToCart && (
              <button type="button" className="btn btn--outline" onClick={() => onAddToCart(gun)}>
                <ShoppingBag size={16} /> Add to demo cart
              </button>
            )}
            <button type="button" className="btn btn--outline" onClick={handleShare}>
              <Share2 size={16} /> Share link
            </button>
            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onArchive && (
              <button type="button" className="btn btn--outline" onClick={() => onArchive(gun)}>
                Archive
              </button>
            )}
          </div>
          {shareMessage && <p className="form-hint" role="status">{shareMessage}</p>}
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications (from ingredients / steps if present) */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !canReview}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <>{editingReviewId ? <Check size={16} /> : <Send size={16} />}{editingReviewId ? 'Save Review' : 'Submit Review'}</>
            )}
          </button>
          {editingReviewId && (
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => {
                setEditingReviewId(null)
                setComment('')
                setRating(5)
              }}
            >
              <X size={16} /> Cancel edit
            </button>
          )}

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!canReview && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => (
              <li key={rev.id} className="review-item">
                <div className="review-head">
                  <span className="review-user">
                    {(rev.user_id || rev.user_identifier) === userIdentifier
                      ? profile.username || 'You'
                      : rev.user_identifier
                        ? `Operator ${String(rev.user_identifier).slice(0, 8)}`
                        : 'Anonymous'}
                  </span>
                  <span className="review-stars-display">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < rev.rating ? 'var(--brass)' : 'none'}
                        stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                      />
                    ))}
                  </span>
                </div>
                {rev.comment && <p className="review-comment">{rev.comment}</p>}
                <div className="review-controls">
                  <button
                    type="button"
                    className={rev.myVote === 'up' ? 'btn btn--sm btn--outline is-selected' : 'btn btn--sm btn--outline'}
                    onClick={() => handleVote(rev.id, 'up')}
                    aria-label="Thumbs up review"
                    aria-pressed={rev.myVote === 'up'}
                  >
                    <ThumbsUp size={14} /> {rev.thumbsUp || 0}
                  </button>
                  <button
                    type="button"
                    className={rev.myVote === 'down' ? 'btn btn--sm btn--outline is-selected' : 'btn btn--sm btn--outline'}
                    onClick={() => handleVote(rev.id, 'down')}
                    aria-label="Thumbs down review"
                    aria-pressed={rev.myVote === 'down'}
                  >
                    <ThumbsDown size={14} /> {rev.thumbsDown || 0}
                  </button>
                  {(rev.user_id || rev.user_identifier) === userIdentifier && (
                    <>
                      <button type="button" className="btn btn--sm btn--outline" onClick={() => handleEditReview(rev)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button type="button" className="btn btn--sm btn--danger-ghost" onClick={() => handleDeleteReview(rev.id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}