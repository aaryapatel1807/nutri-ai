const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// GET /api/workouts - get all workouts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const workouts = await prisma.workout.findMany({
      where: { userId: req.userId },
      orderBy: { completedAt: 'desc' }
    })
    res.json(workouts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/workouts/stats - get workout statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total = await prisma.workout.count({ where: { userId: req.userId } })
    const thisWeek = await prisma.workout.count({
      where: {
        userId: req.userId,
        completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })
    const totalCalories = await prisma.workout.aggregate({
      where: { userId: req.userId },
      _sum: { calories: true }
    })
    res.json({
      totalWorkouts: total,
      thisWeek,
      totalCaloriesBurned: totalCalories._sum.calories || 0
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/workouts - log completed workout
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, duration, calories, category, difficulty } = req.body
    const workout = await prisma.workout.create({
      data: {
        userId:     req.userId,
        name:       name || 'Workout',
        duration:   parseInt(duration) || 0,
        calories:   parseInt(calories) || 0,
        category:   category || 'Strength',
        difficulty: difficulty || 'Intermediate',
      }
    })
    res.json(workout)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/workouts/:id - update a workout
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, duration, calories, category, difficulty } = req.body
    const existing = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!existing) return res.status(404).json({ error: 'Workout not found' })

    const workout = await prisma.workout.update({
      where: { id: req.params.id },
      data: {
        ...(name       && { name }),
        ...(duration   && { duration: parseInt(duration) }),
        ...(calories   && { calories: parseInt(calories) }),
        ...(category   && { category }),
        ...(difficulty && { difficulty }),
      }
    })
    res.json(workout)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/workouts/:id - delete a workout
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!existing) return res.status(404).json({ error: 'Workout not found' })

    await prisma.workout.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/workouts/:id/complete - mark as complete (no-op, already saved as completed)
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!workout) return res.status(404).json({ error: 'Workout not found' })
    res.json({ success: true, workout })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
