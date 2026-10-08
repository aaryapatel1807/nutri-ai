// ─── Meals routes (Hono) ────────────────────────────────────────────────────
// Port of app/backend/routes/meals.js.

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { normalizeMealInput } from '../utils/nutrition.js'

const app = new Hono()
const auth = authMiddleware()

// GET /api/meals
app.get('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const meals = await prisma.meal.findMany({
      where: { userId: c.get('userId') },
      orderBy: { date: 'desc' },
    })
    return c.json(meals)
  } catch (err) {
    console.error('Failed to load meals:', err.message)
    return c.json({ error: 'Failed to load meals' }, 500)
  }
})

// GET /api/meals/today
app.get('/today', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const now = new Date()
    const windowStart = new Date(now.getTime() - 30 * 60 * 60 * 1000)

    const [meals, user] = await Promise.all([
      prisma.meal.findMany({
        where: { userId, date: { gte: windowStart, lte: now } },
        orderBy: { date: 'asc' },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { calorieGoal: true } }),
    ])

    const totals = meals.reduce(
      (acc, meal) => ({
        totalCalories: acc.totalCalories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { totalCalories: 0, protein: 0, carbs: 0, fat: 0 }
    )

    const grouped = {
      Breakfast: meals.filter((m) => m.mealType === 'Breakfast'),
      Lunch: meals.filter((m) => m.mealType === 'Lunch'),
      Dinner: meals.filter((m) => m.mealType === 'Dinner'),
      Snack: meals.filter((m) => m.mealType === 'Snack'),
    }

    c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
    return c.json({ ...totals, goalCalories: user?.calorieGoal || 1800, meals, grouped })
  } catch (err) {
    console.error("Failed to load today's meals:", err.message)
    return c.json({ error: "Failed to load today's meals" }, 500)
  }
})

// GET /api/meals/weekly
app.get('/weekly', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const [meals, user] = await Promise.all([
      prisma.meal.findMany({
        where: { userId, date: { gte: sevenDaysAgo } },
        orderBy: { date: 'asc' },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { calorieGoal: true } }),
    ])

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const days = []
    const goal = user?.calorieGoal || 2000

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayMeals = meals.filter((m) => m.date.toISOString().split('T')[0] === dateStr)
      days.push({
        day: dayNames[d.getDay()],
        cal: Math.round(dayMeals.reduce((a, m) => a + m.calories, 0)),
        protein: Math.round(dayMeals.reduce((a, m) => a + m.protein, 0)),
        carbs: Math.round(dayMeals.reduce((a, m) => a + m.carbs, 0)),
        fat: Math.round(dayMeals.reduce((a, m) => a + m.fat, 0)),
        goal,
      })
    }
    return c.json(days)
  } catch (err) {
    console.error('Failed to load weekly meals:', err.message)
    return c.json({ error: 'Failed to load weekly meals' }, 500)
  }
})

// POST /api/meals
app.post('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const normalized = normalizeMealInput(await c.req.json())
    if (normalized.error) return c.json({ error: normalized.error }, 400)

    const meal = await prisma.meal.create({ data: { userId, ...normalized.value } })
    await checkAndAwardBadges(prisma, userId)
    return c.json(meal, 201)
  } catch (err) {
    console.error('Create meal error:', err.message)
    return c.json({ error: 'Failed to log meal' }, 500)
  }
})

// DELETE /api/meals/:id
app.delete('/:id', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const meal = await prisma.meal.findFirst({
      where: { id: c.req.param('id'), userId: c.get('userId') },
    })
    if (!meal) return c.json({ error: 'Meal not found' }, 404)
    await prisma.meal.delete({ where: { id: c.req.param('id') } })
    return c.json({ success: true })
  } catch (err) {
    console.error('Failed to delete meal:', err.message)
    return c.json({ error: 'Failed to delete meal' }, 500)
  }
})

async function checkAndAwardBadges(prisma, userId) {
  try {
    const mealCount = await prisma.meal.count({ where: { userId } })
    if (mealCount >= 1) {
      const badge = await prisma.badge.findFirst({ where: { name: 'First Bite' } })
      if (badge) {
        await prisma.userBadge.upsert({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
          create: { userId, badgeId: badge.id },
          update: {},
        })
      }
    }
  } catch (err) {
    console.error('Badge check error:', err.message)
  }
}

export default app
