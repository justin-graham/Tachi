'use client'

import React from 'react'
import { EnhancedButton } from '../ui/enhanced-button'
import { EnhancedCard, EnhancedCardContent } from '../ui/enhanced-card'

export interface ErrorMessageProps {
  title?: string
  message: string
  error?: Error
  onRetry?: () => void
  retryText?: string
  showDetails?: boolean
  variant?: 'error' | 'warning' | 'info'
}

const variantStyles = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    messageColor: 'text-red-600',
    detailsBg: 'bg-red-50',
    detailsBorder: 'border-red-200',
    detailsText: 'text-red-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800',
    messageColor: 'text-yellow-600',
    detailsBg: 'bg-yellow-50',
    detailsBorder: 'border-yellow-200',
    detailsText: 'text-yellow-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-600',
    detailsBg: 'bg-blue-50',
    detailsBorder: 'border-blue-200',
    detailsText: 'text-blue-700',
  },
}

export function ErrorMessage({
  title = 'Error',
  message,
  error,
  onRetry,
  retryText = 'Try Again',
  showDetails = false,
  variant = 'error',
}: ErrorMessageProps) {
  const styles = variantStyles[variant]

  return (
    <EnhancedCard className={`${styles.bg} ${styles.border}`}>
      <EnhancedCardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center`}>
            {variant === 'error' && (
              <svg className={`w-6 h-6 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L2.732 15.5C1.962 16.333 2.924 18 4.464 18z"
                />
              </svg>
            )}
            {variant === 'warning' && (
              <svg className={`w-6 h-6 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {variant === 'info' && (
              <svg className={`w-6 h-6 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${styles.titleColor} mb-1`}>{title}</h3>
            <p className={`text-sm ${styles.messageColor} mb-4`}>{message}</p>

            {/* Error details (development only) */}
            {error && showDetails && process.env.NODE_ENV === 'development' && (
              <details className={`mt-4 p-3 ${styles.detailsBg} rounded border ${styles.detailsBorder}`}>
                <summary className={`cursor-pointer text-sm font-medium ${styles.titleColor}`}>
                  Error Details (Development)
                </summary>
                <pre className={`mt-2 text-xs ${styles.detailsText} overflow-auto max-h-40`}>
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}

            {/* Retry button */}
            {onRetry && (
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-4"
              >
                {retryText}
              </EnhancedButton>
            )}
          </div>
        </div>
      </EnhancedCardContent>
    </EnhancedCard>
  )
}

// Inline error message (smaller, no card)
export function InlineError({
  message,
  onRetry,
  retryText = 'Retry',
}: {
  message: string
  onRetry?: () => void
  retryText?: string
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded text-sm">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-red-700">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-700 hover:text-red-800 font-medium underline"
        >
          {retryText}
        </button>
      )}
    </div>
  )
}

// Network error with automatic retry
export function NetworkError({
  onRetry,
  retryDelay = 5,
  autoRetry = false,
}: {
  onRetry: () => void
  retryDelay?: number
  autoRetry?: boolean
}) {
  const [countdown, setCountdown] = React.useState(retryDelay)
  const [isRetrying, setIsRetrying] = React.useState(false)

  React.useEffect(() => {
    if (autoRetry && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (autoRetry && countdown === 0) {
      handleRetry()
    }
  }, [autoRetry, countdown])

  const handleRetry = async () => {
    setIsRetrying(true)
    await onRetry()
    setIsRetrying(false)
    setCountdown(retryDelay)
  }

  return (
    <ErrorMessage
      title="Network Error"
      message={
        autoRetry
          ? `Connection lost. Retrying in ${countdown} seconds...`
          : "Unable to connect. Please check your internet connection and try again."
      }
      onRetry={autoRetry ? undefined : handleRetry}
      retryText={isRetrying ? 'Retrying...' : 'Retry Now'}
      variant="warning"
    />
  )
}
