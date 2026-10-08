// ─── Google Fit integration routes (Hono) ───────────────────────────────────
// Port of app/backend/routes/integrations.js. Real OAuth 2.0 + data sync.
// All network I/O is plain fetch (Workers-safe). Token encryption uses the
// WebCrypto port in utils/crypto.js (same "iv:ct:tag" format as the Express
// backend, so existing ConnectedAccount rows keep working).
//
// NOTE: BACKEND_URL must be the deployed Workers URL — update the Authorized
// redirect URI in the Google Cloud Console OAuth client to match
// <BACKEND_URL>/api/integrations/google-fit/callback (see
// docs/cloudflare-migration.md).

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { randomHex, encryptToken, decryptTokenLenient } from '../utils/crypto.js'

const app = new Hono()
const auth = authMiddleware()

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

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000

function redirectUri(env) {
  const base = (env.BACKEND_URL || 'https://nutriai-backend-nu.vercel.app').replace(/\/$/, '')
  return `${base}/api/integrations/google-fit/callback`
}

function frontendUrl(env) {
  return (env.FRONTEND_URL || 'https://nutriai-frontend-three.vercel.app').replace(/\/$/, '')
}

function credsReady(env) {
  return Boolean(env.GOOGLE_FIT_CLIENT_ID && env.GOOGLE_FIT_CLIENT_SECRET)
}

function isProd(env) {
  return env.NODE_ENV === 'production'
}

const ACTIVITY_NAMES = {
  1: 'Cycling', 7: 'Walking', 8: 'Running', 9: 'Aerobics', 10: 'Badminton',
  14: 'Dancing', 16: 'Elliptical', 19: 'Gym', 21: 'Golf', 24: 'HIIT',
  29: 'Jump Rope', 44: 'Pilates', 47: 'Yoga', 54: 'Rowing', 56: 'Stair Climbing',
  72: 'Tennis', 82: 'Swimming', 84: 'Treadmill', 97: 'Strength Training',
  113: 'CrossFit', 116: 'Boxing', 148: 'Hiking', 0: 'Workout',
}
const ACTIVITY_KCAL_PER_MIN = {
  Running: 10, Cycling: 8, Swimming: 9, Walking: 4, Hiking: 6,
  'Strength Training': 6, CrossFit: 9, HIIT: 9, Boxing: 8, Rowing: 8,
  Elliptical: 7, 'Stair Climbing': 8, Treadmill: 9, Aerobics: 7,
  Dancing: 5, 'Jump Rope': 10, Tennis: 7, Badminton: 6, Yoga: 3,
  Pilates: 4, Golf: 4, Gym: 6, Workout: 6,
}

async function createOAuthState(prisma, userId, provider) {
  const state = randomHex(32)
  await prisma.oAuthState.create({
    data: { state, userId, provider, expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS) },
  })
  return state
}

async function consumeOAuthState(prisma, state, provider) {
  if (!state || typeof state !== 'string') return null
  const row = await prisma.oAuthState.findUnique({ where: { state } })
  if (row && row.provider === provider) {
    await prisma.oAuthState.delete({ where: { state } }).catch(() => {})
    if (row.expiresAt > new Date()) return row.userId
    return null
  }
  if (row) await prisma.oAuthState.delete({ where: { state } }).catch(() => {})
  return null
}

async function encryptAccountTokens(env, data) {
  const out = { ...data }
  const key = env.TOKEN_ENCRYPTION_KEY
  if (out.accessToken) out.accessToken = await encryptToken(out.accessToken, key, isProd(env))
  if (out.refreshToken) out.refreshToken = await encryptToken(out.refreshToken, key, isProd(env))
  return out
}

async function decryptAccountTokens(env, account) {
  if (!account) return account
  const key = env.TOKEN_ENCRYPTION_KEY
  return {
    ...account,
    accessToken: await decryptTokenLenient(account.accessToken, key, isProd(env)),
    refreshToken: account.refreshToken
      ? await decryptTokenLenient(account.refreshToken, key, isProd(env))
      : account.refreshToken,
  }
}

async function exchangeCode(env, code) {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_FIT_CLIENT_ID,
    client_secret: env.GOOGLE_FIT_CLIENT_SECRET,
    redirect_uri: redirectUri(env),
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

async function refreshAccessToken(prisma, env, account) {
  const acc = await decryptAccountTokens(env, account)
  if (!acc.refreshToken) throw new Error('No refresh token — please reconnect Google Fit')
  const body = new URLSearchParams({
    refresh_token: acc.refreshToken,
    client_id: env.GOOGLE_FIT_CLIENT_ID,
    client_secret: env.GOOGLE_FIT_CLIENT_SECRET,
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
    where: { id: acc.id },
    data: await encryptAccountTokens(env, {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    }),
  })
  return decryptAccountTokens(env, updated)
}

async function fitFetch(prisma, env, account, path, options = {}) {
  let acc = await decryptAccountTokens(env, account)
  if (acc.expiresAt && acc.expiresAt.getTime() - Date.now() < 60_000) {
    acc = await refreshAccessToken(prisma, env, acc)
  }
  const r = await fetch(`${FIT_BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${acc.accessToken}`, ...(options.headers || {}) },
  })
  if (r.status === 401 && acc.refreshToken) {
    acc = await refreshAccessToken(prisma, env, acc)
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

async function aggregate(prisma, env, account, dataTypeName, startMs, endMs) {
  return fitFetch(prisma, env, account, '/dataset:aggregate', {
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

// GET /api/integrations/google-fit/connect
app.get('/google-fit/connect', auth, async (c) => {
  try {
    const env = c.env
    const prisma = c.get('prisma')
    if (!credsReady(env)) {
      return c.json(
        {
          success: false,
          error:
            'Google Fit is not configured on the server (missing GOOGLE_FIT_CLIENT_ID / GOOGLE_FIT_CLIENT_SECRET)',
        },
        500
      )
    }
    const state = await createOAuthState(prisma, c.get('userId'), PROVIDER)
    const params = new URLSearchParams({
      client_id: env.GOOGLE_FIT_CLIENT_ID,
      redirect_uri: redirectUri(env),
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
    })
    return c.json({ success: true, url: `${GOOGLE_AUTH_URL}?${params.toString()}` })
  } catch (err) {
    console.error('Google Fit connect error:', err.message)
    return c.json({ success: false, error: 'Could not start Google Fit connection' }, 500)
  }
})

// GET /api/integrations/google-fit/callback
app.get('/google-fit/callback', async (c) => {
  const env = c.env
  const prisma = c.get('prisma')
  const fail = (msg) =>
    c.redirect(`${frontendUrl(env)}/profile?tab=apps&gfit=error&msg=${encodeURIComponent(msg)}`)
  try {
    const { code, state, error } = c.req.query()
    if (error) return fail(`Google: ${error}`)
    if (!code || !state) return fail('Missing code or state')
    const userId = await consumeOAuthState(prisma, state, PROVIDER)
    if (!userId) return fail('Session expired — please connect again')
    const tokens = await exchangeCode(env, code)
    const tokenData = await encryptAccountTokens(env, {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
      scopes: tokens.scope || SCOPES,
    })
    await prisma.connectedAccount.upsert({
      where: { userId_provider: { userId, provider: PROVIDER } },
      update: {
        ...tokenData,
        ...(tokens.refresh_token
          ? { refreshToken: await encryptToken(tokens.refresh_token, env.TOKEN_ENCRYPTION_KEY, isProd(env)) }
          : {}),
      },
      create: {
        userId,
        provider: PROVIDER,
        ...tokenData,
        refreshToken: tokens.refresh_token
          ? await encryptToken(tokens.refresh_token, env.TOKEN_ENCRYPTION_KEY, isProd(env))
          : null,
      },
    })
    return c.redirect(`${frontendUrl(env)}/profile?tab=apps&gfit=connected`)
  } catch (err) {
    console.error('Google Fit callback error:', err.message)
    return fail('Could not complete the Google Fit connection — please try again')
  }
})

// GET /api/integrations/google-fit/status
app.get('/google-fit/status', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const acc = await prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId: c.get('userId'), provider: PROVIDER } },
      select: { lastSyncAt: true, createdAt: true },
    })
    return c.json({ success: true, connected: Boolean(acc), lastSyncAt: acc?.lastSyncAt || null })
  } catch (err) {
    console.error('Google Fit status error:', err.message)
    return c.json({ success: false, error: 'Could not check Google Fit status' }, 500)
  }
})

// POST /api/integrations/google-fit/sync
app.post('/google-fit/sync', auth, async (c) => {
  try {
    const env = c.env
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const account = await prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId, provider: PROVIDER } },
    })
    if (!account) return c.json({ success: false, error: 'Google Fit not connected' }, 404)

    const now = Date.now()
    const DAY = 86400000
    const summary = { steps: 0, workoutsAdded: 0, sleepNights: 0, weightKg: null }

    try {
      const agg = await aggregate(prisma, env, account, 'com.google.step_count.delta', now - 7 * DAY, now)
      for (const b of agg.bucket || []) {
        for (const ds of b.dataset || []) {
          for (const p of ds.point || []) {
            summary.steps += p.value?.[0]?.intVal || 0
          }
        }
      }
    } catch (e) {
      console.error('Fit steps error:', e.message)
    }

    try {
      const start = new Date(now - 30 * DAY).toISOString()
      const end = new Date(now).toISOString()
      const data = await fitFetch(prisma, env, account, `/sessions?startTime=${start}&endTime=${end}`)
      const sessions = (data.session || []).filter(
        (s) => Number(s.endTimeMillis) - Number(s.startTimeMillis) >= 60000
      )
      const existing = await prisma.workout.findMany({
        where: { userId, completedAt: { gte: new Date(now - 30 * DAY) } },
        select: { name: true, completedAt: true },
      })
      const already = (name, at) =>
        existing.some((w) => w.name === name && Math.abs(new Date(w.completedAt).getTime() - at) < 60000)
      for (const s of sessions) {
        const name = ACTIVITY_NAMES[s.activityType] || s.name || 'Workout'
        const startMs = Number(s.startTimeMillis)
        if (already(name, startMs)) continue
        const mins = Math.round((Number(s.endTimeMillis) - startMs) / 60000)
        const kcalPerMin = ACTIVITY_KCAL_PER_MIN[name] || 6
        await prisma.workout.create({
          data: {
            userId,
            name,
            duration: mins,
            calories: Math.round(mins * kcalPerMin),
            category: 'Imported',
            completedAt: new Date(startMs),
          },
        })
        summary.workoutsAdded++
      }
    } catch (e) {
      console.error('Fit sessions error:', e.message)
    }

    try {
      const agg = await aggregate(prisma, env, account, 'com.google.sleep.segment', now - 7 * DAY, now)
      for (const b of agg.bucket || []) {
        let asleepMs = 0,
          deepRemMs = 0
        for (const ds of b.dataset || []) {
          for (const p of ds.point || []) {
            const v = p.value?.[0]?.intVal
            const dur = Number(p.endTimeNanos - p.startTimeNanos) / 1e6
            if ([2, 4, 5, 6].includes(v)) asleepMs += dur
            if ([5, 6].includes(v)) deepRemMs += dur
          }
        }
        if (asleepMs < 3600000) continue
        const hours = Math.round((asleepMs / 3600000) * 10) / 10
        const quality = Math.max(1, Math.min(5, Math.round(1 + 4 * (deepRemMs / asleepMs))))
        const day = dayStartUTC(new Date(Number(b.startTimeMillis)))
        await prisma.sleepLog.upsert({
          where: { userId_date: { userId, date: day } },
          update: { hours, quality },
          create: { userId, date: day, hours, quality },
        })
        summary.sleepNights++
      }
    } catch (e) {
      console.error('Fit sleep error:', e.message)
    }

    try {
      const agg = await aggregate(prisma, env, account, 'com.google.weight', now - 30 * DAY, now)
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
          where: { userId, date: { gte: day, lt: new Date(day.getTime() + DAY) } },
        })
        if (!dup) {
          await prisma.weightLog.create({
            data: { userId, weight: summary.weightKg, date: new Date(latest.at) },
          })
        }
      }
    } catch (e) {
      console.error('Fit weight error:', e.message)
    }

    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    })

    return c.json({ success: true, summary, lastSyncAt: new Date() })
  } catch (err) {
    console.error('Google Fit sync error:', err.message)
    return c.json({ success: false, error: 'Google Fit sync failed' }, 500)
  }
})

// DELETE /api/integrations/google-fit/disconnect
app.delete('/google-fit/disconnect', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    await prisma.connectedAccount.deleteMany({
      where: { userId: c.get('userId'), provider: PROVIDER },
    })
    return c.json({ success: true })
  } catch (err) {
    console.error('Google Fit disconnect error:', err.message)
    return c.json({ success: false, error: 'Could not disconnect Google Fit' }, 500)
  }
})

export default app
