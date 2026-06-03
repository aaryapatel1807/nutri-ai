const z = require('zod')
const MealService = require('../services/meal.service')

// Validation schemas
const createMealSchema = z.object({
  name: z.string().min(1, 'Meal name is required'),
  calories: z.number().min(0, 'Calories must be positive'),
  protein: z.number().min(0, 'Protein must be positive').default(0),
  carbs: z.number().min(0, 'Carbs must be positive').default(0),
  fat: z.number().min(0, 'Fat must be positive').default(0),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack']).default('Breakfast'),
  date: z.string().optional()
})

const deleteMealSchema = z.object({
  id: z.string().min(1, 'Meal ID is required')
})

class MealController {
  constructor() {
    this.mealService = new MealService()
  }

  async getMeals(req, res) {
    try {
      const userId = req.userId
      const meals = await this.mealService.mealRepo.findByUserId(userId)
      
      res.json({
        success: true,
        data: meals
      })
    } catch (error) {
      console.log('Get meals error:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch meals'
      })
    }
  }

  async getTodayMeals(req, res) {
    try {
      const userId = req.userId
      const result = await this.mealService.getTodayMeals(userId)
      
      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.log('Get today meals error:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch today\'s meals'
      })
    }
  }

  async getWeeklyMeals(req, res) {
    try {
      const userId = req.userId
      const result = await this.mealService.getWeeklyMeals(userId)
      
      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.log('Get weekly meals error:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch weekly meals'
      })
    }
  }

  async createMeal(req, res) {
    try {
      const userId = req.userId
      
      // Validate input
      const validatedData = createMealSchema.parse(req.body)
      
      const meal = await this.mealService.logMeal(userId, validatedData)
      
      res.status(201).json({
        success: true,
        data: meal,
        message: 'Meal logged successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        })
      }
      
      console.log('Create meal error:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async deleteMeal(req, res) {
    try {
      const userId = req.userId
      const { id } = req.params
      
      const result = await this.mealService.deleteMeal(userId, id)
      
      res.json({
        success: true,
        data: result,
        message: 'Meal deleted successfully'
      })
    } catch (error) {
      console.log('Delete meal error:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

module.exports = MealController
