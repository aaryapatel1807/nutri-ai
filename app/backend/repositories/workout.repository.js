const { prisma } = require('../prisma.config')
const BaseRepository = require('./base.repository')

class WorkoutRepository extends BaseRepository {
  constructor() {
    super(prisma.workout)
    this.prisma = prisma
  }

  async findByUserId(userId, options = {}) {
    return await this.model.findMany({ 
      where: { userId }, 
      ...options 
    })
  }

  async getWorkoutStats(userId) {
    const total = await this.model.count({ where: { userId } })
    const thisWeek = await this.model.count({
      where: {
        userId,
        completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })
    const totalCalories = await this.model.aggregate({
      where: { userId },
      _sum: { calories: true }
    })
    
    return {
      totalWorkouts: total,
      thisWeek,
      totalCaloriesBurned: totalCalories._sum.calories || 0
    }
  }

  async findWeeklyWorkouts(userId) {
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const workouts = await this.model.findMany({
      where: {
        userId,
        completedAt: { gte: sevenDaysAgo }
      },
      orderBy: { completedAt: 'asc' }
    })

    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      
      const dayWorkouts = workouts.filter(w => w.completedAt.toISOString().split('T')[0] === dateStr)
      
      days.push({
        date: dateStr,
        workouts: dayWorkouts,
        totalCalories: dayWorkouts.reduce((sum, w) => sum + w.calories, 0),
        totalDuration: dayWorkouts.reduce((sum, w) => sum + w.duration, 0)
      })
    }
    return days
  }
}

module.exports = WorkoutRepository
