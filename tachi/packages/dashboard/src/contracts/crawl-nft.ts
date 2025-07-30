import { type Address } from 'viem'

// CrawlNFT Contract ABI (minimal - only functions we need)
export const crawlNftAbi = [
  {
    inputs: [
      { name: "publisher", type: "address" },
      { name: "termsURI", type: "string" }
    ],
    name: "mintLicense",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "termsURI", type: "string" }],
    name: "mintMyLicense",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "publisher", type: "address" }],
    name: "hasLicense",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "publisher", type: "address" }],
    name: "getPublisherTokenId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "publisher", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "termsURI", type: "string" }
    ],
    name: "LicenseMinted",
    type: "event"
  }
] as const

// Contract addresses by network
export const crawlNftAddresses: Record<number, Address> = {
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Local hardhat - deployed CrawlNFT
  84532: process.env.NEXT_PUBLIC_CRAWLNFT_ADDRESS_BASE_SEPOLIA as Address, // Base Sepolia
  8453: process.env.NEXT_PUBLIC_CRAWLNFT_ADDRESS_BASE_MAINNET as Address, // Base Mainnet
}

export const CRAWL_NFT_CONTRACT = {
  abi: crawlNftAbi,
  address: crawlNftAddresses,
}
