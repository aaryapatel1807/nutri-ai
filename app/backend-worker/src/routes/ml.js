// ─── AI proxy routes (Hono) ─────────────────────────────────────────────────
// Port of app/backend/routes/mlProxy.js.
//
// Differences from the Express version:
//   - Uploads: Workers have no multer — the image comes from
//     `c.req.parseBody()` as a File; size-capped at 5MB, magic-byte validated.
//   - Rate limits: per-isolate sliding windows (same shape as before).
//   - Everything else (personas, quotas, sanitisation, error mapping) is 1:1.

import { Hono } from 'hono'
import { authMiddleware, userRateLimit } from '../middleware/auth.js'

const app = new Hono()
const auth = authMiddleware()

const GEMINI_MODEL = 'gemini-2.5-flash'

const aiBurst = () => userRateLimit(30, 60 * 1000) // 30 AI calls / minute / user

async function aiDailyQuota(c, next) {
  const prisma = c.get('prisma')
  const env = c.env
  const AI_DAILY_CAP = Number(env.AI_DAILY_CAP || 100)
  try {
    const day = new Date()
    day.setUTCHours(0, 0, 0, 0)
    const where = { userId_date: { userId: c.get('userId'), date: day } }
    const usage = await prisma.aiUsage.findUnique({ where })
    if (usage && usage.count >= AI_DAILY_CAP) {
      return c.json(
        { error: 'Daily AI limit reached — please try again tomorrow', retryAfter: 86400 },
        429
      )
    }
    await prisma.aiUsage.upsert({
      where,
      update: { count: { increment: 1 } },
      create: { userId: c.get('userId'), date: day, count: 1 },
    })
    await next()
  } catch (err) {
    console.error('AI quota check failed:', err.message)
    await next()
  }
}

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

const MAX_MESSAGE_LEN = 4000
const MAX_HISTORY_ITEMS = 20
const MAX_HISTORY_ITEM_LEN = 4000

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return []
  return history.slice(-MAX_HISTORY_ITEMS).map((m) => ({
    role: m && m.role === 'assistant' ? 'assistant' : 'user',
    content: String((m && m.content) || '').slice(0, MAX_HISTORY_ITEM_LEN),
  }))
}

async function buildProfileContext(prisma, userId) {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        fitnessGoal: true,
        dietType: true,
        activityLevel: true,
        height: true,
        weight: true,
        targetWeight: true,
        calorieGoal: true,
        proteinGoal: true,
        carbGoal: true,
        fatGoal: true,
      },
    })
    if (!u) return ''
    const bits = []
    if (u.name) bits.push(`name: ${u.name}`)
    for (const k of ['fitnessGoal', 'dietType', 'activityLevel']) {
      if (u[k]) bits.push(`${k}: ${u[k]}`)
    }
    for (const k of [
      'height',
      'weight',
      'targetWeight',
      'calorieGoal',
      'proteinGoal',
      'carbGoal',
      'fatGoal',
    ]) {
      if (Number.isFinite(u[k])) bits.push(`${k}: ${u[k]}`)
    }
    return bits.length ? `\n\nUser profile: ${bits.join(', ')}.` : ''
  } catch {
    return ''
  }
}

async function callGroq(env, messages, systemPrompt, jsonMode = false) {
  const groqMessages = [
    {
      role: 'system',
      content: systemPrompt || 'You are Mentor Nova, a helpful AI nutrition and fitness coach.',
    },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ]
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: groqMessages,
      max_tokens: 2048,
      temperature: 0.7,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  const data = await response.json()
  if (!response.ok) {
    const err = new Error(data.error?.message || 'Groq error')
    err.status = response.status
    throw err
  }
  return data.choices?.[0]?.message?.content || ''
}

function aiErrorResponse(c, error, fallbackMessage) {
  if (error && error.status === 429) {
    return c.json(
      { error: 'AI service is busy — please wait a moment and try again', retryAfter: 60 },
      429
    )
  }
  console.error(`${fallbackMessage}:`, error && error.message)
  return c.json({ error: fallbackMessage }, 500)
}

// POST /api/ml/chat
app.post('/chat', auth, aiBurst(), aiDailyQuota, async (c) => {
  try {
    const env = c.env
    const { message, history = [], user_data } = await c.req.json()

    if (!message || typeof message !== 'string')
      return c.json({ error: 'message is required' }, 400)
    if (message.length > MAX_MESSAGE_LEN)
      return c.json({ error: `message is too long (max ${MAX_MESSAGE_LEN} characters)` }, 400)
    if (!env.GROQ_API_KEY) return c.json({ error: 'AI service not configured' }, 503)

    const personaId =
      user_data && typeof user_data.persona === 'string' && COACH_SYSTEM_PROMPTS[user_data.persona]
        ? user_data.persona
        : DEFAULT_PERSONA

    const messages = [
      ...sanitizeHistory(history),
      { role: 'user', content: message.slice(0, MAX_MESSAGE_LEN) },
    ]
    const profileCtx = await buildProfileContext(c.get('prisma'), c.get('userId'))
    const text = await callGroq(env, messages, COACH_SYSTEM_PROMPTS[personaId] + profileCtx)
    return c.json({ response: text, text })
  } catch (error) {
    return aiErrorResponse(c, error, 'Chat failed')
  }
})

// POST /api/ml/recipe-suggestions
app.post('/recipe-suggestions', auth, aiBurst(), aiDailyQuota, async (c) => {
  try {
    const env = c.env
    const { ingredients = [], dietary_preferences = [], meal_type = 'any' } = await c.req.json()
    if (!env.GROQ_API_KEY) return c.json({ error: 'AI service not configured' }, 503)

    const cleanList = (arr) =>
      Array.isArray(arr) ? arr.slice(0, 30).map((s) => String(s).slice(0, 100)) : []
    const ing = cleanList(ingredients)
    const prefs = cleanList(dietary_preferences)
    const mealType = ['any', 'breakfast', 'lunch', 'dinner', 'snack'].includes(meal_type)
      ? meal_type
      : 'any'

    const prompt = `Suggest 3 recipes using these ingredients: ${ing.join(', ')}.
Dietary preferences: ${prefs.join(', ') || 'none'}.
Meal type: ${mealType}.
Respond in JSON format: { "recipes": [{ "name": "", "ingredients": [], "instructions": "", "calories": 0 }] }`

    const text = await callGroq(env, [{ role: 'user', content: prompt }], undefined, true)
    const clean = text.replace(/```json|```/g, '').trim()
    try {
      return c.json(JSON.parse(clean))
    } catch {
      return c.json({ recipes: [], raw: text })
    }
  } catch (error) {
    return aiErrorResponse(c, error, 'Recipe suggestions failed')
  }
})

// POST /api/ml/nutrition-forecast
app.post('/nutrition-forecast', auth, aiBurst(), aiDailyQuota, async (c) => {
  try {
    const env = c.env
    const { historical_data } = await c.req.json()
    if (!env.GROQ_API_KEY) return c.json({ error: 'AI service not configured' }, 503)

    const profileCtx = await buildProfileContext(c.get('prisma'), c.get('userId'))
    const hist = Array.isArray(historical_data) ? historical_data.slice(0, 60) : []
    const histJson = JSON.stringify(hist).slice(0, 8000)

    const prompt = `Based on this user data:${profileCtx || ' (no profile on file)'} and historical nutrition data: ${histJson},
provide a 7-day nutrition forecast and recommendations.
Respond in JSON: { "forecast": [], "recommendations": [] }`

    const text = await callGroq(env, [{ role: 'user', content: prompt }], undefined, true)
    const clean = text.replace(/```json|```/g, '').trim()
    try {
      return c.json(JSON.parse(clean))
    } catch {
      return c.json({ forecast: [], recommendations: [], raw: text })
    }
  } catch (error) {
    return aiErrorResponse(c, error, 'Nutrition forecast failed')
  }
})

// Validate image by magic bytes (not the client-supplied mimetype).
function isImageBuffer(bytes) {
  if (!bytes || bytes.length < 12) return false
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true // JPEG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true // PNG
  const td = new TextDecoder('ascii')
  if (td.decode(bytes.slice(0, 4)) === 'RIFF' && td.decode(bytes.slice(8, 12)) === 'WEBP') return true
  const gif = td.decode(bytes.slice(0, 6))
  if (gif === 'GIF87a' || gif === 'GIF89a') return true
  if (td.decode(bytes.slice(4, 8)) === 'ftyp') {
    const brand = td.decode(bytes.slice(8, 12))
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'].includes(brand))
      return true
  }
  return false
}

function bytesToBase64(bytes) {
  let s = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(s)
}

// POST /api/ml/detect-food — Gemini Vision (Groq's free tier has no vision model)
app.post('/detect-food', auth, aiBurst(), aiDailyQuota, async (c) => {
  try {
    const env = c.env
    const body = await c.req.parseBody()
    const file = body.image
    if (!file || typeof file === 'string' || !file.arrayBuffer) {
      return c.json({ error: 'No image file uploaded' }, 400)
    }
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'Image too large (max 5MB)' }, 413)
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!isImageBuffer(bytes)) {
      return c.json({ error: 'Only image files (JPEG, PNG, WebP, GIF, HEIC) are accepted' }, 400)
    }
    if (!env.GEMINI_API_KEY) return c.json({ error: 'AI service not configured' }, 503)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { inline_data: { mime_type: file.type || 'image/jpeg', data: bytesToBase64(bytes) } },
                {
                  text: 'Identify the food items in this image and estimate calories. Respond in JSON: { "foods": [{ "name": "", "calories": 0, "confidence": 0.0 }], "total_calories": 0 }',
                },
              ],
            },
          ],
        }),
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
      return c.json(JSON.parse(clean))
    } catch {
      return c.json({ foods: [], total_calories: 0, raw: text })
    }
  } catch (error) {
    return aiErrorResponse(c, error, 'Food detection failed')
  }
})

export default app
