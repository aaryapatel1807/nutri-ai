'use client'
import { motion } from 'framer-motion'
import { cardHover } from '@/lib/animations'

export default function GlassCard({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'p-6',
  style = {}
}) {
  const motionProps = hover ? {
    ...cardHover,
    whileTap: { scale: 0.98 }
  } : {}

  return (
    <motion.div
      style={{
        background: 'rgba(22,22,31,0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        padding: '24px',
        cursor: hover ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}
