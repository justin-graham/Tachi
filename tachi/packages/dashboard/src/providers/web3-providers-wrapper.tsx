'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// Dynamic import with no SSR to avoid IndexedDB issues
const Web3ProviderComponent = dynamic(
  () => import('./web3-provider').then(mod => ({ default: mod.Providers })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Web3 providers...</p>
        </div>
      </div>
    )
  }
)

export function Web3Providers({ children }: { children: ReactNode }) {
  return <Web3ProviderComponent>{children}</Web3ProviderComponent>
}
