'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
// PageWrapper removed to fix double-wrap bug

export default function CertificatesPage() {
  const [filter, setFilter] = useState('all')

  const certificates = [
    {
      id: 1,
      title: 'Nutrition Master',
      emoji: '🥗',
      category: 'nutrition',
      description: 'Complete comprehensive nutrition training',
      criteria: 'Complete 5 nutrition modules + pass final exam',
      difficulty: 'Advanced',
    },
    {
      id: 2,
      title: 'Fitness Pro',
      emoji: '💪',
      category: 'fitness',
      description: 'Demonstrate mastery in workout planning',
      criteria: 'Log 100+ workouts with proper form scores',
      difficulty: 'Intermediate',
    },
    {
      id: 3,
      title: 'Wellness Ambassador',
      emoji: '🧬',
      category: 'health',
      description: 'Achieve excellent holistic health metrics',
      criteria: 'Maintain 80+ wellness score for 30 days',
      difficulty: 'Advanced',
    },
    {
      id: 4,
      title: 'Recovery Expert',
      emoji: '😴',
      category: 'health',
      description: 'Master sleep and recovery optimization',
      criteria: 'Complete sleep module + 15 day tracking',
      difficulty: 'Intermediate',
    },
    {
      id: 5,
      title: 'Meal Prep Champion',
      emoji: '🍲',
      category: 'nutrition',
      description: 'Create and share 20+ meal plans',
      criteria: 'Create personalized plans for 20 scenarios',
      difficulty: 'Beginner',
    },
    {
      id: 6,
      title: 'Community Leader',
      emoji: '🌟',
      category: 'community',
      description: 'Become a trusted voice in the community',
      criteria: 'Achieve 500+ helpful responses & mentor 5 users',
      difficulty: 'Advanced',
    },
  ]

  const filtered = filter === 'all' ? certificates : certificates.filter((c) => c.category === filter)

  return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-primary)] p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold break-words text-[var(--text-primary)] mb-2">🏆 Certificates & Achievements</h1>
            <p className="text-gray-400">Showcase your expertise and dedication to your health journey. Certificates are not issued yet — these are the planned tracks and their criteria.</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-4">
            {['all', 'nutrition', 'fitness', 'health', 'community'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg border transition-all whitespace-nowrap capitalize ${
                  filter === cat
                    ? 'bg-gradient-to-r from-[#FF6B5E] via-[#FFB020] to-[#7B61FF] text-white border-transparent'
                    : 'border-white/20 text-gray-300 hover:border-white/40'
                }`}
              >
                {cat === 'all' ? 'All Certificates' : cat}
              </button>
            ))}
          </div>

          {/* Certificates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map((cert, idx) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div className="relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 border-white/10 bg-white/5 hover:border-white/20">
                  <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full">
                    Coming soon
                  </div>

                  {/* Icon */}
                  <div className="text-5xl mb-3">{cert.emoji}</div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{cert.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{cert.description}</p>

                  {/* Criteria */}
                  <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-xs text-gray-400 font-semibold mb-2">TO EARN:</p>
                    <p className="text-sm text-gray-300">{cert.criteria}</p>
                  </div>

                  {/* Meta */}
                  <div className="space-y-2 text-xs text-gray-400 mb-4">
                    <div className="flex justify-between">
                      <span>Difficulty:</span>
                      <span
                        className={`font-semibold ${
                          cert.difficulty === 'Beginner'
                            ? 'text-[#B5E5F2]'
                            : cert.difficulty === 'Intermediate'
                              ? 'text-[#7B61FF]'
                              : 'text-[#FF6B5E]'
                        }`}
                      >
                        {cert.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* CTA — no issuance flow exists, so no working button is faked */}
                  <button disabled
                    className="w-full py-2 rounded-lg font-semibold bg-white/5 text-gray-500 cursor-not-allowed"
                  >
                    Certificate issuance coming soon
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </div>
  )
}
