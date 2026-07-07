import { useState, useRef, useEffect } from 'react'

const COUNTRIES = [
  // SE Asia first (most relevant for HCMC)
  ['Vietnam',      '🇻🇳'],
  ['Thailand',     '🇹🇭'],
  ['Singapore',    '🇸🇬'],
  ['Malaysia',     '🇲🇾'],
  ['Indonesia',    '🇮🇩'],
  ['Philippines',  '🇵🇭'],
  ['Cambodia',     '🇰🇭'],
  ['Myanmar',      '🇲🇲'],
  ['Laos',         '🇱🇦'],
  ['Taiwan',       '🇹🇼'],
  ['Hong Kong',    '🇭🇰'],
  // East Asia
  ['South Korea',  '🇰🇷'],
  ['Japan',        '🇯🇵'],
  ['China',        '🇨🇳'],
  // South Asia
  ['India',        '🇮🇳'],
  ['Bangladesh',   '🇧🇩'],
  ['Pakistan',     '🇵🇰'],
  ['Sri Lanka',    '🇱🇰'],
  ['Nepal',        '🇳🇵'],
  // Oceania
  ['Australia',    '🇦🇺'],
  ['New Zealand',  '🇳🇿'],
  // Americas
  ['United States','🇺🇸'],
  ['Canada',       '🇨🇦'],
  ['Brazil',       '🇧🇷'],
  ['Mexico',       '🇲🇽'],
  ['Argentina',    '🇦🇷'],
  ['Colombia',     '🇨🇴'],
  ['Chile',        '🇨🇱'],
  // Europe
  ['United Kingdom','🇬🇧'],
  ['France',       '🇫🇷'],
  ['Germany',      '🇩🇪'],
  ['Italy',        '🇮🇹'],
  ['Spain',        '🇪🇸'],
  ['Portugal',     '🇵🇹'],
  ['Netherlands',  '🇳🇱'],
  ['Belgium',      '🇧🇪'],
  ['Switzerland',  '🇨🇭'],
  ['Sweden',       '🇸🇪'],
  ['Norway',       '🇳🇴'],
  ['Denmark',      '🇩🇰'],
  ['Finland',      '🇫🇮'],
  ['Poland',       '🇵🇱'],
  ['Ukraine',      '🇺🇦'],
  ['Russia',       '🇷🇺'],
  // Middle East & Africa
  ['UAE',          '🇦🇪'],
  ['Saudi Arabia', '🇸🇦'],
  ['Israel',       '🇮🇱'],
  ['Turkey',       '🇹🇷'],
  ['Egypt',        '🇪🇬'],
  ['South Africa', '🇿🇦'],
  ['Nigeria',      '🇳🇬'],
  ['Kenya',        '🇰🇪'],
]

export default function FlagPicker({ value, onChange }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  const filtered = query.trim()
    ? COUNTRIES.filter(([name]) => name.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flag-picker" ref={ref}>
      <button
        type="button"
        className="flag-btn"
        onClick={() => setOpen(v => !v)}
        title="Select your country"
      >
        {value || '🌐'}
      </button>

      {open && (
        <div className="flag-dropdown">
          <input
            autoFocus
            className="flag-search"
            placeholder="Search country…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flag-list">
            {filtered.length === 0 && (
              <div className="flag-empty">No match</div>
            )}
            {filtered.map(([name, flag]) => (
              <button
                key={name}
                type="button"
                className={`flag-option ${value === flag ? 'on' : ''}`}
                onClick={() => { onChange(flag); setOpen(false); setQuery('') }}
              >
                <span className="flag-option-emoji">{flag}</span>
                <span className="flag-option-name">{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
