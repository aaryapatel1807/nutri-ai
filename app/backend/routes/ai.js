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

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey)
    return res.status(503).json({ error: 'AI service not configured (missing GEMINI_API_KEY)' })

  try {
    // Map messages format from standard to Gemini API format
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    // Determine target model
    const targetModel = model && model.startsWith('gemini') ? model : 'gemini-2.5-flash'

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: geminiMessages,
        systemInstruction: {
          parts: [{ text: systemPrompt || 'You are Mentor Nova, a helpful AI nutrition and fitness coach.' }]
        },
        generationConfig: {
          maxOutputTokens: 1024
        }
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('Gemini API error:', err)
      return res.status(response.status).json({ error: err.error?.message || 'AI service error' })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Map usage Metadata to match the front-end expectations
    const usage = data.usageMetadata ? {
      input_tokens: data.usageMetadata.promptTokenCount,
      output_tokens: data.usageMetadata.candidatesTokenCount
    } : undefined

    res.json({ text, usage })

  } catch (err) {
    console.error('AI chat proxy error:', err.message)
    res.status(500).json({ error: 'Failed to reach AI service' })
  }
})

module.exports = router
