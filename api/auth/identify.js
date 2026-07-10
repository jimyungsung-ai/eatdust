'use strict'
const parseBody     = require('../_parseBody')
const users         = require('../_users')
const { signToken } = require('../_auth')

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).end()

  const { email, username, flag } = await parseBody(req)

  if (!email || !email.includes('@'))
    return res.status(400).json({ error: 'A valid email is required' })

  const normalEmail = email.toLowerCase().trim()

  // Returning user — just log them in
  let user = users.list.find(u => u.email === normalEmail)

  if (!user) {
    // New user — create on the spot
    const name = (username || '').trim() || `foodie_${Math.floor(Math.random() * 9000 + 1000)}`
    // Make username unique if taken
    let finalName = name
    let suffix    = 2
    while (users.list.find(u => u.username.toLowerCase() === finalName.toLowerCase())) {
      finalName = `${name}${suffix++}`
    }
    user = {
      id:        String(++users._nextId),
      email:     normalEmail,
      username:  finalName,
      flag:      flag || '',
      createdAt: new Date().toISOString(),
    }
    users.list.push(user)
  }

  const token = signToken({ userId: user.id, username: user.username, flag: user.flag })
  return res.status(200).json({ token, user })
}
