'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import PageWrapper from '../../components/shared/PageWrapper'

export default function QuizzesPage() {
  const [selectedQuiz, setSelectedQuiz] = useState(null)

  const quizzes = [
    {
      id: 1,
      title: 'Nutrition Basics',
      emoji: '🥗',
      description: 'Test your knowledge about macronutrients, calories, and healthy eating',
      difficulty: 'Beginner',
      questions: 10,
      reward: 50,
      completed: false,
    },
    {
      id: 2,
      title: 'Workout Science',
      emoji: '💪',
      description: 'Learn about progressive overload, form, and training principles',
      difficulty: 'Intermediate',
      questions: 15,
      reward: 100,
      completed: false,
    },
    {
      id: 3,
      title: 'Health & Recovery',
      emoji: '🧬',
      description: 'Understand sleep, recovery, and injury prevention strategies',
      difficulty: 'Advanced',
      questions: 12,
      reward: 150,
      completed: false,
    },
    {
      id: 4,
      title: 'Meal Planning',
      emoji: '🍲',
      description: 'Master the art of creating balanced, sustainable meal plans',
      difficulty: 'Intermediate',
      questions: 8,
      reward: 75,
      completed: true,
    },
  ]

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] to-[#1A1A2E] p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-2">📚 Knowledge Quizzes</h1>
            <p className="text-gray-400">Test your fitness and nutrition knowledge. Earn XP and unlock achievements!</p>
          </div>

          {/* Quiz Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {quizzes.map((quiz, idx) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedQuiz(quiz)}
                className="cursor-pointer group"
              >
                <div className="relative p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                  {/* Badge */}
                  {quiz.completed && (
                    <div className="absolute top-3 right-3 bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full">
                      ✓ Completed
                    </div>
                  )}

                  {/* Content */}
                  <div className="text-4xl mb-3">{quiz.emoji}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{quiz.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{quiz.description}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                        {quiz.difficulty}
                      </span>
                      <span className="text-gray-500">{quiz.questions} Qs</span>
                    </div>
                    <span className="text-yellow-400 font-semibold">+{quiz.reward} XP</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      style={{ width: quiz.completed ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 p-8 rounded-xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm text-center"
          >
            <p className="text-gray-300 mb-4">🎯 Complete all quizzes to unlock the Expert badge!</p>
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-cyan-400 rounded-full opacity-20"></div>
          </motion.div>
        </motion.div>
      </div>
    </PageWrapper>
  )
}
