const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
require('dotenv').config()

// Auth middleware
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// POST /api/ai/chat
// Body: { messages: [{role, content}], systemPrompt: string, model?: string }
router.post('/chat', auth, async (req, res) => {
  const { messages, systemPrompt, model } = req.body

  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages array is required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey)
    return res.status(503).json({ error: 'AI service not configured (missing ANTHROPIC_API_KEY)' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt || 'You are Mentor Nova, a helpful AI nutrition and fitness coach.',
        messages
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('Anthropic API error:', err)
      return res.status(response.status).json({ error: err.error?.message || 'AI service error' })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    res.json({ text, usage: data.usage })

  } catch (err) {
    console.error('AI chat proxy error:', err.message)
    res.status(500).json({ error: 'Failed to reach AI service' })
  }
})

module.exports = router
