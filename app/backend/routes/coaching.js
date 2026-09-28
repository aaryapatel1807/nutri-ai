const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// ============================================================================
// Adaptive coaching — learned TDEE, goal-based targets, daily readiness.
//
// LEARNED-TDEE ALGORITHM (MacroFactor-style energy-balance method):
//   1. Take the last 28 days of weight logs. Require >= 10 readings spanning
//      >= 14 days, otherwise the trend is noise -> insufficient_data.
//   2. Collapse to one reading per calendar day (latest wins), then fit an
//      ordinary least-squares line: weight(kg) vs days -> slope (kg/day).
//   3. Convert mass change to energy: 1 kg of body mass ~= 7700 kcal, so
//      dailyBalanceKcal = slopeKgPerDay * 7700 (negative = losing weight).
//   4. Average intake = mean of daily calorie totals over days with at least
//      one meal logged (require >= 7 such days, else intake is unreliable).
//   5. learnedTDEE = avgIntake - dailyBalanceKcal.
//      (Losing 0.5 kg/wk = -550 kcal/day balance while eating 2000 -> TDEE 2550.)
//   6. Sanity clamp: if the learned value falls outside 0.6x-1.8x of the
//      Mifflin-St Jeor formula estimate, the input data is almost certainly
//      bad (missed logs, wrong entries) -> insufficient_data with fallback.
// ============================================================================

const KCAL_PER_KG = 7700
const WINDOW_DAYS = 28
const MIN_WEIGHT_READINGS = 10
const MIN_SPAN_DAYS = 14
const MIN_INTAKE_DAYS = 7

function round2(n) { return Math.round(n * 100) / 100 }

// Ordinary least-squares slope of weight (kg) against days since first reading.
function weightTrendKgPerDay(daily) {
  const n = daily.length
  if (n < 2) return 0
  const t0 = daily[0].date.getTime()
  const xs = daily.map(e => (e.date.getTime() - t0) / 86400000)
  const ys = daily.map(e => e.weight)
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
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

// Mifflin-St Jeor BMR x activity factor. Used as the fallback estimate and as
// the sanity anchor for the learned value. Returns null when inputs are missing.
function mifflinTdee(user, weightKg) {
  const weight = weightKg || user.weight
  if (!weight || !user.height) return null
  const age = estimateAge(user.dob) ?? 30
  const female = String(user.gender || '').toLowerCase().startsWith('f')
  const bmr = 10 * weight + 6.25 * user.height - 5 * age + (female ? -161 : 5)
  const act = String(user.activityLevel || '').toLowerCase().replace(/[\s_-]/g, '')
  const factors = {
    sedentary: 1.2, light: 1.375, lightlyactive: 1.375,
    moderate: 1.55, moderatelyactive: 1.55,
    active: 1.725, veryactive: 1.9, extraactive: 1.9, athlete: 1.9
  }
  return Math.round(bmr * (factors[act] ?? 1.4))
}

async function getLatestWeightKg(userId, user) {
  const latest = await prisma.weightLog.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { weight: true }
  })
  return latest ? latest.weight : (user.weight || null)
}

// Core analysis shared by /tdee and /targets.
async function analyseEnergyBalance(userId, user) {
  const since = new Date()
  since.setDate(since.getDate() - WINDOW_DAYS)

  const [weights, meals] = await Promise.all([
    prisma.weightLog.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'asc' },
      select: { weight: true, date: true }
    }),
    prisma.meal.findMany({
      where: { userId, date: { gte: since } },
      select: { calories: true, date: true }
    })
  ])

  const spanDays = weights.length >= 2
    ? (weights[weights.length - 1].date.getTime() - weights[0].date.getTime()) / 86400000
    : 0

  if (weights.length < MIN_WEIGHT_READINGS || spanDays < MIN_SPAN_DAYS) {
    return {
      ok: false, reason: 'insufficient_data',
      weightReadings: weights.length,
      spanDays: round2(spanDays),
      need: `Log your weight at least ${MIN_WEIGHT_READINGS} times over ${MIN_SPAN_DAYS} days`
    }
  }

  // One reading per day (latest wins) to avoid same-day duplicates skewing OLS.
  const byDay = new Map()
  for (const w of weights) byDay.set(w.date.toISOString().slice(0, 10), w)
  const daily = [...byDay.values()].sort((a, b) => a.date - b.date)

  const slopeKgPerDay = weightTrendKgPerDay(daily)
  const trendKgPerWeek = round2(slopeKgPerDay * 7)
  const dailyBalanceKcal = slopeKgPerDay * KCAL_PER_KG

  // Average intake over days with at least one logged meal.
  const intakeByDay = new Map()
  for (const m of meals) {
    const key = m.date.toISOString().slice(0, 10)
    intakeByDay.set(key, (intakeByDay.get(key) || 0) + (Number(m.calories) || 0))
  }
  const intakeDays = intakeByDay.size
  if (intakeDays < MIN_INTAKE_DAYS) {
    return {
      ok: false, reason: 'insufficient_intake_data',
      weightReadings: daily.length, spanDays: round2(spanDays), intakeDays,
      need: `Log meals on at least ${MIN_INTAKE_DAYS} days in the last ${WINDOW_DAYS}`
    }
  }
  const avgIntake = [...intakeByDay.values()].reduce((a, b) => a + b, 0) / intakeDays

  const latestWeightKg = await getLatestWeightKg(userId, user)
  const formulaAnchor = mifflinTdee(user, latestWeightKg)
  let learnedTDEE = Math.round(avgIntake - dailyBalanceKcal)

  // Sanity clamp against the formula estimate — protects against
  // systematically under-logged meals or bad scale entries.
  if (formulaAnchor && (learnedTDEE < formulaAnchor * 0.6 || learnedTDEE > formulaAnchor * 1.8)) {
    return {
      ok: false, reason: 'unreliable_data',
      weightReadings: daily.length, spanDays: round2(spanDays), intakeDays,
      need: 'Your weight trend and logged intake disagree — check for missed meals or scale errors'
    }
  }

  const confidence =
    (daily.length >= 20 && intakeDays >= 20) ? 'high' :
    (daily.length >= 14 && intakeDays >= 10) ? 'medium' : 'low'

  return {
    ok: true,
    learnedTDEE,
    trendKgPerWeek,
    avgIntake: Math.round(avgIntake),
    daysCovered: Math.round(spanDays),
    weightReadings: daily.length,
    intakeDays,
    confidence,
    series: daily.map(w => ({ date: w.date.toISOString().slice(0, 10), weight: round2(w.weight) }))
  }
}

function goalAdjustment(fitnessGoal) {
  const g = String(fitnessGoal || '').toLowerCase()
  if (/(loss|lose|cut|fat|slim|shred)/.test(g)) return { adjustment: -500, goal: 'fat_loss' }
  if (/(muscle|gain|bulk|build)/.test(g)) return { adjustment: 250, goal: 'muscle_gain' }
  return { adjustment: 0, goal: 'maintain' }
}

// GET /api/coaching/tdee — learned TDEE from the last 28 days
router.get('/tdee', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const analysis = await analyseEnergyBalance(req.userId, user)
    if (!analysis.ok) {
      const latestWeightKg = await getLatestWeightKg(req.userId, user)
      return res.status(200).json({
        status: 'insufficient_data',
        reason: analysis.reason,
        need: analysis.need,
        fallbackTDEE: mifflinTdee(user, latestWeightKg),
        estimated: true
      })
    }

    res.status(200).json({ status: 'ok', estimated: false, ...analysis })
  } catch (err) {
    console.error('Coaching TDEE error:', err.message)
    res.status(500).json({ error: 'Failed to calculate TDEE' })
  }
})

// GET /api/coaching/targets — calorie + macro targets from learned TDEE (or formula fallback)
router.get('/targets', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const analysis = await analyseEnergyBalance(req.userId, user)
    const latestWeightKg = await getLatestWeightKg(req.userId, user)
    const base = analysis.ok ? analysis.learnedTDEE : (mifflinTdee(user, latestWeightKg) ?? 2000)

    const { adjustment, goal } = goalAdjustment(user.fitnessGoal)
    const calorieTarget = Math.round((base + adjustment) / 10) * 10

    const weightKg = latestWeightKg || 70
    const proteinG = Math.round(2 * weightKg)            // 2 g/kg — evidence-based for active adults
    const fatG = Math.round((0.25 * calorieTarget) / 9)   // 25% of calories from fat
    const carbsG = Math.max(0, Math.round((calorieTarget - proteinG * 4 - fatG * 9) / 4))

    res.status(200).json({
      calorieTarget, proteinG, carbsG, fatG,
      goal, adjustment,
      basedOn: analysis.ok ? 'learned' : 'estimate',
      confidence: analysis.ok ? analysis.confidence : null
    })
  } catch (err) {
    console.error('Coaching targets error:', err.message)
    res.status(500).json({ error: 'Failed to calculate targets' })
  }
})

// ---------------------------------------------------------------------------
// Readiness score (0-100) — software-only recovery proxy, Whoop-style.
//
//   50% sleep: last night's log (within 40h). Hours scored against an 8h
//              ideal, blended with subjective quality (1-5).
//   30% recent training strain: sessions + calories in the last 48h —
//              heavy recent load lowers readiness.
//   20% soreness: self-reported 1-5 via ?soreness (default 3).
// Missing components degrade to a neutral 70; no data at all -> 70 'Steady'.
// ---------------------------------------------------------------------------

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
  Recover: 'Take it easy today — light movement, extra sleep and hydrate well.'
}

// GET /api/coaching/readiness?soreness=1-5
router.get('/readiness', authMiddleware, async (req, res) => {
  try {
    let soreness = Number(req.query.soreness)
    if (!Number.isInteger(soreness) || soreness < 1 || soreness > 5) soreness = 3

    const now = new Date()
    const sleepCutoff = new Date(now.getTime() - 40 * 3600 * 1000)
    const strainCutoff = new Date(now.getTime() - 48 * 3600 * 1000)

    // Guarded: the SleepLog model is applied centrally; degrade gracefully until then.
    let lastSleep = null
    if (prisma.sleepLog) {
      lastSleep = await prisma.sleepLog.findFirst({
        where: { userId: req.userId, date: { gte: sleepCutoff } },
        orderBy: { date: 'desc' }
      })
    }

    const recentWorkouts = await prisma.workout.findMany({
      where: { userId: req.userId, completedAt: { gte: strainCutoff } },
      select: { calories: true }
    })

    let sleepScore = null
    if (lastSleep) {
      const hoursScore = Math.max(0, 100 - 14 * Math.abs(lastSleep.hours - 8))
      const qualityScore = lastSleep.quality * 20
      sleepScore = Math.round(0.6 * hoursScore + 0.4 * qualityScore)
    }

    const recentKcal = recentWorkouts.reduce((a, w) => a + (Number(w.calories) || 0), 0)
    const strainScore = Math.max(0, Math.round(100 - (recentWorkouts.length * 15 + recentKcal / 40)))

    const sorenessScore = (6 - soreness) * 25 // 1 -> 100, 5 -> 25

    const hasAnyData = lastSleep || recentWorkouts.length > 0 || req.query.soreness !== undefined
    const score = hasAnyData
      ? Math.round(0.5 * (sleepScore ?? 70) + 0.3 * strainScore + 0.2 * sorenessScore)
      : 70

    const zone = readinessZone(score)
    res.status(200).json({
      score, zone,
      suggestion: ZONE_ADVICE[zone],
      soreness,
      components: {
        sleep: sleepScore,
        strain: strainScore,
        soreness: sorenessScore,
        sessionsLast48h: recentWorkouts.length
      },
      dataQuality: hasAnyData ? (lastSleep ? 'good' : 'partial') : 'none'
    })
  } catch (err) {
    console.error('Coaching readiness error:', err.message)
    res.status(500).json({ error: 'Failed to calculate readiness' })
  }
})

module.exports = router
