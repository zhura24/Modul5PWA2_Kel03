import { useState } from 'react'
import {
  Archive,
  Camera,
  Check,
  Copy,
  FileText,
  Heart,
  Play,
  RotateCcw,
  Trash2,
  UserRoundPen,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { useGuns } from '../hooks/useGuns'
import { deleteDraft, getAllDrafts } from '../utils/draftStorage'
import { getArchivedGunIds, restoreGun } from '../services/archiveService'
import GUNS_LOCAL from '../data/guns'
import About from './About'
import Contact from './Contact'

const SECTIONS = [
  { id: 'overview', label: 'Profile' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'archive', label: 'Archive' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

export default function ProfilePage({ onReplaySplash, onEditProfile, onNavigate }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [activeSection, setActiveSection] = useState('overview')
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [drafts, setDrafts] = useState(() => getAllDrafts())
  const [archiveState, setArchiveState] = useState(() => {
    try {
      return { ids: getArchivedGunIds(), error: '' }
    } catch (error) {
      return { ids: [], error: error.message }
    }
  })
  const { favorites } = useFavorites()
  const { guns, loading: gunsLoading, error: gunsError } = useGuns({ limit: 50 })

  const refreshDrafts = () => setDrafts(getAllDrafts())

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setFeedback('Could not copy the profile ID. Check browser permissions.')
      window.setTimeout(() => setFeedback(''), 3000)
    }
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFeedback('Choose an image file for your avatar.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Avatar image must be under 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = userService.updateAvatar(reader.result)
      if (!result.success) {
        setFeedback(result.message || 'Could not save avatar.')
        return
      }
      setAvatar(reader.result)
      setProfile(result.data)
      setFeedback('Avatar updated.')
      window.setTimeout(() => setFeedback(''), 3000)
    }
    reader.onerror = () => setFeedback('Could not read the selected image.')
    reader.readAsDataURL(file)
  }

  const handleRestore = (id) => {
    try {
      restoreGun(id)
      setArchiveState((current) => ({
        ids: current.ids.filter((archivedId) => archivedId !== String(id)),
        error: '',
      }))
    } catch (error) {
      setArchiveState((current) => ({ ...current, error: error.message }))
    }
  }

  const archivedIds = archiveState.ids
  const archiveCandidates = [
    ...guns,
    ...GUNS_LOCAL.map((gun, index) => ({ ...gun, id: gun.id || `local-${index}` })),
  ]
  const archivedGuns = archiveCandidates.filter((gun, index, list) =>
    archivedIds.includes(String(gun.id)) &&
    list.findIndex((candidate) => String(candidate.id) === String(gun.id)) === index,
  )

  return (
    <div className="profile-page">
      <section className="masthead profile-masthead">
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">Profile settings, saved drafts, and archived items.</p>
        </div>
        {onReplaySplash && (
          <button type="button" className="btn btn--outline btn--sm" onClick={onReplaySplash}>
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      <nav className="profile-sections" aria-label="Profile sections">
        {SECTIONS.map((section) => (
          <button
            type="button"
            key={section.id}
            className={activeSection === section.id ? 'nav-link active' : 'nav-link'}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      {feedback && <div className="toast toast--success" role="status">{feedback}</div>}

      {activeSection === 'overview' && (
        <section className="profile-card">
          <div className="profile-card-top">
            <div className="avatar-wrap">
              {avatar
                ? <img src={avatar} alt={`${profile.username} avatar`} className="avatar-img" />
                : <div className="avatar-placeholder"><UserRoundPen size={36} /></div>}
              <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
                <Camera size={14} />
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden-file-input"
                />
              </label>
            </div>
            <div className="profile-identity">
              <h2 className="display">{profile.username || 'Shooter'}</h2>
              <p>{profile.bio || 'No bio added yet.'}</p>
              <div className="profile-id-row">
                <span className="mono-badge">{profile.userId}</span>
                <button type="button" className="icon-btn" onClick={handleCopyId} title="Copy profile ID">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <Heart size={20} className="stat-icon" stroke="var(--brass)" />
              <div className="stat-val">{favorites.length}</div>
              <div className="stat-label">Favorites</div>
            </div>
            <div className="stat-item">
              <FileText size={20} className="stat-icon" stroke="var(--steel)" />
              <div className="stat-val">{drafts.length}</div>
              <div className="stat-label">Saved drafts</div>
            </div>
            <div className="stat-item">
              <Archive size={20} className="stat-icon" stroke="var(--steel)" />
              <div className="stat-val">{archivedIds.length}</div>
              <div className="stat-label">Archived items</div>
            </div>
          </div>

          <button type="button" className="btn btn--primary" onClick={onEditProfile}>
            <UserRoundPen size={16} /> Edit name and bio
          </button>
        </section>
      )}

      {activeSection === 'drafts' && (
        <section className="profile-section">
          <h2 className="section-title">Saved drafts</h2>
          {drafts.length === 0 ? (
            <p className="detail-empty">No saved drafts yet.</p>
          ) : (
            <ul className="profile-item-list">
              {drafts.map(({ id, draft }) => (
                <li className="profile-item" key={id}>
                  <div>
                    <strong>{draft.formData?.name || (id === 'create' ? 'New item draft' : 'Edited item draft')}</strong>
                    <span>{id === 'create' ? 'New item' : `Item ${id}`} · {draft.savedAt ? new Date(draft.savedAt).toLocaleString() : 'Saved draft'}</span>
                  </div>
                  <div className="profile-item-actions">
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => onNavigate(id === 'create' ? 'Create' : 'Edit', id === 'create' ? undefined : { id })}
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger-ghost"
                      onClick={() => {
                        deleteDraft(id)
                        refreshDrafts()
                      }}
                      aria-label="Delete saved draft"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeSection === 'archive' && (
        <section className="profile-section">
          <h2 className="section-title">Archived items</h2>
          {archiveState.error && <p className="form-error" role="alert">{archiveState.error}</p>}
          {gunsLoading && archivedGuns.length === 0 ? (
            <p className="detail-loading">Loading archived items…</p>
          ) : archivedGuns.length === 0 && gunsError ? (
            <p className="form-error" role="alert">{gunsError}</p>
          ) : archivedGuns.length === 0 ? (
            <p className="detail-empty">No archived items.</p>
          ) : (
            <>
              {gunsError && <p className="form-error" role="alert">{gunsError}</p>}
              <ul className="profile-item-list">
                {archivedGuns.map((gun) => (
                  <li className="profile-item" key={gun.id}>
                    <div>
                      <strong>{gun.name}</strong>
                      <span>{gun.type || gun.category || 'Item'}{gun.caliber ? ` · ${gun.caliber}` : ''}</span>
                    </div>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => handleRestore(gun.id)}>
                      <RotateCcw size={14} /> Restore
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {activeSection === 'about' && <About />}
      {activeSection === 'contact' && <Contact />}
    </div>
  )
}
