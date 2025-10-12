import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import type { Hash } from 'viem'
import { toast } from 'react-hot-toast'
import { getContractAddresses } from './config'
import { CRAWL_NFT_ABI, PAYMENT_PROCESSOR_ABI, USDC_ABI } from './abis'

// Hook to get contract addresses for current chain
export function useContractAddresses(chainId?: number) {
  return getContractAddresses(chainId || 8453) // Default to Base mainnet
}

// CrawlNFT Hooks
export function useHasLicense(publisher?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)

  return useReadContract({
    address: addresses.crawlNFT,
    abi: CRAWL_NFT_ABI,
    functionName: 'hasLicense',
    args: publisher ? [publisher as `0x${string}`] : undefined,
    query: {
      enabled: !!publisher
    }
  })
}

export function usePublisherTokenId(publisher?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useReadContract({
    address: addresses.crawlNFT,
    abi: CRAWL_NFT_ABI,
    functionName: 'getPublisherTokenId',
    args: publisher ? [publisher as `0x${string}`] : undefined,
    query: {
      enabled: !!publisher
    }
  })
}

export function useLicenseData(tokenId?: number, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useReadContract({
    address: addresses.crawlNFT,
    abi: CRAWL_NFT_ABI,
    functionName: 'getLicenseData',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId && tokenId > 0
    }
  })
}

// PaymentProcessor Hooks
export function useBaseCrawlFee(chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useReadContract({
    address: addresses.paymentProcessor,
    abi: PAYMENT_PROCESSOR_ABI,
    functionName: 'baseCrawlFee'
  })
}

export function useProtocolFeePercent(chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useReadContract({
    address: addresses.paymentProcessor,
    abi: PAYMENT_PROCESSOR_ABI,
    functionName: 'protocolFeePercent'
  })
}

export function usePublisherBalance(publisher?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useReadContract({
    address: addresses.paymentProcessor,
    abi: PAYMENT_PROCESSOR_ABI,
    functionName: 'publisherBalances',
    args: publisher ? [publisher as `0x${string}`] : undefined,
    query: {
      enabled: !!publisher
    }
  })
}

export function useUserEscrowBalance(user?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useReadContract({
    address: addresses.paymentProcessor,
    abi: PAYMENT_PROCESSOR_ABI,
    functionName: 'getPublisherStats',
    args: user ? [user as `0x${string}`] : undefined,
    query: {
      enabled: !!user,
      select: (data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          return data[0] as bigint
        }
        return undefined
      }
    }
  })
}

// USDC Hooks
export function useUSDCBalance(account?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useReadContract({
    address: addresses.usdc,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: account ? [account as `0x${string}`] : undefined,
    query: {
      enabled: !!account
    }
  })
}

export function useUSDCAllowance(owner?: string, spender?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useReadContract({
    address: addresses.usdc,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner as `0x${string}`, spender as `0x${string}`] : undefined,
    query: {
      enabled: !!(owner && spender)
    }
  })
}

// Write hooks with transaction handling (wagmi v2 style)
export function useRequestCrawl(chainId?: number) {
  const addresses = useContractAddresses(chainId)
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const requestCrawl = async (
    tokenId: number,
    targetUrl: string,
    amount: string
  ): Promise<Hash | undefined> => {
    const amountWei = parseUnits(amount, 6)

    try {
      const txHash = await writeContractAsync({
        address: addresses.paymentProcessor,
        abi: PAYMENT_PROCESSOR_ABI,
        functionName: 'requestCrawl',
        args: [BigInt(tokenId), targetUrl, amountWei],
      })
      return txHash
    } catch (error) {
      console.error('Error requesting crawl:', error)
      toast.error('Failed to request crawl')
      return undefined
    }
  }

  return {
    requestCrawl,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed
  }
}

// Simplified approve hook for wagmi v2
export function useApproveUSDC(chainId?: number) {
  const addresses = useContractAddresses(chainId)
  const { writeContractAsync, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = async (amount: string): Promise<Hash | undefined> => {
    const amountWei = parseUnits(amount, 6)

    try {
      const txHash = await writeContractAsync({
        address: addresses.usdc,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [addresses.paymentProcessor, amountWei],
      })
      toast.success('Approval initiated')
      return txHash
    } catch (error) {
      console.error('Error approving USDC:', error)
      toast.error('Failed to approve USDC')
      return undefined
    }
  }

  return {
    approve,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed
  }
}

// Simplified withdraw hook
export function useWithdrawPublisherBalance(chainId?: number) {
  const addresses = useContractAddresses(chainId)
  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const withdrawBalance = async () => {
    try {
      writeContract({
        address: addresses.paymentProcessor,
        abi: PAYMENT_PROCESSOR_ABI,
        functionName: 'withdrawFees',
      })
      toast.success('Withdrawal initiated')
    } catch (error) {
      console.error('Error withdrawing balance:', error)
      toast.error('Failed to withdraw balance')
    }
  }

  return {
    withdrawBalance,
    hash,
    isPending: isPending || isConfirming,
    isConfirmed
  }
}

// Utility functions
export function formatUSDC(amount: bigint): string {
  return formatUnits(amount, 6)
}

export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, 6)
}

// Custom hook for complete crawl request flow
export function useCrawlRequestFlow(chainId?: number) {
  const { approve, isPending: isApproving, isConfirmed: isApprovalConfirmed } = useApproveUSDC(chainId)
  const { requestCrawl, isPending: isRequesting, isConfirmed: isRequestConfirmed } = useRequestCrawl(chainId)

  const executeCrawlRequest = async (
    tokenId: number,
    targetUrl: string,
    amount: string
  ) => {
    try {
      // First approve USDC spending
      await approve(amount)
      
      // Wait for approval confirmation before proceeding
      // Note: In a real implementation, you'd want to handle this with proper state management
      // For now, the user will need to call requestCrawl separately after approval
      
      toast.success('USDC approval initiated. Please confirm the transaction and then submit your crawl request.')
    } catch (error) {
      console.error('Error in crawl request flow:', error)
      toast.error('Failed to complete crawl request')
    }
  }

  const executeAfterApproval = async (
    tokenId: number,
    targetUrl: string,
    amount: string
  ) => {
    try {
      await requestCrawl(tokenId, targetUrl, amount)
      toast.success('Crawl request submitted successfully')
    } catch (error) {
      console.error('Error requesting crawl:', error)
      toast.error('Failed to submit crawl request')
    }
  }

  return {
    executeCrawlRequest,
    executeAfterApproval,
    isPending: isApproving || isRequesting,
    isApprovalConfirmed,
    isRequestConfirmed,
    canProceedToCrawl: isApprovalConfirmed && !isRequesting
  }
}
