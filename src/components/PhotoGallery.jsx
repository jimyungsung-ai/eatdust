import { useState } from 'react'

export default function PhotoGallery({ photos }) {
  const [lightbox, setLightbox] = useState(null)

  const visible = (photos || []).slice(0, 2)
  const isEmpty = visible.length === 0

  return (
    <>
      {/* ── Photo grid ── */}
      <div className={`pg-grid${isEmpty ? ' pg-grid-empty' : ''}`}>
        {visible.map((src, i) => (
          <div key={i} className="pg-cell" onClick={() => setLightbox(i)}>
            <img src={src} alt={`Photo ${i + 1}`} loading="lazy" />
          </div>
        ))}

        {/* + button — always present */}
        <button className={`pg-add${isEmpty ? ' pg-add-wide' : ''}`} type="button" title="Add photo">
          <span className="pg-add-icon">+</span>
          {isEmpty && <span className="pg-add-label">Add photo</span>}
        </button>
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
