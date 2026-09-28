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
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px var(--shadow-color)',
        cursor: hover ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
      {...motionProps}
      className={`${padding} ${className}`}
    >
      {children}
    </motion.div>
  )
}
