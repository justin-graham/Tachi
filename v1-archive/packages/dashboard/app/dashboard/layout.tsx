'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requireAuth={true} requireOnboarding={true}>
      {children}
    </RouteGuard>
  )
}
