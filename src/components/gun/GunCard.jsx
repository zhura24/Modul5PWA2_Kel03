import { useState } from 'react'
import { Share2 } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { formatPrice, truncate } from '../../utils/helpers'
import { shareGunLink } from '../../utils/share'
import { getCatalogImages } from '../../utils/catalogImages'

/**
 * Product card used in the catalog grid.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onSelect  — called with the gun when clicked
 * @param {Function} [props.onEdit]  — called when Edit is clicked (admin)
 * @param {Function} [props.onArchive]— called when Archive is clicked
 */
export default function GunCard({ gun, onSelect, onEdit, onArchive }) {
  const [shareMessage, setShareMessage] = useState('')
  const imgSrc = getCatalogImages(gun)[0] || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  const handleShare = async (event) => {
    event.stopPropagation()
    try {
      const result = await shareGunLink(gun)
      setShareMessage(result === 'shared' ? 'Link shared.' : 'Link copied.')
    } catch (error) {
      if (error.name !== 'AbortError') {
        setShareMessage(error.message || 'Could not share this item.')
      }
    }
  }

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        <img
          className="card-img"
          src={imgSrc}
          alt={gun.name}
          width="240"
          height="180"
          loading="lazy"
          decoding="async"
        />

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <span className="price">{formatPrice(price)}</span>
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        <FavoriteButton gunId={gun.id || gun.name} />

        <button
          type="button"
          className="card-act-btn"
          onClick={handleShare}
          aria-label={`Share ${gun.name}`}
          title="Share link"
          disabled={!gun.id}
        >
          <Share2 size={15} />
        </button>

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(gun) }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            ✏️
          </button>
        )}

        {onArchive && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => { e.stopPropagation(); onArchive(gun) }}
            aria-label={`Archive ${gun.name}`}
            title="Archive"
          >
            🗑️
          </button>
        )}
      </div>
      {shareMessage && <span className="card-share-status" role="status">{shareMessage}</span>}
    </li>
  )
}