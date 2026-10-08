// ─── Badges routes (Hono) ───────────────────────────────────────────────────
// Port of app/backend/routes/badges.js.

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()
const auth = authMiddleware()
const LEVELS = [
  { level: 1, name: 'Rookie', minXP: 0 },
  { level: 2, name: 'Beginner', minXP: 500 },
  { level: 3, name: 'Novice', minXP: 1200 },
  { level: 4, name: 'Apprentice', minXP: 2500 },
  { level: 5, name: 'Intermediate', minXP: 4500 },
  { level: 6, name: 'Advanced', minXP: 7000 },
  { level: 7, name: 'Expert', minXP: 10000 },
  { level: 8, name: 'Elite', minXP: 14000 },
  { level: 9, name: 'Master', minXP: 20000 },
  { level: 10, name: 'Legend', minXP: 30000 },
]

// GET /api/badges
app.get('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userId = c.get('userId')
    const allBadges = await prisma.badge.findMany()
    const userBadges = await prisma.userBadge.findMany({ where: { userId } })
    const unlockedIds = userBadges.map((ub) => ub.badgeId)
    return c.json(
      allBadges.map((badge) => ({
        ...badge,
        unlocked: unlockedIds.includes(badge.id),
        unlockedAt: userBadges.find((ub) => ub.badgeId === badge.id)?.unlockedAt,
      }))
    )
  } catch (err) {
    console.error('Failed to load badges:', err.message)
    return c.json({ error: 'Failed to load badges' }, 500)
  }
})

// GET /api/badges/xp
app.get('/xp', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: c.get('userId') },
      include: { badge: true },
    })
    const totalXP = userBadges.reduce((acc, ub) => acc + ub.badge.xp, 0)
    const currentLevel = [...LEVELS].reverse().find((l) => totalXP >= l.minXP) || LEVELS[0]
    const nextLevel = LEVELS.find((l) => l.minXP > totalXP) || LEVELS[LEVELS.length - 1]
    return c.json({
      totalXP,
      level: currentLevel.level,
      levelName: currentLevel.name,
      nextLevelXP: nextLevel.minXP,
      unlockedBadges: userBadges.length,
    })
  } catch (err) {
    console.error('Failed to load XP:', err.message)
    return c.json({ error: 'Failed to load XP' }, 500)
  }
})


export default app
