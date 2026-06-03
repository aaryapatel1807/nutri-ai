const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// GET /api/stats - get full user statistics
router.get('/', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const totalMeals = await prisma.meal.count({ where: { userId: req.userId } })
    const totalWorkouts = await prisma.workout.count({ where: { userId: req.userId } })
    const totalBadges = await prisma.userBadge.count({ where: { userId: req.userId } })

    // Efficient streak calculation: Fetch all unique dates user logged meals
    const mealDates = await prisma.meal.findMany({
      where: { userId: req.userId },
      select: { date: true },
      orderBy: { date: 'desc' }
    })

    // Group dates by day (YYYY-MM-DD) to count unique days
    const uniqueDays = [...new Set(mealDates.map(m => m.date.toISOString().split('T')[0]))]
    
    let streak = 0
    if (uniqueDays.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0]
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      
      // Start checking from the most recent entry
      let currentIdx = 0
      
      // If the most recent log isn't today or yesterday, streak is broken
      if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) {
        streak = 0
      } else {
        streak = 1
        for (let i = 0; i < uniqueDays.length - 1; i++) {
          const current = new Date(uniqueDays[i])
          const previous = new Date(uniqueDays[i + 1])
          const diffTime = Math.abs(current - previous)
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays === 1) {
            streak++
          } else {
            break
          }
        }
      }
    }

    res.json({
      totalMeals,
      totalWorkouts,
      totalBadges,
      streak,
      memberSince: user?.createdAt,
      calorieGoal: user?.calorieGoal || 2000,
      proteinGoal: user?.proteinGoal || 150,
      carbGoal:    user?.carbGoal    || 250,
      fatGoal:     user?.fatGoal     || 65,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
