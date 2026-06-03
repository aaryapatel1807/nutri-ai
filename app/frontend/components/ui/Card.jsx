'use client'
import { motion } from 'framer-motion'
import { forwardRef } from 'react'

const Card = forwardRef(({
  children,
  className = '',
  variant = 'default',
  hover = true,
  glass = false,
  ...props
}, ref) => {
  const baseClasses = 'rounded-2xl transition-all duration-300'
  
  const variants = {
    default: 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50',
    glass: 'bg-white/5 backdrop-blur-xl border border-white/10',
    elevated: 'bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-600/30 shadow-2xl',
    success: 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30',
    warning: 'bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30',
    danger: 'bg-gradient-to-br from-red-500/20 to-pink-600/20 border border-red-500/30',
  }
  
  const hoverEffects = {
    default: hover ? 'hover:shadow-2xl hover:border-gray-600/50 hover:scale-[1.02]' : '',
    glass: hover ? 'hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]' : '',
    elevated: hover ? 'hover:shadow-3xl hover:border-gray-500/40 hover:scale-[1.03]' : '',
  }

  const classes = `
    ${baseClasses}
    ${variants[glass ? 'glass' : variant]}
    ${hoverEffects[glass ? 'glass' : variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  return (
    <motion.div
      ref={ref}
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : {}}
      transition={{ duration: 0.3 }}
      {...props}
    >
      <div className="relative">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
        
        {/* Inner content */}
        <div className="relative p-6">
          {children}
        </div>
      </div>
    </motion.div>
  )
})

Card.displayName = 'Card'

export default Card
