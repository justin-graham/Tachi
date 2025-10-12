'use client'

import React from 'react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
}

const colorClasses = {
  primary: 'border-blue-600 border-t-transparent',
  secondary: 'border-gray-600 border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-400 border-t-transparent',
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

// Full page loading
export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <div className="text-center">
        <LoadingSpinner size="xl" color="primary" className="mx-auto mb-4" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}

// Inline loading
export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center space-x-3 p-4">
      <LoadingSpinner size="sm" color="primary" />
      {message && <span className="text-gray-600 text-sm">{message}</span>}
    </div>
  )
}

// Button loading state
export function ButtonLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <span className="flex items-center space-x-2">
      <LoadingSpinner size="sm" color="white" />
      <span>{text}</span>
    </span>
  )
}

// Card loading overlay
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <div className="text-center">
        <LoadingSpinner size="lg" color="primary" className="mx-auto mb-3" />
        {message && <p className="text-gray-700 font-medium">{message}</p>}
      </div>
    </div>
  )
}

// Transaction loading state with progress
export function TransactionLoading({
  step,
  totalSteps = 3,
  message,
}: {
  step: number
  totalSteps?: number
  message?: string
}) {
  const steps = [
    'Initiating transaction...',
    'Waiting for confirmation...',
    'Processing...',
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <LoadingSpinner size="lg" color="primary" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">Processing Transaction</h3>
          <p className="text-sm text-gray-600 mb-4">
            {message || steps[step - 1] || 'Processing...'}
          </p>

          {/* Progress steps */}
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <React.Fragment key={i}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    i < step
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : i === step
                      ? 'border-blue-600 text-blue-600 animate-pulse'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {i < step ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-medium">{i + 1}</span>
                  )}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      i < step ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Dots loading animation
export function DotsLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// Skeleton pulse (alternative to spinner)
export function PulseLoader({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${100 - i * 10}%` }} />
      ))}
    </div>
  )
}
