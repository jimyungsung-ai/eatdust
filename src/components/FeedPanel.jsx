import { useState, useEffect, useRef } from 'react'
import { CATEGORIES } from '../App'

function relTime(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d}d ago`
}

function buildEvents(spots, comments) {
  const spotMap = {}
  spots.forEach(s => { spotMap[s.id] = s })

  const evts = []

  spots.forEach(s => {
    if (!s.submittedAt) return
    const cat = CATEGORIES[s.category]
    evts.push({
      id:       `spot-${s.id}`,
      type:     'spot',
      time:     s.submittedAt,
      username: s.discovererUsername || 'someone',
      flag:     s.discovererFlag || '',
      spotName: s.name,
      icon:     cat?.icon || '🍽',
    })
  })

  comments.forEach(c => {
    const spot = spotMap[c.spotId]
    if (!spot) return
    evts.push({
      id:       `comment-${c.id ?? c.createdAt}`,
      type:     'comment',
      time:     c.createdAt,
      username: c.username || 'anon',
      flag:     c.flag || '',
      spotName: spot.name,
      icon:     CATEGORIES[spot.category]?.icon || '🍽',
    })
  })

  return evts.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 40)
}

export default function FeedTicker({ spots = [] }) {
  const [events, setEvents] = useState([])
  const trackRef = useRef(null)

  const refresh = async () => {
    let comments = []
    try { comments = await fetch('/api/comments').then(r => r.json()) } catch {}
    setEvents(buildEvents(spots, comments))
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 30_000)
    return () => clearInterval(t)
  }, [spots])

  if (events.length === 0) return null

  // Duplicate items so the marquee loops seamlessly
  const items = [...events, ...events]

  return (
    <div className="ticker-bar">
      <div className="ticker-badge">
        <span className="ticker-dot" />
        LIVE
      </div>
      <div className="ticker-track-wrap">
        <div className="ticker-track" ref={trackRef} style={{ '--count': events.length }}>
          {items.map((e, i) => (
            <span key={`${e.id}-${i}`} className="ticker-item">
              <span className="ticker-flag">{e.flag || e.icon}</span>
              <span className="ticker-user">{e.username}</span>
              {e.type === 'spot'
                ? <><span className="ticker-verb"> discovered </span><span className="ticker-spot">{e.icon} {e.spotName}</span></>
                : <><span className="ticker-verb"> commented on </span><span className="ticker-spot">{e.spotName}</span></>
              }
              <span className="ticker-time"> · {relTime(e.time)}</span>
              <span className="ticker-sep">  ·  </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
