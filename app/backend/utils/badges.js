// Shared badge-award helpers (used by meals, workouts, water routes).
// Every award is an idempotent upsert: awarding twice is a no-op, and a
// badge is only ever awarded when its criteria are actually met — never
// from mock progress or hardcoded unlocks.
const { prisma } = require('../prisma.config')

async function awardBadge(userId, name) {
  try {
    const badge = await prisma.badge.findFirst({ where: { name } })
    if (!badge) return false
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { userId, badgeId: badge.id },
      update: {},
    })
    return true
  } catch (err) {
    console.error(`Badge award (${name}) error:`, err.message)
    return false
  }
}

// "NutriAI Legend" = every other seeded badge unlocked.
async function checkLegend(userId) {
  try {
    const [all, unlocked] = await Promise.all([
      prisma.badge.count(),
      prisma.userBadge.count({ where: { userId } }),
    ])
    if (all > 1 && unlocked >= all - 1) await awardBadge(userId, 'NutriAI Legend')
  } catch (err) {
    console.error('Legend check error:', err.message)
  }
}

module.exports = { awardBadge, checkLegend }
