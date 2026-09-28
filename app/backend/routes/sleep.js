const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// ---------------------------------------------------------------------------
// Sleep logs — manual sleep tracking that feeds the readiness score.
//
// NOTE: requires the SleepLog model (see SCHEMA_SLEEP.prisma.txt in this
// directory) with @@unique([userId, date]). Dates are normalised to UTC
// midnight so one log per calendar day is kept (re-logging a day overwrites).
// ---------------------------------------------------------------------------

const MAX_DAYS = 90

// Normalise any date input to UTC midnight so the (userId, date) unique
// constraint behaves as "one log per calendar day".
function toDayStart(value) {
  const d = value ? new Date(value) : new Date()
  if (isNaN(d.getTime())) return null
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

// GET /api/sleep?days=30 — recent sleep logs, oldest first (chart-friendly)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let days = Number(req.query.days)
    if (!Number.isFinite(days)) days = 30
    days = Math.min(Math.max(Math.floor(days), 1), MAX_DAYS)

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const logs = await prisma.sleepLog.findMany({
      where: { userId: req.userId, date: { gte: cutoff } },
      orderBy: { date: 'asc' }
    })
    res.json(logs)
  } catch (err) {
    console.error('Get sleep logs error:', err.message)
    res.status(500).json({ error: 'Failed to fetch sleep logs' })
  }
})

// POST /api/sleep — log (or overwrite) a night's sleep
// Body: { date?: ISO string (default today), hours: 0-24, quality: 1-5 }
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, hours, quality } = req.body

    const h = Number(hours)
    if (!Number.isFinite(h) || h < 0 || h > 24)
      return res.status(400).json({ error: 'hours must be a number between 0 and 24' })

    const q = Number(quality)
    if (!Number.isInteger(q) || q < 1 || q > 5)
      return res.status(400).json({ error: 'quality must be a whole number from 1 to 5' })

    const day = toDayStart(date)
    if (!day)
      return res.status(400).json({ error: 'date must be a valid date' })
    if (day.getTime() > Date.now())
      return res.status(400).json({ error: 'date cannot be in the future' })

    // One log per day: re-logging the same date overwrites the previous entry.
    const log = await prisma.sleepLog.upsert({
      where: { userId_date: { userId: req.userId, date: day } },
      update: { hours: h, quality: q },
      create: { userId: req.userId, date: day, hours: h, quality: q }
    })

    res.status(201).json(log)
  } catch (err) {
    console.error('Log sleep error:', err.message)
    res.status(500).json({ error: 'Failed to log sleep' })
  }
})

// DELETE /api/sleep/:id — delete a sleep log (own logs only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const log = await prisma.sleepLog.findUnique({ where: { id: req.params.id } })
    if (!log) return res.status(404).json({ error: 'Log not found' })
    if (log.userId !== req.userId) return res.status(403).json({ error: 'Not authorised' })

    await prisma.sleepLog.delete({ where: { id: req.params.id } })
    res.json({ message: 'Sleep log deleted' })
  } catch (err) {
    console.error('Delete sleep log error:', err.message)
    res.status(500).json({ error: 'Failed to delete sleep log' })
  }
})

module.exports = router
