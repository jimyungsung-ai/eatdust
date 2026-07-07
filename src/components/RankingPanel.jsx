import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { CATEGORIES } from '../App'
import { useLang } from '../LangContext'

function fmt(price) {
  return (price / 1000) + 'k₫'
}

function relDays(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / (1000 * 60 * 60 * 24))
  if (d === 0) return 'Today'
  return `${d}d`
}

export default function RankingPanel({ spots, votes = [], onSelect, onVoteSelect }) {
  const { lang } = useLang()
  const [collapsed,  setCollapsed]  = useState(false)
  const [viewMode,   setViewMode]   = useState('ranking') // 'ranking' | 'new'
  const [audience,   setAudience]   = useState('all')
  const [pos,        setPos]        = useState(null)
  const [dragging,   setDragging]   = useState(false)
  const panelRef = useRef(null)
  const dragRef  = useRef(null)

  /* ── Ranked list ── */
  const ranked = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    return [...spots]
      .map(s => {
        const spotVotes = votes.filter(v => v.spotId === s.id)
        const recentAll = spotVotes.filter(v => new Date(v.createdAt) >= sevenDaysAgo)

        let score, trend

        if (audience === 'all') {
          score = (s.valueUp || 0) - (s.valueDown || 0)
          const ru = recentAll.filter(v => v.type === 'up').length
          const rd = recentAll.filter(v => v.type === 'down').length
          trend = ru - rd
        } else {
          const isLocal  = audience === 'local'
          const filtered = isLocal
            ? spotVotes.filter(v => v.flag === '🇻🇳')
            : spotVotes.filter(v => v.flag && v.flag !== '🇻🇳')
          const recent   = isLocal
            ? recentAll.filter(v => v.flag === '🇻🇳')
            : recentAll.filter(v => v.flag && v.flag !== '🇻🇳')

          score = filtered.filter(v => v.type === 'up').length
          trend = recent.filter(v => v.type === 'up').length
                - recent.filter(v => v.type === 'down').length
        }

        return { ...s, score, trend }
      })
      .filter(s => (s.valueUp || 0) > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }, [spots, votes, audience])

  /* ── Newest list ── */
  const newest = useMemo(() => {
    return [...spots]
      .filter(s => {
        if (audience === 'all')     return true
        if (audience === 'local')   return s.discovererFlag === '🇻🇳'
        if (audience === 'foreign') return s.discovererFlag && s.discovererFlag !== '🇻🇳'
        return true
      })
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 15)
  }, [spots, audience])

  const titleRanking = lang === 'en' ? 'Ranking'   : 'Xếp hạng'
  const titleNew     = lang === 'en' ? 'New Spot'  : 'Địa mới'

  /* ── Collapse toggle ── */
  const handleToggle = useCallback(() => {
    if (!pos && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect()
      setPos({ x: rect.left, y: rect.top })
    }
    setCollapsed(v => !v)
  }, [pos])

  /* ── Drag start ── */
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.rk-toggle'))    return
    if (e.target.closest('.rk-view-btn')) return
    e.preventDefault()

    const rect  = panelRef.current.getBoundingClientRect()
    const startX = rect.left
    const startY = rect.top
    if (!pos) setPos({ x: startX, y: startY })

    dragRef.current = { startMX: e.clientX, startMY: e.clientY, startX, startY }
    setDragging(true)
  }, [pos])

  /* ── Drag move / up ── */
  useEffect(() => {
    if (!dragging) return

    const onMove = (e) => {
      const { startMX, startMY, startX, startY } = dragRef.current
      const nx = startX + (e.clientX - startMX)
      const ny = startY + (e.clientY - startMY)
      const maxX = window.innerWidth  - (panelRef.current?.offsetWidth  || 320)
      const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 100)
      setPos({ x: Math.max(0, Math.min(nx, maxX)), y: Math.max(0, Math.min(ny, maxY)) })
    }
    const onUp = () => setDragging(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [dragging])

  if (spots.length === 0) return null

  const style = pos
    ? { left: pos.x, top: pos.y, bottom: 'auto', right: 'auto', transform: 'none' }
    : {}

  return (
    <div
      ref={panelRef}
      className={`ranking-panel ${collapsed ? 'collapsed' : ''} ${dragging ? 'dragging' : ''}`}
      style={style}
    >
      {/* ── Header (drag handle) ── */}
      <div className="rk-header" onMouseDown={handleMouseDown}>
        <div className="rk-view-toggle">
          <button
            className={`rk-view-btn ${viewMode === 'ranking' ? 'on' : ''}`}
            onClick={() => setViewMode('ranking')}
          >
            {titleRanking}
          </button>
          <button
            className={`rk-view-btn ${viewMode === 'new' ? 'on' : ''}`}
            onClick={() => setViewMode('new')}
          >
            {titleNew}
          </button>
        </div>
        <button className="rk-toggle" onClick={handleToggle}>
          <span className={`rk-chevron ${collapsed ? 'down' : 'up'}`} />
        </button>
      </div>

      {/* ── Ranking view ── */}
      {!collapsed && viewMode === 'ranking' && (
        <>
          <div className="rk-tabs">
            <button className={`rk-tab ${audience === 'all'     ? 'on' : ''}`} onClick={() => setAudience('all')}>🤝 All</button>
            <button className={`rk-tab ${audience === 'local'   ? 'on' : ''}`} onClick={() => setAudience('local')}>🇻🇳 Locals</button>
            <button className={`rk-tab ${audience === 'foreign' ? 'on' : ''}`} onClick={() => setAudience('foreign')}>🌐 Foreigners</button>
          </div>

          <div className="rk-list">
            {ranked.length === 0 ? (
              <p className="rk-empty">No ranked spots yet</p>
            ) : ranked.map((spot, i) => {
              const cat      = CATEGORIES[spot.category] || { icon: '🍽', label: '', label_en: '' }
              const catLabel = lang === 'en' ? (cat.label_en || cat.label) : cat.label
              return (
                <div key={spot.id} className="rk-row" onClick={() => onSelect(spot)}>
                  <span className="rk-rank">#{i + 1}</span>
                  <span className="rk-icon">{cat.icon}</span>
                  <div className="rk-info">
                    <div className="rk-name-row">
                      <span className="rk-name">{spot.name}</span>
                      <span className="rk-price">{fmt(spot.price)}</span>
                    </div>
                    <div className="rk-dist">{spot.district} · {catLabel}</div>
                  </div>
                  <div className="rk-score">
                    <span className="rk-score-val">+{spot.score}</span>
                    {spot.trend !== 0 && (
                      <span className={`rk-trend ${spot.trend > 0 ? 'up' : 'down'}`}>
                        {spot.trend > 0 ? '▲' : '▼'}
                        {spot.trend > 0 ? `+${spot.trend}` : spot.trend}
                      </span>
                    )}
                  </div>
                  <div className="rk-vote-btns" onClick={e => e.stopPropagation()}>
                    <button className="rk-vote-btn up"   title="Good"         onClick={() => onVoteSelect(spot, 'up')}>▲</button>
                    <button className="rk-vote-btn down" title="Not so good"  onClick={() => onVoteSelect(spot, 'down')}>▼</button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── New spots view ── */}
      {!collapsed && viewMode === 'new' && (
        <>
          <div className="rk-tabs">
            <button className={`rk-tab ${audience === 'all'     ? 'on' : ''}`} onClick={() => setAudience('all')}>🤝 All</button>
            <button className={`rk-tab ${audience === 'local'   ? 'on' : ''}`} onClick={() => setAudience('local')}>🇻🇳 Locals</button>
            <button className={`rk-tab ${audience === 'foreign' ? 'on' : ''}`} onClick={() => setAudience('foreign')}>🌐 Foreigners</button>
          </div>
          <div className="rk-list">
            {newest.length === 0 ? (
              <p className="rk-empty">No spots yet</p>
            ) : newest.map(spot => {
              const cat      = CATEGORIES[spot.category] || { icon: '🍽', label: '', label_en: '' }
              const catLabel = lang === 'en' ? (cat.label_en || cat.label) : cat.label
              const up       = spot.valueUp   || 0
              const down     = spot.valueDown || 0
              return (
                <div key={spot.id} className="rk-row" onClick={() => onSelect(spot)}>
                  <span className="rk-rank rk-new-age">{relDays(spot.submittedAt)}</span>
                  <span className="rk-icon">{cat.icon}</span>
                  <div className="rk-info">
                    <div className="rk-name-row">
                      <span className="rk-name">{spot.name}</span>
                      <span className="rk-price">{fmt(spot.price)}</span>
                    </div>
                    <div className="rk-dist">{spot.district} · {catLabel}</div>
                  </div>
                  <div className="rk-score">
                    <span className="rk-score-val">+{up}</span>
                    {down > 0 && <span className="rk-trend down">▼{down}</span>}
                  </div>
                  <div className="rk-vote-btns" onClick={e => e.stopPropagation()}>
                    <button className="rk-vote-btn up"   title="Good"        onClick={() => onVoteSelect(spot, 'up')}>▲</button>
                    <button className="rk-vote-btn down" title="Not so good" onClick={() => onVoteSelect(spot, 'down')}>▼</button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
