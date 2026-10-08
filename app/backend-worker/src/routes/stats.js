// ─── Stats routes (Hono) ────────────────────────────────────────────────────
// Port of app/backend/routes/stats.js.

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()
const auth = authMiddleware()

// GET /api/stats
app.get('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const [user, totalMeals, totalWorkouts, totalBadges, mealDates] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.meal.count({ where: { userId } }),
      prisma.workout.count({ where: { userId } }),
      prisma.userBadge.count({ where: { userId } }),
      prisma.meal.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'desc' },
      }),
    ])

    const uniqueDays = [...new Set(mealDates.map((m) => m.date.toISOString().split('T')[0]))]
    let streak = 0
    if (uniqueDays.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0]
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
        streak = 1
        for (let i = 0; i < uniqueDays.length - 1; i++) {
          const diffDays = Math.ceil(
            Math.abs(new Date(uniqueDays[i]) - new Date(uniqueDays[i + 1])) / (1000 * 60 * 60 * 24)
          )
          if (diffDays === 1) streak++
          else break
        }
      }
    }

    return c.json({
      totalMeals,
      totalWorkouts,
      totalBadges,
      streak,
      memberSince: user?.createdAt,
      calorieGoal: user?.calorieGoal || 2000,
      proteinGoal: user?.proteinGoal || 150,
      carbGoal: user?.carbGoal || 250,
      fatGoal: user?.fatGoal || 65,
    })
  } catch (err) {
    console.error('Failed to load stats:', err.message)
    return c.json({ error: 'Failed to load stats' }, 500)
  }
})

export default app
