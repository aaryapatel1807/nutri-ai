const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    console.log('Register:', name, email)

    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' })

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
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' })

    console.log('User created:', user.id)
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    })
  } catch (err) {
    console.log('Register error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' })

    // Don't expose the hashed password
    const { password: _pw, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) {
    console.log('Login error:', err.message)
    res.status(500).json({ error: err.message })
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
    res.status(401).json({ error: 'Invalid token' })
  }
})

// UPDATE PROFILE
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId

    const updates = { ...req.body }
    // Strip sensitive / immutable fields
    delete updates.password
    delete updates.email
    delete updates.id
    delete updates.createdAt

    // Auto-compute BMI if both height (cm) and weight (kg) provided
    // Schema uses `height` (Float) and `weight` (Float) in metric units
    if (updates.height && updates.weight) {
      const hMeters = updates.height / 100
      updates.bmi = parseFloat((updates.weight / (hMeters * hMeters)).toFixed(1))
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
    console.log('Profile update error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
