import { base, baseSepolia } from 'viem/chains'
import { Address } from 'viem'

// Chain configuration
export const SUPPORTED_CHAINS = [base, baseSepolia] as const
export const DEFAULT_CHAIN = base

// Contract addresses per chain
export interface ContractAddresses {
  crawlNFT: Address
  paymentProcessor: Address
  usdc: Address
}

// Base Mainnet (Chain ID: 8453)
const baseMainnetAddresses: ContractAddresses = {
  crawlNFT: '0x0000000000000000000000000000000000000000', // Will be updated after deployment
  paymentProcessor: '0x0000000000000000000000000000000000000000', // Will be updated after deployment
  usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC
}

// Base Sepolia (Chain ID: 84532)
const baseSepoliaAddresses: ContractAddresses = {
  crawlNFT: '0x0000000000000000000000000000000000000000', // Will be updated after deployment
  paymentProcessor: '0x0000000000000000000000000000000000000000', // Will be updated after deployment
  usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Base Sepolia USDC
}

export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [base.id]: baseMainnetAddresses,
  [baseSepolia.id]: baseSepoliaAddresses
}

// Environment variable overrides
export function getContractAddresses(chainId: number): ContractAddresses {
  const envAddresses: Partial<ContractAddresses> = {}
  
  // Check for environment variable overrides
  if (process.env.NEXT_PUBLIC_CRAWL_NFT_ADDRESS) {
    envAddresses.crawlNFT = process.env.NEXT_PUBLIC_CRAWL_NFT_ADDRESS as Address
  }
  
  if (process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS) {
    envAddresses.paymentProcessor = process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS as Address
  }
  
  if (process.env.NEXT_PUBLIC_USDC_ADDRESS) {
    envAddresses.usdc = process.env.NEXT_PUBLIC_USDC_ADDRESS as Address
  }
  
  const defaultAddresses = CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[base.id]
  
  return {
    ...defaultAddresses,
    ...envAddresses
  }
}

// Contract deployment info
export const CONTRACT_DEPLOYMENT_INFO = {
  crawlNFT: {
    name: 'Tachi Content License',
    symbol: 'CRAWL',
    description: 'Soulbound NFT representing publisher licenses for the Tachi Protocol'
  },
  paymentProcessor: {
    name: 'Tachi Payment Processor',
    description: 'Handles USDC payments for crawl requests and publisher fee distribution'
  }
}

// Fee configuration
export const FEE_CONFIG = {
  baseCrawlFee: 1_000_000, // 1 USDC (6 decimals)
  protocolFeePercent: 250, // 2.5% (250 basis points)
  maxPaymentAmount: 1000_000_000 // 1000 USDC (6 decimals)
}