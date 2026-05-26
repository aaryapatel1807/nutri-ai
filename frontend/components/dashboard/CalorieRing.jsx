'use client'
import { motion } from 'framer-motion'

export default function CalorieRing({ current = 0, goal = 2000, size = 180 }) {
  const percent = Math.min(current / goal, 1)
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = percent * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="white"
          strokeWidth="12"
          fill="none"
          opacity="0.05"
        />
        
        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: 0 }}
          animate={{ strokeDasharray }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF87" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-[2rem] text-white">{current}</div>
        <div className="text-[var(--text-muted)] text-sm">of {goal} kcal</div>
      </div>
      
      {/* Percentage Label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="chip chip-green">
          {Math.round(percent * 100)}% of Daily Goal
        </div>
      </div>
    </div>
  )
}
