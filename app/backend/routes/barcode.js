const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product'

// Barcodes are numeric (EAN/UPC/Code128 payloads) — reject anything else
// so the lookup URL can never be abused as an open redirect/SSRF vector.
function isValidCode(code) {
  return /^[0-9]{4,20}$/.test(String(code))
}

// Normalise an Open Food Facts product into NutriAI's macro shape.
// Prefer per-serving values when the product defines a serving size,
// otherwise fall back to per-100g values.
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
    image: product.image_front_url || product.image_url || null
  }
}

async function lookupProduct(code) {
  const res = await fetch(`${OFF_BASE}/${code}.json`, {
    headers: { 'User-Agent': 'NutriAI/1.0 (nutrition-tracking)' },
    signal: AbortSignal.timeout(10000)
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.status !== 1 || !data.product) return null
  return normalizeProduct(code, data.product)
}

// GET /api/barcode/:code — look up a packaged product by barcode
// (Open Food Facts, free database with good Indian coverage)
router.get('/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params
    if (!isValidCode(code)) return res.status(400).json({ error: 'Invalid barcode' })

    const product = await lookupProduct(code)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    console.error('Barcode lookup error:', err.message)
    res.status(500).json({ error: 'Barcode lookup failed' })
  }
})

// POST /api/barcode/log — log a scanned product as a meal
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { code, mealType } = req.body
    if (!code || !isValidCode(code)) return res.status(400).json({ error: 'Invalid barcode' })
    if (!MEAL_TYPES.includes(mealType)) return res.status(400).json({ error: 'Invalid meal type' })

    const product = await lookupProduct(String(code))
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const meal = await prisma.meal.create({
      data: {
        userId: req.userId,
        name: product.brand ? `${product.name} (${product.brand})` : product.name,
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fat: product.fat,
        mealType
      }
    })
    res.status(201).json(meal)
  } catch (err) {
    console.error('Barcode log error:', err.message)
    res.status(500).json({ error: 'Failed to log meal' })
  }
})

module.exports = router
