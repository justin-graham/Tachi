'use client'

import React from 'react'
import { cn } from '../../lib/utils'

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'technical'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function EnhancedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: EnhancedButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-[#FF7043] text-white hover:bg-[#e55a35] focus:ring-[#FF7043] shadow-sm hover:shadow-md',
    secondary: 'bg-[#52796F] text-white hover:bg-[#455e56] focus:ring-[#52796F] shadow-sm hover:shadow-md',
    outline: 'border-2 border-[#FF7043] text-[#FF7043] bg-transparent hover:bg-[#FF7043] hover:text-white focus:ring-[#FF7043]',
    ghost: 'text-[#1A1A1A] bg-transparent hover:bg-gray-100 focus:ring-gray-300',
    technical: 'bg-[#1A1A1A] text-white font-mono hover:bg-gray-800 focus:ring-gray-600 border border-gray-700'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg'
  }
  
  const variantClasses = variants[variant]
  const sizeClasses = sizes[size]
  
  return (
    <button
      className={cn(baseClasses, variantClasses, sizeClasses, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
      )}
      {children}
    </button>
  )
}