import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useNetworkGuard } from './useNetworkGuard'
import { showWalletSuccess, showWalletError, showTransactionPending, showTransactionSuccess, showApiError } from '../toast'

// Mock CrawlNFT contract ABI - replace with actual ABI
const CRAWL_NFT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'originUrl', type: 'string' }
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }]
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

// Mock contract address - replace with actual deployed address
const CRAWL_NFT_ADDRESS = '0x1234567890123456789012345678901234567890' as const

interface LicenseData {
  tokenId: bigint
  owner: string
  price: bigint
  originUrl: string
  isActive: boolean
}

interface MintLicenseParams {
  price: string // Price in USDC (e.g., "1.50")
  originUrl: string
}

export function useLicense() {
  const { address, isConnected } = useAccount()
  const { isOnSupportedChain } = useNetworkGuard()
  const queryClient = useQueryClient()
  
  const { writeContract, data: hash, isPending: isMinting } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash 
  })
  
  // Read user's license balance
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    address: CRAWL_NFT_ADDRESS,
    abi: CRAWL_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && isOnSupportedChain && !!address,
  })
  
  // Query to fetch user's licenses
  const { 
    data: licenses, 
    isLoading: isLoadingLicenses,
    error: licensesError 
  } = useQuery({
    queryKey: ['licenses', address],
    queryFn: async (): Promise<LicenseData[]> => {
      if (!address || !isConnected) return []
      
      // Mock implementation - replace with actual API call
      // This should call your backend API to get user's licenses
      const response = await fetch(`/api/licenses/${address}`)
      if (!response.ok) throw new Error('Failed to fetch licenses')
      
      return response.json()
    },
    enabled: isConnected && isOnSupportedChain && !!address,
    staleTime: 30000,
    retry: 2,
  })
  
  // Mint license mutation
  const mintLicense = useMutation({
    mutationFn: async ({ price, originUrl }: MintLicenseParams) => {
      if (!address || !isConnected || !isOnSupportedChain) {
        throw new Error('Wallet not connected or on wrong network')
      }
      
      const priceInWei = parseEther(price)
      
      // Show pending transaction toast
      showTransactionPending(hash || '')
      
      // Call the contract
      await writeContract({
        address: CRAWL_NFT_ADDRESS,
        abi: CRAWL_NFT_ABI,
        functionName: 'mint',
        args: [address, priceInWei, originUrl],
        value: parseEther('0.01'), // Mint fee
      })
      
      return { hash, price, originUrl }
    },
    onSuccess: (data) => {
      showTransactionSuccess(data.hash || '', 'License minted')
      // Invalidate and refetch licenses
      queryClient.invalidateQueries({ queryKey: ['licenses', address] })
    },
    onError: (error) => {
      console.error('Mint license error:', error)
      showWalletError('License minting', error instanceof Error ? error.message : 'Unknown error')
    }
  })
  
  // Update license mutation
  const updateLicense = useMutation({
    mutationFn: async ({ tokenId, price, originUrl }: { tokenId: string, price: string, originUrl: string }) => {
      if (!address || !isConnected || !isOnSupportedChain) {
        throw new Error('Wallet not connected or on wrong network')
      }
      
      // This should call your backend API to update license metadata
      const response = await fetch(`/api/licenses/${tokenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, originUrl })
      })
      
      if (!response.ok) throw new Error('Failed to update license')
      return response.json()
    },
    onSuccess: () => {
      showWalletSuccess('License updated')
      queryClient.invalidateQueries({ queryKey: ['licenses', address] })
    },
    onError: (error) => {
      console.error('Update license error:', error)
      showApiError('License update', error instanceof Error ? error.message : 'Unknown error')
    }
  })
  
  return {
    // State
    balance: balance ? Number(balance) : 0,
    licenses: licenses || [],
    isConnected,
    isOnSupportedChain,
    
    // Loading states
    isLoadingBalance,
    isLoadingLicenses,
    isMinting: isMinting || isConfirming,
    isConfirmed,
    
    // Actions
    mintLicense: mintLicense.mutate,
    updateLicense: updateLicense.mutate,
    
    // Mutation states
    mintError: mintLicense.error,
    updateError: updateLicense.error,
    licensesError,
    
    // Transaction data
    transactionHash: hash,
  }
}