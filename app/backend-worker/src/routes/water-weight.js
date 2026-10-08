// ─── Water + weight routes (Hono) ───────────────────────────────────────────
// Port of app/backend/routes/water.js and app/backend/routes/weight.js.
// Mounted at /api/water and /api/weight respectively (see src/app.js).

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'

const auth = authMiddleware()

// ─── water ──────────────────────────────────────────────────────────────────
export const water = new Hono()

// GET /api/water[?date=]
water.get('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const { date } = c.req.query()
    let whereClause = { userId: c.get('userId') }
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      whereClause.date = { gte: start, lte: end }
    } else {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      whereClause.date = { gte: start, lte: end }
    }
    const logs = await prisma.waterLog.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    })
    const totalMl = logs.reduce((sum, log) => sum + log.amountMl, 0)
    return c.json({ logs, totalMl, totalL: (totalMl / 1000).toFixed(2) })
  } catch (err) {
    console.error('Get water logs error:', err.message)
    return c.json({ error: 'Failed to fetch water logs' }, 500)
  }
})

// GET /api/water/history
water.get('/history', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const logs = await prisma.waterLog.findMany({
      where: { userId: c.get('userId'), date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    })
    return c.json(logs)
  } catch (err) {
    console.error('Get water history error:', err.message)
    return c.json({ error: 'Failed to fetch water history' }, 500)
  }
})

// POST /api/water
water.post('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const { amountMl } = await c.req.json()
    const ml = Number(amountMl)
    if (!Number.isFinite(ml) || ml <= 0)
      return c.json({ error: 'amountMl must be a positive number' }, 400)
    const log = await prisma.waterLog.create({
      data: { userId: c.get('userId'), amountMl: Math.round(ml) },
    })
    return c.json(log, 201)
  } catch (err) {
    console.error('Log water error:', err.message)
    return c.json({ error: 'Failed to log water' }, 500)
  }
})

// DELETE /api/water/:id
water.delete('/:id', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const id = c.req.param('id')
    const log = await prisma.waterLog.findUnique({ where: { id } })
    if (!log) return c.json({ error: 'Log not found' }, 404)
    if (log.userId !== c.get('userId')) return c.json({ error: 'Not authorized' }, 403)
    await prisma.waterLog.delete({ where: { id } })
    return c.json({ message: 'Water log deleted' })
  } catch (err) {
    console.error('Delete water log error:', err.message)
    return c.json({ error: 'Failed to delete water log' }, 500)
  }
})

// ─── weight ─────────────────────────────────────────────────────────────────
export const weight = new Hono()

// GET /api/weight
weight.get('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const logs = await prisma.weightLog.findMany({
      where: { userId: c.get('userId') },
      orderBy: { date: 'desc' },
      take: 90,
    })
    return c.json(logs)
  } catch (err) {
    console.error('Get weight logs error:', err.message)
    return c.json({ error: 'Failed to fetch weight logs' }, 500)
  }
})

// GET /api/weight/latest
weight.get('/latest', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const log = await prisma.weightLog.findFirst({
      where: { userId: c.get('userId') },
      orderBy: { date: 'desc' },
    })
    return c.json(log || null)
  } catch (err) {
    console.error('Get latest weight error:', err.message)
    return c.json({ error: 'Failed to fetch latest weight' }, 500)
  }
})

// GET /api/weight/history
weight.get('/history', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const logs = await prisma.weightLog.findMany({
      where: { userId: c.get('userId'), date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    })
    return c.json(logs)
  } catch (err) {
    console.error('Get weight history error:', err.message)
    return c.json({ error: 'Failed to fetch weight history' }, 500)
  }
})

// POST /api/weight
weight.post('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const { weight: w } = await c.req.json()
    const kg = Number(w)
    if (!Number.isFinite(kg) || kg <= 0)
      return c.json({ error: 'weight must be a positive number (kg)' }, 400)
    const log = await prisma.weightLog.create({ data: { userId, weight: kg } })
    await prisma.user.update({ where: { id: userId }, data: { weight: parseFloat(w) } })
    return c.json(log, 201)
  } catch (err) {
    console.error('Log weight error:', err.message)
    return c.json({ error: 'Failed to log weight' }, 500)
  }
})

// DELETE /api/weight/:id
weight.delete('/:id', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const id = c.req.param('id')
    const log = await prisma.weightLog.findUnique({ where: { id } })
    if (!log) return c.json({ error: 'Log not found' }, 404)
    if (log.userId !== c.get('userId')) return c.json({ error: 'Not authorized' }, 403)
    await prisma.weightLog.delete({ where: { id } })
    return c.json({ message: 'Weight log deleted' })
  } catch (err) {
    console.error('Delete weight log error:', err.message)
    return c.json({ error: 'Failed to delete weight log' }, 500)
  }
})
