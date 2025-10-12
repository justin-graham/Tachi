'use client'

import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200'

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  }

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%'),
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      {...props}
    />
  )
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="flex space-x-4 mb-4 pb-3 border-b border-gray-200">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`header-${i}`} className="flex-1">
            <Skeleton height={20} width="60%" />
          </div>
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4 mb-4 py-3 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1">
              <Skeleton height={16} width={`${60 + Math.random() * 30}%`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// Card Skeleton
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <Skeleton height={24} width="40%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={16} width={`${70 + Math.random() * 20}%`} />
      ))}
    </div>
  )
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <Skeleton height={32} width="50%" className="mb-2" />
      <Skeleton height={14} width="70%" className="mb-2" />
      <Skeleton height={12} width="40%" />
    </div>
  )
}

// List Skeleton
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="60%" />
            <Skeleton height={12} width="40%" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Form Skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton height={14} width="30%" className="mb-2" />
          <Skeleton height={40} width="100%" />
        </div>
      ))}
      <Skeleton height={40} width={120} className="mt-6" />
    </div>
  )
}

// Chart Skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton height={24} width="40%" />
      <div className="flex items-end justify-between space-x-2" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${30 + Math.random() * 70}%`}
            variant="rectangular"
          />
        ))}
      </div>
      <div className="flex justify-center space-x-4">
        <Skeleton height={12} width={80} />
        <Skeleton height={12} width={80} />
      </div>
    </div>
  )
}

// Transaction Row Skeleton
export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100">
      <div className="flex items-center space-x-4 flex-1">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="space-y-2 flex-1">
          <Skeleton height={16} width="40%" />
          <Skeleton height={12} width="30%" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton height={18} width={80} />
        <Skeleton height={12} width={60} />
      </div>
    </div>
  )
}

// Balance Skeleton
export function BalanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Skeleton height={24} width="30%" className="mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton height={16} width="40%" />
              <Skeleton height={20} width="25%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
