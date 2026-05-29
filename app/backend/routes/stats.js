const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')
const prisma = new PrismaClient()

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nutriai_secret')
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// GET /api/stats - get full user statistics
router.get('/', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const totalMeals = await prisma.meal.count({ where: { userId: req.userId } })
    const totalWorkouts = await prisma.workout.count({ where: { userId: req.userId } })
    const totalBadges = await prisma.userBadge.count({ where: { userId: req.userId } })

    // Calculate streak
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const next = new Date(date)
      next.setDate(next.getDate() + 1)

      const mealsOnDay = await prisma.meal.count({
        where: { userId: req.userId, date: { gte: date, lt: next } }
      })
      if (mealsOnDay > 0) streak++
      else break
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
