const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// GET /api/meals - get all meals for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const meals = await prisma.meal.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' }
    })
    res.json(meals)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/meals/today - get today's meals with totals
router.get('/today', authMiddleware, async (req, res) => {
  try {
    // Use a 30-hour window (last 6h + today 24h) to handle any timezone offset up to UTC+14
    const now = new Date()
    const windowStart = new Date(now.getTime() - 30 * 60 * 60 * 1000) // 30 hours ago

    const [meals, user] = await Promise.all([
      prisma.meal.findMany({
        where: {
          userId: req.userId,
          date: { gte: windowStart, lte: now }
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
      goalCalories: user?.calorieGoal || 1800,
      meals,
      grouped
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
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
    res.status(500).json({ error: err.message })
  }
})

// POST /api/meals - log a new meal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, mealType, date } = req.body
    const meal = await prisma.meal.create({
      data: {
        userId:   req.userId,
        name:     name || 'Unknown',
        calories: parseFloat(calories) || 0,
        protein:  parseFloat(protein)  || 0,
        carbs:    parseFloat(carbs)    || 0,
        fat:      parseFloat(fat)      || 0,
        mealType: mealType || 'Breakfast',
        date:     date ? new Date(date) : new Date()
      }
    })

    // Auto award badges after logging meal
    await checkAndAwardBadges(req.userId)

    res.json(meal)
  } catch (err) {
    res.status(500).json({ error: err.message })
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
    res.status(500).json({ error: err.message })
  }
})

// Helper: auto award badges after meal log
async function checkAndAwardBadges(userId) {
  try {
    const mealCount = await prisma.meal.count({ where: { userId } })

    if (mealCount >= 1) {
      const badge = await prisma.badge.findFirst({ where: { name: 'First Bite' } })
      if (badge) {
        await prisma.userBadge.upsert({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
          create: { userId, badgeId: badge.id },
          update: {}
        })
      }
    }
  } catch (err) {
    console.error('Badge check error:', err.message)
  }
}

module.exports = router
