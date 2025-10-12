import { http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { env } from './env'

export const wagmiConfig = getDefaultConfig({
  appName: 'Tachi Protocol',
  projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  chains: [base, baseSepolia],
  ssr: true,
  transports: {
    [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_KEY}`),
  },
})
