// ─── Barcode routes (Hono) ──────────────────────────────────────────────────
// Port of app/backend/routes/barcode.js (Open Food Facts lookup + meal log).

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { MEAL_TYPES } from '../utils/nutrition.js'

const app = new Hono()
const auth = authMiddleware()

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product'

function isValidCode(code) {
  return /^[0-9]{4,20}$/.test(String(code))
}

function normalizeProduct(code, product) {
  const n = product.nutriments || {}
  const hasServing = n['energy-kcal_serving'] != null || n['proteins_serving'] != null
  const pick = (key) => {
    const v = hasServing ? n[`${key}_serving`] : n[`${key}_100g`]
    const num = Number(v)
    return Number.isFinite(num) && num >= 0 ? Math.round(num) : 0
  }
  return {
    code,
    name: product.product_name || product.product_name_en || 'Unknown product',
    brand: product.brands || '',
    calories: pick('energy-kcal'),
    protein: pick('proteins'),
    carbs: pick('carbohydrates'),
    fat: pick('fat'),
    servingSize: product.serving_size || (hasServing ? '' : '100g'),
    perServing: hasServing,
    image: product.image_front_url || product.image_url || null,
  }
}

async function lookupProduct(code) {
  const res = await fetch(`${OFF_BASE}/${code}.json`, {
    headers: { 'User-Agent': 'NutriAI/1.0 (nutrition-tracking)' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.status !== 1 || !data.product) return null
  return normalizeProduct(code, data.product)
}

// GET /api/barcode/:code
app.get('/:code', auth, async (c) => {
  try {
    const { code } = c.req.param()
    if (!isValidCode(code)) return c.json({ error: 'Invalid barcode' }, 400)
    const product = await lookupProduct(code)
    if (!product) return c.json({ error: 'Product not found' }, 404)
    return c.json(product)
  } catch (err) {
    console.error('Barcode lookup error:', err.message)
    return c.json({ error: 'Barcode lookup failed' }, 500)
  }
})

// POST /api/barcode/log
app.post('/log', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const { code, mealType } = await c.req.json()
    if (!code || !isValidCode(code)) return c.json({ error: 'Invalid barcode' }, 400)
    if (!MEAL_TYPES.includes(mealType)) return c.json({ error: 'Invalid meal type' }, 400)

    const product = await lookupProduct(String(code))
    if (!product) return c.json({ error: 'Product not found' }, 404)

    const meal = await prisma.meal.create({
      data: {
        userId: c.get('userId'),
        name: product.brand ? `${product.name} (${product.brand})` : product.name,
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fat: product.fat,
        mealType,
      },
    })
    return c.json(meal, 201)
  } catch (err) {
    console.error('Barcode log error:', err.message)
    return c.json({ error: 'Failed to log meal' }, 500)
  }
})

export default app
