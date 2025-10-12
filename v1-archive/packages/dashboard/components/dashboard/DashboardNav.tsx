'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { EnhancedBadge } from '../ui/enhanced-badge'
import { EnhancedButton } from '../ui/enhanced-button'

interface NavTab {
  id: string
  label: string
  href: string
}

const navTabs: NavTab[] = [
  { id: 'overview', label: 'Overview', href: '/dashboard' },
  { id: 'api-keys', label: 'API Keys', href: '/dashboard/api-keys' },
  { id: 'billing', label: 'Billing', href: '/dashboard/billing' },
  { id: 'settings', label: 'Settings', href: '/dashboard/settings' },
]

interface DashboardNavProps {
  networkBadge?: string
}

export function DashboardNav({ networkBadge = 'Base' }: DashboardNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await logout(false) // false = don't disconnect wallet, just logout session
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getActiveTab = () => {
    const tab = navTabs.find(t => t.href === pathname)
    return tab?.id || 'overview'
  }

  return (
    <div className="bg-white border-b-2 border-[#FF7043] shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-[#1A1A1A] font-['Coinbase Display']">
            Publisher Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <EnhancedBadge variant="info" size="md">
              <span className="w-2 h-2 bg-[#0052FF] rounded-full mr-2 animate-pulse"></span>
              {networkBadge}
            </EnhancedBadge>

            {/* User email/name */}
            {user?.profile?.email && (
              <span className="text-sm text-gray-600 hidden md:inline">
                {user.profile.name || user.profile.email}
              </span>
            )}

            {/* Logout Button */}
            <EnhancedButton
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'LOGGING OUT...' : 'LOGOUT'}
            </EnhancedButton>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-8 border-b border-gray-200">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className={`pb-3 px-1 font-medium text-sm uppercase tracking-wide transition-colors border-b-2 ${
                getActiveTab() === tab.id
                  ? 'text-[#FF7043] border-[#FF7043]'
                  : 'text-[#52796F] border-transparent hover:text-[#1A1A1A] hover:border-gray-300'
              } font-['Coinbase Display']`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
