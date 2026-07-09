'use strict'
const bcrypt     = require('bcryptjs')
const parseBody  = require('../_parseBody')
const users      = require('../_users')
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

  const { email, username, flag, password } = await parseBody(req)

  if (!email || !username || !password)
    return res.status(400).json({ error: 'email, username and password are required' })

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' })

  if (users.list.find(u => u.email === email.toLowerCase().trim()))
    return res.status(409).json({ error: 'Email already registered' })

  if (users.list.find(u => u.username.toLowerCase() === username.trim().toLowerCase()))
    return res.status(409).json({ error: 'Username already taken' })

  const hash = await bcrypt.hash(password, 10)
  const user = {
    id:        String(++users._nextId),
    email:     email.toLowerCase().trim(),
    username:  username.trim(),
    flag:      flag || '',
    password:  hash,
    createdAt: new Date().toISOString(),
  }
  users.list.push(user)

  const { password: _, ...safe } = user
  const token = signToken({ userId: user.id, username: user.username, flag: user.flag })
  return res.status(201).json({ token, user: safe })
}
