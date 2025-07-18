import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, base, baseSepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// Custom Hardhat network for local development
export const hardhat = {
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Hardhat', url: 'http://localhost:8545' },
  },
  testnet: true,
} as const

export const config = getDefaultConfig({
  appName: 'Tachi Dashboard',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [hardhat, baseSepolia, base, mainnet, sepolia],
  transports: {
    [hardhat.id]: http(),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    [base.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

// Contract addresses by network
export const contractAddresses = {
  // Local Hardhat Network (Chain ID: 31337)
  31337: {
    crawlNFT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    paymentProcessor: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    proofOfCrawlLedger: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    mockUSDC: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
    // Base Sepolia testnet
  84532: {
    crawlNFT: process.env.NEXT_PUBLIC_CRAWLNFT_ADDRESS_BASE_SEPOLIA || '',
    paymentProcessor: process.env.NEXT_PUBLIC_PAYMENTPROCESSOR_ADDRESS_BASE_SEPOLIA || '',
    proofLedger: process.env.NEXT_PUBLIC_PROOF_LEDGER_ADDRESS_BASE_SEPOLIA || '',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
  },
  // Base Mainnet
  8453: {
    crawlNFT: process.env.NEXT_PUBLIC_CRAWLNFT_ADDRESS_BASE_MAINNET || '',
    paymentProcessor: process.env.NEXT_PUBLIC_PAYMENTPROCESSOR_ADDRESS_BASE_MAINNET || '',
    proofLedger: process.env.NEXT_PUBLIC_PROOF_LEDGER_ADDRESS_BASE_MAINNET || '',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet USDC
  },
} as const

export const tachiConfig = {
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545',
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3000/api/gateway',
  // Default to Hardhat network for development
  defaultChainId: 31337,
  // Get contract addresses for current network
  getContractAddresses: (chainId: number = 31337) => {
    return contractAddresses[chainId as keyof typeof contractAddresses] || contractAddresses[31337]
  },
}
