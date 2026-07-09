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

  const { email, password } = await parseBody(req)

  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' })

  const user = users.list.find(u => u.email === email.toLowerCase().trim())
  if (!user) return res.status(401).json({ error: 'Invalid email or password' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

  const { password: _, ...safe } = user
  const token = signToken({ userId: user.id, username: user.username, flag: user.flag })
  return res.status(200).json({ token, user: safe })
}
