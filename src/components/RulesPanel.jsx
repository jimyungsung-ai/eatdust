const RULES_KEY = 'eatdust_rules_seen'

export default function RulesPanel({ onClose }) {
  const dismiss = () => {
    localStorage.setItem(RULES_KEY, '1')
    onClose()
  }

  return (
    <div className="rp-overlay" onClick={dismiss}>
      <div className="rp-sheet" onClick={e => e.stopPropagation()}>
        <div className="rp-header">
          <span className="rp-icon">📖</span>
          <span className="rp-title">Community Rules</span>
        </div>

        <ol className="rp-list">
          <li>Only add spots you've actually eaten at.</li>
          <li>Budget only — 80,000₫ or less per meal.</li>
          <li>Vote honestly — up if it's real value, down if it's not.</li>
        </ol>

        <p className="rp-footer">
          This map runs on trust — be nice, be true 😊
        </p>

        <button className="rp-btn" onClick={dismiss}>
          Let's eat 🍜
        </button>
      </div>
    </div>
  )
}
