import { createWalletClient, createPublicClient, http, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base, baseSepolia, hardhat } from 'viem/chains'
import { crawlNftAbi, getCrawlNftAddress } from '@/contracts/crawl-nft'

// Get the appropriate chain for the given chainId
function getChain(chainId: number) {
  switch (chainId) {
    case 31337:
      return hardhat
    case 84532:
      return baseSepolia
    case 8453:
      return base
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

/**
 * Mint a CrawlNFT license using the deployer's private key (Approach A)
 * WARNING: This is for demo purposes only! Never expose private keys in production.
 */
export async function mintLicenseAsOwner(
  chainId: number,
  publisher: Address,
  termsURI: string
): Promise<{ hash: string; tokenId?: bigint }> {
  const deployerPrivateKey = process.env.NEXT_PUBLIC_DEPLOYER_PRIVATE_KEY
  if (!deployerPrivateKey) {
    throw new Error('NEXT_PUBLIC_DEPLOYER_PRIVATE_KEY not configured')
  }

  const contractAddress = getCrawlNftAddress(chainId)
  if (!contractAddress) {
    throw new Error(`CrawlNFT contract not deployed on chain ${chainId}`)
  }

  const chain = getChain(chainId)
  const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`)
  
  // Get the RPC URL for the chain
  const rpcUrl = chainId === 31337 ? 'http://127.0.0.1:8545' : undefined
  
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl)
  })

  // Call mintLicense function
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: crawlNftAbi,
    functionName: 'mintLicense',
    args: [publisher, termsURI],
  })

  return { hash }
}

/**
 * Check if a publisher already has a license
 */
export async function checkHasLicense(
  chainId: number,
  publisher: Address
): Promise<boolean> {
  const contractAddress = getCrawlNftAddress(chainId)
  if (!contractAddress) {
    throw new Error(`CrawlNFT contract not deployed on chain ${chainId}`)
  }

  const chain = getChain(chainId)
  
  // Get the RPC URL for the chain
  const rpcUrl = chainId === 31337 ? 'http://127.0.0.1:8545' : undefined
  
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl)
  })

  const result = await publicClient.readContract({
    address: contractAddress,
    abi: crawlNftAbi,
    functionName: 'hasLicense',
    args: [publisher],
  })

  return result as boolean
}
