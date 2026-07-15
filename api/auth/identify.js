'use strict'
const bcrypt                     = require('bcryptjs')
const parseBody                  = require('../_parseBody')
const { loadUsers, saveUsers }   = require('../_users')
const { signToken }              = require('../_auth')

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).end()

  const { email, password, username, flag } = await parseBody(req)

  if (!email || !email.includes('@'))
    return res.status(400).json({ error: 'A valid email is required' })
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' })

  const normalEmail = email.toLowerCase().trim()
  const users       = await loadUsers()
  let   user        = users.list.find(u => u.email === normalEmail)

  if (user) {
    // ── Returning user — verify password ──
    // Legacy accounts created before passwords existed have no hash;
    // set the password they type now as their password.
    if (!user.passwordHash) {
      user.passwordHash = await bcrypt.hash(password, 10)
      await saveUsers(users)
    } else {
      const ok = await bcrypt.compare(password, user.passwordHash)
      if (!ok) return res.status(401).json({ error: 'Wrong password' })
    }
  } else {
    // ── New user — create account ──
    const base = (username || '').trim() || `foodie_${Math.floor(Math.random() * 9000 + 1000)}`
    let finalName = base
    let suffix    = 2
    while (users.list.find(u => u.username.toLowerCase() === finalName.toLowerCase())) {
      finalName = `${base}${suffix++}`
    }
    user = {
      id:           String(++users._nextId),
      email:        normalEmail,
      username:     finalName,
      flag:         flag || '',
      passwordHash: await bcrypt.hash(password, 10),
      createdAt:    new Date().toISOString(),
    }
    users.list.push(user)
    await saveUsers(users)
  }

  const token = signToken({ userId: user.id, username: user.username, flag: user.flag })
  return res.status(200).json({
    token,
    user: { id: user.id, email: user.email, username: user.username, flag: user.flag },
  })
}
