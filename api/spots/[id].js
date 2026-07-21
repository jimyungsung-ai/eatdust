const { loadStore, saveStore } = require('../_store')
const parseBody = require('../_parseBody')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const store = await loadStore()
  const { id } = req.query
  const idx = store.spots.findIndex(s => s.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  if (req.method === 'GET')    return res.status(200).json(store.spots[idx])

  if (req.method === 'PATCH') {
    const body = await parseBody(req)
    store.spots[idx] = { ...store.spots[idx], ...body }
    await saveStore(store)
    return res.status(200).json(store.spots[idx])
  }

  if (req.method === 'DELETE') {
    store.spots.splice(idx, 1)
    await saveStore(store)
    return res.status(200).json({ deleted: true })
  }

  res.status(405).end()
}
