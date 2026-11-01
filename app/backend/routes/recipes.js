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
// Expand an IPv6 address (handling :: compression and a trailing dotted
// IPv4 part) into 8 numeric groups, or null when unparseable.
function expandIpv6(ip) {
  let addr = ip.toLowerCase()
  let tailV4 = null
  const v4Match = addr.match(/:(\d+\.\d+\.\d+\.\d+)$/)
  if (v4Match) {
    tailV4 = v4Match[1].split('.').map(Number)
    if (tailV4.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null
    // Strip only the digits, not the preceding ':' — for "64:ff9b::8.8.8.8"
    // that leaves "64:ff9b::" (compression marker intact); for a full form
    // like "1:2:3:4:5:6:8.8.8.8" it leaves one stray ':' to trim.
    addr = addr.slice(0, addr.length - v4Match[1].length)
    if (addr.endsWith(':') && !addr.endsWith('::')) addr = addr.slice(0, -1)
  }
  const halves = addr.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const all = [...head, ...tail]
  if (all.some(g => !/^[0-9a-f]{1,4}$/.test(g))) return null
  const nums = all.map(g => parseInt(g, 16))
  const missing = 8 - nums.length - (tailV4 ? 2 : 0)
  if (halves.length === 1) {
    if (missing !== 0) return null
    return [...nums, ...(tailV4 ? [(tailV4[0] << 8) + tailV4[1], (tailV4[2] << 8) + tailV4[3]] : [])]
  }
  if (missing < 0) return null
  const expanded = [...nums.slice(0, head.length), ...Array(missing).fill(0), ...nums.slice(head.length)]
  if (tailV4) expanded.push((tailV4[0] << 8) + tailV4[1], (tailV4[2] << 8) + tailV4[3])
  return expanded.length === 8 ? expanded : null
}

// Extract an embedded IPv4 address from IPv6 transition forms, if present:
// ::ffff:a.b.c.d (IPv4-mapped), 64:ff9b::a.b.c.d (NAT64 WKP), 2002::/16 (6to4).
// The embedded address must pass the same checks — ::ffff:127.0.0.1 is
// loopback even though the outer form looks like a global IPv6 address.
function embeddedIpv4(ip) {
  const g = expandIpv6(ip)
  if (!g) return null
  const v4 = (hi, lo) => `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`
  if (g[0] === 0 && g[1] === 0 && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0xffff) return v4(g[6], g[7])
  if (g[0] === 0x64 && g[1] === 0xff9b && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0) return v4(g[6], g[7])
  if (g[0] === 0x2002) return v4(g[1], g[2])
  return null
}

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
      (a === 100 && b >= 64 && b <= 127) ||            // 100.64.0.0/10 CGNAT (cloud-internal)
      (a === 198 && (b === 18 || b === 19)) ||         // 198.18.0.0/15 benchmarking (cloud-internal)
      (a === 192 && b === 0) ||                        // 192.0.0.0/24 IETF protocol assignments
      a === 0 ||                                       // 0.0.0.0/8
      a >= 240                                          // 240.0.0.0/4 reserved + 255.255.255.255
    )
  }
  // IPv6: check embedded IPv4 first (mapped/NAT64/6to4 bypasses).
  const embedded = embeddedIpv4(ip)
  if (embedded) return isBlockedIp(embedded)
  const g = expandIpv6(ip)
  if (!g) return true // unparseable IPv6 → block
  const allZero = g.every(n => n === 0)
  return (
    allZero ||                                        // :: unspecified
    (g.slice(0, 7).every(n => n === 0) && g[7] === 1) || // ::1 loopback
    (g[0] >= 0xfc00 && g[0] <= 0xfdff) ||               // fc00::/7 unique-local
    (g[0] >= 0xfe80 && g[0] <= 0xfebf) ||               // fe80::/10 link-local (full range)
    (g[0] === 0x2001 && g[1] === 0x0db8) ||             // 2001:db8::/32 documentation (unroutable)
    (g[0] === 0 && g[1] === 0 && g[2] === 0 && g[3] === 0 && g[4] === 0xffff && g[5] === 0) // ::ffff:0:0/96 translated
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

// Read a fetch Response body with a hard byte cap, streaming — never buffer
// an unbounded body first. Aborts (and throws) the moment the cap is passed,
// so a multi-hundred-MB page can't OOM the serverless function before the
// size check runs. The caller's AbortSignal (per-hop 10s timeout) also bounds
// the total read time, including slow-drip bodies.
async function readCappedBody(res, maxBytes) {
  if (!res.body || typeof res.body.getReader !== 'function') {
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > maxBytes) throw new Error('Page is too large to import')
    return buf
  }
  const reader = res.body.getReader()
  const chunks = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        try { await reader.cancel() } catch {}
        throw new Error('Page is too large to import')
      }
      chunks.push(value)
    }
  } finally {
    try { reader.releaseLock() } catch {}
  }
  return Buffer.concat(chunks.map(c => Buffer.from(c)))
}

// Call Groq in JSON mode (same OpenAI-compatible pattern as routes/mlProxy.js)
async function callGroqJson(userContent, systemPrompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    signal: AbortSignal.timeout(30000),
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
      const buf = await readCappedBody(page, MAX_BYTES)
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
// Test hooks (attaching to the router object does not affect its use as
// Express middleware). Unit tests import these without starting a server.
module.exports.isBlockedIp = isBlockedIp
module.exports.assertPublicHost = assertPublicHost
module.exports.fetchPublicPage = fetchPublicPage
module.exports.readCappedBody = readCappedBody
