import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useLang } from '../LangContext'

const MEDALS       = { 1: '🥇', 2: '🥈', 3: '🥉' }
const SYSTEM_USERS = new Set(['Eat Dust'])

const FLAG_NAMES = {
  '🇻🇳': 'Vietnam',       '🇹🇭': 'Thailand',      '🇸🇬': 'Singapore',
  '🇲🇾': 'Malaysia',      '🇮🇩': 'Indonesia',     '🇵🇭': 'Philippines',
  '🇰🇭': 'Cambodia',      '🇲🇲': 'Myanmar',       '🇱🇦': 'Laos',
  '🇹🇼': 'Taiwan',        '🇭🇰': 'Hong Kong',     '🇰🇷': 'South Korea',
  '🇯🇵': 'Japan',         '🇨🇳': 'China',         '🇮🇳': 'India',
  '🇦🇺': 'Australia',     '🇳🇿': 'New Zealand',   '🇺🇸': 'United States',
  '🇨🇦': 'Canada',        '🇧🇷': 'Brazil',        '🇲🇽': 'Mexico',
  '🇬🇧': 'United Kingdom','🇫🇷': 'France',        '🇩🇪': 'Germany',
  '🇮🇹': 'Italy',         '🇪🇸': 'Spain',         '🇵🇹': 'Portugal',
  '🇳🇱': 'Netherlands',   '🇧🇪': 'Belgium',       '🇨🇭': 'Switzerland',
  '🇸🇪': 'Sweden',        '🇳🇴': 'Norway',        '🇩🇰': 'Denmark',
  '🇦🇪': 'UAE',           '🇸🇦': 'Saudi Arabia',  '🇹🇷': 'Turkey',
  '🇿🇦': 'South Africa',  '🇳🇬': 'Nigeria',       '🇷🇺': 'Russia',
}

export default function FoodiesPanel({ spots = [], onClose }) {
  const { lang } = useLang()
  const [viewMode,  setViewMode]  = useState('foodies')  // 'foodies' | 'countries'
  const [collapsed, setCollapsed] = useState(false)
  const [audience,  setAudience]  = useState('all')
  const [pos,       setPos]       = useState(null)
  const [dragging,  setDragging]  = useState(false)
  const panelRef = useRef(null)
  const dragRef  = useRef(null)

  /* ── Foodies leaderboard ── */
  const leaderboard = useMemo(() => {
    const filtered = spots.filter(s => {
      if (audience === 'local')   return s.discovererFlag === '🇻🇳'
      if (audience === 'foreign') return s.discovererFlag && s.discovererFlag !== '🇻🇳'
      return true
    })
    const map = {}
    for (const s of filtered) {
      const u = s.discovererUsername
      if (!u || SYSTEM_USERS.has(u)) continue
      if (!map[u]) {
        map[u] = { username: u, flag: s.discovererFlag || '', discoveries: 0, totalUp: 0, totalDown: 0 }
      }
      map[u].discoveries++
      map[u].totalUp   += s.valueUp   || 0
      map[u].totalDown += s.valueDown || 0
      if (s.discovererFlag) map[u].flag = s.discovererFlag
    }
    return Object.values(map)
      .sort((a, b) => (b.totalUp + b.totalDown) - (a.totalUp + a.totalDown))
      .slice(0, 20)
  }, [spots, audience])

  /* ── Countries leaderboard — Vietnam pinned first ── */
  const countries = useMemo(() => {
    const map = {}
    for (const s of spots) {
      const f = s.discovererFlag
      if (!f) continue
      map[f] = (map[f] || 0) + 1
    }
    const vn    = map['🇻🇳'] || 0
    const rest  = Object.entries(map)
      .filter(([f]) => f !== '🇻🇳')
      .sort((a, b) => b[1] - a[1])
    const all = vn > 0 ? [['🇻🇳', vn], ...rest] : rest
    return all
  }, [spots])

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
    if (e.target.closest('.fd-toggle'))  return
    if (e.target.closest('.rk-tab'))     return
    if (e.target.closest('.rk-view-btn')) return
    e.preventDefault()

    const rect   = panelRef.current.getBoundingClientRect()
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
      const nx   = startX + (e.clientX - startMX)
      const ny   = startY + (e.clientY - startMY)
      const maxX = window.innerWidth  - (panelRef.current?.offsetWidth  || 370)
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

  const style = pos
    ? { left: pos.x, top: pos.y, bottom: 'auto', right: 'auto', transform: 'none' }
    : {}

  const titleFoodies   = lang === 'en' ? 'Foodies'    : 'Thực khách'
  const titleCountries = lang === 'en' ? 'Countries'  : 'Quốc gia'

  return (
    <div
      ref={panelRef}
      className={`foodies-panel ${collapsed ? 'collapsed' : ''} ${dragging ? 'dragging' : ''}`}
      style={style}
    >
      {/* ── Header (drag handle) ── */}
      <div className="fd-header" onMouseDown={handleMouseDown}>
        <div className="rk-view-toggle">
          <button
            className={`rk-view-btn ${viewMode === 'foodies' ? 'on' : ''}`}
            onClick={() => setViewMode('foodies')}
          >
            {titleFoodies}
          </button>
          <button
            className={`rk-view-btn ${viewMode === 'countries' ? 'on' : ''}`}
            onClick={() => setViewMode('countries')}
          >
            {titleCountries}
          </button>
        </div>
        <div className="fd-header-actions">
          <button className="fd-toggle" onClick={handleToggle}>
            <span className={`rk-chevron ${collapsed ? 'down' : 'up'}`} />
          </button>
          <button className="fd-close" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* ── Foodies view ── */}
      {!collapsed && viewMode === 'foodies' && (
        <>
          <div className="rk-tabs">
            <button className={`rk-tab ${audience === 'all'     ? 'on' : ''}`} onClick={() => setAudience('all')}>🤝 All</button>
            <button className={`rk-tab ${audience === 'local'   ? 'on' : ''}`} onClick={() => setAudience('local')}>🇻🇳 By locals</button>
            <button className={`rk-tab ${audience === 'foreign' ? 'on' : ''}`} onClick={() => setAudience('foreign')}>🌐 By foreigners</button>
          </div>
          <div className="fd-list">
            {leaderboard.length === 0 ? (
              <p className="fd-empty">
                {lang === 'en' ? 'No discoverers yet — be the first!' : 'Chưa có ai — hãy là người đầu tiên!'}
              </p>
            ) : leaderboard.map((u, i) => {
              const rank  = i + 1
              const medal = MEDALS[rank]
              return (
                <div key={u.username} className={`fd-row ${rank <= 3 ? 'fd-top' : ''}`}>
                  <span className="fd-rank">
                    {medal ? medal : <span className="fd-rank-num">#{rank}</span>}
                  </span>
                  <div className="fd-info">
                    <div className="fd-name">
                      {u.flag && <span className="fd-flag">{u.flag}</span>}
                      {u.username}
                    </div>
                  </div>
                  <div className="fd-disc-col">
                    <span className="fd-disc-num">{u.discoveries}</span>
                    <span className="fd-disc-label">{lang === 'en' ? 'spots' : 'địa điểm'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Countries view ── */}
      {!collapsed && viewMode === 'countries' && (
        <div className="fd-list">
          {countries.length === 0 ? (
            <p className="fd-empty">
              {lang === 'en' ? 'No spots yet' : 'Chưa có địa điểm'}
            </p>
          ) : (() => {
            const maxCount = countries[0][1]
            return countries.map(([flag, count], i) => {
              const name  = FLAG_NAMES[flag] || flag
              const isVN  = flag === '🇻🇳'
              const rank  = i + 1
              const medal = MEDALS[rank]
              const pct   = Math.round((count / maxCount) * 100)
              return (
                <div key={flag} className={`fd-row fd-row-country ${isVN ? 'fd-top' : ''}`}>
                  <div
                    className="fd-country-bar"
                    style={{ width: `${pct}%`, background: 'rgba(251,191,36,0.13)' }}
                  />
                  <span className="fd-rank">
                    {medal ? medal : <span className="fd-rank-num">#{rank}</span>}
                  </span>
                  <div className="fd-info">
                    <div className="fd-name">
                      <span className="fd-flag">{flag}</span>
                      {name}
                    </div>
                  </div>
                  <div className="fd-disc-col">
                    <span className="fd-disc-num">{count}</span>
                    <span className="fd-disc-label">{lang === 'en' ? (count === 1 ? 'spot' : 'spots') : 'địa điểm'}</span>
                  </div>
                </div>
              )
            })
          })()}
        </div>
      )}
    </div>
  )
}
