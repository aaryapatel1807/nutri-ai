'use client'
import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeOffIcon } from '@heroicons/react/24/outline'

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const baseClasses = 'w-full px-4 py-3 bg-white/5 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 backdrop-blur-sm'
  
  const stateClasses = {
    default: 'border-gray-600/30 focus:border-purple-500 focus:ring-purple-500/20',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
    success: 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
  }

  const classes = `
    ${baseClasses}
    ${stateClasses[error ? 'error' : 'default']}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  const togglePassword = () => setShowPassword(!showPassword)

  return (
    <div className="relative">
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </motion.label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={type === 'password' && !showPassword ? 'password' : type}
          placeholder={placeholder}
          disabled={disabled}
          className={`${classes} ${leftIcon ? 'pl-12' : ''} ${rightIcon || type === 'password' ? 'pr-12' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          {...props}
        />
        
        {(rightIcon || type === 'password') && (
          <button
            type="button"
            onClick={type === 'password' ? togglePassword : undefined}
            disabled={disabled}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors pointer-events-none"
          >
            {type === 'password' ? (
              showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />
            ) : (
              rightIcon
            )}
          </button>
        )}
      </div>
      
      {helperText && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-2 text-sm ${error ? 'text-red-400' : 'text-gray-400'}`}
        >
          {helperText}
        </motion.p>
      )}
      
      {error && (
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-2 text-sm text-red-400 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 002 0v4a1 1 0 01-2 0V9z" clipRule="evenodd" />
          </svg>
          {error}
        </motion.p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
