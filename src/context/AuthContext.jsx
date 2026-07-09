import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const TOKEN_KEY   = 'eatdust_token'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authReady,   setAuthReady]   = useState(false)

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setAuthReady(true); return }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(user => { if (user) setCurrentUser(user) })
      .catch(() => {})
      .finally(() => setAuthReady(true))
  }, [])

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Login failed') }
    const { token, user } = await res.json()
    localStorage.setItem(TOKEN_KEY, token)
    setCurrentUser(user)
    return user
  }

  const register = async (email, username, flag, password) => {
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, username, flag, password }),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Registration failed') }
    const { token, user } = await res.json()
    localStorage.setItem(TOKEN_KEY, token)
    setCurrentUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setCurrentUser(null)
  }

  const getToken = () => localStorage.getItem(TOKEN_KEY)

  return (
    <AuthContext.Provider value={{ currentUser, authReady, login, register, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
