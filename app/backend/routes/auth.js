const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { authMiddleware, rateLimitMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// Stricter limits on the credential endpoints (brute-force protection)
const authLimiter = rateLimitMiddleware(20, 15 * 60 * 1000)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

// REGISTER
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' })

    if (!EMAIL_RE.test(email))
      return res.status(400).json({ error: 'Invalid email address' })

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' })

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing)
      return res.status(400).json({ error: 'Email already registered' })

    // Hash password and store in `password` field (matches schema)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    })

    // Generate JWT
    const token = signToken(user.id)

    res.status(201).json({
      token,
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

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user)
      return res.status(401).json({ error: 'Invalid email or password' })

    // Compare against `password` field (fixed from passwordHash)
    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password' })

    const token = signToken(user.id)

    // Don't expose the hashed password
    const { password: _pw, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Login failed' })
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
