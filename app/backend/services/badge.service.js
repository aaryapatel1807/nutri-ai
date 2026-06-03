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

      // Calculate progress based on badge type
      if (badge.name === 'First Bite') {
        progress = isUnlocked ? 100 : 0
      } else if (badge.name === 'Protein King') {
        // This would need meal tracking logic
        progress = isUnlocked ? 100 : Math.random() * 80 // Placeholder
      } else if (badge.name === 'Week Warrior') {
        // This would need streak tracking logic
        progress = isUnlocked ? 100 : Math.random() * 60 // Placeholder
      }

      return {
        ...badge,
        progress: parseFloat(progress.toFixed(1)),
        unlocked: isUnlocked
      }
    })
  }
}

module.exports = BadgeService
