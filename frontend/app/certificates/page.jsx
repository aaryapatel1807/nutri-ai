'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import PageWrapper from '../../components/shared/PageWrapper'

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
      earnedAt: '2026-05-15',
      earnedBy: 500,
      difficulty: 'Advanced',
    },
    {
      id: 2,
      title: 'Fitness Pro',
      emoji: '💪',
      category: 'fitness',
      description: 'Demonstrate mastery in workout planning',
      criteria: 'Log 100+ workouts with proper form scores',
      earnedAt: '2026-04-20',
      earnedBy: 1200,
      difficulty: 'Intermediate',
    },
    {
      id: 3,
      title: 'Wellness Ambassador',
      emoji: '🧬',
      category: 'health',
      description: 'Achieve excellent holistic health metrics',
      criteria: 'Maintain 80+ wellness score for 30 days',
      earnedAt: null,
      earnedBy: 300,
      difficulty: 'Advanced',
    },
    {
      id: 4,
      title: 'Recovery Expert',
      emoji: '😴',
      category: 'health',
      description: 'Master sleep and recovery optimization',
      criteria: 'Complete sleep module + 15 day tracking',
      earnedAt: '2026-03-10',
      earnedBy: 400,
      difficulty: 'Intermediate',
    },
    {
      id: 5,
      title: 'Meal Prep Champion',
      emoji: '🍲',
      category: 'nutrition',
      description: 'Create and share 20+ meal plans',
      criteria: 'Create personalized plans for 20 scenarios',
      earnedAt: null,
      earnedBy: 200,
      difficulty: 'Beginner',
    },
    {
      id: 6,
      title: 'Community Leader',
      emoji: '🌟',
      category: 'community',
      description: 'Become a trusted voice in the community',
      criteria: 'Achieve 500+ helpful responses & mentor 5 users',
      earnedAt: null,
      earnedBy: 150,
      difficulty: 'Advanced',
    },
  ]

  const filtered = filter === 'all' ? certificates : certificates.filter((c) => c.category === filter)

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] to-[#1A1A2E] p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-2">🏆 Certificates & Achievements</h1>
            <p className="text-gray-400">Showcase your expertise and dedication to your health journey</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-4">
            {['all', 'nutrition', 'fitness', 'health', 'community'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg border transition-all whitespace-nowrap capitalize ${
                  filter === cat
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-transparent'
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
                <div
                  className={`relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                    cert.earnedAt
                      ? 'border-yellow-500/30 bg-yellow-500/10 hover:border-yellow-500/50'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {/* Earned Badge */}
                  {cert.earnedAt && (
                    <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      ✓ Earned
                    </div>
                  )}

                  {/* Icon */}
                  <div className="text-5xl mb-3">{cert.emoji}</div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white mb-2">{cert.title}</h3>
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
                            ? 'text-green-400'
                            : cert.difficulty === 'Intermediate'
                              ? 'text-blue-400'
                              : 'text-red-400'
                        }`}
                      >
                        {cert.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Earned by:</span>
                      <span>{cert.earnedBy} users</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    className={`w-full py-2 rounded-lg font-semibold transition-all ${
                      cert.earnedAt
                        ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:opacity-90'
                    }`}
                  >
                    {cert.earnedAt ? '📜 View Certificate' : 'Start Earning'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Leaderboard Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-8 rounded-xl border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold text-white mb-6">👑 Top Certificate Earners</h2>
            <div className="space-y-3">
              {[
                { rank: 1, name: 'Alex Johnson', certificates: 12, level: '🥇 Expert' },
                { rank: 2, name: 'Sam Patel', certificates: 10, level: '🥈 Advanced' },
                { rank: 3, name: 'Jordan Lee', certificates: 9, level: '🥉 Advanced' },
              ].map((user) => (
                <div key={user.rank} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {user.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.level}</p>
                    </div>
                  </div>
                  <p className="text-yellow-400 font-bold">{user.certificates} 🏆</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </PageWrapper>
  )
}
