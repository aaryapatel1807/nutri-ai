const express = require('express')
const router = express.Router()
const dns = require('dns').promises
const net = require('net')
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

// ---------------------------------------------------------------------------
// SSRF guard for the recipe-import URL fetch.
//
// The fetch below runs server-side, so a malicious URL like
// http://169.254.169.254/latest/meta-data/ (cloud metadata) or
// http://localhost:5432/ could probe the server's own network. Defense:
//   1. Only http/https schemes (already enforced at the route).
//   2. DNS-resolve the hostname and reject any private/loopback/link-local
//      address — checked on EVERY redirect hop, not just the first URL,
//      which also closes the basic DNS-rebinding hole.
// ---------------------------------------------------------------------------
function isBlockedIp(ip) {
  if (!net.isIP(ip)) return true // unparseable → block
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return (
      a === 10 ||                                    // 10.0.0.0/8
      a === 127 ||                                   // 127.0.0.0/8 loopback
      (a === 172 && b >= 16 && b <= 31) ||            // 172.16.0.0/12
      (a === 192 && b === 168) ||                     // 192.168.0.0/16
      (a === 169 && b === 254) ||                     // 169.254.0.0/16 link-local (cloud metadata)
      a === 0                                        // 0.0.0.0/8
    )
  }
  // IPv6
  const low = ip.toLowerCase()
  return (
    low === '::1' ||                                 // loopback
    low === '::' ||
    low.startsWith('fc') || low.startsWith('fd') ||   // fc00::/7 unique-local
    low.startsWith('fe80:')                          // fe80::/10 link-local
  )
}

async function assertPublicHost(hostname) {
  let addrs
  try {
    addrs = await dns.lookup(hostname, { all: true })
  } catch {
    throw new Error('Could not resolve that hostname')
  }
  if (!addrs.length || addrs.some((a) => isBlockedIp(a.address))) {
    throw new Error('That URL resolves to a private or internal address')
  }
}

// Fetch with manual redirect handling (max 3 hops) so every hop's host is
// SSRF-checked — fetch()'s automatic redirects would skip the check.
async function fetchPublicPage(rawUrl, timeoutMs = 10000) {
  let url = rawUrl
  for (let hop = 0; hop < 3; hop++) {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only http(s) URLs are supported')
    }
    await assertPublicHost(parsed.hostname)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'NutriAI/1.0 (recipe-import)' },
      })
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const loc = res.headers.get('location')
        if (!loc) throw new Error('Redirect with no location')
        url = new URL(loc, url).toString()
        await res.arrayBuffer().catch(() => {}) // drain
        continue
      }
      return res
    } finally {
      clearTimeout(timeout)
    }
  }
  throw new Error('Too many redirects')
}

// Call Groq in JSON mode (same OpenAI-compatible pattern as routes/mlProxy.js)
async function callGroqJson(userContent, systemPrompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      max_tokens: 2048,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Groq error')
  return data.choices?.[0]?.message?.content || ''
}

// Strip a fetched page down to readable text for the LLM
function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

// GET /api/recipes - get all saved recipes for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(recipes)
  } catch (err) {
    console.error('Get recipes error:', err.message)
    res.status(500).json({ error: 'Failed to fetch recipes' })
  }
})

// GET /api/recipes/:id - get a single recipe
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await prisma.recipe.findUnique({ where: { id: req.params.id } })
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })
    if (recipe.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' })
    res.json(recipe)
  } catch (err) {
    console.error('Get recipe error:', err.message)
    res.status(500).json({ error: 'Failed to fetch recipe' })
  }
})

// POST /api/recipes - save a new recipe
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, ingredients, instructions, calories, protein, carbs, fat, imageUrl } = req.body
    if (!title || !ingredients || !instructions)
      return res.status(400).json({ error: 'title, ingredients, and instructions are required' })

    const recipe = await prisma.recipe.create({
      data: {
        userId: req.userId,
        title,
        ingredients,
        instructions,
        calories: calories ? parseFloat(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fat: fat ? parseFloat(fat) : null,
        imageUrl: imageUrl || null
      }
    })
    res.status(201).json(recipe)
  } catch (err) {
    console.error('Create recipe error:', err.message)
    res.status(500).json({ error: 'Failed to save recipe' })
  }
})

// POST /api/recipes/import — extract a recipe from a web page URL via AI.
// Fetches the page (http/https only, 10s timeout, 2MB cap) and uses Groq to
// parse ingredients, instructions and per-serving nutrition. Returns the
// recipe draft; nothing is saved until the user chooses to.
router.post('/import', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'A recipe URL is required' })

    let parsed
    try { parsed = new URL(url) } catch { return res.status(400).json({ error: 'Invalid URL' }) }
    if (!['http:', 'https:'].includes(parsed.protocol))
      return res.status(400).json({ error: 'Only http(s) URLs are supported' })
    if (!GROQ_API_KEY) return res.status(503).json({ error: 'AI service not configured' })

    const MAX_BYTES = 2 * 1024 * 1024
    let html = ''
    try {
      // SSRF-checked fetch: scheme + DNS/IP validation on every redirect hop
      const page = await fetchPublicPage(parsed.toString())
      if (!page.ok) return res.status(502).json({ error: 'Could not fetch that page' })
      const contentType = page.headers.get('content-type') || ''
      if (!/text\/html|application\/xhtml/.test(contentType))
        return res.status(400).json({ error: 'That URL is not a web page' })
      const buf = Buffer.from(await page.arrayBuffer())
      if (buf.length > MAX_BYTES) return res.status(400).json({ error: 'Page is too large to import' })
      html = buf.toString('utf8')
    } catch (e) {
      console.error('Recipe import fetch error:', e.message)
      return res.status(400).json({ error: e.message || 'Could not fetch that page' })
    }

    const text = htmlToText(html).slice(0, 8000)
    if (text.length < 100) return res.status(502).json({ error: 'No readable recipe content found on that page' })

    const raw = await callGroqJson(
      `Extract the recipe from this web page text. Respond in JSON: { "title": "", "ingredients": [""], "instructions": [""], "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }. Estimate per-serving nutrition if the page does not state it.\n\nPage text:\n${text}`,
      'You are a recipe extraction assistant. Output valid JSON only.'
    )
    const clean = raw.replace(/```json|```/g, '').trim()
    let recipe
    try { recipe = JSON.parse(clean) }
    catch { return res.status(502).json({ error: 'Could not understand the recipe on that page' }) }

    if (!recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.instructions))
      return res.status(502).json({ error: 'Could not understand the recipe on that page' })

    res.json({
      title: String(recipe.title).slice(0, 200),
      ingredients: recipe.ingredients.map(String),
      instructions: recipe.instructions.map(String),
      calories: Math.round(Number(recipe.calories)) || 0,
      protein: Math.round(Number(recipe.protein)) || 0,
      carbs: Math.round(Number(recipe.carbs)) || 0,
      fat: Math.round(Number(recipe.fat)) || 0,
      sourceUrl: parsed.toString()
    })
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'The page took too long to load' })
    console.error('Recipe import error:', err.message)
    res.status(500).json({ error: 'Recipe import failed' })
  }
})

// PUT /api/recipes/:id - update a recipe
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.recipe.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Recipe not found' })
    if (existing.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' })

    const { title, ingredients, instructions, calories, protein, carbs, fat, imageUrl } = req.body

    const updated = await prisma.recipe.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(ingredients && { ingredients }),
        ...(instructions && { instructions }),
        ...(calories !== undefined && { calories: parseFloat(calories) }),
        ...(protein !== undefined && { protein: parseFloat(protein) }),
        ...(carbs !== undefined && { carbs: parseFloat(carbs) }),
        ...(fat !== undefined && { fat: parseFloat(fat) }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    })
    res.json(updated)
  } catch (err) {
    console.error('Update recipe error:', err.message)
    res.status(500).json({ error: 'Failed to update recipe' })
  }
})

// DELETE /api/recipes/:id - delete a recipe
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await prisma.recipe.findUnique({ where: { id: req.params.id } })
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })
    if (recipe.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' })

    await prisma.recipe.delete({ where: { id: req.params.id } })
    res.json({ message: 'Recipe deleted' })
  } catch (err) {
    console.error('Delete recipe error:', err.message)
    res.status(500).json({ error: 'Failed to delete recipe' })
  }
})

module.exports = router
