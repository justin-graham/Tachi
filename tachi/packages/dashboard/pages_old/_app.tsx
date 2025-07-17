import '@rainbow-me/rainbowkit/styles.css'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create query client
const queryClient = new QueryClient()

// Create Wagmi config
const wagmiConfig = getDefaultConfig({
  appName: 'Tachi Publisher Dashboard',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <>
            <Head>
              <title>Tachi Publisher Dashboard</title>
              <meta name="description" content="Onboard to the Tachi pay-per-crawl protocol" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" href="/favicon.ico" />
            </Head>
            <Component {...pageProps} />
          </>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
