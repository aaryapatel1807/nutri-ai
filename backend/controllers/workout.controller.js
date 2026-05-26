const z = require('zod')
const WorkoutService = require('../services/workout.service')

// Validation schemas
const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  calories: z.number().min(0, 'Calories must be positive'),
  category: z.enum(['Cardio', 'Strength', 'Flexibility', 'Sports']).optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  completedAt: z.string().optional()
})

const deleteWorkoutSchema = z.object({
  id: z.string().min(1, 'Workout ID is required')
})

class WorkoutController {
  constructor() {
    this.workoutService = new WorkoutService()
  }

  async getWorkouts(req, res) {
    try {
      const userId = req.userId
      const workouts = await this.workoutService.getUserWorkouts(userId)
      
      res.json({
        success: true,
        data: workouts
      })
    } catch (error) {
      console.log('Get workouts error:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workouts'
      })
    }
  }

  async getWorkoutStats(req, res) {
    try {
      const userId = req.userId
      const stats = await this.workoutService.getWorkoutStats(userId)
      
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.log('Get workout stats error:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workout statistics'
      })
    }
  }

  async createWorkout(req, res) {
    try {
      const userId = req.userId
      
      // Validate input
      const validatedData = createWorkoutSchema.parse(req.body)
      
      const workout = await this.workoutService.logWorkout(userId, validatedData)
      
      res.status(201).json({
        success: true,
        data: workout,
        message: 'Workout logged successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        })
      }
      
      console.log('Create workout error:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async deleteWorkout(req, res) {
    try {
      const userId = req.userId
      const { id } = req.params
      
      const result = await this.workoutService.deleteWorkout(userId, id)
      
      res.json({
        success: true,
        data: result,
        message: 'Workout deleted successfully'
      })
    } catch (error) {
      console.log('Delete workout error:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

module.exports = WorkoutController
