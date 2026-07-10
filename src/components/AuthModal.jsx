import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import FlagPicker from './FlagPicker'

const ADJ  = ['ngon', 'bụi', 'cay', 'béo', 'thơm', 'giòn', 'đậm', 'ngọt']
const FOOD = ['phở', 'bún', 'cơm', 'bánh', 'chả', 'nem', 'lẩu', 'xôi']
function randomName() {
  return `${ADJ[Math.random() * ADJ.length | 0]}_${FOOD[Math.random() * FOOD.length | 0]}_${Math.floor(Math.random() * 900 + 100)}`
}

export default function AuthModal({ onClose }) {
  const { identify } = useAuth()
  const [email,    setEmail]    = useState('')
  const [username, setUsername] = useState(randomName)
  const [flag,     setFlag]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
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

        <p className="auth-tagline">Enter your email to join or sign back in</p>

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

          <div className="auth-field">
            <label className="auth-label">Username <span className="auth-optional">— change it if you like</span></label>
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={30}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Nationality <span className="auth-optional">(optional)</span></label>
            <FlagPicker value={flag} onChange={setFlag} />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? '…' : "Let's eat 🍜"}
          </button>
        </form>

        <p className="auth-hint">Returning? Just enter your email — we'll find you.</p>
      </div>
    </div>
  )
}
