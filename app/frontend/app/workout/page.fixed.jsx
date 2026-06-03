'use client'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { auth } from '../../lib/api'
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  FireIcon, 
  ChartBarIcon, 
  TrophyIcon, 
  CalendarDaysIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const WORKOUT_TEMPLATES = [
  {
    id: 'hiit',
    name: 'HIIT Cardio Blast',
    duration: 20,
    calories: 250,
    difficulty: 'Advanced',
    category: 'Cardio',
    exercises: [
      { name: 'Jumping Jacks', duration: 45, rest: 15 },
      { name: 'High Knees', duration: 30, rest: 10 },
      { name: 'Burpees', duration: 40, rest: 20 },
      { name: 'Mountain Climbers', duration: 30, rest: 10 }
    ]
  },
  {
    id: 'strength',
    name: 'Upper Body Strength',
    duration: 45,
    calories: 180,
    difficulty: 'Intermediate',
    category: 'Strength',
    exercises: [
      { name: 'Push-ups', sets: 3, reps: 12, rest: 60 },
      { name: 'Dumbbell Rows', sets: 3, reps: 10, rest: 45 },
      { name: 'Shoulder Press', sets: 3, reps: 8, rest: 60 },
      { name: 'Bicep Curls', sets: 3, reps: 12, rest: 45 }
    ]
  },
  {
    id: 'yoga',
    name: 'Morning Yoga Flow',
    duration: 30,
    calories: 120,
    difficulty: 'Beginner',
    category: 'Flexibility',
    exercises: [
      { name: 'Sun Salutation', duration: 60, rest: 0 },
      { name: 'Warrior I', duration: 30, rest: 15 },
      { name: 'Tree Pose', duration: 45, rest: 15 },
      { name: 'Child\'s Pose', duration: 60, rest: 0 }
    ]
  },
  {
    id: 'core',
    name: 'Core Crusher',
    duration: 25,
    calories: 200,
    difficulty: 'Intermediate',
    category: 'Strength',
    exercises: [
      { name: 'Plank', duration: 60, rest: 30 },
      { name: 'Crunches', sets: 3, reps: 15, rest: 30 },
      { name: 'Russian Twists', sets: 3, reps: 20, rest: 30 },
      { name: 'Leg Raises', sets: 3, reps: 15, rest: 30 }
    ]
  }
]

export default function WorkoutPlanner() {
  const [workouts, setWorkouts] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [exerciseTime, setExerciseTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [customWorkout, setCustomWorkout] = useState({
    name: '',
    duration: '',
    calories: '',
    category: 'Strength',
    difficulty: 'Intermediate'
  })

  useEffect(() => {
    const loadWorkoutData = async () => {
      try {
        setLoading(true)
        setError('')
        const [workoutData, statsData] = await Promise.all([
          auth.getWorkouts(),
          auth.getWorkoutStats()
        ])
        setWorkouts(workoutData)
        setStats(statsData)
      } catch (err) {
        console.error('Workout load error:', err)
        setError('Failed to load workout data')
      } finally {
        setLoading(false)
      }
    }

    loadWorkoutData()
  }, [])

  // Timer effect
  useEffect(() => {
    let interval
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
        setExerciseTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }

    return () => clearInterval(interval)
  }, [isWorkoutActive])

  const weeklyProgress = useMemo(() => {
    if (!workouts.length) return []

    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.completedAt)
        return workoutDate >= date && workoutDate < nextDate
      })

      last7Days.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        workouts: dayWorkouts.length,
        calories: dayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0),
        duration: dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)
      })
    }

    return last7Days
  }, [workouts])

  const handleStartWorkout = (workout) => {
    setSelectedWorkout(workout)
    setIsWorkoutActive(true)
    setElapsedTime(0)
    setCurrentExercise(0)
    setExerciseTime(0)
  }

  const handlePauseWorkout = () => {
    setIsWorkoutActive(false)
  }

  const handleStopWorkout = async () => {
    if (!selectedWorkout) return

    try {
      setLoading(true)
      const workout = await auth.logWorkout({
        name: selectedWorkout.name,
        duration: elapsedTime,
        calories: selectedWorkout.calories,
        category: selectedWorkout.category,
        difficulty: selectedWorkout.difficulty
      })

      setWorkouts(prev => [workout, ...prev])
      setIsWorkoutActive(false)
      setSelectedWorkout(null)
      setElapsedTime(0)
      setCurrentExercise(0)
      setExerciseTime(0)
    } catch (err) {
      console.error('Workout save error:', err)
      setError('Failed to save workout')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getExerciseProgress = () => {
    if (!selectedWorkout || !selectedWorkout.exercises) return 0
    return ((currentExercise + 1) / selectedWorkout.exercises.length) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
        <span className="ml-4 text-white text-lg">Loading workouts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Card variant="danger" className="max-w-md">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-white">⚠️ Error</h3>
            <p className="text-gray-300">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-green-400 via-emerald-500 to-blue-600 bg-clip-text text-transparent">
          Workout Planner
        </h1>
        <p className="text-gray-400 mt-2">Track progress, crush goals, build consistency</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card variant="default" className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">📊 Your Stats</h3>
            
            {stats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Workouts</span>
                  <span className="text-2xl font-bold text-white">{stats.totalWorkouts}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">This Week</span>
                  <span className="text-2xl font-bold text-green-400">{stats.thisWeek}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Calories Burned</span>
                  <span className="text-2xl font-bold text-orange-400">{stats.totalCaloriesBurned}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Weekly Progress Chart */}
          <Card variant="default">
            <h3 className="text-xl font-semibold text-white mb-4">📈 Weekly Progress</h3>
            
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="day" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="workouts" fill="#22c55e" />
                <Bar dataKey="calories" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Middle Column - Workout Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card variant="default" className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">🏋 Workout Library</h3>
            
            <div className="space-y-3">
              {WORKOUT_TEMPLATES.map((workout) => (
                <motion.div
                  key={workout.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStartWorkout(workout)}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedWorkout?.id === workout.id 
                      ? 'border-purple-500 bg-purple-500/20' 
                      : 'border-gray-700 hover:border-purple-500 hover:bg-purple-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{workout.name}</h4>
                      <p className="text-sm text-gray-400">{workout.category} • {workout.difficulty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{workout.duration} min</p>
                      <p className="text-lg font-bold text-white">{workout.calories} cal</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    {workout.exercises.length} exercises • {workout.exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0)}s total
                  </div>
                </motion.div>
              ))}
            </div>
            
            <Button
              onClick={() => setShowCustom(true)}
              variant="outline"
              className="w-full"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Custom Workout
            </Button>
          </Card>

          {/* Active Workout */}
          {selectedWorkout && (
            <Card variant="success" className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">🔥 Active Workout</h3>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold text-white">{selectedWorkout.name}</h4>
                  <div className="flex gap-2">
                    {!isWorkoutActive ? (
                      <Button
                        onClick={() => setIsWorkoutActive(true)}
                        variant="primary"
                        size="sm"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePauseWorkout}
                        variant="outline"
                        size="sm"
                      >
                        <PauseIcon className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={handleStopWorkout}
                      variant="danger"
                      size="sm"
                      disabled={loading}
                    >
                      <StopIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getExerciseProgress()}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Exercise {currentExercise + 1} of {selectedWorkout.exercises.length}</span>
                <span>{formatTime(exerciseTime)}</span>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{formatTime(elapsedTime)}</div>
                <div className="text-sm text-gray-400">
                  Total Time • {Math.round(elapsedTime / 60)} min • {selectedWorkout.calories} cal
                </div>
              </div>
            </Card>
          )}
        </motion.div>

        {/* Right Column - Progress & History */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card variant="default" className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">🏆 Recent Workouts</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {workouts.slice(0, 10).map((workout, index) => (
                <motion.div
                  key={workout.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-800 rounded-xl border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{workout.name}</h4>
                      <p className="text-sm text-gray-400">
                        {new Date(workout.completedAt).toLocaleDateString()} • {workout.duration} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">{workout.calories} cal</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{workout.category}</span>
                    <span>•</span>
                    <span>{workout.difficulty}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Achievement Badges */}
          <Card variant="default">
            <h3 className="text-xl font-semibold text-white mb-4">🎯 Achievements</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrophyIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-400">First Workout</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FireIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-400">3 Day Streak</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-400">1000 Calories</p>
              </div>
              
              <div className="text-center opacity-50">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-500">30 Day Streak</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Custom Workout Modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showCustom ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${
          showCustom ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        onClick={() => setShowCustom(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: showCustom ? 1 : 0, scale: showCustom ? 1 : 0.9 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-gray-800 rounded-2xl border border-gray-700 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-semibold text-white mb-4">Create Custom Workout</h3>
          
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Workout name"
              value={customWorkout.name}
              onChange={(e) => setCustomWorkout({ ...customWorkout, name: e.target.value })}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Duration (min)"
                value={customWorkout.duration}
                onChange={(e) => setCustomWorkout({ ...customWorkout, duration: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Calories"
                value={customWorkout.calories}
                onChange={(e) => setCustomWorkout({ ...customWorkout, calories: e.target.value })}
              />
            </div>
            
            <select
              value={customWorkout.category}
              onChange={(e) => setCustomWorkout({ ...customWorkout, category: e.target.value })}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
            >
              <option value="Cardio">Cardio</option>
              <option value="Strength">Strength</option>
              <option value="Flexibility">Flexibility</option>
              <option value="Sports">Sports</option>
            </select>
            
            <select
              value={customWorkout.difficulty}
              onChange={(e) => setCustomWorkout({ ...customWorkout, difficulty: e.target.value })}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={() => {
                if (customWorkout.name && customWorkout.duration) {
                  handleStartWorkout({
                    id: 'custom',
                    name: customWorkout.name,
                    duration: parseInt(customWorkout.duration),
                    calories: parseInt(customWorkout.calories),
                    category: customWorkout.category,
                    difficulty: customWorkout.difficulty,
                    exercises: []
                  })
                  setShowCustom(false)
                  setCustomWorkout({ name: '', duration: '', calories: '', category: 'Strength', difficulty: 'Intermediate' })
                }
              }}
              variant="success"
              disabled={!customWorkout.name || !customWorkout.duration}
              className="flex-1"
            >
              Start Workout
            </Button>
            
            <Button
              onClick={() => {
                setShowCustom(false)
                setCustomWorkout({ name: '', duration: '', calories: '', category: 'Strength', difficulty: 'Intermediate' })
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
