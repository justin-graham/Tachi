import { useWriteContract, useReadContract, useChainId, useWaitForTransactionReceipt } from 'wagmi'
import { crawlNftAbi, getCrawlNftAddress } from '@/contracts/crawl-nft'
import { type Address } from 'viem'

export function useMintLicense() {
  const chainId = useChainId()
  const contractAddress = getCrawlNftAddress(chainId)

  const { 
    writeContract, 
    data: hash, 
    isPending, 
    error 
  } = useWriteContract()

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash,
  })

  const mintLicense = async (publisher: Address, termsURI: string) => {
    if (!contractAddress) {
      throw new Error(`CrawlNFT contract not deployed on chain ${chainId}`)
    }

    writeContract({
      address: contractAddress,
      abi: crawlNftAbi,
      functionName: 'mintLicense',
      args: [publisher, termsURI],
    })
  }

  return {
    mintLicense,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

export function useHasLicense(publisher?: Address) {
  const chainId = useChainId()
  const contractAddress = getCrawlNftAddress(chainId)

  return useReadContract({
    address: contractAddress,
    abi: crawlNftAbi,
    functionName: 'hasLicense',
    args: publisher ? [publisher] : undefined,
    query: {
      enabled: !!publisher && !!contractAddress,
    },
  })
}

export function useGetPublisherTokenId(publisher?: Address) {
  const chainId = useChainId()
  const contractAddress = getCrawlNftAddress(chainId)

  return useReadContract({
    address: contractAddress,
    abi: crawlNftAbi,
    functionName: 'getPublisherTokenId',
    args: publisher ? [publisher] : undefined,
    query: {
      enabled: !!publisher && !!contractAddress,
    },
  })
}

export function useTotalSupply() {
  const chainId = useChainId()
  const contractAddress = getCrawlNftAddress(chainId)

  return useReadContract({
    address: contractAddress,
    abi: crawlNftAbi,
    functionName: 'totalSupply',
    query: {
      enabled: !!contractAddress,
    },
  })
}
