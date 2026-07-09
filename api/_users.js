'use strict'

if (!global.__users) {
  global.__users = { list: [], _nextId: 50000 }
}

module.exports = global.__users
