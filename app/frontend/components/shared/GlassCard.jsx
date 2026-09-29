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
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(26px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(26px) saturate(1.6)',
        border: '1px solid var(--glass-border)',
        borderRadius: '26px',
        boxShadow: 'var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)',
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
