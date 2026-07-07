/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'

const { readFileSync } = require('fs')
const { join } = require('path')

if (!global.__store) {
  let db
  try {
    // In Vercel, process.cwd() is the project root (/var/task)
    db = JSON.parse(readFileSync(join(process.cwd(), 'db.json'), 'utf8'))
  } catch {
    db = { spots: [], votes: [], comments: [] }
  }
  global.__store = {
    spots:    JSON.parse(JSON.stringify(db.spots    || [])),
    votes:    JSON.parse(JSON.stringify(db.votes    || [])),
    comments: JSON.parse(JSON.stringify(db.comments || [])),
    _nextId:  20000,
  }
}

module.exports = global.__store
