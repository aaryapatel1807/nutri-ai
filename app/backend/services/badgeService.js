const prisma = require('../config/db')

// Badge definitions mapped to Badge names in DB (seeded via seed.js)
const BADGE_DEFINITIONS = [
  { name: 'First Bite',      check: (s) => (s.totalMeals    || 0) >= 1   },
  { name: 'Week Warrior',    check: (s) => (s.streak         || 0) >= 7   },
  { name: 'Monthly Monster', check: (s) => (s.streak         || 0) >= 30  },
  { name: 'Iron Will',       check: (s) => (s.totalWorkouts  || 0) >= 10  },
  { name: 'Century Club',    check: (s) => (s.totalWorkouts  || 0) >= 100 },
  { name: 'First Rep',       check: (s) => (s.totalWorkouts  || 0) >= 1   },
]

/**
 * Check badge conditions and award any newly-earned badges to the user.
 * @param {string} userId
 * @param {object} stats - { totalMeals, totalWorkouts, streak }
 * @returns {array} newly awarded badge objects
 */
async function checkBadges(userId, stats) {
  // Fetch all badge definitions from DB
  const allBadges = await prisma.badge.findMany()

  // Fetch already earned badges for this user
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true }
  })
  const earnedIds = new Set(userBadges.map(ub => ub.badgeId))

  const newBadges = []

  for (const def of BADGE_DEFINITIONS) {
    // Find the matching badge in DB
    const badge = allBadges.find(b => b.name === def.name)
    if (!badge) continue

    // Skip already earned
    if (earnedIds.has(badge.id)) continue

    // Skip if condition not met
    if (!def.check(stats)) continue

    // Award the badge (upsert to prevent race conditions)
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { userId, badgeId: badge.id },
      update: {}
    })

    newBadges.push(badge)
  }

  return newBadges
}

module.exports = { checkBadges, BADGE_DEFINITIONS }
