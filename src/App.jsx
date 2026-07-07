import { useState, useEffect, useCallback } from 'react'
import MapView from './components/MapView'
import SpotDetail from './components/SpotDetail'
import SubmitForm from './components/SubmitForm'
import FilterPanel from './components/FilterPanel'
import RankingPanel from './components/RankingPanel'
import FoodiesPanel from './components/FoodiesPanel'
import { LangContext } from './LangContext'
import { T } from './i18n'

export const CATEGORIES = {
  com:      { label: 'Cơm',          label_en: 'Rice',           icon: '🍚' },
  bun_pho:  { label: 'Bún · Phở',   label_en: 'Noodles',        icon: '🍜' },
  banh_mi:  { label: 'Bánh mì',     label_en: 'Bánh Mì',        icon: '🥖' },
  chao:     { label: 'Cháo',        label_en: 'Porridge',       icon: '🫕' },
  ga:       { label: 'Gà',          label_en: 'Chicken',        icon: '🍗' },
  hai_san:  { label: 'Hải sản',     label_en: 'Seafood',        icon: '🦐' },
  nuong:    { label: 'Nướng',       label_en: 'Grilled',        icon: '🔥' },
  goi_cuon: { label: 'Gỏi · Cuốn', label_en: 'Rolls & Salad',  icon: '🥗' },
  banh:     { label: 'Bánh ngọt',   label_en: 'Pastry & Snack', icon: '🥟' },
  do_uong:  { label: 'Đồ uống',     label_en: 'Drinks',         icon: '☕' },
}

export const DISTRICTS = [
  'District 1', 'District 3', 'District 4', 'District 5',
  'District 10', 'Bình Thạnh', 'Gò Vấp', 'Tân Bình', 'Phú Nhuận',
]

const DEFAULT_FILTERS = { maxPrice: 80000, categories: [], district: '' }

export function isNew(spot) {
  const days = (Date.now() - new Date(spot.submittedAt)) / (1000 * 60 * 60 * 24)
  return days < 7
}

export default function App() {
  const [spots, setSpots] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [pendingVoteType, setPendingVoteType] = useState(null)
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitLocation, setSubmitLocation] = useState(null)
  const [showFilters,  setShowFilters]  = useState(false)
  const [showFoodies,  setShowFoodies]  = useState(true)
  const [showRanking,  setShowRanking]  = useState(true)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [pinMode, setPinMode] = useState(false)
  const [lang, setLang] = useState('en')

  const t = T[lang]

  const fetchSpots = useCallback(async () => {
    try {
      const [spotsRes, votesRes] = await Promise.all([
        fetch('/api/spots'),
        fetch('/api/votes'),
      ])
      setSpots(await spotsRes.json())
      setVotes(await votesRes.json())
    } catch (e) {
      console.error('API error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSpots() }, [fetchSpots])

  const filteredSpots = spots.filter(s => {
    if (s.price > filters.maxPrice) return false
    if (filters.categories.length && !filters.categories.includes(s.category)) return false
    if (filters.district && s.district !== filters.district) return false
    return true
  })

  // Top-3 by valueUp — used to badge map markers
  const rankMap = {}
  ;[...filteredSpots]
    .filter(s => (s.valueUp || 0) > 0)
    .sort((a, b) => (b.valueUp || 0) - (a.valueUp || 0))
    .slice(0, 3)
    .forEach((s, i) => { rankMap[s.id] = i + 1 })

  const activeFilterCount =
    (filters.maxPrice < 80000 ? 1 : 0) +
    filters.categories.length +
    (filters.district ? 1 : 0)

  const handleVote = async (id, type, flag = '') => {
    const spot = spots.find(s => s.id === id)
    if (!spot) return
    const field = type === 'up' ? 'valueUp' : 'valueDown'
    const updated = { ...spot, [field]: (spot[field] || 0) + 1 }
    // Record the vote with nationality
    const newVote = { spotId: id, type, flag, createdAt: new Date().toISOString() }
    await Promise.all([
      fetch(`/api/spots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: updated[field] }),
      }),
      fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVote),
      }),
    ])
    setSpots(prev => prev.map(s => s.id === id ? updated : s))
    setVotes(prev => [...prev, { ...newVote, id: Date.now().toString() }])
    setSelectedSpot(updated)
  }

  const handleSubmit = async (data) => {
    const { username, flag, ...spotData } = data
    const payload = { ...spotData, submittedAt: new Date().toISOString(), valueUp: 0, valueDown: 0, discovererFlag: flag || '', discovererUsername: username || '' }
    const res = await fetch('/api/spots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const saved = await res.json()

    // Auto-post "Discovered by" comment — posted as Eat Dust 🇻🇳
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spotId: saved.id,
        username: 'Eat Dust',
        flag: '🇻🇳',
        text: T[lang === 'en' ? 'en' : 'vn'].sf_discovered(username, flag),
        likes: 0,
        createdAt: new Date().toISOString(),
      }),
    }).catch(() => {})

    setSpots(prev => [...prev, saved])
    setShowSubmit(false)
    setSubmitLocation(null)
    setSelectedSpot(saved)
  }

  const handleMapClick = (latlng) => {
    if (!pinMode) return
    setPinMode(false)
    setSelectedSpot(null)
    setSubmitLocation(latlng)
    setShowSubmit(true)
  }

  const handleFAB = () => {
    if (pinMode) {
      setPinMode(false)
    } else {
      setSelectedSpot(null)
      setShowSubmit(false)
      setPinMode(true)
    }
  }

  const closeSubmit = () => {
    setShowSubmit(false)
    setSubmitLocation(null)
    setPinMode(false)
  }

  return (
    <LangContext.Provider value={lang}>
      <div className="app" translate="no">
        {/* ── Header ── */}
        <header className="header">
          <div className="header-brand">
            <span className="header-title">🍜 Ăn Bụi <span className="header-sub">· Sài Gòn</span></span>
          </div>
          <div className="header-actions">
            {/* Ranking panel toggle */}
            <button
              className={`btn-foodies ${showRanking ? 'active' : ''}`}
              onClick={() => setShowRanking(v => !v)}
            >
              🏆 Ranking
            </button>
            {/* Foodies leaderboard */}
            <button
              className={`btn-foodies ${showFoodies ? 'active' : ''}`}
              onClick={() => setShowFoodies(v => !v)}
            >
              🍴 Foodies
            </button>
            {/* Language toggle */}
            <div className="lang-toggle" translate="no">
              <button
                className={lang === 'vn' ? 'on' : ''}
                onClick={() => setLang('vn')}
              >VN</button>
              <span className="lang-sep">|</span>
              <button
                className={lang === 'en' ? 'on' : ''}
                onClick={() => setLang('en')}
              >ENG</button>
            </div>
            {/* Filter */}
            <button
              className={`btn-filter ${activeFilterCount > 0 ? 'active' : ''}`}
              onClick={() => setShowFilters(v => !v)}
            >
              {t.filter_btn} {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
            </button>
          </div>
        </header>

        {/* ── Filter panel ── */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        )}

        {/* ── Foodies panel ── */}
        {showFoodies && (
          <FoodiesPanel spots={spots} onClose={() => setShowFoodies(false)} />
        )}

        {/* ── Map ── */}
        <MapView
          spots={filteredSpots}
          selectedId={selectedSpot?.id}
          rankMap={rankMap}
          onSelect={setSelectedSpot}
          onMapClick={handleMapClick}
          loading={loading}
          pinMode={pinMode}
          placedPin={showSubmit ? submitLocation : null}
        />

        {/* ── Spot detail ── */}
        {selectedSpot && !showSubmit && (
          <SpotDetail
            spot={selectedSpot}
            onClose={() => { setSelectedSpot(null); setPendingVoteType(null) }}
            onVote={handleVote}
            onUpdate={updated => {
              setSpots(prev => prev.map(s => s.id === updated.id ? updated : s))
              setSelectedSpot(updated)
            }}
            initialVoteType={pendingVoteType}
          />
        )}

        {/* ── Submit form ── */}
        {showSubmit && (
          <SubmitForm
            initialLocation={submitLocation}
            onSubmit={handleSubmit}
            onClose={closeSubmit}
          />
        )}

        {/* ── Ranking panel ── */}
        {!showSubmit && showRanking && (
          <RankingPanel spots={filteredSpots} votes={votes} onSelect={setSelectedSpot} onVoteSelect={(spot, type) => { setSelectedSpot(spot); setPendingVoteType(type) }} />
        )}

        {/* ── FAB ── */}
        {!showSubmit && (
          <button
            className={`fab ${pinMode ? 'fab-cancel' : ''}`}
            onClick={handleFAB}
          >
            {pinMode ? t.fab_cancel : t.fab_add}
          </button>
        )}

        {/* ── Pin mode hint ── */}
        {pinMode && (
          <div className="pin-hint">{t.pin_hint}</div>
        )}
      </div>
    </LangContext.Provider>
  )
}
