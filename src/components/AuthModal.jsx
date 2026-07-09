import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import FlagPicker from './FlagPicker'

export default function AuthModal({ onClose, onSuccess }) {
  const { login, register } = useAuth()
  const [tab,      setTab]      = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [flag,     setFlag]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const switchTab = (t) => { setTab(t); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        if (!username.trim()) { setError('Username is required'); return }
        await register(email, username.trim(), flag, password)
      }
      onSuccess?.()
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

        {/* Header */}
        <div className="auth-head">
          <span className="auth-brand">🍜 Ăn Bụi</span>
          <button className="auth-close" onClick={onClose}>✕</button>
        </div>

        <p className="auth-tagline">
          {tab === 'login' ? 'Welcome back, foodie 👋' : 'Join the community 🍽'}
        </p>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login'    ? 'on' : ''}`} onClick={() => switchTab('login')}>Sign in</button>
          <button className={`auth-tab ${tab === 'register' ? 'on' : ''}`} onClick={() => switchTab('register')}>Create account</button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required autoFocus
            />
          </div>

          {tab === 'register' && (
            <>
              <div className="auth-field">
                <label className="auth-label">Username</label>
                <input
                  className="auth-input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="ngon_pho_42"
                  maxLength={30}
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Nationality <span className="auth-optional">(optional)</span></label>
                <FlagPicker value={flag} onChange={setFlag} />
              </div>
            </>
          )}

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={tab === 'register' ? 'At least 6 characters' : ''}
              minLength={tab === 'register' ? 6 : undefined}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? '…' : tab === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {tab === 'login' && (
          <p className="auth-switch">
            No account?{' '}
            <button className="auth-switch-link" onClick={() => switchTab('register')}>
              Create one
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
