const express = require('express')
const router = express.Router()
const { authMiddleware, userRateLimitMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')
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

// ---------------------------------------------------------------------------
// AI abuse protection (serverless-safe).
//
// 1) aiBurst: per-user burst cap via express-rate-limit (in-memory —
//    best-effort on Vercel cold starts, still blunts scripted bursts on warm
//    instances). Mount AFTER authMiddleware so req.userId is set.
// 2) aiDailyQuota: hard per-user daily cap enforced in Postgres, so open
//    registration can't burn the whole Groq free-tier quota (1K req/day).
// ---------------------------------------------------------------------------
const aiBurst = userRateLimitMiddleware(30, 60 * 1000) // 30 AI calls / minute / user
const AI_DAILY_CAP = Number(process.env.AI_DAILY_CAP || 100) // AI calls / day / user

async function aiDailyQuota(req, res, next) {
  try {
    const day = new Date()
    day.setUTCHours(0, 0, 0, 0)
    const where = { userId_date: { userId: req.userId, date: day } }
    const usage = await prisma.aiUsage.findUnique({ where })
    if (usage && usage.count >= AI_DAILY_CAP) {
      return res.status(429).json({
        error: 'Daily AI limit reached — please try again tomorrow',
        retryAfter: 86400,
      })
    }
    await prisma.aiUsage.upsert({
      where,
      update: { count: { increment: 1 } },
      create: { userId: req.userId, date: day, count: 1 },
    })
    next()
  } catch (err) {
    // Quota check must never break the feature — fail open on DB errors,
    // the burst limiter above still applies.
    console.error('AI quota check failed:', err.message)
    next()
  }
}

// ---------------------------------------------------------------------------
// Coach personas — the system prompts live SERVER-SIDE. The frontend sends
// only a persona id; any client-supplied systemPrompt is ignored, so a
// tampered client can't rewrite the model's instructions (prompt injection
// via user_data.systemPrompt was previously possible).
// ---------------------------------------------------------------------------
const COACH_SYSTEM_PROMPTS = {
  nutrition: `You are NutriBot, an elite AI nutrition coach for NutriAI fitness app.
You are an expert in:
- Personalized nutrition planning and macro calculations
- Indian and international food database with calories
- Meal timing, nutrient timing around workouts
- Weight loss, muscle gain, and maintenance diets
- Micronutrients, vitamins, minerals
- Food allergies and dietary restrictions
- Supplement recommendations
- Gut health and digestion

User context: Fitness-focused individual using NutriAI app.
Always give specific, actionable advice with exact numbers.
Format responses with emojis, bullet points, and clear sections.
Keep responses concise but highly informative.
When calculating macros, always show your math.
Suggest specific Indian foods when relevant.`,
  workout: `You are FitCoach, an elite AI personal trainer for NutriAI fitness app.
You are an expert in:
- Strength training, hypertrophy, powerlifting
- Calisthenics and bodyweight training
- HIIT, cardio, and athletic performance
- Exercise form, technique, and injury prevention
- Progressive overload and periodization
- Recovery, rest days, and deload weeks
- Home workouts with minimal equipment
- Sport-specific training
- Warm-up and cool-down protocols

Always provide:
- Specific sets, reps, rest times
- Form cues and common mistakes to avoid
- Progression schemes
- Alternative exercises
Format with clear structure and emojis.`,
  health: `You are WellnessAI, an elite health and wellness coach for NutriAI.
You are an expert in:
- Sleep optimization and circadian rhythm
- Stress management and cortisol control
- Recovery protocols and HRV
- Hormonal health and optimization
- Mental health and fitness connection
- Injury prevention and mobility
- Longevity and anti-aging strategies
- Blood work interpretation basics
- Gut microbiome and digestion
- Breathing techniques and mindfulness

Always provide evidence-based advice.
Mention when to consult a doctor for medical issues.
Give practical, implementable daily habits.
Use NutriAI context and frame advice for fitness-focused users.`,
  transformation: `You are TransformAI, an elite body transformation coach for NutriAI.
You are an expert in:
- Body recomposition (lose fat + gain muscle simultaneously)
- Cutting phases with muscle preservation
- Bulking phases with minimal fat gain
- Calorie cycling and carb cycling
- Contest prep and peak week protocols
- Body fat measurement and tracking
- Before/after transformation planning
- Realistic timeline setting
- Habit formation and consistency
- Mindset and motivation strategies

Be direct, motivating, and data-driven.
Always set realistic expectations with timelines.
Provide specific protocols not generic advice.
Use success stories and examples to motivate.`,
}
const DEFAULT_PERSONA = 'nutrition'

// Input caps — a single request must not be able to burn unbounded tokens.
const MAX_MESSAGE_LEN = 4000
const MAX_HISTORY_ITEMS = 20
const MAX_HISTORY_ITEM_LEN = 4000

// Sanitize client history: keep role/content only, coerce roles, cap lengths.
// (History can still contain client-invented "assistant" turns — inherent to
// multi-turn chat; caps + server-side system prompt bound the abuse.)
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return []
  return history.slice(-MAX_HISTORY_ITEMS).map((m) => ({
    role: m && m.role === 'assistant' ? 'assistant' : 'user',
    content: String((m && m.content) || '').slice(0, MAX_HISTORY_ITEM_LEN),
  }))
}

// Shape user_data server-side: build a small profile snapshot from the DB
// instead of interpolating raw client JSON into the system prompt.
async function buildProfileContext(userId) {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true, fitnessGoal: true, dietType: true, activityLevel: true,
        height: true, weight: true, targetWeight: true,
        calorieGoal: true, proteinGoal: true, carbGoal: true, fatGoal: true,
      },
    })
    if (!u) return ''
    const bits = []
    if (u.name) bits.push(`name: ${u.name}`)
    for (const k of ['fitnessGoal', 'dietType', 'activityLevel']) {
      if (u[k]) bits.push(`${k}: ${u[k]}`)
    }
    for (const k of ['height', 'weight', 'targetWeight', 'calorieGoal', 'proteinGoal', 'carbGoal', 'fatGoal']) {
      if (Number.isFinite(u[k])) bits.push(`${k}: ${u[k]}`)
    }
    return bits.length ? `\n\nUser profile: ${bits.join(', ')}.` : ''
  } catch {
    return ''
  }
}

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
  if (!response.ok) {
    // Surface the upstream status so callers can map 429 → 429 instead of a
    // generic 500 (testing 2026-10-03: Groq quota surfaced as "Chat failed").
    const err = new Error(data.error?.message || 'Groq error')
    err.status = response.status
    throw err
  }
  return data.choices?.[0]?.message?.content || ''
}

// Map AI failures to the right status: a 429 from the provider (or our own
// quota middleware) becomes a friendly 429 for the client, not a 500.
function aiErrorResponse(res, error, fallbackMessage) {
  if (error && error.status === 429) {
    return res.status(429).json({
      error: 'AI service is busy — please wait a moment and try again',
      retryAfter: 60,
    })
  }
  console.error(`${fallbackMessage}:`, error && error.message)
  return res.status(500).json({ error: fallbackMessage })
}

// POST /api/ml/chat — powered by Groq
router.post('/chat', authMiddleware, aiBurst, aiDailyQuota, async (req, res) => {
  try {
    const { message, history = [], user_data } = req.body

    if (!message || typeof message !== 'string')
      return res.status(400).json({ error: 'message is required' })
    if (message.length > MAX_MESSAGE_LEN)
      return res.status(400).json({ error: `message is too long (max ${MAX_MESSAGE_LEN} characters)` })
    if (!GROQ_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    // Persona id is validated against the server-side allowlist; any
    // client-supplied systemPrompt inside user_data is ignored.
    const personaId =
      user_data && typeof user_data.persona === 'string' && COACH_SYSTEM_PROMPTS[user_data.persona]
        ? user_data.persona
        : DEFAULT_PERSONA

    const messages = [
      ...sanitizeHistory(history),
      { role: 'user', content: message.slice(0, MAX_MESSAGE_LEN) },
    ]

    const profileCtx = await buildProfileContext(req.userId)
    const systemPrompt = COACH_SYSTEM_PROMPTS[personaId] + profileCtx

    const text = await callGroq(messages, systemPrompt)
    res.json({ response: text, text })
  } catch (error) {
    aiErrorResponse(res, error, 'Chat failed')
  }
})

// POST /api/ml/recipe-suggestions — powered by Groq
router.post('/recipe-suggestions', authMiddleware, aiBurst, aiDailyQuota, async (req, res) => {
  try {
    const { ingredients = [], dietary_preferences = [], meal_type = 'any' } = req.body
    if (!GROQ_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    // Cap array sizes and string lengths — this whole prompt goes to the LLM
    const cleanList = (arr) =>
      Array.isArray(arr) ? arr.slice(0, 30).map((s) => String(s).slice(0, 100)) : []
    const ing = cleanList(ingredients)
    const prefs = cleanList(dietary_preferences)
    const mealType = ['any', 'breakfast', 'lunch', 'dinner', 'snack'].includes(meal_type) ? meal_type : 'any'

    const prompt = `Suggest 3 recipes using these ingredients: ${ing.join(', ')}.
Dietary preferences: ${prefs.join(', ') || 'none'}.
Meal type: ${mealType}.
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
    aiErrorResponse(res, error, 'Recipe suggestions failed')
  }
})

// POST /api/ml/nutrition-forecast — powered by Groq
router.post('/nutrition-forecast', authMiddleware, aiBurst, aiDailyQuota, async (req, res) => {
  try {
    const { historical_data } = req.body
    if (!GROQ_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    // Ignore client-supplied user_data — build the profile context from the
    // DB (see /chat). Cap the historical payload size.
    const profileCtx = await buildProfileContext(req.userId)
    const hist = Array.isArray(historical_data) ? historical_data.slice(0, 60) : []
    const histJson = JSON.stringify(hist).slice(0, 8000)

    const prompt = `Based on this user data:${profileCtx || ' (no profile on file)'} and historical nutrition data: ${histJson},
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
    aiErrorResponse(res, error, 'Nutrition forecast failed')
  }
})

// Validate image by magic bytes, not by the client-supplied mimetype.
// (Testing 2026-10-03: a fake .exe labelled image/jpeg reached Gemini and
// 500'd; an SVG with an embedded <script> was accepted. Both are now 400.)
function isImageBuffer(buf) {
  if (!buf || buf.length < 12) return false
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true // JPEG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true // PNG
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return true // WebP
  const gif = buf.toString('ascii', 0, 6)
  if (gif === 'GIF87a' || gif === 'GIF89a') return true // GIF
  // HEIC/HEIF: ftyp box at offset 4 (iPhone photos)
  if (buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12)
    if (['heic','heix','hevc','hevx','heim','heis','hevm','hevs','mif1','msf1'].includes(brand)) return true
  }
  return false
}

// POST /api/ml/detect-food — stays on Gemini Vision (Groq's free tier has no vision-capable model)
router.post('/detect-food', authMiddleware, aiBurst, aiDailyQuota, uploadSingle, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' })
    if (!isImageBuffer(req.file.buffer))
      return res.status(400).json({ error: 'Only image files (JPEG, PNG, WebP, GIF, HEIC) are accepted' })
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
    if (!response.ok) {
      const err = new Error(data.error?.message || 'Gemini vision error')
      err.status = response.status
      throw err
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    try {
      res.json(JSON.parse(clean))
    } catch {
      res.json({ foods: [], total_calories: 0, raw: text })
    }
  } catch (error) {
    aiErrorResponse(res, error, 'Food detection failed')
  }
})

module.exports = router
