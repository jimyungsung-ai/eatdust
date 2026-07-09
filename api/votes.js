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

  if (req.method === 'GET') return res.status(200).json(store.votes)

  if (req.method === 'POST') {
    const payload = requireAuth(req)
    if (!payload) return res.status(401).json({ error: 'Login required' })

    const body = await parseBody(req)
    const { spotId, type } = body

    // Prevent double voting
    const existing = store.votes.find(v => v.spotId === spotId && v.userId === payload.userId)
    if (existing) return res.status(409).json({ error: 'You already voted on this spot' })

    const vote = {
      ...body,
      id:     String(++store._nextId),
      userId: payload.userId,
      flag:   payload.flag || '',
    }
    store.votes.push(vote)
    return res.status(201).json(vote)
  }

  res.status(405).end()
}
