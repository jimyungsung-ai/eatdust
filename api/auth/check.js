'use strict'
const parseBody       = require('../_parseBody')
const { loadUsers }   = require('../_users')

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).end()

  const { email } = await parseBody(req)
  if (!email) return res.status(400).json({ error: 'email required' })

  const users  = await loadUsers()
  const exists = !!users.list.find(u => u.email === email.toLowerCase().trim())
  return res.status(200).json({ exists })
}
