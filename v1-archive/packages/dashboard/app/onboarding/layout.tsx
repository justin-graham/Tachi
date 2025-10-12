'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requireAuth={true} requireOnboarding={false}>
      {children}
    </RouteGuard>
  )
}
