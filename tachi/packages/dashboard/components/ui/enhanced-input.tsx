'use client'

import React from 'react'
import { cn } from '../../lib/utils'

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'technical' | 'outlined'
  error?: boolean
  helperText?: string
}

export function EnhancedInput({
  variant = 'default',
  error = false,
  helperText,
  className,
  placeholder,
  ...props
}: EnhancedInputProps) {
  const baseClasses = 'w-full px-0 py-3 bg-transparent transition-all duration-200 focus:outline-none border-0 border-b-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    default: 'border-[#FF7043] focus:border-[#FF7043] text-[#1A1A1A] placeholder:text-[#A0A0A0] placeholder:font-medium',
    technical: 'border-[#FF7043] focus:border-[#FF7043] bg-[#1A1A1A] text-white font-mono placeholder:text-gray-400',
    outlined: 'border-[#FF7043] focus:border-[#FF7043] text-[#1A1A1A] placeholder:text-[#A0A0A0]'
  }
  
  const errorClasses = error 
    ? 'border-red-500 focus:border-red-500' 
    : ''
  
  const inputClasses = cn(baseClasses, variants[variant], errorClasses, className)
  
  return (
    <div className="space-y-2">
      <input 
        className={inputClasses} 
        placeholder={placeholder}
        {...props} 
      />
      {helperText && (
        <p className={cn(
          'text-xs font-mono',
          error ? 'text-red-600' : 'text-[#52796F]'
        )}>
          {helperText}
        </p>
      )}
    </div>
  )
}