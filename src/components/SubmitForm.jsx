import { useState, useRef } from 'react'
import { CATEGORIES, DISTRICTS } from '../App'
import { useLang } from '../LangContext'

const EMPTY = {
  name: '', dish: '', price: '', category: 'com',
  district: 'District 3', lat: '', lng: '', notes: '', googleMapsUrl: '',
}

export default function SubmitForm({ initialLocation, onSubmit, onClose }) {
  const { lang, t } = useLang()
  const [form, setForm] = useState({
    ...EMPTY,
    lat: initialLocation ? initialLocation.lat.toFixed(6) : '',
    lng: initialLocation ? initialLocation.lng.toFixed(6) : '',
  })
  const [gpsLoading, setGpsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [photo,     setPhoto]     = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

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

  const useGPS = () => {
    if (!navigator.geolocation) return alert(t.loc_required)
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('lat', pos.coords.latitude.toFixed(6))
        set('lng', pos.coords.longitude.toFixed(6))
        setGpsLoading(false)
      },
      () => { alert(t.loc_required); setGpsLoading(false) }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.lat || !form.lng) return alert(t.loc_required)
    if (!photo) return alert(lang === 'en' ? 'Please add a photo.' : 'Vui lòng thêm ảnh.')
    setSubmitting(true)
    try {
      await onSubmit({
        ...form,
        price: parseInt(form.price, 10),
        lat:   parseFloat(form.lat),
        lng:   parseFloat(form.lng),
        photos: [photo],
      })
    } finally {
      setSubmitting(false)
    }
  }

  const hasLocation = form.lat && form.lng

  return (
    <div className="spot-overlay">
      <div className="spot-modal sf-modal">

        <div className="sm-head">
          <div className="sm-head-text">
            <h2 className="sm-name">{t.sf_title}</h2>
            <p className="sm-loc">{t.sf_subtitle}</p>
          </div>
          <button className="sm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={`sf-location ${hasLocation ? 'has-loc' : ''}`}>
          {hasLocation ? (
            <>{t.loc_set} <strong>{parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}</strong></>
          ) : (
            <>{t.loc_none}</>
          )}
        </div>

        <form className="sf-form" onSubmit={handleSubmit}>

          <div className="sf-section">
            <label className="sf-label">{t.name_label}</label>
            <input className="sf-input" placeholder={t.name_ph} value={form.name}
              onChange={e => set('name', e.target.value)} required />
          </div>

          <div className="sf-section">
            <label className="sf-label">{t.dish_label}</label>
            <input className="sf-input" placeholder={t.dish_ph} value={form.dish}
              onChange={e => set('dish', e.target.value)} required />
          </div>

          <div className="sm-grid sf-grid-2">
            <div className="sm-cell sf-cell">
              <span className="sm-cell-label">{t.price_label}</span>
              <input className="sf-cell-input" type="number" placeholder="35000"
                value={form.price} onChange={e => set('price', e.target.value)}
                required min={5000} max={80000} />
            </div>
            <div className="sm-cell sf-cell">
              <span className="sm-cell-label">{t.type_label}</span>
              <select className="sf-cell-input" value={form.category}
                onChange={e => set('category', e.target.value)}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {lang === 'en' ? (v.label_en ?? v.label) : v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sf-section">
            <label className="sf-label">{t.district_label}</label>
            <select className="sf-input" value={form.district}
              onChange={e => set('district', e.target.value)}>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="sf-section">
            <label className="sf-label">{t.gps_label}</label>
            <div className="sf-row">
              <input className="sf-input" type="number" step="any" placeholder={t.lat_ph}
                value={form.lat} onChange={e => set('lat', e.target.value)} />
              <input className="sf-input" type="number" step="any" placeholder={t.lng_ph}
                value={form.lng} onChange={e => set('lng', e.target.value)} />
            </div>
            <button type="button" className={`sf-gps-btn ${gpsLoading ? 'loading' : ''}`} onClick={useGPS}>
              {gpsLoading ? t.gps_loading : t.gps_btn}
            </button>
          </div>

          <div className="sf-section">
            <label className="sf-label">{t.gmaps_label}</label>
            <input className="sf-input sf-gmaps-input" type="url" placeholder={t.gmaps_ph}
              value={form.googleMapsUrl} onChange={e => set('googleMapsUrl', e.target.value)} />
          </div>

          <div className="sf-section">
            <label className="sf-label">{t.notes_label}</label>
            <textarea className="sf-input sf-textarea" placeholder={t.notes_ph}
              value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>

          <div className="sf-section">
            <label className="sf-label">
              {lang === 'en' ? 'Photo (required)' : 'Ảnh (bắt buộc)'}
            </label>
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

          <div className="sf-tip">{t.tip}</div>

          <button type="submit" className="sf-submit" disabled={submitting || uploading || !photo}>
            {submitting ? t.submitting : t.submit_btn}
          </button>
        </form>
      </div>
    </div>
  )
}
