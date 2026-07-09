'use strict'
const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'eatdust-dev-secret-changeme'

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' })
}

function verifyToken(token) {
  try { return jwt.verify(token, SECRET) } catch { return null }
}

function requireAuth(req) {
  const header = req.headers['authorization'] || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  return verifyToken(token)
}

module.exports = { signToken, requireAuth }
