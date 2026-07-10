import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import FlagPicker from './FlagPicker'

export default function AuthModal({ onClose }) {
  const { identify } = useAuth()
  const [email,      setEmail]      = useState('')
  const [username,   setUsername]   = useState('')
  const [flag,       setFlag]       = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [checking,   setChecking]   = useState(false)
  // null = not checked yet, true = returning user, false = new user
  const [isReturning, setIsReturning] = useState(null)

  const checkEmail = async () => {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) return
    setChecking(true)
    try {
      const res  = await fetch('/api/auth/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()
      setIsReturning(data.exists)
    } catch {
      setIsReturning(false) // treat as new on error
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (isReturning === false && !flag) {
      setError('Please select your nationality')
      return
    }
    setLoading(true)
    try {
      await identify(email, username, flag)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">

        <div className="auth-head">
          <span className="auth-brand">🍜 Ăn Bụi</span>
          <button className="auth-close" onClick={onClose}>✕</button>
        </div>

        <p className="auth-tagline">
          {isReturning === true  ? 'Welcome back 👋'         :
           isReturning === false ? 'Create your account 🍽'  :
           'Enter your email to get started'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setIsReturning(null) }}
              onBlur={checkEmail}
              placeholder="you@example.com"
              required autoFocus
            />
            {checking && <span className="auth-checking">Checking…</span>}
          </div>

          {/* Only show for new users */}
          {isReturning === false && (
            <>
              <div className="auth-field">
                <label className="auth-label">Username</label>
                <input
                  className="auth-input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="How should we call you?"
                  maxLength={30}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Nationality</label>
                <FlagPicker value={flag} onChange={setFlag} />
              </div>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          {/* Show button once email is validated */}
          {isReturning !== null && (
            <button className="auth-submit" type="submit" disabled={loading || checking}>
              {loading ? '…' : "Let's eat 🍜"}
            </button>
          )}
        </form>

        {isReturning === null && (
          <p className="auth-hint">Tab out of the email field to continue</p>
        )}
        {isReturning === true && (
          <p className="auth-hint">We found your account — just hit the button.</p>
        )}
      </div>
    </div>
  )
}
