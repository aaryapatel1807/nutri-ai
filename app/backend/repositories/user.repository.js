const { prisma } = require('../prisma.config')
const BaseRepository = require('./base.repository')

class UserRepository extends BaseRepository {
  constructor() {
    super(prisma.user)
    this.prisma = prisma
  }

  async findByEmail(email) {
    return await this.model.findUnique({ where: { email } })
  }

  async updateProfile(userId, data) {
    // Auto-compute BMI if both height (cm) and weight (kg) provided
    if (data.height && data.weight) {
      const hMeters = data.height / 100
      data.bmi = parseFloat((data.weight / (hMeters * hMeters)).toFixed(1))
    }
    
    return await this.model.update({
      where: { id: userId },
      data: { ...data, updatedAt: new Date() }
    })
  }

  async getUserStats(userId) {
    const user = await this.model.findUnique({ 
      where: { id: userId },
      include: {
        meals: true,
        workouts: true,
        badges: { include: { badge: true } },
        _count: {
          select: {
            meals: true,
            workouts: true,
            badges: true
          }
        }
      }
    })
    return user
  }
}

module.exports = UserRepository
