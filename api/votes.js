const store     = require('./_store')
const parseBody = require('./_parseBody')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    return res.status(200).json(store.votes)
  }

  if (req.method === 'POST') {
    const body = await parseBody(req)
    const vote = { ...body, id: String(++store._nextId) }
    store.votes.push(vote)
    return res.status(201).json(vote)
  }

  res.status(405).end()
}
