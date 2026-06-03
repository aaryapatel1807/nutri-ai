const WorkoutRepository = require('../repositories/workout.repository')

class WorkoutService {
  constructor() {
    this.workoutRepo = new WorkoutRepository()
  }

  async logWorkout(userId, workoutData) {
    const workout = await this.workoutRepo.create({
      userId,
      ...workoutData,
      completedAt: workoutData.completedAt ? new Date(workoutData.completedAt) : new Date()
    })

    return workout
  }

  async getUserWorkouts(userId, options = {}) {
    return await this.workoutRepo.findByUserId(userId, {
      orderBy: { completedAt: 'desc' },
      ...options
    })
  }

  async getWorkoutStats(userId) {
    return await this.workoutRepo.getWorkoutStats(userId)
  }

  async getWeeklyWorkouts(userId) {
    return await this.workoutRepo.findWeeklyWorkouts(userId)
  }

  async deleteWorkout(userId, workoutId) {
    // Verify workout belongs to user
    const workout = await this.workoutRepo.findById(workoutId)
    if (!workout || workout.userId !== userId) {
      throw new Error('Workout not found or access denied')
    }
    
    return await this.workoutRepo.delete(workoutId)
  }
}

module.exports = WorkoutService
