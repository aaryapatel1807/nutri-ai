const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { prisma } = require('../prisma.config')

// Auth middleware
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// GET /api/water - get water logs for today (or by date query param)
router.get('/', auth, async (req, res) => {
  try {
    const { date } = req.query
    let whereClause = { userId: req.userId }

    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      whereClause.date = { gte: start, lte: end }
    } else {
      // Default: today
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      whereClause.date = { gte: start, lte: end }
    }

    const logs = await prisma.waterLog.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    })

    const totalMl = logs.reduce((sum, log) => sum + log.amountMl, 0)
    res.json({ logs, totalMl, totalL: (totalMl / 1000).toFixed(2) })
  } catch (err) {
    console.error('Get water logs error:', err.message)
    res.status(500).json({ error: 'Failed to fetch water logs' })
  }
})

// GET /api/water/history - get last 7 days of water logs
router.get('/history', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const logs = await prisma.waterLog.findMany({
      where: { userId: req.userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' }
    })
    res.json(logs)
  } catch (err) {
    console.error('Get water history error:', err.message)
    res.status(500).json({ error: 'Failed to fetch water history' })
  }
})

// POST /api/water - log water intake
router.post('/', auth, async (req, res) => {
  try {
    const { amountMl } = req.body
    if (!amountMl || amountMl <= 0)
      return res.status(400).json({ error: 'amountMl must be a positive number' })

    const log = await prisma.waterLog.create({
      data: { userId: req.userId, amountMl: parseInt(amountMl) }
    })
    res.status(201).json(log)
  } catch (err) {
    console.error('Log water error:', err.message)
    res.status(500).json({ error: 'Failed to log water' })
  }
})

// DELETE /api/water/:id - delete a water log entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const log = await prisma.waterLog.findUnique({ where: { id: req.params.id } })
    if (!log) return res.status(404).json({ error: 'Log not found' })
    if (log.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' })

    await prisma.waterLog.delete({ where: { id: req.params.id } })
    res.json({ message: 'Water log deleted' })
  } catch (err) {
    console.error('Delete water log error:', err.message)
    res.status(500).json({ error: 'Failed to delete water log' })
  }
})

module.exports = router
