import { useState, useEffect, useCallback } from 'react'
import MapView from './components/MapView'
import SpotDetail from './components/SpotDetail'
import SubmitForm from './components/SubmitForm'
import FilterPanel from './components/FilterPanel'
import RankingPanel from './components/RankingPanel'
import FoodiesPanel from './components/FoodiesPanel'
import RulesPanel from './components/RulesPanel'
import AuthModal from './components/AuthModal'
import FeedPanel from './components/FeedPanel'
import { LangContext } from './LangContext'
import { T } from './i18n'
import { AuthProvider, useAuth } from './context/AuthContext'

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

// ── Inner app (has access to useAuth) ──────────────────────────────────────
function AppInner() {
  const { currentUser, logout, getToken } = useAuth()

  const [spots,           setSpots]           = useState([])
  const [votes,           setVotes]           = useState([])
  const [loading,         setLoading]         = useState(true)
  const [selectedSpot,    setSelectedSpot]    = useState(null)
  const [pendingVoteType, setPendingVoteType] = useState(null)
  const [showSubmit,      setShowSubmit]      = useState(false)
  const [submitLocation,  setSubmitLocation]  = useState(null)
  const [showFilters,     setShowFilters]     = useState(false)
  const [showFoodies,     setShowFoodies]     = useState(() => window.innerWidth > 680)
  const [showRanking,     setShowRanking]     = useState(() => window.innerWidth > 680)
  const [showRules,       setShowRules]       = useState(() => !localStorage.getItem('eatdust_rules_seen'))
  const [showAuth,        setShowAuth]        = useState(false)
  const [filters,         setFilters]         = useState(DEFAULT_FILTERS)
  const [pinMode,         setPinMode]         = useState(false)
  const [lang,            setLang]            = useState('en')
  const [alreadyVoted,    setAlreadyVoted]    = useState(false)

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

  const handleVote = async (id, type, reasons = []) => {
    if (!currentUser) { setShowAuth(true); return }
    const spot = spots.find(s => s.id === id)
    if (!spot) return
    const field   = type === 'up' ? 'valueUp' : 'valueDown'
    const updated = { ...spot, [field]: (spot[field] || 0) + 1 }
    const token   = getToken()

    const voteRes = await fetch('/api/votes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        spotId:    id,
        type,
        flag:      currentUser.flag || '',
        reasons,
        createdAt: new Date().toISOString(),
      }),
    })

    if (voteRes.status === 409) {
      setAlreadyVoted(true)
      setTimeout(() => setAlreadyVoted(false), 2500)
      return
    }
    if (!voteRes.ok) return

    await fetch(`/api/spots/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [field]: updated[field] }),
    })

    setSpots(prev => prev.map(s => s.id === id ? updated : s))
    setVotes(prev => [...prev, { spotId: id, type, flag: currentUser.flag || '', id: Date.now().toString() }])
    setSelectedSpot(updated)
  }

  const handleSubmit = async (data) => {
    const token = getToken()
    const payload = {
      ...data,
      submittedAt: new Date().toISOString(),
      valueUp:     0,
      valueDown:   0,
    }
    const res = await fetch('/api/spots', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const saved = await res.json()
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
      if (!currentUser) { setShowAuth(true); return }
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
            <button className={`btn-foodies ${showRanking ? 'active' : ''}`} onClick={() => setShowRanking(v => !v)}>
              🏆 Ranking
            </button>
            <button className={`btn-foodies ${showFoodies ? 'active' : ''}`} onClick={() => setShowFoodies(v => !v)}>
              🍴 Foodies
            </button>
            <div className="lang-toggle" translate="no">
              <button className={lang === 'vn' ? 'on' : ''} onClick={() => setLang('vn')}>VN</button>
              <span className="lang-sep">|</span>
              <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>ENG</button>
            </div>
            <button className={`btn-filter ${activeFilterCount > 0 ? 'active' : ''}`} onClick={() => setShowFilters(v => !v)}>
              {t.filter_btn} {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
            </button>
            {/* Auth */}
            {currentUser ? (
              <div className="header-user">
                <span className="header-user-chip">
                  {currentUser.flag && <span>{currentUser.flag}</span>}
                  {currentUser.username}
                </span>
                <button className="header-logout" onClick={logout} title="Sign out">↪</button>
              </div>
            ) : (
              <button className="header-signin" onClick={() => setShowAuth(true)}>Sign in</button>
            )}
          </div>
        </header>

        {/* ── Filter panel ── */}
        {showFilters && (
          <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} onReset={() => setFilters(DEFAULT_FILTERS)} />
        )}

        {/* ── Foodies panel ── */}
        {showFoodies && <FoodiesPanel spots={spots} onClose={() => setShowFoodies(false)} />}

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
            onRequestAuth={() => setShowAuth(true)}
            onUpdate={updated => {
              setSpots(prev => prev.map(s => s.id === updated.id ? updated : s))
              setSelectedSpot(updated)
            }}
            onDelete={id => {
              setSpots(prev => prev.filter(s => s.id !== id))
              setSelectedSpot(null)
            }}
            initialVoteType={pendingVoteType}
          />
        )}

        {/* ── Submit form ── */}
        {showSubmit && (
          <SubmitForm initialLocation={submitLocation} onSubmit={handleSubmit} onClose={closeSubmit} />
        )}

        {/* ── Ranking panel ── */}
        {!showSubmit && showRanking && (
          <RankingPanel
            spots={filteredSpots}
            votes={votes}
            onSelect={setSelectedSpot}
            onVoteSelect={(spot, type) => {
              if (!currentUser) { setShowAuth(true); return }
              setSelectedSpot(spot)
              setPendingVoteType(type)
            }}
          />
        )}

        {/* ── FAB ── */}
        {!showSubmit && (
          <div className="fab-row">
            {!pinMode && (
              <button className="fab-rules-btn" onClick={() => setShowRules(true)} title="Community rules">📖</button>
            )}
            <button className={`fab ${pinMode ? 'fab-cancel' : ''}`} onClick={handleFAB}>
              {pinMode ? t.fab_cancel : t.fab_add}
            </button>
          </div>
        )}

        {/* ── Pin mode hint ── */}
        {pinMode && <div className="pin-hint">{t.pin_hint}</div>}

        {/* ── "Already voted" toast ── */}
        {alreadyVoted && <div className="vote-toast">You already voted on this spot ✓</div>}

        {/* ── Rules panel ── */}
        {showRules && <RulesPanel onClose={() => setShowRules(false)} />}

        {/* ── Auth modal ── */}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

        {/* ── Live ticker ── */}
        <FeedPanel spots={spots} />

        {/* ── Mobile tag strip ── */}
        <div className="mobile-tags">
          <button className={`mt-tag ${showRanking ? 'active' : ''}`} onClick={() => setShowRanking(v => !v)}>🏆 Ranking</button>
          <button className={`mt-tag ${showFoodies ? 'active' : ''}`} onClick={() => setShowFoodies(v => !v)}>🍴 Foodies</button>
          <button className={`mt-tag ${activeFilterCount > 0 ? 'active' : ''}`} onClick={() => setShowFilters(v => !v)}>
            ⚙ Filter {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
          <button className="mt-tag" onClick={() => currentUser ? null : setShowAuth(true)}>
            {currentUser ? `${currentUser.flag || '👤'} ${currentUser.username}` : 'Sign in'}
          </button>
        </div>

      </div>
    </LangContext.Provider>
  )
}

// ── Root export wraps with AuthProvider ────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
