'use strict'
const users = require('../_users')
const { requireAuth } = require('../_auth')

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')    return res.status(405).end()

  const payload = requireAuth(req)
  if (!payload) return res.status(401).json({ error: 'Unauthorized' })

  const user = users.list.find(u => u.id === payload.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const { password: _, ...safe } = user
  return res.status(200).json(safe)
}
