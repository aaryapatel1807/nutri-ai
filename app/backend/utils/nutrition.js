// ─── Pure nutrition helpers ─────────────────────────────────────────────────
// Zero-dependency, DB-free functions used by the meals routes. Extracted so the
// math/validation is unit-testable without Prisma. Semantics intentionally
// match the historical route behavior (parseFloat(x) || 0, 'Unknown' default).

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

// Sanity caps: a single meal above these is certainly a data-entry error.
const CAPS = { calories: 20000, protein: 2000, carbs: 2000, fat: 2000 }

function toNum(v, cap) {
  let n = parseFloat(v)
  if (!Number.isFinite(n)) return 0
  if (n < 0) n = 0 // negative macros are never valid
  return Math.min(n, cap)
}

/**
 * Validate + normalize a meal-log request body.
 * @returns {{ error: string } | { value: { name, calories, protein, carbs, fat, mealType, date } }}
 */
function normalizeMealInput(body = {}) {
  const { name, calories, protein, carbs, fat, mealType, date } = body

  let parsedDate = new Date()
  if (date !== undefined && date !== null && date !== '') {
    parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return { error: 'Invalid date' }
  }

  const type = MEAL_TYPES.includes(mealType) ? mealType : 'Breakfast'

  return {
    value: {
      name: (typeof name === 'string' && name.trim()) || 'Unknown',
      calories: toNum(calories, CAPS.calories),
      protein: toNum(protein, CAPS.protein),
      carbs: toNum(carbs, CAPS.carbs),
      fat: toNum(fat, CAPS.fat),
      mealType: type,
      date: parsedDate,
    },
  }
}

/** Sum macros across an array of meal-like objects. */
function sumMacros(meals) {
  return (meals || []).reduce(
    (acc, m) => ({
      calories: acc.calories + (Number(m.calories) || 0),
      protein: acc.protein + (Number(m.protein) || 0),
      carbs: acc.carbs + (Number(m.carbs) || 0),
      fat: acc.fat + (Number(m.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

/**
 * Macro calorie split as percentages (protein/carbs ×4, fat ×9 kcal/g).
 * Returns { protein, carbs, fat } summing to ~100 (0s when total is 0).
 */
function macroSplit(totals) {
  const p = (Number(totals.protein) || 0) * 4
  const c = (Number(totals.carbs) || 0) * 4
  const f = (Number(totals.fat) || 0) * 9
  const total = p + c + f
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 }
  const pct = (n) => Math.round((n / total) * 100)
  return { protein: pct(p), carbs: pct(c), fat: pct(f) }
}

module.exports = { MEAL_TYPES, normalizeMealInput, sumMacros, macroSplit }
