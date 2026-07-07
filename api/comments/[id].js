const store     = require('../_store')
const parseBody = require('../_parseBody')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query
  const idx = store.comments.findIndex(c => c.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  if (req.method === 'GET') {
    return res.status(200).json(store.comments[idx])
  }

  if (req.method === 'PATCH') {
    const body = await parseBody(req)
    store.comments[idx] = { ...store.comments[idx], ...body }
    return res.status(200).json(store.comments[idx])
  }

  res.status(405).end()
}
