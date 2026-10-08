// ─── Shared middleware (Hono) ───────────────────────────────────────────────
// Ports app/backend/middleware/auth.middleware.js.
//
// - authMiddleware: verifies the Bearer JWT (hono/jwt, HS256, WebCrypto) and
//   sets the userId on the context.
// - rateLimit / userRateLimit: in-memory sliding-window limiters (per isolate).
//   Same semantics as the old express-rate-limit setup — best-effort on
//   serverless, since isolates don't share memory. The DB-backed daily AI
//   quota in routes/ml.js remains the hard guarantee for the AI free tier.

import { verify } from 'hono/jwt'

function jsonError(c, status, payload) {
  return c.json(payload, status)
}

export function authMiddleware() {
  return async (c, next) => {
    try {
      const header = c.req.header('authorization')
      const token = header && header.startsWith('Bearer ') ? header.slice(7) : null
      if (!token) {
        return jsonError(c, 401, { success: false, error: 'No token provided' })
      }
      const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
      if (!decoded || !decoded.userId) throw new Error('bad claims')
      c.set('userId', decoded.userId)
      await next()
    } catch (err) {
      console.log('Auth middleware error:', err.message)
      return jsonError(c, 401, { success: false, error: 'Invalid token' })
    }
  }
}

// Sliding-window rate limiter. `keyFn(c)` selects the bucket (IP, userId…).
export function rateLimit({ max = 100, windowMs = 15 * 60 * 1000, keyFn, message }) {
  const hits = new Map() // key -> array of timestamps (per isolate)
  return async (c, next) => {
    const now = Date.now()
    const key = keyFn(c)
    let times = hits.get(key) || []
    times = times.filter((t) => now - t < windowMs)
    if (times.length >= max) {
      const body =
        typeof message === 'function'
          ? message(windowMs)
          : message || { success: false, error: 'Too many requests' }
      const res = jsonError(c, 429, body)
      res.headers.set('Retry-After', String(Math.ceil(windowMs / 1000)))
      return res
    }
    times.push(now)
    hits.set(key, times)
    // Opportunistic cleanup so the map can't grow without bound.
    if (hits.size > 10000) {
      for (const [k, v] of hits) {
        if (v.length === 0 || now - v[v.length - 1] >= windowMs) hits.delete(k)
      }
    }
    await next()
  }
}

const clientIp = (c) =>
  c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

export function ipRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    max: maxRequests,
    windowMs,
    keyFn: clientIp,
    message: (w) => ({
      success: false,
      error: 'Too many requests',
      retryAfter: Math.ceil(w / 1000),
    }),
  })
}

// Per-user variant — keys on the authenticated userId (falls back to IP).
// Must be mounted AFTER authMiddleware so the userId is set.
export function userRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    max: maxRequests,
    windowMs,
    keyFn: (c) => c.get('userId') || clientIp(c),
    message: (w) => ({
      success: false,
      error: 'Too many requests — please slow down',
      retryAfter: Math.ceil(w / 1000),
    }),
  })
}

export function prismaErrorHandler() {
  return async (c, next) => {
    try {
      await next()
    } catch (err) {
      console.error('Error:', err)
      if (err.code === 'P2002') {
        return jsonError(c, 400, { success: false, error: 'Unique constraint violation' })
      }
      if (err.code === 'P2025') {
        return jsonError(c, 404, { success: false, error: 'Record not found' })
      }
      throw err
    }
  }
}
