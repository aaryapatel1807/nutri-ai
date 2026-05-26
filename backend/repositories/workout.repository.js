const { PrismaClient } = require('@prisma/client')
const BaseRepository = require('./base.repository')

class WorkoutRepository extends BaseRepository {
  constructor() {
    const prisma = new PrismaClient()
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
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const workouts = await this.model.findMany({
        where: {
          userId,
          completedAt: { gte: date, lt: nextDate }
        }
      })

      days.push({
        date: date.toISOString().split('T')[0],
        workouts,
        totalCalories: workouts.reduce((sum, w) => sum + w.calories, 0),
        totalDuration: workouts.reduce((sum, w) => sum + w.duration, 0)
      })
    }
    return days
  }
}

module.exports = WorkoutRepository
