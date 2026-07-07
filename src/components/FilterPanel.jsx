import { CATEGORIES, DISTRICTS } from '../App'
import { useLang } from '../LangContext'

export default function FilterPanel({ filters, onChange, onClose, onReset }) {
  const { lang, t } = useLang()
  const set = (k, v) => onChange(prev => ({ ...prev, [k]: v }))

  const toggleCat = (cat) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat]
    set('categories', next)
  }

  return (
    <div className="fp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="filter-panel">

        {/* ── Header ── */}
        <div className="fp-header">
          <span className="fp-title">{t.fp_title}</span>
          <button className="fp-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ── Body ── */}
        <div className="fp-body">

          {/* Price */}
          <div className="fp-section">
            <div className="fp-section-head">
              <span className="fp-label">{t.fp_max_price}</span>
              <span className="fp-price-val">{(filters.maxPrice / 1000).toFixed(0)}k₫</span>
            </div>
            <input
              type="range"
              min={20000} max={80000} step={5000}
              value={filters.maxPrice}
              onChange={e => set('maxPrice', Number(e.target.value))}
            />
            <div className="fp-range-labels"><span>20k₫</span><span>80k₫</span></div>
          </div>

          {/* Category */}
          <div className="fp-section">
            <span className="fp-label">{t.fp_type}</span>
            <div className="fp-chips">
              <button
                className={`fp-chip ${filters.categories.length === 0 ? 'on' : ''}`}
                onClick={() => set('categories', [])}
              >
                {lang === 'en' ? 'All' : 'Tất cả'}
              </button>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <button
                  key={k}
                  className={`fp-chip ${filters.categories.includes(k) ? 'on' : ''}`}
                  onClick={() => toggleCat(k)}
                >
                  {v.icon} {lang === 'en' ? (v.label_en ?? v.label) : v.label}
                </button>
              ))}
            </div>
          </div>

          {/* District */}
          <div className="fp-section">
            <span className="fp-label">{t.fp_district}</span>
            <div className="fp-chips">
              <button
                className={`fp-chip ${!filters.district ? 'on' : ''}`}
                onClick={() => set('district', '')}
              >
                {t.fp_all_dist}
              </button>
              {DISTRICTS.map(d => (
                <button
                  key={d}
                  className={`fp-chip ${filters.district === d ? 'on' : ''}`}
                  onClick={() => set('district', filters.district === d ? '' : d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="fp-footer">
          <button className="fp-reset-btn" onClick={onReset}>{t.fp_clear}</button>
        </div>

      </div>
    </div>
  )
}
