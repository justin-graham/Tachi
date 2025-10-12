'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireOnboarding?: boolean
  redirectTo?: string
}

export function RouteGuard({
  children,
  requireAuth = true,
  requireOnboarding = false,
  redirectTo
}: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (isLoading) {
      return
    }

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname || '/dashboard')
      router.push(redirectTo || `/auth/login?returnUrl=${returnUrl}`)
      return
    }

    // Check onboarding completion
    if (requireOnboarding && user && !user.onboardingCompleted) {
      router.push('/onboarding')
      return
    }

    setIsAuthorized(true)
  }, [isLoading, isAuthenticated, user, requireAuth, requireOnboarding, router, pathname, redirectTo])

  // Show loading state while checking auth
  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}

// Higher-order component version
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<RouteGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard {...options}>
        <Component {...props} />
      </RouteGuard>
    )
  }
}
