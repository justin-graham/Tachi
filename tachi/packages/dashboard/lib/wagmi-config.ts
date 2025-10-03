import { configureChains, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
// import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { env } from './env'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [base, baseSepolia],
  [
    alchemyProvider({ apiKey: env.NEXT_PUBLIC_ALCHEMY_KEY }),
    publicProvider()
  ]
)

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    // WalletConnect disabled - can be re-enabled by adding project ID
    // new WalletConnectConnector({
    //   chains,
    //   options: {
    //     projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    //     metadata: {
    //       name: 'Tachi Protocol',
    //       description: 'Publisher dashboard for content monetization',
    //       url: env.NEXT_PUBLIC_APP_URL,
    //       icons: [`${env.NEXT_PUBLIC_APP_URL}/favicon.ico`]
    //     }
    //   },
    // }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'Tachi Protocol',
        appLogoUrl: `${env.NEXT_PUBLIC_APP_URL}/favicon.ico`,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
})

export { chains }