'use client'
import { motion, AnimatePresence } from 'framer-motion'
import NeonButton from '@/components/shared/NeonButton'

export default function BadgeUnlock({ isOpen, badge, onClose }) {
  if (!isOpen || !badge) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[rgba(0,0,0,0.88)] backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-6xl mb-4">{badge.emoji}</div>
          <div 
            className="font-display text-[2.5rem] text-white mb-2"
            style={{ textShadow: `0 0 20px ${badge.color}` }}
          >
            NEW BADGE UNLOCKED!
          </div>
          <div className="font-display text-[1.5rem] text-white mb-4">
            {badge.name}
          </div>
          <motion.div
            className="chip chip-orange inline-block text-lg"
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -40, opacity: 0 }}
            transition={{ duration: 2 }}
            style={{ color: '#FFD700' }}
          >
            +{badge.xp || 200} XP
          </motion.div>
          <div className="mt-8">
            <NeonButton onClick={onClose}>
              AWESOME! 🎉
            </NeonButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
