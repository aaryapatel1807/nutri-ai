'use client'
import { motion } from 'framer-motion'
// PageWrapper removed to fix double-wrap bug

export default function QuizzesPage() {
  // Quizzes are NOT playable yet: no question bank, runner, or XP award
  // exists behind these cards. The old page showed a fabricated "Completed"
  // state and promised an Expert badge — both removed. Cards are previews
  // until a real quiz flow ships.
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
      completed: false,
    },
  ]

  return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-primary)] p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold break-words text-[var(--text-primary)] mb-2">📚 Knowledge Quizzes</h1>
            <p className="text-gray-400">Test your fitness and nutrition knowledge. Quizzes are coming soon — previews below, no questions or XP rewards yet.</p>
          </div>

          {/* Quiz Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {quizzes.map((quiz, idx) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div className="relative p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-[var(--track)] transition-all duration-300 backdrop-blur-sm">
                  {/* Availability */}
                  <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full">
                    Coming soon
                  </div>

                  {/* Content */}
                  <div className="text-4xl mb-3">{quiz.emoji}</div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{quiz.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{quiz.description}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-3">
                      <span className="px-2 py-1 bg-[#FFB020]/15 text-[#D97706] rounded text-xs">
                        {quiz.difficulty}
                      </span>
                      <span className="text-gray-500">{quiz.questions} Qs</span>
                    </div>
                    <span className="text-yellow-400 font-semibold">+{quiz.reward} XP</span>
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
            className="mt-12 p-8 rounded-xl border border-[#FF6B5E]/30 bg-[#FF6B5E]/10 backdrop-blur-sm text-center"
          >
            <p className="text-gray-300 mb-4">🎯 Quizzes with real questions, scoring and XP rewards are on the way — nothing here is scored or completed yet.</p>
          </motion.div>
        </motion.div>
      </div>
  )
}
