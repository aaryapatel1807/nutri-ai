const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')
const prisma = new PrismaClient()

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nutriai_secret')
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// GET /api/badges - get all badges with unlock status
router.get('/', auth, async (req, res) => {
  try {
    const allBadges = await prisma.badge.findMany()
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.userId }
    })
    const unlockedIds = userBadges.map(ub => ub.badgeId)

    const badges = allBadges.map(badge => ({
      ...badge,
      unlocked: unlockedIds.includes(badge.id),
      unlockedAt: userBadges.find(ub => ub.badgeId === badge.id)?.unlockedAt
    }))

    res.json(badges)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/badges/xp - get user XP and level
router.get('/xp', auth, async (req, res) => {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.userId },
      include: { badge: true }
    })

    const totalXP = userBadges.reduce((acc, ub) => acc + ub.badge.xp, 0)

    const LEVELS = [
      { level:1,  name:'Rookie',       minXP:0     },
      { level:2,  name:'Beginner',     minXP:500   },
      { level:3,  name:'Novice',       minXP:1200  },
      { level:4,  name:'Apprentice',   minXP:2500  },
      { level:5,  name:'Intermediate', minXP:4500  },
      { level:6,  name:'Advanced',     minXP:7000  },
      { level:7,  name:'Expert',       minXP:10000 },
      { level:8,  name:'Elite',        minXP:14000 },
      { level:9,  name:'Master',       minXP:20000 },
      { level:10, name:'Legend',       minXP:30000 },
    ]

    const currentLevel = [...LEVELS].reverse().find(l => totalXP >= l.minXP) || LEVELS[0]
    const nextLevel = LEVELS.find(l => l.minXP > totalXP) || LEVELS[LEVELS.length - 1]

    res.json({
      totalXP,
      level: currentLevel.level,
      levelName: currentLevel.name,
      nextLevelXP: nextLevel.minXP,
      unlockedBadges: userBadges.length
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
