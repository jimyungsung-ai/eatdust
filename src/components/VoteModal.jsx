import { useState } from 'react'
import FlagPicker from './FlagPicker'
import { useLang } from '../LangContext'

export default function VoteModal({ type, onSubmit, onClose }) {
  const { t } = useLang()
  const [flag,    setFlag]    = useState('🇻🇳')
  const [reasons, setReasons] = useState([])

  const tags = type === 'up' ? t.vote_tags_up : t.vote_tags_down
  const title = type === 'up' ? t.vote_modal_up : t.vote_modal_down
  const isUp  = type === 'up'

  const toggleReason = (tag) => {
    setReasons(prev =>
      prev.includes(tag) ? prev.filter(r => r !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = () => {
    onSubmit({ flag, reasons })
    onClose()
  }

  return (
    <div className="vm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vm-modal">

        {/* Header */}
        <div className="vm-head">
          <span className="vm-title">{title}</span>
          <button className="vm-close" onClick={onClose}>✕</button>
        </div>

        {/* Flag row */}
        <div className="vm-section">
          <p className="vm-label">{t.vote_modal_flag}</p>
          <div className="vm-flag-row">
            <FlagPicker value={flag} onChange={setFlag} />
          </div>
        </div>

        {/* Tags */}
        <div className="vm-section">
          <p className="vm-label">{t.vote_modal_tags}</p>
          <div className="vm-tags">
            {tags.map(tag => (
              <button
                key={tag}
                type="button"
                className={`vm-tag ${isUp ? 'up' : 'down'} ${reasons.includes(tag) ? 'on' : ''}`}
                onClick={() => toggleReason(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          className={`vm-submit ${isUp ? 'up' : 'down'}`}
          onClick={handleSubmit}
          disabled={reasons.length === 0}
        >
          Vote
        </button>

      </div>
    </div>
  )
}
