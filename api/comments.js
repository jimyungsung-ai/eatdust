const store     = require('./_store')
const parseBody = require('./_parseBody')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { spotId } = req.query
    const result = spotId
      ? store.comments.filter(c => c.spotId === spotId)
      : store.comments
    return res.status(200).json(result)
  }

  if (req.method === 'POST') {
    const body = await parseBody(req)
    const comment = { ...body, id: String(++store._nextId) }
    store.comments.push(comment)
    return res.status(201).json(comment)
  }

  res.status(405).end()
}
