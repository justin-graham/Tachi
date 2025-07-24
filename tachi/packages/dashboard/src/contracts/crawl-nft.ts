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
  31337: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Local hardhat - deployed CrawlNFT
  84532: '0x...', // Base Sepolia (to be deployed)
  8453: '0x...', // Base Mainnet (to be deployed)
}

// Get contract address for current chain
export function getCrawlNftAddress(chainId: number): Address | undefined {
  return crawlNftAddresses[chainId]
}
