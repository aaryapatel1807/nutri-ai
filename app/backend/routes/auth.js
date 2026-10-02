const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { authMiddleware, rateLimitMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')
const { hashToken } = require('../utils/tokenCrypto')
const { sendPasswordResetEmail } = require('../utils/mailer')

// Stricter limits on the credential endpoints (brute-force protection)
const authLimiter = rateLimitMiddleware(20, 15 * 60 * 1000)
// Password-reset request endpoint — abused for email spam, so limit harder
const resetRequestLimiter = rateLimitMiddleware(5, 60 * 60 * 1000)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LEN = 10

// Access tokens are short-lived (1h). Long sessions use rotating refresh
// tokens (see POST /refresh) which can be revoked server-side.
const ACCESS_TOKEN_TTL = '1h'
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function signAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: ACCESS_TOKEN_TTL,
  })
}

// Issue a refresh token: store only the SHA-256 hash, return the raw value
// once. Logins create independent chains per device — only a password reset
// or refresh-token reuse (theft signal) revokes every chain.
async function issueRefreshToken(userId) {
  const raw = crypto.randomBytes(48).toString('hex')
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })
  return raw
}

function tokenPair(userId, refreshToken) {
  return { token: signAccessToken(userId), refreshToken }
}

// REGISTER
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' })

    // Normalize: the mobile app lowercases+trims, the web sends raw input.
    // Storing normalized prevents case/whitespace login mismatches.
    const normEmail = String(email).trim().toLowerCase()

    if (!EMAIL_RE.test(normEmail))
      return res.status(400).json({ error: 'Invalid email address' })

    if (password.length < MIN_PASSWORD_LEN)
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LEN} characters` })

    // Do NOT reveal whether the email is taken (user-enumeration guard).
    // An existing address gets the same 201 + generic message, but no
    // account is created and no token is issued.
    // Case-insensitive: older accounts may have been stored un-normalized.
    const existing = await prisma.user.findFirst({
      where: { email: { equals: normEmail, mode: 'insensitive' } },
    })
    if (existing)
      return res.status(201).json({
        message: 'If this email is new, an account was created. Please sign in.',
      })

    // Hash password and store in `password` field (matches schema)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: { name: String(name).trim(), email: normEmail, password: hashedPassword }
    })

    const refreshToken = await issueRefreshToken(user.id)

    res.status(201).json({
      ...tokenPair(user.id, refreshToken),
      user: { id: user.id, email: user.email, name: user.name }
    })
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// LOGIN
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' })

    // Case-insensitive + trimmed lookup: the mobile app normalizes the email
    // but the web historically sent raw input, so stored values may differ
    // in case or surrounding whitespace.
    const user = await prisma.user.findFirst({
      where: { email: { equals: String(email).trim(), mode: 'insensitive' } },
    })

    // Generic error either way — no user enumeration via login
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password' })

    // Compare against `password` field (fixed from passwordHash)
    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password' })

    const refreshToken = await issueRefreshToken(user.id)

    // Don't expose the hashed password
    const { password: _pw, ...safeUser } = user
    res.json({ ...tokenPair(user.id, refreshToken), user: safeUser })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Login failed' })
  }
})

// REFRESH — rotate the refresh token and issue a new access token.
// If a revoked/unknown token is presented, the whole chain is revoked
// (reuse detection: a stolen refresh token being replayed kills the session).
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken || typeof refreshToken !== 'string')
      return res.status(400).json({ error: 'Refresh token required' })

    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    })

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      // Reuse of a dead token → possible theft: revoke the user's chains
      if (record) {
        await prisma.refreshToken.updateMany({
          where: { userId: record.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      }
      return res.status(401).json({ error: 'Session expired — please sign in again' })
    }

    // Rotate: revoke the presented token, issue a fresh pair
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    })
    const raw = crypto.randomBytes(48).toString('hex')
    await prisma.refreshToken.create({
      data: {
        userId: record.userId,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    })

    res.json(tokenPair(record.userId, raw))
  } catch (err) {
    console.error('Refresh error:', err.message)
    res.status(500).json({ error: 'Session refresh failed' })
  }
})

// LOGOUT — revoke the refresh token server-side (the access token simply
// expires within the hour). Also clears nothing client-side; the frontend
// removes its stored tokens itself.
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken, all } = req.body || {}
    if (all && req.headers.authorization) {
      // Revoke every session: needs the access token to identify the user.
      // (Verified manually here because this route is intentionally public —
      // the access token may already be expired.)
      try {
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
        await prisma.refreshToken.updateMany({
          where: { userId: decoded.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      } catch { /* expired/invalid access token — nothing to revoke by user */ }
    } else if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
    res.json({ success: true })
  } catch (err) {
    console.error('Logout error:', err.message)
    res.status(500).json({ error: 'Logout failed' })
  }
})

// FORGOT PASSWORD — always returns the same generic response so the endpoint
// cannot be used to enumerate accounts. If the address exists, a single-use
// 1h token is created (old pending tokens for the user are invalidated) and
// emailed via the pluggable mailer.
router.post('/forgot-password', resetRequestLimiter, async (req, res) => {
  const generic = { message: 'If that email is registered, a reset link is on its way.' }
  try {
    const { email } = req.body
    if (!email || !EMAIL_RE.test(String(email))) return res.json(generic)

    const user = await prisma.user.findUnique({ where: { email: String(email) } })
    if (!user) return res.json(generic)

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }, // invalidate older pending tokens
    })

    const raw = crypto.randomBytes(32).toString('hex')
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })

    // Never fail the request on mailer errors — the generic response stands.
    try { await sendPasswordResetEmail(user.email, raw) }
    catch (e) { console.error('Reset email failed:', e.message) }

    return res.json(generic)
  } catch (err) {
    console.error('Forgot-password error:', err.message)
    return res.json(generic)
  }
})

// RESET PASSWORD — consumes the single-use token, sets the new password,
// and revokes all refresh tokens (a password change kills every session).
router.post('/reset-password', resetRequestLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body
    if (!token || typeof token !== 'string')
      return res.status(400).json({ error: 'Reset token required' })
    if (!newPassword || newPassword.length < MIN_PASSWORD_LEN)
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LEN} characters` })

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    })
    if (!record || record.usedAt || record.expiresAt < new Date())
      return res.status(400).json({ error: 'This reset link is invalid or has expired' })

    // Single-use: mark consumed first so a concurrent replay fails
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    })

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    })
    await prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    res.json({ message: 'Password updated — please sign in again.' })
  } catch (err) {
    console.error('Reset-password error:', err.message)
    res.status(500).json({ error: 'Password reset failed' })
  }
})

// GET ME
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })

    if (!user) return res.status(404).json({ error: 'User not found' })
    const { password: _pw, ...safeUser } = user
    res.json(safeUser)
  } catch (err) {
    // Token was already verified by authMiddleware — a failure here is a server/DB issue, not auth
    console.error('Get me error:', err.message)
    res.status(500).json({ error: 'Failed to load profile' })
  }
})

// UPDATE PROFILE — whitelisted fields only, with type validation
const STRING_FIELDS = ['name', 'phone', 'dob', 'gender', 'location', 'fitnessGoal', 'dietType', 'activityLevel']
const FLOAT_FIELDS = ['height', 'weight', 'targetWeight', 'bodyFat', 'muscleMass', 'waterGoal', 'sleepGoal']
const INT_FIELDS = ['calorieGoal', 'proteinGoal', 'carbGoal', 'fatGoal']

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId
    const updates = {}

    for (const f of STRING_FIELDS) {
      if (req.body[f] !== undefined) {
        if (typeof req.body[f] !== 'string')
          return res.status(400).json({ error: `Invalid value for ${f}` })
        updates[f] = req.body[f]
      }
    }
    for (const f of FLOAT_FIELDS) {
      if (req.body[f] !== undefined) {
        const n = Number(req.body[f])
        if (!Number.isFinite(n) || n < 0)
          return res.status(400).json({ error: `Invalid value for ${f}` })
        updates[f] = n
      }
    }
    for (const f of INT_FIELDS) {
      if (req.body[f] !== undefined) {
        const n = Number(req.body[f])
        if (!Number.isInteger(n) || n < 0)
          return res.status(400).json({ error: `Invalid value for ${f}` })
        updates[f] = n
      }
    }

    // Recompute BMI from merged existing + new height/weight (either may have been updated alone)
    if (updates.height !== undefined || updates.weight !== undefined) {
      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { height: true, weight: true }
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

    // Always update updatedAt
    updates.updatedAt = new Date()

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
    })

    const { password: _pw, ...safeUser } = user
    res.json(safeUser)
  } catch (err) {
    console.error('Profile update error:', err.message)
    res.status(500).json({ error: 'Profile update failed' })
  }
})

module.exports = router
