const { PrismaClient } = require('@prisma/client')
const BaseRepository = require('./base.repository')

class MealRepository extends BaseRepository {
  constructor() {
    const prisma = new PrismaClient()
    super(prisma.meal)
    this.prisma = prisma
  }

  async findByUserId(userId, options = {}) {
    return await this.model.findMany({ 
      where: { userId }, 
      ...options 
    })
  }

  async findTodayMeals(userId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return await this.model.findMany({
      where: {
        userId,
        date: { gte: today, lt: tomorrow }
      },
      orderBy: { date: 'asc' }
    })
  }

  async findWeeklyMeals(userId) {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const meals = await this.model.findMany({
        where: {
          userId,
          date: { gte: date, lt: nextDate }
        }
      })

      days.push({
        date: date.toISOString().split('T')[0],
        meals,
        totals: meals.reduce((acc, meal) => ({
          calories: acc.calories + meal.calories,
          protein: acc.protein + meal.protein,
          carbs: acc.carbs + meal.carbs,
          fat: acc.fat + meal.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
      })
    }
    return days
  }

  async getMealStats(userId, startDate, endDate) {
    return await this.model.aggregate({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      },
      _sum: {
        calories: true,
        protein: true,
        carbs: true,
        fat: true
      },
      _count: true
    })
  }
}

module.exports = MealRepository
