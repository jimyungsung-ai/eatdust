'use strict'
/*
 * Persistent spots/votes/comments store backed by Vercel Blob.
 * Mirrors _users.js. In-memory stores reset on cold starts, which wiped
 * user-submitted spots, votes and comments. We persist one JSON blob.
 *
 * Note: this uses a load-modify-save pattern with no locking. Fine for a
 * low-traffic community app; heavy concurrent writes could race.
 */
const { readFileSync } = require('fs')
const { join }         = require('path')
const { put, list }    = require('@vercel/blob')

const BLOB_KEY = 'eatdust/store.json'

// Seed data shipped with the app (used only when the blob doesn't exist yet).
function seedFromDisk() {
  try {
    const db = JSON.parse(readFileSync(join(process.cwd(), 'db.json'), 'utf8'))
    return {
      spots:    db.spots    || [],
      votes:    db.votes    || [],
      comments: db.comments || [],
      _nextId:  20000,
    }
  } catch {
    return { spots: [], votes: [], comments: [], _nextId: 20000 }
  }
}

async function saveStore(store) {
  await put(BLOB_KEY, JSON.stringify(store), {
    access:            'public',
    contentType:       'application/json',
    addRandomSuffix:   false,
    allowOverwrite:    true,
    cacheControlMaxAge: 0,
  })
}

async function loadStore() {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY })
    const match = blobs.find(b => b.pathname === BLOB_KEY)
    if (!match) {
      // First ever run — seed from db.json and persist it.
      const seeded = seedFromDisk()
      await saveStore(seeded)
      return seeded
    }
    const res = await fetch(`${match.url}?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return seedFromDisk()
    const data = await res.json()
    return {
      spots:    Array.isArray(data.spots)    ? data.spots    : [],
      votes:    Array.isArray(data.votes)    ? data.votes    : [],
      comments: Array.isArray(data.comments) ? data.comments : [],
      _nextId:  data._nextId || 20000,
    }
  } catch (err) {
    console.error('loadStore error:', err)
    return seedFromDisk()
  }
}

module.exports = { loadStore, saveStore }
