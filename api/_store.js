const { readFileSync } = require('fs')
const { join } = require('path')

if (!global.__store) {
  const db = JSON.parse(readFileSync(join(__dirname, '../db.json'), 'utf8'))
  global.__store = {
    spots:    JSON.parse(JSON.stringify(db.spots)),
    votes:    JSON.parse(JSON.stringify(db.votes    || [])),
    comments: JSON.parse(JSON.stringify(db.comments || [])),
    _nextId:  20000,
  }
}

module.exports = global.__store
