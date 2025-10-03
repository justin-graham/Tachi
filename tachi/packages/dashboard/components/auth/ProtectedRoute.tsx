'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredUserType?: 'publisher' | 'crawler'
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredUserType, 
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/connect')
    } else if (
      !isLoading && 
      isAuthenticated && 
      user && 
      requiredUserType && 
      user.userType !== requiredUserType
    ) {
      // Redirect to appropriate dashboard based on user type
      if (user.userType === 'publisher') {
        router.push('/dashboard')
      } else {
        router.push('/dashboard/analytics')
      }
    }
  }, [isLoading, isAuthenticated, user, requiredUserType, router])

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF7043] border-t-transparent mx-auto mb-4"></div>
            <p className="text-[#52796F] font-medium">Loading...</p>
          </div>
        </div>
      )
    )
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Authentication Required</h2>
            <p className="text-[#52796F] mb-6">Please sign in to access this page</p>
            <button
              onClick={() => router.push('/auth/connect')}
              className="bg-[#FF7043] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e55a35] transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      )
    )
  }

  if (requiredUserType && user?.userType !== requiredUserType) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Access Denied</h2>
            <p className="text-[#52796F] mb-6">
              This page requires {requiredUserType} access
            </p>
            <button
              onClick={() => {
                if (user?.userType === 'publisher') {
                  router.push('/dashboard')
                } else {
                  router.push('/dashboard/analytics')
                }
              }}
              className="bg-[#FF7043] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e55a35] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}