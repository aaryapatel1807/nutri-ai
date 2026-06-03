const express = require('express')
const router = express.Router()
const axios = require('axios')
const { authMiddleware } = require('../middleware/auth.middleware')
const multer = require('multer')
const upload = multer()
const FormData = require('form-data')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
const GEMINI_MODEL = 'gemini-2.5-flash'

// Helper — call Gemini directly
async function callGemini(messages, systemPrompt) {
  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        systemInstruction: {
          parts: [{ text: systemPrompt || 'You are Mentor Nova, a helpful AI nutrition and fitness coach.' }]
        },
        generationConfig: { maxOutputTokens: 1024 }
      })
    }
  )

  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Gemini error')
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// POST /api/ml/chat — powered by Gemini
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history = [], user_data } = req.body

    if (!message) return res.status(400).json({ error: 'message is required' })
    if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    const messages = [
      ...history,
      { role: 'user', content: message }
    ]

    const systemPrompt = user_data
      ? `You are Mentor Nova, a helpful AI nutrition and fitness coach. User profile: ${JSON.stringify(user_data)}`
      : 'You are Mentor Nova, a helpful AI nutrition and fitness coach.'

    const text = await callGemini(messages, systemPrompt)
    res.json({ response: text, text })
  } catch (error) {
    console.error('Chat error:', error.message)
    res.status(500).json({ error: 'Chat failed' })
  }
})

// POST /api/ml/recipe-suggestions — powered by Gemini
router.post('/recipe-suggestions', authMiddleware, async (req, res) => {
  try {
    const { ingredients = [], dietary_preferences = [], meal_type = 'any' } = req.body
    if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    const prompt = `Suggest 3 recipes using these ingredients: ${ingredients.join(', ')}.
Dietary preferences: ${dietary_preferences.join(', ') || 'none'}.
Meal type: ${meal_type}.
Respond in JSON format: { "recipes": [{ "name": "", "ingredients": [], "instructions": "", "calories": 0 }] }`

    const text = await callGemini([{ role: 'user', content: prompt }])
    
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

// POST /api/ml/nutrition-forecast — powered by Gemini
router.post('/nutrition-forecast', authMiddleware, async (req, res) => {
  try {
    const { user_data, historical_data } = req.body
    if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    const prompt = `Based on this user data: ${JSON.stringify(user_data)} and historical nutrition data: ${JSON.stringify(historical_data)},
provide a 7-day nutrition forecast and recommendations.
Respond in JSON: { "forecast": [], "recommendations": [] }`

    const text = await callGemini([{ role: 'user', content: prompt }])
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

// POST /api/ml/detect-food — still requires ML service (image detection)
router.post('/detect-food', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' })
    if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    // Convert image to base64 and send to Gemini Vision
    const base64Image = req.file.buffer.toString('base64')
    const mimeType = req.file.mimetype

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
