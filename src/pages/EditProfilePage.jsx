import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import userService from '../services/userService'

export default function EditProfilePage({ onBack, onSuccess }) {
  const currentProfile = userService.getUserProfile()
  const [username, setUsername] = useState(currentProfile.username || '')
  const [bio, setBio] = useState(currentProfile.bio || '')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!username.trim()) {
      setError('Name cannot be empty.')
      return
    }
    const result = userService.saveUserProfile({
      ...currentProfile,
      username: username.trim(),
      bio: bio.trim(),
    })
    if (!result.success) {
      setError(result.message || 'Could not save the profile.')
      return
    }
    onSuccess()
  }

  return (
    <section className="profile-section">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to profile
      </button>
      <h1 className="display">Edit profile</h1>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="profile-name" className="form-label">Name</label>
          <input
            id="profile-name"
            className="form-input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={60}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="profile-bio" className="form-label">Bio</label>
          <textarea
            id="profile-bio"
            className="form-textarea"
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={500}
          />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--primary">
          <Save size={16} /> Save changes
        </button>
      </form>
    </section>
  )
}
