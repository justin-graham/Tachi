'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '../ui/enhanced-card'
import { EnhancedButton } from '../ui/enhanced-button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <EnhancedCard variant="elevated" className="bg-white border-red-200">
          <EnhancedCardHeader>
            <EnhancedCardTitle className="text-red-800">
              Something went wrong
            </EnhancedCardTitle>
          </EnhancedCardHeader>
          <EnhancedCardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L2.732 15.5C1.962 16.333 2.924 18 4.464 18z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">An unexpected error occurred</h3>
                  <p className="text-red-600 text-sm">
                    We apologize for the inconvenience. Please try refreshing the page.
                  </p>
                </div>
              </div>
              
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <details className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                  <summary className="cursor-pointer text-sm font-medium text-red-800">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-700 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex space-x-3">
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </EnhancedButton>
                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                >
                  Try Again
                </EnhancedButton>
              </div>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      )
    }

    return this.props.children
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    // You can integrate with error reporting services like Sentry here
  }
}