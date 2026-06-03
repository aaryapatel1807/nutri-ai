const MealRepository = require('../repositories/meal.repository')
const BadgeRepository = require('../repositories/badge.repository')

class MealService {
  constructor() {
    this.mealRepo = new MealRepository()
    this.badgeRepo = new BadgeRepository()
  }

  async logMeal(userId, mealData) {
    const meal = await this.mealRepo.create({
      userId,
      ...mealData,
      date: mealData.date ? new Date(mealData.date) : new Date()
    })

    // Auto award badges after logging meal
    await this.checkAndAwardBadges(userId)

    return meal
  }

  async getTodayMeals(userId) {
    const meals = await this.mealRepo.findTodayMeals(userId)
    
    // Calculate totals
    const totals = meals.reduce((acc, meal) => ({
      totalCalories: acc.totalCalories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }), { totalCalories: 0, protein: 0, carbs: 0, fat: 0 })

    // Group by meal type
    const grouped = {
      Breakfast: meals.filter(m => m.mealType === 'Breakfast'),
      Lunch:     meals.filter(m => m.mealType === 'Lunch'),
      Dinner:    meals.filter(m => m.mealType === 'Dinner'),
      Snack:     meals.filter(m => m.mealType === 'Snack'),
    }

    return { ...totals, meals, grouped }
  }

  async getWeeklyMeals(userId) {
    const weeklyData = await this.mealRepo.findWeeklyMeals(userId)
    
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    return weeklyData.map(day => ({
      day: dayNames[new Date(day.date).getDay()],
      cal: Math.round(day.totals.calories),
      protein: Math.round(day.totals.protein),
      carbs: Math.round(day.totals.carbs),
      fat: Math.round(day.totals.fat),
      goal: 1800
    }))
  }

  async deleteMeal(userId, mealId) {
    // Verify meal belongs to user
    const meal = await this.mealRepo.findById(mealId)
    if (!meal || meal.userId !== userId) {
      throw new Error('Meal not found or access denied')
    }
    
    return await this.mealRepo.delete(mealId)
  }

  async checkAndAwardBadges(userId) {
    try {
      const mealCount = await this.mealRepo.count({ userId })
      
      // First meal badge
      if (mealCount === 1) {
        const badge = await this.badgeRepo.findBadgeByName('First Bite')
        if (badge) {
          await this.badgeRepo.awardBadge(userId, badge.id)
        }
      }
    } catch (error) {
      console.error('Badge awarding error:', error)
    }
  }
}

module.exports = MealService
