const BadgeRepository = require('../repositories/badge.repository')

class BadgeService {
  constructor() {
    this.badgeRepo = new BadgeRepository()
  }

  async getAllBadges(userId) {
    const allBadges = await this.badgeRepo.findAll()
    const userBadges = await this.badgeRepo.findUserBadges(userId)
    const unlockedIds = userBadges.map(ub => ub.badgeId)

    return allBadges.map(badge => ({
      ...badge,
      unlocked: unlockedIds.includes(badge.id),
      unlockedAt: userBadges.find(ub => ub.badgeId === badge.id)?.unlockedAt
    }))
  }

  async getUserXP(userId) {
    return await this.badgeRepo.getUserLevel(userId)
  }

  async getBadgeProgress(userId) {
    const allBadges = await this.badgeRepo.findAll()
    const userBadges = await this.badgeRepo.findUserBadges(userId)
    const unlockedIds = new Set(userBadges.map(ub => ub.badgeId))

    return allBadges.map(badge => {
      const isUnlocked = unlockedIds.has(badge.id)
      let progress = 0

      // Honest progress: 100 when unlocked, else 0. Per-badge progress
      // tracking is not implemented, and the old Math.random() placeholders
      // fabricated progress percentages — never show invented progress.
      progress = isUnlocked ? 100 : 0

      return {
        ...badge,
        progress: parseFloat(progress.toFixed(1)),
        unlocked: isUnlocked
      }
    })
  }
}

module.exports = BadgeService
