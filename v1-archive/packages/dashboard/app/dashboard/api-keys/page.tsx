'use client'

import { useRouter } from 'next/navigation'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { ApiKeysTab } from '@/components/dashboard/ApiKeysTab'

export default function ApiKeysPage() {
  const router = useRouter()
  const navigationTabs = [
    { id: 'overview', label: 'Overview', href: '/dashboard' },
    { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics' },
    { id: 'api-keys', label: 'API Keys', href: '/dashboard/api-keys' },
    { id: 'billing', label: 'Billing', href: '/dashboard/billing' },
    { id: 'settings', label: 'Settings', href: '/dashboard/settings' },
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="bg-white border-b-2 border-[#FF7043] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-[#1A1A1A] font-['Coinbase Display']">Publisher Dashboard</h1>
            <div className="flex items-center space-x-4">
              <EnhancedBadge variant="info" size="md">
                <span className="w-2 h-2 bg-[#0052FF] rounded-full mr-2 animate-pulse"></span>
                Base Network
              </EnhancedBadge>
              <EnhancedButton variant="ghost" size="sm">
                PROFILE
              </EnhancedButton>
            </div>
          </div>
          <nav className="flex space-x-8 border-b border-gray-200">
            {navigationTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => router.push(tab.href)}
                className={`pb-3 px-1 font-medium text-sm uppercase tracking-wide transition-colors border-b-2 ${
                  tab.id === 'api-keys'
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <ApiKeysTab />
      </div>
    </div>
  )
}
