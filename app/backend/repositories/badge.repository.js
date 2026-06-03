const { prisma } = require('../prisma.config')
const BaseRepository = require('./base.repository')

class BadgeRepository extends BaseRepository {
  constructor() {
    super(prisma.badge)
    this.prisma = prisma
  }

  async findAll() {
    return await this.model.findMany()
  }

  async findUserBadges(userId) {
    return await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true }
    })
  }

  async findBadgeByName(name) {
    return await this.model.findFirst({ where: { name } })
  }

  async awardBadge(userId, badgeId) {
    return await this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId } },
      create: { userId, badgeId },
      update: {}
    })
  }

  async calculateUserXP(userId) {
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true }
    })

    return userBadges.reduce((total, userBadge) => total + userBadge.badge.xp, 0)
  }

  async getUserLevel(userId) {
    const totalXP = await this.calculateUserXP(userId)
    
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

    return {
      totalXP,
      level: currentLevel.level,
      levelName: currentLevel.name,
      nextLevelXP: nextLevel.minXP
    }
  }
}

module.exports = BadgeRepository
