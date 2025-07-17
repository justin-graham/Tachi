'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { useMemo } from 'react'
import '@rainbow-me/rainbowkit/styles.css'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'tachi-dashboard-dev'

export function Providers({ children }: { children: React.ReactNode }) {
  // Create RainbowKit configuration
  const config = useMemo(() => {
    return getDefaultConfig({
      appName: 'Tachi Publisher Dashboard',
      projectId,
      chains: [base, baseSepolia],
      ssr: false, // Disable SSR to avoid hydration issues
    })
  }, [])

  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      },
    },
  }), [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
