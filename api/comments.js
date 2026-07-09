'use strict'
const store     = require('./_store')
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

  if (req.method === 'GET') {
    const { spotId } = req.query
    const result = spotId
      ? store.comments.filter(c => c.spotId === spotId)
      : store.comments
    return res.status(200).json(result)
  }

  if (req.method === 'POST') {
    const payload = requireAuth(req)
    if (!payload) return res.status(401).json({ error: 'Login required' })

    const body = await parseBody(req)
    const comment = {
      ...body,
      id:       String(++store._nextId),
      username: payload.username,
      flag:     payload.flag || '',
    }
    store.comments.push(comment)
    return res.status(201).json(comment)
  }

  res.status(405).end()
}
