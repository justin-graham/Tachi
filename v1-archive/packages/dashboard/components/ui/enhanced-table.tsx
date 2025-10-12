'use client'

import React from 'react'
import { cn } from '../../lib/utils'

interface EnhancedTableProps {
  children: React.ReactNode
  className?: string
}

interface EnhancedTableHeaderProps {
  children: React.ReactNode
  className?: string
}

interface EnhancedTableBodyProps {
  children: React.ReactNode
  className?: string
}

interface EnhancedTableRowProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

interface EnhancedTableCellProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'technical' | 'numeric'
  header?: boolean
}

export function EnhancedTable({ children, className }: EnhancedTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse', className)}>
        {children}
      </table>
    </div>
  )
}

export function EnhancedTableHeader({ children, className }: EnhancedTableHeaderProps) {
  return (
    <thead className={cn('bg-gray-50 border-b-2 border-gray-200', className)}>
      {children}
    </thead>
  )
}

export function EnhancedTableBody({ children, className }: EnhancedTableBodyProps) {
  return (
    <tbody className={cn('divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  )
}

export function EnhancedTableRow({ 
  children, 
  className, 
  hover = true 
}: EnhancedTableRowProps) {
  const hoverClasses = hover ? 'hover:bg-gray-50 transition-colors duration-150' : ''
  
  return (
    <tr className={cn(hoverClasses, className)}>
      {children}
    </tr>
  )
}

export function EnhancedTableCell({ 
  children, 
  className, 
  variant = 'default',
  header = false
}: EnhancedTableCellProps) {
  const Component = header ? 'th' : 'td'
  
  const baseClasses = 'px-4 py-3 text-left'
  
  const variants = {
    default: 'text-[#1A1A1A]',
    technical: 'font-mono text-sm text-[#1A1A1A]',
    numeric: 'font-mono text-right text-[#1A1A1A] tabular-nums'
  }
  
  const headerClasses = header 
    ? 'font-semibold text-xs uppercase tracking-wide text-[#52796F] font-[\'Coinbase Display\']'
    : ''
  
  return (
    <Component className={cn(
      baseClasses, 
      variants[variant], 
      headerClasses, 
      className
    )}>
      {children}
    </Component>
  )
}