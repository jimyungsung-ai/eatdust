'use strict'
const { loadStore, saveStore } = require('./_store')
const parseBody = require('./_parseBody')
const { requireAuth } = require('./_auth')

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  const store = await loadStore()

  if (req.method === 'GET') return res.status(200).json(store.spots)

  if (req.method === 'POST') {
    const payload = requireAuth(req)
    if (!payload) return res.status(401).json({ error: 'Login required' })

    const body = await parseBody(req)
    const spot = {
      ...body,
      id:                 String(++store._nextId),
      discovererUsername: payload.username,
      discovererFlag:     payload.flag || '',
    }
    store.spots.push(spot)

    // Auto-post "Discovered by" comment server-side
    store.comments.push({
      id:        String(++store._nextId),
      spotId:    spot.id,
      username:  'Eat Dust',
      flag:      '🇻🇳',
      text:      `Discovered by ${payload.username}${payload.flag ? ' ' + payload.flag : ''}`,
      likes:     0,
      createdAt: new Date().toISOString(),
    })

    await saveStore(store)
    return res.status(201).json(spot)
  }

  res.status(405).end()
}
