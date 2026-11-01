const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')
const { normalizeMealInput } = require('../utils/nutrition')

// Parse ?date=YYYY-MM-DD (the caller's LOCAL calendar day) into a UTC range.
// Returns { start, end } or null when the param is absent/invalid.
function localDayRange(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  const start = new Date(`${dateStr}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

// GET /api/meals - get all meals for user; ?date=YYYY-MM-DD filters to that
// local calendar day (this is what lib/api meals.getByDate already called —
// the query used to be silently ignored, returning everything).
router.get('/', authMiddleware, async (req, res) => {
  try {
    const range = localDayRange(req.query.date)
    const meals = await prisma.meal.findMany({
      where: {
        userId: req.userId,
        ...(range ? { date: { gte: range.start, lt: range.end } } : {}),
      },
      orderBy: { date: 'desc' }
    })
    res.json(meals)
  } catch (err) {
    console.error('Failed to load meals:', err.message)
    res.status(500).json({ error: 'Failed to load meals' })
  }
})

// GET /api/meals/today - get today's meals with totals.
// The day is the caller's LOCAL calendar day (?date=YYYY-MM-DD, defaulting to
// the server's current UTC day). The old 30-hour trailing window disagreed
// with the frontend's local-day filter, so the same session showed different
// totals on different pages.
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const range = localDayRange(req.query.date) || (() => {
      const now = new Date()
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) }
    })()

    const [meals, user] = await Promise.all([
      prisma.meal.findMany({
        where: {
          userId: req.userId,
          date: { gte: range.start, lt: range.end }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { calorieGoal: true }
      })
    ])

    // Calculate totals
    const totals = meals.reduce((acc, meal) => ({
      totalCalories: acc.totalCalories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    }), { totalCalories: 0, protein: 0, carbs: 0, fat: 0 })

    // Group by meal type
    const grouped = {
      Breakfast: meals.filter(m => m.mealType === 'Breakfast'),
      Lunch:     meals.filter(m => m.mealType === 'Lunch'),
      Dinner:    meals.filter(m => m.mealType === 'Dinner'),
      Snack:     meals.filter(m => m.mealType === 'Snack'),
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.json({
      ...totals,
      goalCalories: user?.calorieGoal || 2000,
      meals,
      grouped
    })
  } catch (err) {
    console.error("Failed to load today's meals:", err.message)
    res.status(500).json({ error: "Failed to load today's meals" })
  }
})

// GET /api/meals/weekly - get last 7 days nutrition
router.get('/weekly', authMiddleware, async (req, res) => {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const [meals, user] = await Promise.all([
      prisma.meal.findMany({
        where: {
          userId: req.userId,
          date: { gte: sevenDaysAgo }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { calorieGoal: true }
      })
    ])

    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const days = []
    const goal = user?.calorieGoal || 2000

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      
      const dayMeals = meals.filter(m => m.date.toISOString().split('T')[0] === dateStr)
      
      days.push({
        day:     dayNames[d.getDay()],
        cal:     Math.round(dayMeals.reduce((a, m) => a + m.calories, 0)),
        protein: Math.round(dayMeals.reduce((a, m) => a + m.protein, 0)),
        carbs:   Math.round(dayMeals.reduce((a, m) => a + m.carbs, 0)),
        fat:     Math.round(dayMeals.reduce((a, m) => a + m.fat, 0)),
        goal:    goal
      })
    }
    res.json(days)
  } catch (err) {
    console.error('Failed to load weekly meals:', err.message)
    res.status(500).json({ error: 'Failed to load weekly meals' })
  }
})

// POST /api/meals - log a new meal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const normalized = normalizeMealInput(req.body)
    if (normalized.error)
      return res.status(400).json({ error: normalized.error })

    const meal = await prisma.meal.create({
      data: { userId: req.userId, ...normalized.value }
    })

    // Auto award badges after logging meal
    await checkAndAwardBadges(req.userId)

    res.status(201).json(meal)
  } catch (err) {
    console.error('Create meal error:', err.message)
    res.status(500).json({ error: 'Failed to log meal' })
  }
})

// DELETE /api/meals/:id - delete a meal
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Verify meal belongs to this user before deleting
    const meal = await prisma.meal.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!meal) return res.status(404).json({ error: 'Meal not found' })

    await prisma.meal.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to delete meal:', err.message)
    res.status(500).json({ error: 'Failed to delete meal' })
  }
})

// Helper: auto award badges after meal log. Criteria are computed from real
// logged data (UTC calendar days, same convention as /api/stats streak).
const { awardBadge, checkLegend } = require('../utils/badges')

async function checkAndAwardBadges(userId) {
  try {
    const mealCount = await prisma.meal.count({ where: { userId } })
    if (mealCount >= 1) await awardBadge(userId, 'First Bite')

    // Meal-day streak (consecutive UTC days ending today or yesterday).
    const mealDates = await prisma.meal.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
    })
    const uniqueDays = [...new Set(mealDates.map(m => m.date.toISOString().split('T')[0]))]
    let streak = 0
    if (uniqueDays.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0]
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
        streak = 1
        for (let i = 0; i < uniqueDays.length - 1; i++) {
          const diffDays = Math.round(Math.abs(new Date(uniqueDays[i]) - new Date(uniqueDays[i + 1])) / 86400000)
          if (diffDays === 1) streak++
          else break
        }
      }
    }
    if (streak >= 7) await awardBadge(userId, 'Week Warrior')
    if (streak >= 30) await awardBadge(userId, 'Monthly Monster')

    // Protein King: 200g+ protein on each of the last 7 UTC calendar days
    // (today + previous 6, consecutive — not just any 7 days in a window).
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i))
      return d.toISOString().split('T')[0]
    })
    const weekStart = new Date(`${last7Days[6]}T00:00:00.000Z`)
    const weekMeals = await prisma.meal.findMany({
      where: { userId, date: { gte: weekStart } },
      select: { date: true, protein: true },
    })
    const proteinByDay = {}
    for (const m of weekMeals) {
      const day = m.date.toISOString().split('T')[0]
      proteinByDay[day] = (proteinByDay[day] || 0) + (m.protein || 0)
    }
    if (last7Days.every(d => (proteinByDay[d] || 0) >= 200)) {
      await awardBadge(userId, 'Protein King')
    }

    await checkLegend(userId)
  } catch (err) {
    console.error('Badge check error:', err.message)
  }
}

module.exports = router
