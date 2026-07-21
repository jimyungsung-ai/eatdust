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

export default function FoodiesPanel({ spots = [], votes = [], onClose }) {
  const { lang } = useLang()
  const [viewMode,  setViewMode]  = useState('leaderboard')  // 'leaderboard' | 'foodies' | 'countries'
  const [collapsed, setCollapsed] = useState(false)
  const [audience,  setAudience]  = useState('all')
  const [pos,       setPos]       = useState(null)
  const [dragging,  setDragging]  = useState(false)
  const panelRef = useRef(null)
  const dragRef  = useRef(null)

  /* ── Points leaderboard ──
     +5 add a place · +1 vote for a place · +3 when a place you added hits 5 upvotes */
  const pointsBoard = useMemo(() => {
    const map = {}
    const ensure = (u, flag) => {
      if (!map[u]) map[u] = { username: u, flag: flag || '', points: 0, spotsAdded: 0, votesCast: 0, bonuses: 0 }
      if (flag) map[u].flag = flag
      return map[u]
    }
    // Discoveries (+5 each) and popularity bonus (+3 when valueUp >= 5)
    for (const s of spots) {
      const u = s.discovererUsername
      if (!u || SYSTEM_USERS.has(u)) continue
      const e = ensure(u, s.discovererFlag)
      e.spotsAdded++
      e.points += 5
      if ((s.valueUp || 0) >= 5) { e.points += 3; e.bonuses++ }
    }
    // Votes cast (+1 each)
    for (const v of votes) {
      const u = v.username
      if (!u || SYSTEM_USERS.has(u)) continue
      const e = ensure(u, v.flag)
      e.votesCast++
      e.points += 1
    }
    return Object.values(map)
      .sort((a, b) => b.points - a.points || b.spotsAdded - a.spotsAdded)
      .slice(0, 20)
  }, [spots, votes])

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
  const titleLeader    = lang === 'en' ? 'Leaderboard' : 'Bảng xếp hạng'

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
            className={`rk-view-btn ${viewMode === 'leaderboard' ? 'on' : ''}`}
            onClick={() => setViewMode('leaderboard')}
          >
            {titleLeader}
          </button>
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

      {/* ── Leaderboard view (points) ── */}
      {!collapsed && viewMode === 'leaderboard' && (
        <>
          <div className="fd-points-legend">
            {lang === 'en'
              ? '+5 add a spot · +1 vote · +3 when your spot hits 5 upvotes'
              : '+5 thêm địa điểm · +1 bình chọn · +3 khi địa điểm đạt 5 lượt thích'}
          </div>
          <div className="fd-list">
            {pointsBoard.length === 0 ? (
              <p className="fd-empty">
                {lang === 'en' ? 'No points yet — add a spot to start!' : 'Chưa có điểm — hãy thêm địa điểm!'}
              </p>
            ) : pointsBoard.map((u, i) => {
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
                    <div className="fd-sub">
                      {u.spotsAdded > 0 && `${u.spotsAdded} ${lang === 'en' ? 'spots' : 'địa điểm'}`}
                      {u.spotsAdded > 0 && u.votesCast > 0 && ' · '}
                      {u.votesCast > 0 && `${u.votesCast} ${lang === 'en' ? 'votes' : 'bình chọn'}`}
                    </div>
                  </div>
                  <div className="fd-disc-col">
                    <span className="fd-pts-num">{u.points}</span>
                    <span className="fd-disc-label">{lang === 'en' ? 'pts' : 'điểm'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

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
