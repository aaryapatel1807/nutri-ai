'use client'
import { motion } from 'framer-motion'
// PageWrapper removed to fix double-wrap bug

export default function RoadmapPage() {
  const roadmapItems = [
    {
      quarter: 'Q2 2026',
      status: 'In Progress',
      color: 'from-cyan-400 to-blue-500',
      items: [
        '✓ User authentication & profiles',
        '✓ Meal logging and tracking',
        '✓ Workout planning',
        'AI nutrition recommendations',
      ],
    },
    {
      quarter: 'Q3 2026',
      status: 'Planned',
      color: 'from-purple-400 to-pink-500',
      items: [
        'Social features & friend challenges',
        'Advanced analytics dashboard',
        'Mobile app launch',
        'Integration with wearables',
      ],
    },
    {
      quarter: 'Q4 2026',
      status: 'Planned',
      color: 'from-green-400 to-cyan-400',
      items: [
        'AI meal plan generator',
        'Personalized supplement recommendations',
        'Offline mode support',
        'Smart notifications',
      ],
    },
    {
      quarter: 'Q1 2027',
      status: 'Planned',
      color: 'from-orange-400 to-red-500',
      items: [
        'Community challenges & competitions',
        'Professional coach network',
        'Advanced health metrics',
        'Integration with health platforms',
      ],
    },
  ]

  const features = [
    { emoji: '🤖', name: 'AI Coaching', description: 'Personalized guidance powered by AI' },
    { emoji: '📸', name: 'Food Detection', description: 'Scan meals for instant nutrition data' },
    { emoji: '📈', name: 'Forecasting', description: 'Predict health outcomes with ML' },
    { emoji: '🏆', name: 'Gamification', description: 'Earn badges and compete with friends' },
    { emoji: '📱', name: 'Mobile App', description: 'Native iOS and Android apps' },
    { emoji: '⌚', name: 'Wearables', description: 'Sync with Apple Watch, Fitbit, etc.' },
  ]

  return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] to-[#1A1A2E] p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold text-white mb-2">🗺️ Our Roadmap</h1>
            <p className="text-gray-400">Here's what we're building for NutriAI in 2026 and beyond</p>
          </div>

          {/* Timeline */}
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {roadmapItems.map((quarter, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  {/* Vertical Line */}
                  {idx < roadmapItems.length - 1 && (
                    <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
                  )}

                  <div className={`p-6 rounded-xl border border-white/10 bg-gradient-to-br ${quarter.color} bg-opacity-10 backdrop-blur-sm`}>
                    {/* Status Badge */}
                    <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm font-semibold mb-3">
                      <span className={`text-transparent bg-clip-text bg-gradient-to-r ${quarter.color}`}>{quarter.status}</span>
                    </div>

                    {/* Quarter */}
                    <h3 className="text-2xl font-bold text-white mb-4">{quarter.quarter}</h3>

                    {/* Items */}
                    <ul className="space-y-2">
                      {quarter.items.map((item, i) => (
                        <li key={i} className="text-gray-300 text-sm flex items-start">
                          <span className="mr-2">{item.startsWith('✓') ? '✅' : '◻️'}</span>
                          {item.replace('✓ ', '')}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Features Spotlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">✨ Upcoming Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm text-center"
                >
                  <div className="text-4xl mb-3">{feature.emoji}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.name}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Newsletter CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-8 rounded-xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm text-center"
          >
            <h3 className="text-2xl font-bold text-white mb-2">📬 Stay Updated</h3>
            <p className="text-gray-300 mb-6">Subscribe to get notified when new features launch</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
              <button className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all">
                Subscribe
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
  )
}
