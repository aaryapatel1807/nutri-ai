const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')
const AuthService = require('../services/auth.service')

// ---------------------------------------------------------------------------
// Google Fit integration — real OAuth 2.0 + data sync.
//
// Setup (one time, by the app owner, all free):
//   1. Google Cloud Console → new project → enable "Fitness API"
//   2. OAuth consent screen → External → Testing mode → add your own
//      Google account as a test user (no verification needed for personal use)
//   3. Credentials → OAuth client ID → Web application → Authorized
//      redirect URI: <BACKEND_URL>/api/integrations/google-fit/callback
//   4. Set GOOGLE_FIT_CLIENT_ID / GOOGLE_FIT_CLIENT_SECRET env vars.
//
// Flow:
//   GET  /api/integrations/google-fit/connect    → { url } (authed)
//   GET  /api/integrations/google-fit/callback   → Google redirects here
//   GET  /api/integrations/google-fit/status     → { connected, lastSyncAt }
//   POST /api/integrations/google-fit/sync       → pulls & stores data
//   DELETE /api/integrations/google-fit/disconnect
// ---------------------------------------------------------------------------

const PROVIDER = 'google-fit'
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const FIT_BASE = 'https://www.googleapis.com/fitness/v1/users/me'

const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
].join(' ')

function redirectUri() {
  const base = (process.env.BACKEND_URL || 'https://nutriai-backend-nu.vercel.app').replace(/\/$/, '')
  return `${base}/api/integrations/google-fit/callback`
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || 'https://nutriai-frontend-three.vercel.app').replace(/\/$/, '')
}

function credsReady() {
  return Boolean(process.env.GOOGLE_FIT_CLIENT_ID && process.env.GOOGLE_FIT_CLIENT_SECRET)
}

// Google Fit activity-type codes → display names
const ACTIVITY_NAMES = {
  1: 'Cycling', 7: 'Walking', 8: 'Running', 9: 'Aerobics', 10: 'Badminton',
  14: 'Dancing', 16: 'Elliptical', 19: 'Gym', 21: 'Golf', 24: 'HIIT',
  29: 'Jump Rope', 44: 'Pilates', 47: 'Yoga', 54: 'Rowing', 56: 'Stair Climbing',
  72: 'Tennis', 82: 'Swimming', 84: 'Treadmill', 97: 'Strength Training',
  113: 'CrossFit', 116: 'Boxing', 148: 'Hiking', 0: 'Workout',
}
// Rough kcal/min estimates per activity (Google Fit sessions carry no calories)
const ACTIVITY_KCAL_PER_MIN = {
  'Running': 10, 'Cycling': 8, 'Swimming': 9, 'Walking': 4, 'Hiking': 6,
  'Strength Training': 6, 'CrossFit': 9, 'HIIT': 9, 'Boxing': 8, 'Rowing': 8,
  'Elliptical': 7, 'Stair Climbing': 8, 'Treadmill': 9, 'Aerobics': 7,
  'Dancing': 5, 'Jump Rope': 10, 'Tennis': 7, 'Badminton': 6, 'Yoga': 3,
  'Pilates': 4, 'Golf': 4, 'Gym': 6, 'Workout': 6,
}

// --- token helpers ---------------------------------------------------------

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_FIT_CLIENT_ID,
    client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET,
    redirect_uri: redirectUri(),
    grant_type: 'authorization_code',
  })
  const r = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error_description || data.error || 'Token exchange failed')
  return data
}

async function refreshAccessToken(account) {
  if (!account.refreshToken) throw new Error('No refresh token — please reconnect Google Fit')
  const body = new URLSearchParams({
    refresh_token: account.refreshToken,
    client_id: process.env.GOOGLE_FIT_CLIENT_ID,
    client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET,
    grant_type: 'refresh_token',
  })
  const r = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error_description || data.error || 'Token refresh failed')
  const updated = await prisma.connectedAccount.update({
    where: { id: account.id },
    data: {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    },
  })
  return updated
}

async function fitFetch(account, path, options = {}) {
  let acc = account
  if (acc.expiresAt && acc.expiresAt.getTime() - Date.now() < 60_000) {
    acc = await refreshAccessToken(acc)
  }
  const r = await fetch(`${FIT_BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${acc.accessToken}`, ...(options.headers || {}) },
  })
  if (r.status === 401 && acc.refreshToken) {
    acc = await refreshAccessToken(acc)
    const retry = await fetch(`${FIT_BASE}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${acc.accessToken}`, ...(options.headers || {}) },
    })
    if (!retry.ok) throw new Error(`Google Fit request failed (${retry.status})`)
    return retry.json()
  }
  if (!r.ok) throw new Error(`Google Fit request failed (${r.status})`)
  return r.json()
}

async function aggregate(account, dataTypeName, startMs, endMs) {
  return fitFetch(account, '/dataset:aggregate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startMs,
      endTimeMillis: endMs,
    }),
  })
}

const dayStartUTC = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

// --- routes ----------------------------------------------------------------

// Step 1: return the Google consent URL (frontend redirects the user there).
// The user's own NutriAI JWT is passed as `state` so the callback can
// identify them (serverless — no shared session store).
router.get('/google-fit/connect', authMiddleware, async (req, res) => {
  try {
    if (!credsReady()) {
      return res.status(500).json({
        success: false,
        error: 'Google Fit is not configured on the server (missing GOOGLE_FIT_CLIENT_ID / GOOGLE_FIT_CLIENT_SECRET)',
      })
    }
    const token = req.headers.authorization?.split(' ')[1]
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_FIT_CLIENT_ID,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',   // needed to receive a refresh_token
      prompt: 'consent',        // ensures refresh_token on every connect
      state: token,
    })
    res.json({ success: true, url: `${GOOGLE_AUTH_URL}?${params.toString()}` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Step 2: Google redirects here after consent. Exchange code → store tokens.
router.get('/google-fit/callback', async (req, res) => {
  const fail = (msg) => res.redirect(`${frontendUrl()}/profile?tab=apps&gfit=error&msg=${encodeURIComponent(msg)}`)
  try {
    const { code, state, error } = req.query
    if (error) return fail(`Google: ${error}`)
    if (!code || !state) return fail('Missing code or state')
    let userId
    try {
      const decoded = await new AuthService().verifyToken(state)
      userId = decoded.userId
    } catch {
      return fail('Session expired — please connect again')
    }
    const tokens = await exchangeCode(code)
    await prisma.connectedAccount.upsert({
      where: { userId_provider: { userId, provider: PROVIDER } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
        scopes: tokens.scope || SCOPES,
      },
      create: {
        userId,
        provider: PROVIDER,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
        scopes: tokens.scope || SCOPES,
      },
    })
    res.redirect(`${frontendUrl()}/profile?tab=apps&gfit=connected`)
  } catch (err) {
    console.error('Google Fit callback error:', err.message)
    fail(err.message)
  }
})

// Connection status for the profile page
router.get('/google-fit/status', authMiddleware, async (req, res) => {
  try {
    const acc = await prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId: req.userId, provider: PROVIDER } },
      select: { lastSyncAt: true, createdAt: true },
    })
    res.json({ success: true, connected: Boolean(acc), lastSyncAt: acc?.lastSyncAt || null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Pull recent Google Fit data into NutriAI (workouts, sleep, weight, steps)
router.post('/google-fit/sync', authMiddleware, async (req, res) => {
  try {
    const account = await prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId: req.userId, provider: PROVIDER } },
    })
    if (!account) return res.status(404).json({ success: false, error: 'Google Fit not connected' })

    const now = Date.now()
    const DAY = 86400000
    const summary = { steps: 0, workoutsAdded: 0, sleepNights: 0, weightKg: null }

    // 1) Steps — last 7 days
    try {
      const agg = await aggregate(account, 'com.google.step_count.delta', now - 7 * DAY, now)
      for (const b of agg.bucket || []) {
        for (const ds of b.dataset || []) {
          for (const p of ds.point || []) {
            summary.steps += (p.value?.[0]?.intVal) || 0
          }
        }
      }
    } catch (e) { console.error('Fit steps error:', e.message) }

    // 2) Workout sessions — last 30 days → Workout rows
    try {
      const start = new Date(now - 30 * DAY).toISOString()
      const end = new Date(now).toISOString()
      const data = await fitFetch(account, `/sessions?startTime=${start}&endTime=${end}`)
      const sessions = (data.session || []).filter(s => Number(s.endTimeMillis) - Number(s.startTimeMillis) >= 60000)
      const existing = await prisma.workout.findMany({
        where: { userId: req.userId, completedAt: { gte: new Date(now - 30 * DAY) } },
        select: { name: true, completedAt: true },
      })
      const already = (name, at) => existing.some(w =>
        w.name === name && Math.abs(new Date(w.completedAt).getTime() - at) < 60000)
      for (const s of sessions) {
        const name = ACTIVITY_NAMES[s.activityType] || s.name || 'Workout'
        const startMs = Number(s.startTimeMillis)
        if (already(name, startMs)) continue
        const mins = Math.round((Number(s.endTimeMillis) - startMs) / 60000)
        const kcalPerMin = ACTIVITY_KCAL_PER_MIN[name] || 6
        await prisma.workout.create({
          data: {
            userId: req.userId,
            name,
            duration: mins,
            calories: Math.round(mins * kcalPerMin),
            category: 'Imported',
            completedAt: new Date(startMs),
          },
        })
        summary.workoutsAdded++
      }
    } catch (e) { console.error('Fit sessions error:', e.message) }

    // 3) Sleep — last 7 days → SleepLog rows (one per night)
    try {
      const agg = await aggregate(account, 'com.google.sleep.segment', now - 7 * DAY, now)
      for (const b of agg.bucket || []) {
        let asleepMs = 0, deepRemMs = 0
        for (const ds of b.dataset || []) {
          for (const p of ds.point || []) {
            const v = p.value?.[0]?.intVal
            const dur = Number(p.endTimeNanos - p.startTimeNanos) / 1e6
            if ([2, 4, 5, 6].includes(v)) asleepMs += dur
            if ([5, 6].includes(v)) deepRemMs += dur
          }
        }
        if (asleepMs < 3600000) continue // ignore naps under an hour
        const hours = Math.round((asleepMs / 3600000) * 10) / 10
        const quality = Math.max(1, Math.min(5, Math.round(1 + 4 * (deepRemMs / asleepMs))))
        const day = dayStartUTC(new Date(Number(b.startTimeMillis)))
        await prisma.sleepLog.upsert({
          where: { userId_date: { userId: req.userId, date: day } },
          update: { hours, quality },
          create: { userId: req.userId, date: day, hours, quality },
        })
        summary.sleepNights++
      }
    } catch (e) { console.error('Fit sleep error:', e.message) }

    // 4) Weight — latest reading in last 30 days → WeightLog
    try {
      const agg = await aggregate(account, 'com.google.weight', now - 30 * DAY, now)
      let latest = null
      for (const b of agg.bucket || []) {
        for (const ds of b.dataset || []) {
          for (const p of ds.point || []) {
            const kg = p.value?.[0]?.fpVal
            const at = Number(p.endTimeNanos || 0) / 1e6
            if (kg && (!latest || at > latest.at)) latest = { kg, at }
          }
        }
      }
      if (latest) {
        summary.weightKg = Math.round(latest.kg * 10) / 10
        const day = dayStartUTC(new Date(latest.at))
        const dup = await prisma.weightLog.findFirst({
          where: { userId: req.userId, date: { gte: day, lt: new Date(day.getTime() + DAY) } },
        })
        if (!dup) {
          await prisma.weightLog.create({
            data: { userId: req.userId, weight: summary.weightKg, date: new Date(latest.at) },
          })
        }
      }
    } catch (e) { console.error('Fit weight error:', e.message) }

    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    })

    res.json({ success: true, summary, lastSyncAt: new Date() })
  } catch (err) {
    console.error('Google Fit sync error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// Disconnect — removes stored tokens
router.delete('/google-fit/disconnect', authMiddleware, async (req, res) => {
  try {
    await prisma.connectedAccount.deleteMany({
      where: { userId: req.userId, provider: PROVIDER },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
