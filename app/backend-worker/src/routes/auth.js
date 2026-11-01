// ─── Auth routes (Hono) ─────────────────────────────────────────────────────
// Port of app/backend/routes/auth.js. Same endpoints, same semantics:
// rotating refresh tokens (hash-stored), reuse detection, single-use reset
// tokens, user-enumeration guards, BMI recompute on profile update.
//
// Passwords: PBKDF2-SHA256 for new hashes; legacy bcrypt ($2a$/$2b$) hashes
// from the Express backend verify via hash-wasm and are upgraded to PBKDF2
// on the next successful login.

import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { authMiddleware, ipRateLimit } from '../middleware/auth.js'
import { randomHex, hashToken, hashPassword, verifyPassword, MAX_PASSWORD_LEN } from '../utils/crypto.js'
import { sendPasswordResetEmail } from '../utils/mailer.js'

const app = new Hono()
const auth = authMiddleware()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LEN = 10
const ACCESS_TOKEN_TTL_S = 3600 // 1h
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

async function signAccessToken(env, userId) {
  return sign(
    { userId, exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_S },
    env.JWT_SECRET,
    'HS256'
  )
}

async function issueRefreshToken(prisma, userId) {
  const raw = randomHex(48)
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: await hashToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })
  return raw
}

async function tokenPair(env, prisma, userId) {
  return { token: await signAccessToken(env, userId), refreshToken: await issueRefreshToken(prisma, userId) }
}

// Stricter limits on the credential endpoints (brute-force protection)
const authLimiter = () => ipRateLimit(20, 15 * 60 * 1000)
const resetRequestLimiter = () => ipRateLimit(5, 60 * 60 * 1000)

// POST /api/auth/register
app.post('/register', authLimiter(), async (c) => {
  try {
    const prisma = c.get('prisma')
    const { name, email, password } = await c.req.json()

    if (!name || !email || !password) return c.json({ error: 'All fields required' }, 400)

    const normEmail = String(email).trim().toLowerCase()
    if (!EMAIL_RE.test(normEmail)) return c.json({ error: 'Invalid email address' }, 400)
    if (password.length < MIN_PASSWORD_LEN)
      return c.json({ error: `Password must be at least ${MIN_PASSWORD_LEN} characters` }, 400)
    if (password.length > MAX_PASSWORD_LEN)
      return c.json({ error: `Password must be at most ${MAX_PASSWORD_LEN} characters` }, 400)

    // Do NOT reveal whether the email is taken (user-enumeration guard).
    const existing = await prisma.user.findFirst({
      where: { email: { equals: normEmail, mode: 'insensitive' } },
    })
    if (existing)
      return c.json(
        { message: 'If this email is new, an account was created. Please sign in.' },
        201
      )

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: { name: String(name).trim(), email: normEmail, password: hashedPassword },
    })

    const pair = await tokenPair(c.env, prisma, user.id)
    return c.json(
      { ...pair, user: { id: user.id, email: user.email, name: user.name } },
      201
    )
  } catch (err) {
    console.error('Register error:', err.message)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// POST /api/auth/login
app.post('/login', authLimiter(), async (c) => {
  try {
    const prisma = c.get('prisma')
    const { email, password } = await c.req.json()

    if (!email || !password) return c.json({ error: 'Email and password required' }, 400)

    const user = await prisma.user.findFirst({
      where: { email: { equals: String(email).trim(), mode: 'insensitive' } },
    })
    if (!user) return c.json({ error: 'Invalid email or password' }, 401)

    const { valid, upgradedHash } = await verifyPassword(password, user.password)
    if (!valid) return c.json({ error: 'Invalid email or password' }, 401)

    // Transparent upgrade: legacy bcrypt hash → PBKDF2 on successful login.
    if (upgradedHash) {
      await prisma.user.update({ where: { id: user.id }, data: { password: upgradedHash } })
    }

    const pair = await tokenPair(c.env, prisma, user.id)
    const { password: _pw, ...safeUser } = user
    return c.json({ ...pair, user: safeUser })
  } catch (err) {
    console.error('Login error:', err.message)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// POST /api/auth/demo — one-tap guest access, no credentials required.
// Shared demo account (demo@nutriai.app), created on first use with a random
// password nobody knows. Mirrors the Express backend's demo endpoint.
const DEMO_EMAIL = 'demo@nutriai.app'
app.post('/demo', authLimiter(), async (c) => {
  try {
    const prisma = c.get('prisma')
    let user = await prisma.user.findFirst({
      where: { email: { equals: DEMO_EMAIL, mode: 'insensitive' } },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Demo Guest',
          email: DEMO_EMAIL,
          password: await hashPassword(randomHex(32)),
          fitnessGoal: 'general-health',
          dietType: 'balanced',
          activityLevel: 'moderate',
          calorieGoal: 2000,
          proteinGoal: 150,
          carbGoal: 250,
          fatGoal: 65,
        },
      })
    }

    const pair = await tokenPair(c.env, prisma, user.id)
    const { password: _pw, ...safeUser } = user
    return c.json({ ...pair, user: { ...safeUser, isDemo: true } })
  } catch (err) {
    console.error('Demo login error:', err.message)
    return c.json({ error: 'Demo login failed' }, 500)
  }
})

// POST /api/auth/refresh — rotate the refresh token, issue a new access token.
app.post('/refresh', async (c) => {
  try {
    const prisma = c.get('prisma')
    const { refreshToken } = await c.req.json()
    if (!refreshToken || typeof refreshToken !== 'string')
      return c.json({ error: 'Refresh token required' }, 400)

    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash: await hashToken(refreshToken) },
    })

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      if (record) {
        await prisma.refreshToken.updateMany({
          where: { userId: record.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      }
      return c.json({ error: 'Session expired — please sign in again' }, 401)
    }

    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    })
    const raw = randomHex(48)
    await prisma.refreshToken.create({
      data: {
        userId: record.userId,
        tokenHash: await hashToken(raw),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    })

    return c.json({ token: await signAccessToken(c.env, record.userId), refreshToken: raw })
  } catch (err) {
    console.error('Refresh error:', err.message)
    return c.json({ error: 'Session refresh failed' }, 500)
  }
})

// POST /api/auth/logout
app.post('/logout', async (c) => {
  try {
    const prisma = c.get('prisma')
    const body = await c.req.json().catch(() => ({}))
    const { refreshToken, all } = body || {}
    const authHeader = c.req.header('authorization')
    if (all && authHeader) {
      try {
        const token = authHeader.split(' ')[1]
        const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
        await prisma.refreshToken.updateMany({
          where: { userId: decoded.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      } catch {
        /* expired/invalid access token — nothing to revoke by user */
      }
    } else if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: await hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
    return c.json({ success: true })
  } catch (err) {
    console.error('Logout error:', err.message)
    return c.json({ error: 'Logout failed' }, 500)
  }
})

// POST /api/auth/forgot-password
app.post('/forgot-password', resetRequestLimiter(), async (c) => {
  const generic = { message: 'If that email is registered, a reset link is on its way.' }
  try {
    const prisma = c.get('prisma')
    const { email } = await c.req.json()
    if (!email || !EMAIL_RE.test(String(email))) return c.json(generic)

    const user = await prisma.user.findUnique({ where: { email: String(email) } })
    if (!user) return c.json(generic)

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    })

    const raw = randomHex(32)
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: await hashToken(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    try {
      await sendPasswordResetEmail(c.env, user.email, raw)
    } catch (e) {
      console.error('Reset email failed:', e.message)
    }
    return c.json(generic)
  } catch (err) {
    console.error('Forgot-password error:', err.message)
    return c.json(generic)
  }
})

// POST /api/auth/reset-password
app.post('/reset-password', resetRequestLimiter(), async (c) => {
  try {
    const prisma = c.get('prisma')
    const { token, newPassword } = await c.req.json()
    if (!token || typeof token !== 'string')
      return c.json({ error: 'Reset token required' }, 400)
    if (!newPassword || newPassword.length < MIN_PASSWORD_LEN)
      return c.json({ error: `Password must be at least ${MIN_PASSWORD_LEN} characters` }, 400)
    if (newPassword.length > MAX_PASSWORD_LEN)
      return c.json({ error: `Password must be at most ${MAX_PASSWORD_LEN} characters` }, 400)

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: await hashToken(token) },
    })
    if (!record || record.usedAt || record.expiresAt < new Date())
      return c.json({ error: 'This reset link is invalid or has expired' }, 400)

    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    })

    await prisma.user.update({
      where: { id: record.userId },
      data: { password: await hashPassword(newPassword) },
    })
    await prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    return c.json({ message: 'Password updated — please sign in again.' })
  } catch (err) {
    console.error('Reset-password error:', err.message)
    return c.json({ error: 'Password reset failed' }, 500)
  }
})

// GET /api/auth/me
app.get('/me', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const user = await prisma.user.findUnique({ where: { id: c.get('userId') } })
    if (!user) return c.json({ error: 'User not found' }, 404)
    const { password: _pw, ...safeUser } = user
    return c.json(safeUser)
  } catch (err) {
    console.error('Get me error:', err.message)
    return c.json({ error: 'Failed to load profile' }, 500)
  }
})

// PUT /api/auth/profile — whitelisted fields only, with type validation
const STRING_FIELDS = ['name', 'phone', 'dob', 'gender', 'location', 'fitnessGoal', 'dietType', 'activityLevel']
const FLOAT_FIELDS = ['height', 'weight', 'targetWeight', 'bodyFat', 'muscleMass', 'waterGoal', 'sleepGoal']
const INT_FIELDS = ['calorieGoal', 'proteinGoal', 'carbGoal', 'fatGoal']

app.put('/profile', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const body = await c.req.json()
    const updates = {}

    for (const f of STRING_FIELDS) {
      if (body[f] !== undefined) {
        if (typeof body[f] !== 'string') return c.json({ error: `Invalid value for ${f}` }, 400)
        updates[f] = body[f]
      }
    }
    for (const f of FLOAT_FIELDS) {
      if (body[f] !== undefined) {
        const n = Number(body[f])
        if (!Number.isFinite(n) || n < 0) return c.json({ error: `Invalid value for ${f}` }, 400)
        updates[f] = n
      }
    }
    for (const f of INT_FIELDS) {
      if (body[f] !== undefined) {
        const n = Number(body[f])
        if (!Number.isInteger(n) || n < 0) return c.json({ error: `Invalid value for ${f}` }, 400)
        updates[f] = n
      }
    }

    if (updates.height !== undefined || updates.weight !== undefined) {
      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { height: true, weight: true },
      })
      const height = updates.height !== undefined ? updates.height : current?.height
      const weight = updates.weight !== undefined ? updates.weight : current?.weight
      if (height && weight) {
        const hMeters = height / 100
        updates.bmi = parseFloat((weight / (hMeters * hMeters)).toFixed(1))
      } else {
        updates.bmi = null
      }
    }

    updates.updatedAt = new Date()
    const user = await prisma.user.update({ where: { id: userId }, data: updates })
    const { password: _pw, ...safeUser } = user
    return c.json(safeUser)
  } catch (err) {
    console.error('Profile update error:', err.message)
    return c.json({ error: 'Profile update failed' }, 500)
  }
})

export default app
