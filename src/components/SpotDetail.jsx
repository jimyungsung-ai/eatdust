import { useState, useEffect } from 'react'
import { CATEGORIES, DISTRICTS, isNew } from '../App'
import { useLang } from '../LangContext'
import FlagPicker from './FlagPicker'
import PhotoGallery from './PhotoGallery'
import VoteModal from './VoteModal'

const ADJ  = ['ngon', 'bụi', 'cay', 'béo', 'ngọt', 'chua', 'thơm', 'giòn', 'mặn', 'đậm']
const FOOD = ['phở', 'bún', 'cơm', 'bánh', 'chả', 'tôm', 'nem', 'lẩu', 'xôi', 'hủ']
function randomName() {
  const a = ADJ[Math.random() * ADJ.length | 0]
  const f = FOOD[Math.random() * FOOD.length | 0]
  return `${a}_${f}_${Math.floor(Math.random() * 900 + 100)}`
}

function fmt(price) {
  return price.toLocaleString('vi-VN') + '₫'
}

function relTime(iso, t) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (m < 60)  return t.rel_min(m)
  const h = Math.floor(m / 60)
  if (h < 24)  return t.rel_hr(h)
  const d = Math.floor(h / 24)
  if (d < 30)  return t.rel_day(d)
  return t.rel_mo(Math.floor(d / 30))
}

// Stable avatar color per username
const AVATAR_COLORS = ['#f59e0b', '#16a34a', '#2563eb', '#dc2626', '#7c3aed', '#0891b2']
function avatarColor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function SpotDetail({ spot, onClose, onVote, onUpdate, onDelete, initialVoteType = null }) {
  const { lang, t } = useLang()
  const cat     = CATEGORIES[spot.category] || { icon: '🍽', label: spot.category, label_en: spot.category }
  const catLabel = lang === 'en' ? (cat.label_en ?? cat.label) : cat.label
  const up      = spot.valueUp   || 0
  const down    = spot.valueDown || 0
  const total   = up + down
  const pct     = total > 0 ? Math.round((up / total) * 100) : null
  const newSpot = isNew(spot)

  const [comments,    setComments]    = useState([])
  const [sortBy,      setSortBy]      = useState('newest')
  const [username,    setUsername]    = useState(randomName)
  const [flag,        setFlag]        = useState('')
  const [text,        setText]        = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [voteModal,   setVoteModal]   = useState(initialVoteType)
  const [likedSet,    setLikedSet]    = useState(new Set())
  const [localLikes,  setLocalLikes]  = useState({})
  const [editMode,    setEditMode]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [draft,       setDraft]       = useState({})

  const startEdit = () => {
    setDraft({
      name:          spot.name,
      dish:          spot.dish          || '',
      price:         spot.price         || '',
      category:      spot.category      || 'com',
      district:      spot.district      || '',
      notes:         spot.notes         || '',
      googleMapsUrl: spot.googleMapsUrl || '',
    })
    setEditMode(true)
  }

  const cancelEdit = () => { setEditMode(false); setDraft({}) }

  const saveEdit = async () => {
    setSaving(true)
    try {
      const payload = {
        ...draft,
        price: Number(draft.price) || spot.price,
      }
      const res = await fetch(`/api/spots/${spot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const updated = await res.json()
      onUpdate?.(updated)
      setEditMode(false)
      setDraft({})
    } finally {
      setSaving(false)
    }
  }

  const setField = (k, v) => setDraft(prev => ({ ...prev, [k]: v }))

  const [confirmDelete, setConfirmDelete] = useState(false)
  const handleDelete = async () => {
    await fetch(`/api/spots/${spot.id}`, { method: 'DELETE' })
    onDelete?.(spot.id)
  }

  useEffect(() => {
    fetch(`/api/comments?spotId=${spot.id}`)
      .then(r => r.json())
      .then(setComments)
      .catch(() => {})
  }, [spot.id])

  const sorted = [...comments].sort((a, b) =>
    sortBy === 'likes'
      ? (b.likes || 0) - (a.likes || 0)
      : new Date(b.createdAt) - new Date(a.createdAt)
  )

  const handleComment = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId: spot.id,
          username: username.trim() || randomName(),
          flag,
          text: text.trim(),
          likes: 0,
          createdAt: new Date().toISOString(),
        }),
      })
      const saved = await res.json()
      setComments(prev => [saved, ...prev])
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  const likeComment = (c) => {
    const key = c.id ?? c.createdAt   // fallback key if id is missing
    if (likedSet.has(key)) return
    const base = localLikes[key] ?? c.likes ?? 0
    setLocalLikes(prev => ({ ...prev, [key]: base + 1 }))
    setLikedSet(prev => new Set([...prev, key]))
    // Persist in background
    if (c.id) {
      fetch(`/api/comments/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likes: base + 1 }),
      }).catch(() => {})
    }
  }

  return (
    <div className="spot-overlay">
      <div className="spot-modal">

        {/* ── Sticky header ── */}
        <div className="sm-head">
          <div className="sm-head-text">
            {editMode
              ? <input
                  className="sm-edit-name"
                  value={draft.name}
                  onChange={e => setField('name', e.target.value)}
                  maxLength={80}
                />
              : <h2 className="sm-name">{spot.name}</h2>
            }
            <p className="sm-loc">
              📍 {editMode ? draft.district : spot.district}
              {newSpot && !editMode && <span className="sm-badge-new"> · {t.new_badge}</span>}
            </p>
          </div>
          <div className="sm-head-actions">
            {!editMode && !confirmDelete && (
              <button className="sm-edit-btn" onClick={startEdit} title="Edit">✎</button>
            )}
            {!editMode && !confirmDelete && (
              <button className="sm-delete-btn" onClick={() => setConfirmDelete(true)} title="Delete">🗑</button>
            )}
            {confirmDelete && (
              <div className="sm-confirm-delete">
                <span>{lang === 'en' ? 'Delete?' : 'Xoá?'}</span>
                <button className="sm-confirm-yes" onClick={handleDelete}>{lang === 'en' ? 'Yes' : 'Có'}</button>
                <button className="sm-confirm-no" onClick={() => setConfirmDelete(false)}>{lang === 'en' ? 'No' : 'Không'}</button>
              </div>
            )}
            <button className="sm-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* ── Photos ── */}
        <PhotoGallery photos={spot.photos} />

        {/* ── Info grid ── */}
        {editMode ? (
          <div className="sm-edit-form">
            <div className="sm-edit-row">
              <label className="sm-edit-label">{t.type_label}</label>
              <select className="sm-edit-input" value={draft.category} onChange={e => setField('category', e.target.value)}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {lang === 'en' ? (v.label_en || v.label) : v.label}</option>
                ))}
              </select>
            </div>
            <div className="sm-edit-row">
              <label className="sm-edit-label">{t.price_label}</label>
              <input className="sm-edit-input" type="number" min={0} step={1000}
                value={draft.price} onChange={e => setField('price', e.target.value)} />
            </div>
            <div className="sm-edit-row">
              <label className="sm-edit-label">{t.dish_label}</label>
              <input className="sm-edit-input" type="text" maxLength={80}
                value={draft.dish} onChange={e => setField('dish', e.target.value)} />
            </div>
            <div className="sm-edit-row">
              <label className="sm-edit-label">{t.district_label}</label>
              <select className="sm-edit-input" value={draft.district} onChange={e => setField('district', e.target.value)}>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="sm-edit-row">
              <label className="sm-edit-label">{t.notes_label}</label>
              <textarea className="sm-edit-input sm-edit-textarea" rows={3} maxLength={300}
                value={draft.notes} onChange={e => setField('notes', e.target.value)} />
            </div>
            <div className="sm-edit-row">
              <label className="sm-edit-label">{t.gmaps_label}</label>
              <input className="sm-edit-input" type="url"
                value={draft.googleMapsUrl} onChange={e => setField('googleMapsUrl', e.target.value)}
                placeholder="https://maps.app.goo.gl/…" />
            </div>
            <div className="sm-edit-actions">
              <button className="sm-edit-cancel" onClick={cancelEdit}>{lang === 'en' ? 'Cancel' : 'Huỷ'}</button>
              <button className="sm-edit-save" onClick={saveEdit} disabled={saving}>
                {saving ? '…' : (lang === 'en' ? 'Save' : 'Lưu')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="sm-grid">
              <div className="sm-cell">
                <span className="sm-cell-label">{t.type}</span>
                <span className="sm-cell-val">{cat.icon} {catLabel}</span>
              </div>
              <div className="sm-cell">
                <span className="sm-cell-label">{t.price}</span>
                <span className="sm-cell-val sm-price">{fmt(spot.price)}</span>
              </div>
              <div className="sm-cell">
                <span className="sm-cell-label">{t.dish}</span>
                <span className="sm-cell-val">{spot.dish}</span>
              </div>
              <div className="sm-cell">
                <span className="sm-cell-label">{t.posted}</span>
                <span className="sm-cell-val">{new Date(spot.submittedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            {spot.notes && <div className="sm-notes">{spot.notes}</div>}
          </>
        )}

        {/* ── Action buttons ── */}
        {total > 0 && (
          <p className="sm-vote-meta">{t.ratings(total)}{pct !== null && ` · ${t.good_pct(pct)}`}</p>
        )}
        <div className="sm-btn-grid">
          <button className="sm-btn sm-btn-up"   onClick={() => setVoteModal('up')}>
            {t.vote_up}{up > 0 && <span className="sm-btn-count">{up}</span>}
          </button>
          <button className="sm-btn sm-btn-down" onClick={() => setVoteModal('down')}>
            {t.vote_down}{down > 0 && <span className="sm-btn-count">{down}</span>}
          </button>
        </div>
        <a
          className="sm-maps-link"
          href={spot.googleMapsUrl || `https://maps.google.com/?q=${spot.lat},${spot.lng}`}
          target="_blank" rel="noopener noreferrer"
        >
          {t.open_maps}
        </a>

        {/* ── Vote modal ── */}
        {voteModal && (
          <VoteModal
            type={voteModal}
            onSubmit={({ flag }) => onVote(spot.id, voteModal, flag)}
            onClose={() => setVoteModal(null)}
          />
        )}

        {/* ── Comments ── */}
        <div className="sm-comments">
          <div className="sm-comments-head">
            <span className="sm-comments-count">
              {t.comments}{comments.length > 0 ? ` · ${comments.length}` : ''}
            </span>
            <div className="sm-sort">
              <button className={sortBy === 'newest' ? 'on' : ''} onClick={() => setSortBy('newest')}>{t.newest}</button>
              <button className={sortBy === 'likes'  ? 'on' : ''} onClick={() => setSortBy('likes')}>{t.top_liked}</button>
            </div>
          </div>

          {/* Input */}
          <form className="sm-comment-form" onSubmit={handleComment}>
            <div className="sm-comment-top">
              <input
                className="sm-input sm-username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t.username_ph}
                maxLength={30}
              />
              <FlagPicker value={flag} onChange={setFlag} />
              <button type="submit" className="sm-submit" disabled={!text.trim() || submitting}>
                {t.post_btn}
              </button>
            </div>
            <textarea
              className="sm-input sm-textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t.comment_ph}
              rows={2}
              maxLength={300}
            />
          </form>

          {/* List */}
          <div className="sm-comment-list">
            {sorted.length === 0 && (
              <p className="sm-no-comments">{t.no_comments}</p>
            )}
            {sorted.map(c => (
              <div key={c.id} className="sm-comment">
                <div className="sm-comment-body">
                  <span className="sm-comment-user">
                    {c.username}{c.flag && <span className="sm-comment-flag">{c.flag}</span>}
                  </span>
                  <p className="sm-comment-text">{c.text}</p>
                  <div className="sm-comment-foot">
                    {(() => {
                      const key   = c.id ?? c.createdAt
                      const liked = likedSet.has(key)
                      const count = localLikes[key] ?? c.likes ?? 0
                      return (
                        <button
                          className={`sm-like${liked ? ' liked' : ''}`}
                          onClick={() => likeComment(c)}
                        >
                          {liked ? '♥' : '♡'} {count}
                        </button>
                      )
                    })()}
                    <span className="sm-comment-time">{relTime(c.createdAt, t)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
