// ─── Recipes routes (Hono) ──────────────────────────────────────────────────
// Port of app/backend/routes/recipes.js, including the /import endpoint with
// its SSRF guard (now DNS-over-HTTPS based — see utils/ssrf.js — since
// Workers have no node:dns/node:net).

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { fetchPublicPage, htmlToText } from '../utils/ssrf.js'

const app = new Hono()
const auth = authMiddleware()

async function callGroqJson(env, userContent, systemPrompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 2048,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Groq error')
  return data.choices?.[0]?.message?.content || ''
}

// GET /api/recipes
app.get('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const recipes = await prisma.recipe.findMany({
      where: { userId: c.get('userId') },
      orderBy: { createdAt: 'desc' },
    })
    return c.json(recipes)
  } catch (err) {
    console.error('Get recipes error:', err.message)
    return c.json({ error: 'Failed to fetch recipes' }, 500)
  }
})

// GET /api/recipes/:id
app.get('/:id', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const recipe = await prisma.recipe.findUnique({ where: { id: c.req.param('id') } })
    if (!recipe) return c.json({ error: 'Recipe not found' }, 404)
    if (recipe.userId !== c.get('userId')) return c.json({ error: 'Not authorized' }, 403)
    return c.json(recipe)
  } catch (err) {
    console.error('Get recipe error:', err.message)
    return c.json({ error: 'Failed to fetch recipe' }, 500)
  }
})

// POST /api/recipes
app.post('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const { title, ingredients, instructions, calories, protein, carbs, fat, imageUrl } =
      await c.req.json()
    if (!title || !ingredients || !instructions)
      return c.json({ error: 'title, ingredients, and instructions are required' }, 400)
    const recipe = await prisma.recipe.create({
      data: {
        userId: c.get('userId'),
        title,
        ingredients,
        instructions,
        calories: calories ? parseFloat(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fat: fat ? parseFloat(fat) : null,
        imageUrl: imageUrl || null,
      },
    })
    return c.json(recipe, 201)
  } catch (err) {
    console.error('Create recipe error:', err.message)
    return c.json({ error: 'Failed to save recipe' }, 500)
  }
})

// POST /api/recipes/import — extract a recipe from a web page URL via AI.
app.post('/import', auth, async (c) => {
  try {
    const env = c.env
    const { url } = await c.req.json()
    if (!url || typeof url !== 'string')
      return c.json({ error: 'A recipe URL is required' }, 400)

    let parsed
    try {
      parsed = new URL(url)
    } catch {
      return c.json({ error: 'Invalid URL' }, 400)
    }
    if (!['http:', 'https:'].includes(parsed.protocol))
      return c.json({ error: 'Only http(s) URLs are supported' }, 400)
    if (!env.GROQ_API_KEY) return c.json({ error: 'AI service not configured' }, 503)

    const MAX_BYTES = 2 * 1024 * 1024
    let html = ''
    try {
      const page = await fetchPublicPage(parsed.toString())
      if (!page.ok) return c.json({ error: 'Could not fetch that page' }, 502)
      const contentType = page.headers.get('content-type') || ''
      if (!/text\/html|application\/xhtml/.test(contentType))
        return c.json({ error: 'That URL is not a web page' }, 400)
      const buf = new Uint8Array(await page.arrayBuffer())
      if (buf.length > MAX_BYTES)
        return c.json({ error: 'Page is too large to import' }, 400)
      html = new TextDecoder('utf-8').decode(buf)
    } catch (e) {
      console.error('Recipe import fetch error:', e.message)
      return c.json({ error: e.message || 'Could not fetch that page' }, 400)
    }

    const text = htmlToText(html).slice(0, 8000)
    if (text.length < 100)
      return c.json({ error: 'No readable recipe content found on that page' }, 502)

    const raw = await callGroqJson(
      env,
      `Extract the recipe from this web page text. Respond in JSON: { "title": "", "ingredients": [""], "instructions": [""], "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }. Estimate per-serving nutrition if the page does not state it.\n\nPage text:\n${text}`,
      'You are a recipe extraction assistant. Output valid JSON only.'
    )
    const clean = raw.replace(/```json|```/g, '').trim()
    let recipe
    try {
      recipe = JSON.parse(clean)
    } catch {
      return c.json({ error: 'Could not understand the recipe on that page' }, 502)
    }
    if (!recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.instructions))
      return c.json({ error: 'Could not understand the recipe on that page' }, 502)

    return c.json({
      title: String(recipe.title).slice(0, 200),
      ingredients: recipe.ingredients.map(String),
      instructions: recipe.instructions.map(String),
      calories: Math.round(Number(recipe.calories)) || 0,
      protein: Math.round(Number(recipe.protein)) || 0,
      carbs: Math.round(Number(recipe.carbs)) || 0,
      fat: Math.round(Number(recipe.fat)) || 0,
      sourceUrl: parsed.toString(),
    })
  } catch (err) {
    if (err.name === 'AbortError')
      return c.json({ error: 'The page took too long to load' }, 504)
    console.error('Recipe import error:', err.message)
    return c.json({ error: 'Recipe import failed' }, 500)
  }
})

// PUT /api/recipes/:id
app.put('/:id', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const id = c.req.param('id')
    const existing = await prisma.recipe.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Recipe not found' }, 404)
    if (existing.userId !== c.get('userId')) return c.json({ error: 'Not authorized' }, 403)

    const { title, ingredients, instructions, calories, protein, carbs, fat, imageUrl } =
      await c.req.json()
    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(ingredients && { ingredients }),
        ...(instructions && { instructions }),
        ...(calories !== undefined && { calories: parseFloat(calories) }),
        ...(protein !== undefined && { protein: parseFloat(protein) }),
        ...(carbs !== undefined && { carbs: parseFloat(carbs) }),
        ...(fat !== undefined && { fat: parseFloat(fat) }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    })
    return c.json(updated)
  } catch (err) {
    console.error('Update recipe error:', err.message)
    return c.json({ error: 'Failed to update recipe' }, 500)
  }
})

// DELETE /api/recipes/:id
app.delete('/:id', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const id = c.req.param('id')
    const recipe = await prisma.recipe.findUnique({ where: { id } })
    if (!recipe) return c.json({ error: 'Recipe not found' }, 404)
    if (recipe.userId !== c.get('userId')) return c.json({ error: 'Not authorized' }, 403)
    await prisma.recipe.delete({ where: { id } })
    return c.json({ message: 'Recipe deleted' })
  } catch (err) {
    console.error('Delete recipe error:', err.message)
    return c.json({ error: 'Failed to delete recipe' }, 500)
  }
})

export default app
