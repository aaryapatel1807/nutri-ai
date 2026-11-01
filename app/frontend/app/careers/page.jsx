'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
// PageWrapper removed to fix double-wrap bug

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')

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

  const visibleJobs = activeFilter === 'All' ? jobs : jobs.filter(j => j.department === activeFilter)

  return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-primary)] p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-[var(--text-primary)] mb-2">🌟 Join Our Team</h1>
            <p className="text-gray-400">
              Help millions of people achieve their health and fitness goals. We're hiring talented, passionate individuals.
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-4">
            {['All', 'Engineering', 'Health', 'Product', 'Marketing'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-[#FF6B5E] via-[#FFB020] to-[#7B61FF] text-white border-transparent'
                    : 'border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--track)]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {visibleJobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedJob(job)}
                className="cursor-pointer group"
              >
                <div className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-[var(--track)] hover:border-[var(--border)] transition-all duration-300 backdrop-blur-sm h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{job.emoji}</div>
                    <span className="text-xs px-2 py-1 bg-[#FFB020]/15 text-[#D97706] rounded-full">{job.type}</span>
                  </div>

                  {/* Title & Department */}
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{job.title}</h3>
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
                  <a
                    href={`mailto:careers@nutriai.com?subject=${encodeURIComponent('Application: ' + job.title)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 block w-full py-2 bg-gradient-to-r from-[#FF6B5E] via-[#FFB020] to-[#7B61FF] text-white rounded-lg font-semibold hover:opacity-90 transition-all text-center"
                  >
                    Apply Now
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center p-8 rounded-xl border border-[#FF6B5E]/30 bg-[#FF6B5E]/10 backdrop-blur-sm"
          >
            <p className="text-gray-300 mb-4">Don't see the right fit? We're always looking for talented people.</p>
            <a href="mailto:careers@nutriai.com" className="inline-block px-8 py-3 bg-gradient-to-r from-[#FF6B5E] via-[#FFB020] to-[#7B61FF] text-white rounded-lg font-semibold hover:bg-[#0D7F9B] transition-all">
              Send Your Resume
            </a>
          </motion.div>
          {/* Job detail modal */}
          {selectedJob && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              onClick={() => setSelectedJob(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-lg p-8 rounded-xl border border-white/10 bg-[#12121c]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{selectedJob.emoji}</div>
                  <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{selectedJob.title}</h2>
                <p className="text-sm text-gray-400 mb-4">{selectedJob.department} · {selectedJob.location} · {selectedJob.type} · {selectedJob.experience}</p>
                <p className="text-gray-300 mb-6">{selectedJob.description}</p>
                <a
                  href={`mailto:careers@nutriai.com?subject=${encodeURIComponent('Application: ' + selectedJob.title)}`}
                  className="block w-full py-3 bg-gradient-to-r from-[#FF6B5E] via-[#FFB020] to-[#7B61FF] text-white rounded-lg font-semibold hover:opacity-90 transition-all text-center"
                >
                  Apply for this role
                </a>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
  )
}
