"use client"

import { useWriteContract, useReadContract, useAccount, useChainId } from 'wagmi'
import { CRAWL_NFT_CONTRACT } from '@/contracts/crawl-nft'
import { Abi } from 'viem'

/**
 * Hook for minting a new license NFT.
 * It encapsulates the write interaction with the CrawlNFT contract.
 */
export function useMintLicense() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { data: hash, isPending, error, writeContract, status } = useWriteContract()

  const mintLicense = (publisher: `0x${string}`, termsURI: string) => {
    if (!chainId || !CRAWL_NFT_CONTRACT.address[chainId]) {
      console.error("Chain ID not supported or contract address not found.");
      return;
    }
    
    console.log('useMintLicense: Preparing to mint...', {
      contractAddress: CRAWL_NFT_CONTRACT.address[chainId],
      args: [publisher, termsURI],
      account: address,
    })

    writeContract({
      address: CRAWL_NFT_CONTRACT.address[chainId],
      abi: CRAWL_NFT_CONTRACT.abi as Abi,
      functionName: 'mintLicense',
      args: [publisher, termsURI],
    })
  }

  return { 
    mintLicense, 
    hash, 
    isPending, 
    isConfirming: status === 'pending',
    isConfirmed: status === 'success',
    error 
  }
}

/**
 * Hook for self-minting a license NFT (convenience function).
 * Uses the new mintMyLicense function for better UX.
 */
export function useMintMyLicense() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { data: hash, isPending, error, writeContract, status } = useWriteContract()

  const mintMyLicense = (termsURI: string) => {
    if (!chainId || !CRAWL_NFT_CONTRACT.address[chainId]) {
      console.error("Chain ID not supported or contract address not found.");
      return;
    }
    
    console.log('useMintMyLicense: Preparing to self-mint...', {
      contractAddress: CRAWL_NFT_CONTRACT.address[chainId],
      args: [termsURI],
      account: address,
    })

    writeContract({
      address: CRAWL_NFT_CONTRACT.address[chainId],
      abi: CRAWL_NFT_CONTRACT.abi as Abi,
      functionName: 'mintMyLicense',
      args: [termsURI],
    })
  }

  return { 
    mintMyLicense, 
    hash, 
    isPending, 
    isConfirming: status === 'pending',
    isConfirmed: status === 'success',
    error 
  }
}

/**
 * Hook to check if a given address already has a license.
 * @returns A wagmi read hook result object.
 */
export function useHasLicense() {
    const { address } = useAccount()
    const chainId = useChainId()

    return useReadContract({
        address: CRAWL_NFT_CONTRACT.address[chainId],
        abi: CRAWL_NFT_CONTRACT.abi as Abi,
        functionName: 'hasLicense',
        args: [address],
        query: {
            enabled: !!address && !!chainId, // Only run query if address and chainId are available
        },
    })
}
