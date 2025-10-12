'use client'

import React from 'react'
import { cn } from '../../lib/utils'

interface EnhancedCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined' | 'technical'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface EnhancedCardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface EnhancedCardContentProps {
  children: React.ReactNode
  className?: string
}

interface EnhancedCardTitleProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'technical'
}

export function EnhancedCard({ 
  children, 
  className, 
  variant = 'default', 
  hover = false,
  padding = 'md'
}: EnhancedCardProps) {
  const baseClasses = 'rounded-lg border transition-all duration-200'
  
  const variants = {
    default: 'bg-white border-gray-200 shadow-sm',
    elevated: 'bg-white border-gray-200 shadow-md hover:shadow-lg',
    outlined: 'bg-transparent border-[#FF7043] border-2',
    technical: 'bg-[#1A1A1A] border-gray-700 text-white'
  }
  
  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-0.5' : ''
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  return (
    <div className={cn(
      baseClasses, 
      variants[variant], 
      paddingClasses[padding],
      hoverClasses, 
      className
    )}>
      {children}
    </div>
  )
}

export function EnhancedCardHeader({ children, className }: EnhancedCardHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 pb-4', className)}>
      {children}
    </div>
  )
}

export function EnhancedCardContent({ children, className }: EnhancedCardContentProps) {
  return (
    <div className={cn('pt-0', className)}>
      {children}
    </div>
  )
}

export function EnhancedCardTitle({ 
  children, 
  className, 
  variant = 'default' 
}: EnhancedCardTitleProps) {
  const variants = {
    default: 'text-xl font-bold text-[#1A1A1A] font-[\'Coinbase Display\']',
    technical: 'text-lg font-bold text-[#1A1A1A] font-mono'
  }
  
  return (
    <h3 className={cn(variants[variant], className)}>
      {children}
    </h3>
  )
}