const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// GET /api/workouts - get all workouts, including per-exercise detail
router.get('/', authMiddleware, async (req, res) => {
  try {
    const workouts = await prisma.workout.findMany({
      where: { userId: req.userId },
      orderBy: { completedAt: 'desc' },
      include: { exercises: true },
    })
    res.json(workouts)
  } catch (err) {
    console.error('Failed to load workouts:', err.message)
    res.status(500).json({ error: 'Failed to load workouts' })
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
    console.error('Failed to load workout stats:', err.message)
    res.status(500).json({ error: 'Failed to load workout stats' })
  }
})

// Validation: duration/calories must be non-negative numbers when supplied.
// A negative duration is objectively impossible — reject it with 400 rather
// than storing it silently (testing 2026-10-03: duration -30 was accepted).
// Returns { value } on success, { error } on invalid input, or undefined when
// the field was not provided at all (caller keeps its own default).
function parseWorkoutNumber(value, field) {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0)
    return { error: `${field} must be a non-negative number` }
  return { value: Math.floor(n) }
}

// Validate one exercise entry: name required; sets/reps non-negative ints;
// weight non-negative number. Returns { value } or { error }.
function parseWorkoutExercise(ex, i) {
  if (!ex || typeof ex !== 'object') return { error: `exercises[${i}] must be an object` }
  if (!ex.name || typeof ex.name !== 'string') return { error: `exercises[${i}].name is required` }
  const out = { name: ex.name.trim() }
  for (const [field, intOnly] of [['sets', true], ['reps', true], ['duration', true], ['calories', true]]) {
    if (ex[field] === undefined || ex[field] === null || ex[field] === '') continue
    const n = Number(ex[field])
    if (!Number.isFinite(n) || n < 0) return { error: `exercises[${i}].${field} must be a non-negative number` }
    out[field] = intOnly ? Math.floor(n) : n
  }
  if (ex.weight !== undefined && ex.weight !== null && ex.weight !== '') {
    const w = Number(ex.weight)
    if (!Number.isFinite(w) || w < 0) return { error: `exercises[${i}].weight must be a non-negative number` }
    out.weight = w
  }
  return { value: out }
}

// POST /api/workouts - log completed workout, including per-exercise detail
// (sets/reps/weight) as WorkoutExercise rows so history survives device changes.
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, duration, calories, category, difficulty, exercises } = req.body

    const dur = parseWorkoutNumber(duration, 'duration')
    if (dur && dur.error) return res.status(400).json({ error: dur.error })
    const cal = parseWorkoutNumber(calories, 'calories')
    if (cal && cal.error) return res.status(400).json({ error: cal.error })

    let exerciseRows = []
    if (exercises !== undefined) {
      if (!Array.isArray(exercises)) return res.status(400).json({ error: 'exercises must be an array' })
      if (exercises.length > 100) return res.status(400).json({ error: 'At most 100 exercises per workout' })
      for (let i = 0; i < exercises.length; i++) {
        const parsed = parseWorkoutExercise(exercises[i], i)
        if (parsed.error) return res.status(400).json({ error: parsed.error })
        exerciseRows.push(parsed.value)
      }
    }

    const workout = await prisma.workout.create({
      data: {
        userId:     req.userId,
        name:       name || 'Workout',
        duration:   dur ? dur.value : 0,
        calories:   cal ? cal.value : 0,
        category:   category || 'Strength',
        difficulty: difficulty || 'Intermediate',
        exercises: exerciseRows.length ? { create: exerciseRows } : undefined,
      },
      include: { exercises: true },
    })
    res.status(201).json(workout)
  } catch (err) {
    console.error('Create workout error:', err.message)
    res.status(500).json({ error: 'Failed to log workout' })
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

    const data = {}
    if (name) data.name = name
    if (category) data.category = category
    if (difficulty) data.difficulty = difficulty
    const dur = parseWorkoutNumber(duration, 'duration')
    if (dur && dur.error) return res.status(400).json({ error: dur.error })
    if (dur) data.duration = dur.value
    const cal = parseWorkoutNumber(calories, 'calories')
    if (cal && cal.error) return res.status(400).json({ error: cal.error })
    if (cal) data.calories = cal.value

    const workout = await prisma.workout.update({
      where: { id: req.params.id },
      data,
    })
    res.json(workout)
  } catch (err) {
    console.error('Failed to update workout:', err.message)
    res.status(500).json({ error: 'Failed to update workout' })
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
    console.error('Failed to delete workout:', err.message)
    res.status(500).json({ error: 'Failed to delete workout' })
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
    console.error('Failed to complete workout:', err.message)
    res.status(500).json({ error: 'Failed to complete workout' })
  }
})

module.exports = router
