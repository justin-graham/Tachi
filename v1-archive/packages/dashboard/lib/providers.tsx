'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary, useErrorHandler } from '../components/error/ErrorBoundary'
import { AuthProvider } from '../hooks/useAuth'
import { http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { env } from './env'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const handleError = useErrorHandler()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000, // 30 seconds
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  }))

  const [wagmiConfig] = React.useState(() => getDefaultConfig({
    appName: 'Tachi Protocol',
    projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    chains: [base, baseSepolia],
    ssr: true,
    transports: {
      [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_KEY}`),
      [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    },
  }))

  return (
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {mounted ? (
            <RainbowKitProvider>
              <AuthProvider>
                <ErrorBoundary onError={handleError}>
                  {children}
                </ErrorBoundary>
              </AuthProvider>
            </RainbowKitProvider>
          ) : (
            <ErrorBoundary onError={handleError}>
              {children}
            </ErrorBoundary>
          )}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              className: '',
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#ffffff',
                },
                duration: 6000,
              },
              loading: {
                iconTheme: {
                  primary: '#6B7280',
                  secondary: '#ffffff',
                },
              },
            }}
          />
          {mounted && <ReactQueryDevtools initialIsOpen={false} />}
        </WagmiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
