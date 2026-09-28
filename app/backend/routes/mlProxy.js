const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const multer = require('multer')
// Cap uploads at 5MB — default multer buffers the whole file in memory (OOM risk on serverless)
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } })

// Multer errors skip the route handler, so translate them here
const uploadSingle = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(413).json({ error: 'Image too large (max 5MB)' })
      return res.status(400).json({ error: 'Image upload failed' })
    }
    next()
  })
}

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b' // Groq free tier (30 RPM / 1K req/day)
// Gemini is kept ONLY for food-photo vision — Groq's free tier currently has no vision-capable model
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.5-flash'

// Helper — call Groq (OpenAI-compatible API)
async function callGroq(messages, systemPrompt, jsonMode = false) {
  const groqMessages = [
    { role: 'system', content: systemPrompt || 'You are Mentor Nova, a helpful AI nutrition and fitness coach.' },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))
  ]

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        max_tokens: 2048,
        temperature: 0.7,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
      })
    }
  )

  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Groq error')
  return data.choices?.[0]?.message?.content || ''
}

// POST /api/ml/chat — powered by Groq
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history = [], user_data } = req.body

    if (!message) return res.status(400).json({ error: 'message is required' })
    if (!GROQ_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    const messages = [
      ...history,
      { role: 'user', content: message }
    ]

    const systemPrompt = user_data
      ? `You are Mentor Nova, a helpful AI nutrition and fitness coach. User profile: ${JSON.stringify(user_data)}`
      : 'You are Mentor Nova, a helpful AI nutrition and fitness coach.'

    const text = await callGroq(messages, systemPrompt)
    res.json({ response: text, text })
  } catch (error) {
    console.error('Chat error:', error.message)
    res.status(500).json({ error: 'Chat failed' })
  }
})

// POST /api/ml/recipe-suggestions — powered by Groq
router.post('/recipe-suggestions', authMiddleware, async (req, res) => {
  try {
    const { ingredients = [], dietary_preferences = [], meal_type = 'any' } = req.body
    if (!GROQ_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    const prompt = `Suggest 3 recipes using these ingredients: ${ingredients.join(', ')}.
Dietary preferences: ${dietary_preferences.join(', ') || 'none'}.
Meal type: ${meal_type}.
Respond in JSON format: { "recipes": [{ "name": "", "ingredients": [], "instructions": "", "calories": 0 }] }`

    const text = await callGroq([{ role: 'user', content: prompt }], undefined, true)
    
    // Try to parse JSON from response
    const clean = text.replace(/```json|```/g, '').trim()
    try {
      res.json(JSON.parse(clean))
    } catch {
      res.json({ recipes: [], raw: text })
    }
  } catch (error) {
    console.error('Recipe suggestions error:', error.message)
    res.status(500).json({ error: 'Recipe suggestions failed' })
  }
})

// POST /api/ml/nutrition-forecast — powered by Groq
router.post('/nutrition-forecast', authMiddleware, async (req, res) => {
  try {
    const { user_data, historical_data } = req.body
    if (!GROQ_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    const prompt = `Based on this user data: ${JSON.stringify(user_data)} and historical nutrition data: ${JSON.stringify(historical_data)},
provide a 7-day nutrition forecast and recommendations.
Respond in JSON: { "forecast": [], "recommendations": [] }`

    const text = await callGroq([{ role: 'user', content: prompt }], undefined, true)
    const clean = text.replace(/```json|```/g, '').trim()
    try {
      res.json(JSON.parse(clean))
    } catch {
      res.json({ forecast: [], recommendations: [], raw: text })
    }
  } catch (error) {
    console.error('Nutrition forecast error:', error.message)
    res.status(500).json({ error: 'Nutrition forecast failed' })
  }
})

// POST /api/ml/detect-food — stays on Gemini Vision (Groq's free tier has no vision-capable model)
router.post('/detect-food', authMiddleware, uploadSingle, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' })
    if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    // Convert image to base64 and send to Gemini Vision
    const base64Image = req.file.buffer.toString('base64')
    const mimeType = req.file.mimetype

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: 'Identify the food items in this image and estimate calories. Respond in JSON: { "foods": [{ "name": "", "calories": 0, "confidence": 0.0 }], "total_calories": 0 }' }
            ]
          }]
        })
      }
    )

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Gemini vision error')
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    try {
      res.json(JSON.parse(clean))
    } catch {
      res.json({ foods: [], total_calories: 0, raw: text })
    }
  } catch (error) {
    console.error('Food detection error:', error.message)
    res.status(500).json({ error: 'Food detection failed' })
  }
})

module.exports = router
