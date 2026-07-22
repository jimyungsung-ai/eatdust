import { useState, useRef } from 'react'
import { useLang } from '../LangContext'

export default function VoteModal({ type, onSubmit, onClose }) {
  const { t, lang } = useLang()
  const [reasons, setReasons] = useState([])
  const [photo,     setPhoto]     = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const tags  = type === 'up' ? t.vote_tags_up : t.vote_tags_down
  const title = type === 'up' ? t.vote_modal_up : t.vote_modal_down
  const isUp  = type === 'up'

  const toggleReason = (tag) => {
    setReasons(prev =>
      prev.includes(tag) ? prev.filter(r => r !== tag) : [...prev, tag]
    )
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const res = await fetch('/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': file.type, 'x-filename': `${Date.now()}-${file.name}` },
        body:    file,
      })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      const { url } = await res.json()
      setPhoto(url)
    } catch (err) {
      console.error('Photo upload error:', err)
      alert('Upload failed — please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = () => {
    if (reasons.length === 0 || !photo || uploading) return
    onSubmit({ reasons, photo })
    onClose()
  }

  return (
    <div className="vm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vm-modal">

        <div className="vm-head">
          <span className="vm-title">{title}</span>
          <button className="vm-close" onClick={onClose}>✕</button>
        </div>

        <div className="vm-section">
          <p className="vm-label">{t.vote_modal_tags}</p>
          <div className="vm-tags">
            {tags.map(tag => (
              <button
                key={tag}
                type="button"
                className={`vm-tag ${isUp ? 'up' : 'down'} ${reasons.includes(tag) ? 'on' : ''}`}
                onClick={() => toggleReason(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ── Photo upload (required) ── */}
        <div className="vm-section">
          <p className="vm-label">
            {lang === 'en' ? 'Add a photo (required)' : 'Thêm ảnh (bắt buộc)'}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {photo ? (
            <div className="vm-photo">
              <img src={photo} alt="Your upload" />
              <button
                type="button"
                className="vm-photo-remove"
                onClick={() => setPhoto(null)}
                title="Remove"
              >✕</button>
            </div>
          ) : (
            <button
              type="button"
              className={`vm-photo-add ${uploading ? 'loading' : ''}`}
              onClick={() => !uploading && fileRef.current?.click()}
              disabled={uploading}
            >
              <span className="vm-photo-icon">{uploading ? '…' : '📷'}</span>
              {uploading
                ? (lang === 'en' ? 'Uploading…' : 'Đang tải…')
                : (lang === 'en' ? 'Add photo'  : 'Thêm ảnh')}
            </button>
          )}
        </div>

        <button
          className={`vm-submit ${isUp ? 'up' : 'down'}`}
          onClick={handleSubmit}
          disabled={reasons.length === 0 || !photo || uploading}
        >
          Vote
        </button>
      </div>
    </div>
  )
}
