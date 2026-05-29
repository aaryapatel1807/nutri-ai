'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import PageWrapper from '../../components/shared/PageWrapper'

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState(null)

  const jobs = [
    {
      id: 1,
      title: 'Fitness Coach',
      department: 'Coaching',
      emoji: '💪',
      location: 'Remote',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Build personalized workout plans and mentor clients on their fitness journey.',
    },
    {
      id: 2,
      title: 'Nutritionist',
      department: 'Health',
      emoji: '🥗',
      location: 'Bangalore, India',
      type: 'Full-time',
      experience: '2+ years',
      description: 'Create meal plans, analyze nutrition data, and guide users on healthy eating.',
    },
    {
      id: 3,
      title: 'ML Engineer',
      department: 'Engineering',
      emoji: '🤖',
      location: 'Remote',
      type: 'Full-time',
      experience: '4+ years',
      description: 'Develop AI models for food detection, health forecasting, and personalization.',
    },
    {
      id: 4,
      title: 'Product Manager',
      department: 'Product',
      emoji: '🎯',
      location: 'Remote',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Drive product strategy and vision for our health and fitness platform.',
    },
    {
      id: 5,
      title: 'React Developer',
      department: 'Engineering',
      emoji: '⚛️',
      location: 'Remote',
      type: 'Full-time',
      experience: '2+ years',
      description: 'Build beautiful, responsive UIs for web and mobile using React and Next.js.',
    },
    {
      id: 6,
      title: 'Community Manager',
      department: 'Marketing',
      emoji: '🌍',
      location: 'Remote',
      type: 'Part-time',
      experience: '1+ years',
      description: 'Engage with our community, manage social media, and build brand advocacy.',
    },
  ]

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] to-[#1A1A2E] p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-2">🌟 Join Our Team</h1>
            <p className="text-gray-400">
              Help millions of people achieve their health and fitness goals. We're hiring talented, passionate individuals.
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-4">
            {['All', 'Engineering', 'Health', 'Product', 'Marketing'].map((filter) => (
              <button
                key={filter}
                className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all whitespace-nowrap"
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {jobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedJob(job)}
                className="cursor-pointer group"
              >
                <div className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{job.emoji}</div>
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">{job.type}</span>
                  </div>

                  {/* Title & Department */}
                  <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{job.department}</p>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-4">{job.description}</p>

                  {/* Meta */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-400">
                      <span className="mr-2">📍</span> {job.location}
                    </div>
                    <div className="flex items-center text-gray-400">
                      <span className="mr-2">⏱️</span> {job.experience}
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="mt-4 w-full py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all">
                    Apply Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center p-8 rounded-xl border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-sm"
          >
            <p className="text-gray-300 mb-4">Don't see the right fit? We're always looking for talented people.</p>
            <a href="mailto:careers@nutriai.com" className="inline-block px-8 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-all">
              Send Your Resume
            </a>
          </motion.div>
        </motion.div>
      </div>
    </PageWrapper>
  )
}
