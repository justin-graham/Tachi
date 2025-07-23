'use client'

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { base, baseSepolia, hardhat } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useMemo } from 'react'
import '@rainbow-me/rainbowkit/styles.css'

// Define chains
const chains = [base, baseSepolia, hardhat] as const

export function Providers({ children }: { children: ReactNode }) {
  // Create config - only initialize on client side
  const config = useMemo(() => {
    if (typeof window === 'undefined') {
      // Return minimal config for SSR
      return getDefaultConfig({
        appName: 'Tachi Publisher Dashboard',
        projectId: 'fallback-dev-id',
        chains: [hardhat],
        ssr: true,
      })
    }

    // Full config for client-side
    const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    const hasValidProjectId = walletConnectProjectId && 
                             walletConnectProjectId !== 'your-project-id' && 
                             walletConnectProjectId.length > 10

    return getDefaultConfig({
      appName: 'Tachi Publisher Dashboard',
      projectId: hasValidProjectId ? walletConnectProjectId! : 'fallback-dev-id',
      chains,
      ssr: false,
    })
  }, [])

  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false, // Disable retries in development
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
