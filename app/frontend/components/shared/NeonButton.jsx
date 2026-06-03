'use client'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function NeonButton({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  className = ''
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'btn-neon'
      case 'ghost':
        return 'btn-ghost'
      case 'outline':
        return 'bg-transparent border border-neon-green text-neon-green hover:bg-neon-green hover:text-black'
      default:
        return 'btn-neon'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm'
      case 'md':
        return 'px-6 py-3 text-base'
      case 'lg':
        return 'px-8 py-4 text-lg'
      default:
        return 'px-6 py-3 text-base'
    }
  }

  const classes = `
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${fullWidth ? 'w-full' : ''}
    ${loading ? 'opacity-70 cursor-not-allowed' : ''}
    ${className}
  `

  return (
    <motion.button
      className={classes}
      onClick={onClick}
      disabled={loading}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <span className="flex items-center justify-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </span>
      )}
    </motion.button>
  )
}
