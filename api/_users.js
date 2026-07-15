'use strict'
/*
 * Persistent users store backed by Vercel Blob.
 * In-memory stores reset on every serverless cold start, which made
 * returning users look brand-new. We persist a single JSON blob instead.
 */
const { put, list } = require('@vercel/blob')

const BLOB_KEY = 'eatdust/users.json'
const EMPTY    = { list: [], _nextId: 50000 }

// Read the current users blob. Always fetches fresh (cache-busted) so a
// user created by another serverless instance is visible immediately.
async function loadUsers() {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY })
    const match = blobs.find(b => b.pathname === BLOB_KEY)
    if (!match) return { ...EMPTY }
    const res = await fetch(`${match.url}?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return { ...EMPTY }
    const data = await res.json()
    return {
      list:    Array.isArray(data.list) ? data.list : [],
      _nextId: data._nextId || 50000,
    }
  } catch (err) {
    console.error('loadUsers error:', err)
    return { ...EMPTY }
  }
}

// Overwrite the users blob with the given store.
async function saveUsers(store) {
  await put(BLOB_KEY, JSON.stringify(store), {
    access:            'public',
    contentType:       'application/json',
    addRandomSuffix:   false,
    allowOverwrite:    true,
    cacheControlMaxAge: 0,
  })
}

module.exports = { loadUsers, saveUsers }
