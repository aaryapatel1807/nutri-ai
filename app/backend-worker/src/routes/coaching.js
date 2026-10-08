// ─── Adaptive coaching routes (Hono) ────────────────────────────────────────
// Port of app/backend/routes/coaching.js — learned TDEE (MacroFactor-style
// energy-balance), goal-based macro targets, and the Whoop-style readiness
// score. Pure computation; only the Prisma calls and req/res changed.

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()
const auth = authMiddleware()

const KCAL_PER_KG = 7700
const WINDOW_DAYS = 28
const MIN_WEIGHT_READINGS = 10
const MIN_SPAN_DAYS = 14
const MIN_INTAKE_DAYS = 7

function round2(n) {
  return Math.round(n * 100) / 100
}

function weightTrendKgPerDay(daily) {
  const n = daily.length
  if (n < 2) return 0
  const t0 = daily[0].date.getTime()
  const xs = daily.map((e) => (e.date.getTime() - t0) / 86400000)
  const ys = daily.map((e) => e.weight)
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0,
    den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) * (xs[i] - meanX)
  }
  return den === 0 ? 0 : num / den
}

function estimateAge(dob) {
  if (!dob) return null
  const m = String(dob).match(/(\d{4})/)
  if (!m) return null
  const age = new Date().getFullYear() - parseInt(m[1], 10)
  return age >= 10 && age <= 100 ? age : null
}

function mifflinTdee(user, weightKg) {
  const weight = weightKg || user.weight
  if (!weight || !user.height) return null
  const age = estimateAge(user.dob) ?? 30
  const female = String(user.gender || '').toLowerCase().startsWith('f')
  const bmr = 10 * weight + 6.25 * user.height - 5 * age + (female ? -161 : 5)
  const act = String(user.activityLevel || '').toLowerCase().replace(/[\s_-]/g, '')
  const factors = {
    sedentary: 1.2,
    light: 1.375,
    lightlyactive: 1.375,
    moderate: 1.55,
    moderatelyactive: 1.55,
    active: 1.725,
    veryactive: 1.9,
    extraactive: 1.9,
    athlete: 1.9,
  }
  return Math.round(bmr * (factors[act] ?? 1.4))
}

async function getLatestWeightKg(prisma, userId, user) {
  const latest = await prisma.weightLog.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { weight: true },
  })
  return latest ? latest.weight : user.weight || null
}

async function analyseEnergyBalance(prisma, userId, user) {
  const since = new Date()
  since.setDate(since.getDate() - WINDOW_DAYS)

  const [weights, meals] = await Promise.all([
    prisma.weightLog.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'asc' },
      select: { weight: true, date: true },
    }),
    prisma.meal.findMany({
      where: { userId, date: { gte: since } },
      select: { calories: true, date: true },
    }),
  ])

  const spanDays =
    weights.length >= 2
      ? (weights[weights.length - 1].date.getTime() - weights[0].date.getTime()) / 86400000
      : 0

  if (weights.length < MIN_WEIGHT_READINGS || spanDays < MIN_SPAN_DAYS) {
    return {
      ok: false,
      reason: 'insufficient_data',
      weightReadings: weights.length,
      spanDays: round2(spanDays),
      need: `Log your weight at least ${MIN_WEIGHT_READINGS} times over ${MIN_SPAN_DAYS} days`,
    }
  }

  const byDay = new Map()
  for (const w of weights) byDay.set(w.date.toISOString().slice(0, 10), w)
  const daily = [...byDay.values()].sort((a, b) => a.date - b.date)

  const slopeKgPerDay = weightTrendKgPerDay(daily)
  const trendKgPerWeek = round2(slopeKgPerDay * 7)
  const dailyBalanceKcal = slopeKgPerDay * KCAL_PER_KG

  const intakeByDay = new Map()
  for (const m of meals) {
    const key = m.date.toISOString().slice(0, 10)
    intakeByDay.set(key, (intakeByDay.get(key) || 0) + (Number(m.calories) || 0))
  }
  const intakeDays = intakeByDay.size
  if (intakeDays < MIN_INTAKE_DAYS) {
    return {
      ok: false,
      reason: 'insufficient_intake_data',
      weightReadings: daily.length,
      spanDays: round2(spanDays),
      intakeDays,
      need: `Log meals on at least ${MIN_INTAKE_DAYS} days in the last ${WINDOW_DAYS}`,
    }
  }
  const avgIntake = [...intakeByDay.values()].reduce((a, b) => a + b, 0) / intakeDays

  const latestWeightKg = await getLatestWeightKg(prisma, userId, user)
  const formulaAnchor = mifflinTdee(user, latestWeightKg)
  const learnedTDEE = Math.round(avgIntake - dailyBalanceKcal)

  if (formulaAnchor && (learnedTDEE < formulaAnchor * 0.6 || learnedTDEE > formulaAnchor * 1.8)) {
    return {
      ok: false,
      reason: 'unreliable_data',
      weightReadings: daily.length,
      spanDays: round2(spanDays),
      intakeDays,
      need: 'Your weight trend and logged intake disagree — check for missed meals or scale errors',
    }
  }

  const confidence =
    daily.length >= 20 && intakeDays >= 20
      ? 'high'
      : daily.length >= 14 && intakeDays >= 10
        ? 'medium'
        : 'low'

  return {
    ok: true,
    learnedTDEE,
    trendKgPerWeek,
    avgIntake: Math.round(avgIntake),
    daysCovered: Math.round(spanDays),
    weightReadings: daily.length,
    intakeDays,
    confidence,
    series: daily.map((w) => ({ date: w.date.toISOString().slice(0, 10), weight: round2(w.weight) })),
  }
}

function goalAdjustment(fitnessGoal) {
  const g = String(fitnessGoal || '').toLowerCase()
  if (/(loss|lose|cut|fat|slim|shred)/.test(g)) return { adjustment: -500, goal: 'fat_loss' }
  if (/(muscle|gain|bulk|build)/.test(g)) return { adjustment: 250, goal: 'muscle_gain' }
  return { adjustment: 0, goal: 'maintain' }
}

// GET /api/coaching/tdee
app.get('/tdee', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return c.json({ error: 'User not found' }, 404)

    const analysis = await analyseEnergyBalance(prisma, userId, user)
    if (!analysis.ok) {
      const latestWeightKg = await getLatestWeightKg(prisma, userId, user)
      return c.json(
        {
          status: 'insufficient_data',
          reason: analysis.reason,
          need: analysis.need,
          fallbackTDEE: mifflinTdee(user, latestWeightKg),
          estimated: true,
        },
        200
      )
    }
    return c.json({ status: 'ok', estimated: false, ...analysis }, 200)
  } catch (err) {
    console.error('Coaching TDEE error:', err.message)
    return c.json({ error: 'Failed to calculate TDEE' }, 500)
  }
})

// GET /api/coaching/targets
app.get('/targets', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return c.json({ error: 'User not found' }, 404)

    const analysis = await analyseEnergyBalance(prisma, userId, user)
    const latestWeightKg = await getLatestWeightKg(prisma, userId, user)
    const base = analysis.ok ? analysis.learnedTDEE : (mifflinTdee(user, latestWeightKg) ?? 2000)

    const { adjustment, goal } = goalAdjustment(user.fitnessGoal)
    const calorieTarget = Math.round((base + adjustment) / 10) * 10

    const weightKg = latestWeightKg || 70
    const proteinG = Math.round(2 * weightKg)
    const fatG = Math.round((0.25 * calorieTarget) / 9)
    const carbsG = Math.max(0, Math.round((calorieTarget - proteinG * 4 - fatG * 9) / 4))

    return c.json(
      {
        calorieTarget,
        proteinG,
        carbsG,
        fatG,
        goal,
        adjustment,
        basedOn: analysis.ok ? 'learned' : 'estimate',
        confidence: analysis.ok ? analysis.confidence : null,
      },
      200
    )
  } catch (err) {
    console.error('Coaching targets error:', err.message)
    return c.json({ error: 'Failed to calculate targets' }, 500)
  }
})

function readinessZone(score) {
  if (score >= 85) return 'Peak'
  if (score >= 70) return 'Primed'
  if (score >= 50) return 'Steady'
  return 'Recover'
}

const ZONE_ADVICE = {
  Peak: 'You are primed — a great day to push intensity or chase a personal best.',
  Primed: 'Good to go. Train as planned and keep fuelling well.',
  Steady: 'Solid base. Keep sessions moderate, prioritise protein and steps.',
  Recover: 'Take it easy today — light movement, extra sleep and hydrate well.',
}

// GET /api/coaching/readiness?soreness=1-5
app.get('/readiness', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    let soreness = Number(c.req.query('soreness'))
    if (!Number.isInteger(soreness) || soreness < 1 || soreness > 5) soreness = 3

    const now = new Date()
    const sleepCutoff = new Date(now.getTime() - 40 * 3600 * 1000)
    const strainCutoff = new Date(now.getTime() - 48 * 3600 * 1000)

    const lastSleep = await prisma.sleepLog.findFirst({
      where: { userId, date: { gte: sleepCutoff } },
      orderBy: { date: 'desc' },
    })

    const recentWorkouts = await prisma.workout.findMany({
      where: { userId, completedAt: { gte: strainCutoff } },
      select: { calories: true },
    })

    let sleepScore = null
    if (lastSleep) {
      const hoursScore = Math.max(0, 100 - 14 * Math.abs(lastSleep.hours - 8))
      const qualityScore = lastSleep.quality * 20
      sleepScore = Math.round(0.6 * hoursScore + 0.4 * qualityScore)
    }

    const recentKcal = recentWorkouts.reduce((a, w) => a + (Number(w.calories) || 0), 0)
    const strainScore = Math.max(0, Math.round(100 - (recentWorkouts.length * 15 + recentKcal / 40)))
    const sorenessScore = (6 - soreness) * 25

    const hasAnyData = lastSleep || recentWorkouts.length > 0 || c.req.query('soreness') !== undefined
    const score = hasAnyData
      ? Math.round(0.5 * (sleepScore ?? 70) + 0.3 * strainScore + 0.2 * sorenessScore)
      : 70

    const zone = readinessZone(score)
    return c.json(
      {
        score,
        zone,
        suggestion: ZONE_ADVICE[zone],
        soreness,
        components: {
          sleep: sleepScore,
          strain: strainScore,
          soreness: sorenessScore,
          sessionsLast48h: recentWorkouts.length,
        },
        dataQuality: hasAnyData ? (lastSleep ? 'good' : 'partial') : 'none',
      },
      200
    )
  } catch (err) {
    console.error('Coaching readiness error:', err.message)
    return c.json({ error: 'Failed to calculate readiness' }, 500)
  }
})

export default app
