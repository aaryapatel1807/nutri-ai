const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// GET /api/weight - get all weight logs for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const logs = await prisma.weightLog.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      take: 90 // last 90 entries
    })
    res.json(logs)
  } catch (err) {
    console.error('Get weight logs error:', err.message)
    res.status(500).json({ error: 'Failed to fetch weight logs' })
  }
})

// GET /api/weight/latest - get the most recent weight log
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const log = await prisma.weightLog.findFirst({
      where: { userId: req.userId },
      orderBy: { date: 'desc' }
    })
    res.json(log || null)
  } catch (err) {
    console.error('Get latest weight error:', err.message)
    res.status(500).json({ error: 'Failed to fetch latest weight' })
  }
})

// GET /api/weight/history - get last 30 days of weight logs
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const logs = await prisma.weightLog.findMany({
      where: { userId: req.userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' }
    })
    res.json(logs)
  } catch (err) {
    console.error('Get weight history error:', err.message)
    res.status(500).json({ error: 'Failed to fetch weight history' })
  }
})

// POST /api/weight - log a new weight entry
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { weight } = req.body
    if (!weight || weight <= 0)
      return res.status(400).json({ error: 'weight must be a positive number (kg)' })

    const log = await prisma.weightLog.create({
      data: { userId: req.userId, weight: parseFloat(weight) }
    })

    // Optionally update user's current weight field too
    await prisma.user.update({
      where: { id: req.userId },
      data: { weight: parseFloat(weight) }
    })

    res.status(201).json(log)
  } catch (err) {
    console.error('Log weight error:', err.message)
    res.status(500).json({ error: 'Failed to log weight' })
  }
})

// DELETE /api/weight/:id - delete a weight log entry
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const log = await prisma.weightLog.findUnique({ where: { id: req.params.id } })
    if (!log) return res.status(404).json({ error: 'Log not found' })
    if (log.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' })

    await prisma.weightLog.delete({ where: { id: req.params.id } })
    res.json({ message: 'Weight log deleted' })
  } catch (err) {
    console.error('Delete weight log error:', err.message)
    res.status(500).json({ error: 'Failed to delete weight log' })
  }
})

module.exports = router
