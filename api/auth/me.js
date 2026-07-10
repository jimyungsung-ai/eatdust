'use strict'
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

  // Return directly from JWT — works across server restarts / cold starts
  return res.status(200).json({
    id:       payload.userId,
    username: payload.username,
    flag:     payload.flag || '',
  })
}
