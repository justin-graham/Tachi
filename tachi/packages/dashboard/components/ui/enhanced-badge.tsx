'use client'

import React from 'react'
import { cn } from '../../lib/utils'

interface EnhancedBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'technical'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EnhancedBadge({
  children,
  variant = 'default',
  size = 'md',
  className
}: EnhancedBadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full border'
  
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    technical: 'bg-[#1A1A1A] text-white border-gray-700 font-mono'
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }
  
  return (
    <span className={cn(
      baseClasses,
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  )
}