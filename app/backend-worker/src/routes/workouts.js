// ─── Workouts routes (Hono) ─────────────────────────────────────────────────
// Port of app/backend/routes/workouts.js.

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()
const auth = authMiddleware()

function parseWorkoutNumber(value, field) {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return { error: `${field} must be a non-negative number` }
  return { value: Math.floor(n) }
}

// GET /api/workouts
app.get('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const workouts = await prisma.workout.findMany({
      where: { userId: c.get('userId') },
      orderBy: { completedAt: 'desc' },
    })
    return c.json(workouts)
  } catch (err) {
    console.error('Failed to load workouts:', err.message)
    return c.json({ error: 'Failed to load workouts' }, 500)
  }
})

// GET /api/workouts/stats
app.get('/stats', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const total = await prisma.workout.count({ where: { userId } })
    const thisWeek = await prisma.workout.count({
      where: { userId, completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    })
    const totalCalories = await prisma.workout.aggregate({
      where: { userId },
      _sum: { calories: true },
    })
    return c.json({
      totalWorkouts: total,
      thisWeek,
      totalCaloriesBurned: totalCalories._sum.calories || 0,
    })
  } catch (err) {
    console.error('Failed to load workout stats:', err.message)
    return c.json({ error: 'Failed to load workout stats' }, 500)
  }
})

// POST /api/workouts
app.post('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const { name, duration, calories, category, difficulty } = await c.req.json()

    const dur = parseWorkoutNumber(duration, 'duration')
    if (dur && dur.error) return c.json({ error: dur.error }, 400)
    const cal = parseWorkoutNumber(calories, 'calories')
    if (cal && cal.error) return c.json({ error: cal.error }, 400)

    const workout = await prisma.workout.create({
      data: {
        userId: c.get('userId'),
        name: name || 'Workout',
        duration: dur ? dur.value : 0,
        calories: cal ? cal.value : 0,
        category: category || 'Strength',
        difficulty: difficulty || 'Intermediate',
      },
    })
    return c.json(workout, 201)
  } catch (err) {
    console.error('Create workout error:', err.message)
    return c.json({ error: 'Failed to log workout' }, 500)
  }
})

// PUT /api/workouts/:id
app.put('/:id', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const id = c.req.param('id')
    const { name, duration, calories, category, difficulty } = await c.req.json()
    const existing = await prisma.workout.findFirst({ where: { id, userId: c.get('userId') } })
    if (!existing) return c.json({ error: 'Workout not found' }, 404)

    const data = {}
    if (name) data.name = name
    if (category) data.category = category
    if (difficulty) data.difficulty = difficulty
    const dur = parseWorkoutNumber(duration, 'duration')
    if (dur && dur.error) return c.json({ error: dur.error }, 400)
    if (dur) data.duration = dur.value
    const cal = parseWorkoutNumber(calories, 'calories')
    if (cal && cal.error) return c.json({ error: cal.error }, 400)
    if (cal) data.calories = cal.value

    const workout = await prisma.workout.update({ where: { id }, data })
    return c.json(workout)
  } catch (err) {
    console.error('Failed to update workout:', err.message)
    return c.json({ error: 'Failed to update workout' }, 500)
  }
})

// DELETE /api/workouts/:id
app.delete('/:id', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const id = c.req.param('id')
    const existing = await prisma.workout.findFirst({ where: { id, userId: c.get('userId') } })
    if (!existing) return c.json({ error: 'Workout not found' }, 404)
    await prisma.workout.delete({ where: { id } })
    return c.json({ success: true })
  } catch (err) {
    console.error('Failed to delete workout:', err.message)
    return c.json({ error: 'Failed to delete workout' }, 500)
  }
})

// POST /api/workouts/:id/complete
app.post('/:id/complete', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const workout = await prisma.workout.findFirst({
      where: { id: c.req.param('id'), userId: c.get('userId') },
    })
    if (!workout) return c.json({ error: 'Workout not found' }, 404)
    return c.json({ success: true, workout })
  } catch (err) {
    console.error('Failed to complete workout:', err.message)
    return c.json({ error: 'Failed to complete workout' }, 500)
  }
})

export default app
