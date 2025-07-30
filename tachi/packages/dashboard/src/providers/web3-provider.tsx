'use client'

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { base, baseSepolia, hardhat } from 'wagmi/chains'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ReactNode } from 'react'
import '@rainbow-me/rainbowkit/styles.css'

const config = getDefaultConfig({
  appName: 'Tachi Publisher Dashboard',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || (() => {
    console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not found. Get your project ID from https://cloud.walletconnect.com/')
    return '2f05a7c0b1e6d7a8b9c8d7e6f5a4b3c2' // Development fallback ID
  })(),
  chains: [base, baseSepolia, hardhat],
  ssr: false, // Disable SSR to prevent indexedDB issues
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
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
