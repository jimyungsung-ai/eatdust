// Shared in-memory store — seeded from db.json at cold start.
// Data persists within a single serverless container lifetime.
// On Vercel cold starts, data resets to the seeded values.
const db = require('../db.json')

if (!global.__store) {
  global.__store = {
    spots:    JSON.parse(JSON.stringify(db.spots)),
    votes:    JSON.parse(JSON.stringify(db.votes    || [])),
    comments: JSON.parse(JSON.stringify(db.comments || [])),
    _nextId:  20000,
  }
}

module.exports = global.__store
