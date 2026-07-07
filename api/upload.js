'use strict'
const { put } = require('@vercel/blob')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-filename')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).end()

  try {
    const filename = (req.headers['x-filename'] || `photo-${Date.now()}.jpg`)
      .replace(/[^a-zA-Z0-9._-]/g, '-')

    const blob = await put(`eatdust/photos/${filename}`, req, {
      access: 'public',
      contentType: req.headers['content-type'] || 'image/jpeg',
    })

    return res.status(200).json({ url: blob.url })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: err.message })
  }
}
