import { useState, useRef } from 'react'

export default function PhotoGallery({ photos, onPhotoAdded }) {
  const [lightbox,   setLightbox]   = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const fileRef = useRef(null)

  const visible = (photos || []).slice(0, 2)
  const isEmpty = visible.length === 0
  const canAdd  = visible.length < 2  // max 2 photos

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !onPhotoAdded) return
    e.target.value = ''   // reset so same file can be re-selected

    setUploading(true)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'x-filename': `${Date.now()}-${file.name}`,
        },
        body: file,
      })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      const { url } = await res.json()
      onPhotoAdded(url)
    } catch (err) {
      console.error('Photo upload error:', err)
      alert('Upload failed — please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* ── Photo grid ── */}
      <div className={`pg-grid${isEmpty ? ' pg-grid-empty' : ''}`}>
        {visible.map((src, i) => (
          <div key={i} className="pg-cell" onClick={() => setLightbox(i)}>
            <img src={src} alt={`Photo ${i + 1}`} loading="lazy" />
          </div>
        ))}

        {/* + button — shows while under 2 photos */}
        {canAdd && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              className={`pg-add${isEmpty ? ' pg-add-wide' : ''} ${uploading ? 'pg-add-loading' : ''}`}
              type="button"
              title="Add photo"
              onClick={() => !uploading && fileRef.current?.click()}
              disabled={uploading}
            >
              <span className="pg-add-icon">{uploading ? '…' : '+'}</span>
              {isEmpty && <span className="pg-add-label">{uploading ? 'Uploading…' : 'Add photo'}</span>}
            </button>
          </>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div className="pg-lightbox" onClick={() => setLightbox(null)}>
          <button className="pg-lb-close" onClick={() => setLightbox(null)}>✕</button>

          {lightbox > 0 && (
            <button
              className="pg-lb-nav pg-lb-prev"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1) }}
            >‹</button>
          )}

          <img
            className="pg-lb-img"
            src={visible[lightbox]}
            alt={`Photo ${lightbox + 1}`}
            onClick={e => e.stopPropagation()}
          />

          {lightbox < visible.length - 1 && (
            <button
              className="pg-lb-nav pg-lb-next"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1) }}
            >›</button>
          )}

          <div className="pg-lb-dots">
            {visible.map((_, i) => (
              <span
                key={i}
                className={`pg-dot ${i === lightbox ? 'on' : ''}`}
                onClick={e => { e.stopPropagation(); setLightbox(i) }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
