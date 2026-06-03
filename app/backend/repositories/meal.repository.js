const { prisma } = require('../prisma.config')
const BaseRepository = require('./base.repository')

class MealRepository extends BaseRepository {
  constructor() {
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
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const meals = await this.model.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo }
      },
      orderBy: { date: 'asc' }
    })

    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      
      const dayMeals = meals.filter(m => m.date.toISOString().split('T')[0] === dateStr)
      
      days.push({
        date: dateStr,
        meals: dayMeals,
        totals: dayMeals.reduce((acc, meal) => ({
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
