// ─── Sleep routes (Hono) ────────────────────────────────────────────────────
// Port of app/backend/routes/sleep.js.

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()
const auth = authMiddleware()

const MAX_DAYS = 90

function toDayStart(value) {
  const d = value ? new Date(value) : new Date()
  if (isNaN(d.getTime())) return null
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

// GET /api/sleep?days=30
app.get('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    let days = Number(c.req.query('days'))
    if (!Number.isFinite(days)) days = 30
    days = Math.min(Math.max(Math.floor(days), 1), MAX_DAYS)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const logs = await prisma.sleepLog.findMany({
      where: { userId: c.get('userId'), date: { gte: cutoff } },
      orderBy: { date: 'asc' },
    })
    return c.json(logs)
  } catch (err) {
    console.error('Get sleep logs error:', err.message)
    return c.json({ error: 'Failed to fetch sleep logs' }, 500)
  }
})

// POST /api/sleep
app.post('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const { date, hours, quality } = await c.req.json()

    const h = Number(hours)
    if (!Number.isFinite(h) || h < 0 || h > 24)
      return c.json({ error: 'hours must be a number between 0 and 24' }, 400)
    const q = Number(quality)
    if (!Number.isInteger(q) || q < 1 || q > 5)
      return c.json({ error: 'quality must be a whole number from 1 to 5' }, 400)

    const day = toDayStart(date)
    if (!day) return c.json({ error: 'date must be a valid date' }, 400)
    if (day.getTime() > Date.now())
      return c.json({ error: 'date cannot be in the future' }, 400)

    const log = await prisma.sleepLog.upsert({
      where: { userId_date: { userId, date: day } },
      update: { hours: h, quality: q },
      create: { userId, date: day, hours: h, quality: q },
    })
    return c.json(log, 201)
  } catch (err) {
    console.error('Log sleep error:', err.message)
    return c.json({ error: 'Failed to log sleep' }, 500)
  }
})

// DELETE /api/sleep/:id
app.delete('/:id', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const id = c.req.param('id')
    const log = await prisma.sleepLog.findUnique({ where: { id } })
    if (!log) return c.json({ error: 'Log not found' }, 404)
    if (log.userId !== c.get('userId')) return c.json({ error: 'Not authorised' }, 403)
    await prisma.sleepLog.delete({ where: { id } })
    return c.json({ message: 'Sleep log deleted' })
  } catch (err) {
    console.error('Delete sleep log error:', err.message)
    return c.json({ error: 'Failed to delete sleep log' }, 500)
  }
})

export default app
