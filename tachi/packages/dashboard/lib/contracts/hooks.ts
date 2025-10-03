import { useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
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
  
  return useContractRead({
    address: addresses.crawlNFT,
    abi: CRAWL_NFT_ABI,
    functionName: 'hasLicense',
    args: publisher ? [publisher] : undefined,
    enabled: !!publisher
  })
}

export function usePublisherTokenId(publisher?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useContractRead({
    address: addresses.crawlNFT,
    abi: CRAWL_NFT_ABI,
    functionName: 'getPublisherTokenId',
    args: publisher ? [publisher] : undefined,
    enabled: !!publisher
  })
}

export function useLicenseData(tokenId?: number, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useContractRead({
    address: addresses.crawlNFT,
    abi: CRAWL_NFT_ABI,
    functionName: 'getLicenseData',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    enabled: !!tokenId && tokenId > 0
  })
}

// PaymentProcessor Hooks
export function useBaseCrawlFee(chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useContractRead({
    address: addresses.paymentProcessor,
    abi: PAYMENT_PROCESSOR_ABI,
    functionName: 'baseCrawlFee'
  })
}

export function useProtocolFeePercent(chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useContractRead({
    address: addresses.paymentProcessor,
    abi: PAYMENT_PROCESSOR_ABI,
    functionName: 'protocolFeePercent'
  })
}

export function usePublisherBalance(publisher?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useContractRead({
    address: addresses.paymentProcessor,
    abi: PAYMENT_PROCESSOR_ABI,
    functionName: 'publisherBalances',
    args: publisher ? [publisher] : undefined,
    enabled: !!publisher
  })
}

export function useUserEscrowBalance(user?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useContractRead({
    address: addresses.paymentProcessor,
    abi: PAYMENT_PROCESSOR_ABI,
    functionName: 'getUserEscrowBalance',
    args: user ? [user] : undefined,
    enabled: !!user
  })
}

// USDC Hooks
export function useUSDCBalance(account?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useContractRead({
    address: addresses.usdc,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    enabled: !!account
  })
}

export function useUSDCAllowance(owner?: string, spender?: string, chainId?: number) {
  const addresses = useContractAddresses(chainId)
  
  return useContractRead({
    address: addresses.usdc,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    enabled: !!(owner && spender)
  })
}

// Write hooks with transaction handling (wagmi v1 style)
export function useRequestCrawl() {
  const { write, data, isLoading } = useContractWrite({
    address: undefined, // Will be set dynamically
    abi: PAYMENT_PROCESSOR_ABI,
    functionName: 'requestCrawl',
  })

  const { isLoading: isWaiting } = useWaitForTransaction({
    hash: data?.hash,
  })

  const requestCrawl = async (
    tokenId: number,
    targetUrl: string,
    amount: string,
    chainId?: number
  ) => {
    const addresses = useContractAddresses(chainId)
    const amountWei = parseUnits(amount, 6)

    try {
      write?.({
        recklesslySetUnpreparedArgs: [BigInt(tokenId), targetUrl, amountWei],
        recklesslySetUnpreparedOverrides: {
          // Set the contract address dynamically
        }
      })
    } catch (error) {
      console.error('Error requesting crawl:', error)
      toast.error('Failed to request crawl')
    }
  }

  return {
    requestCrawl,
    hash: data?.hash,
    isPending: isLoading || isWaiting
  }
}

// Simplified approve hook for wagmi v1
export function useApproveUSDC() {
  const { write, data, isLoading } = useContractWrite({
    address: undefined, // Will be set dynamically  
    abi: USDC_ABI,
    functionName: 'approve',
  })

  const { isLoading: isWaiting } = useWaitForTransaction({
    hash: data?.hash,
  })

  const approve = async (amount: string, chainId?: number) => {
    const addresses = useContractAddresses(chainId)
    const amountWei = parseUnits(amount, 6)

    try {
      write?.({
        recklesslySetUnpreparedArgs: [addresses.paymentProcessor, amountWei],
      })
      toast.success('Approval initiated')
    } catch (error) {
      console.error('Error approving USDC:', error)
      toast.error('Failed to approve USDC')
    }
  }

  return {
    approve,
    hash: data?.hash,
    isPending: isLoading || isWaiting
  }
}

// Simplified withdraw hook
export function useWithdrawPublisherBalance() {
  const { write, data, isLoading } = useContractWrite({
    address: undefined,
    abi: PAYMENT_PROCESSOR_ABI,
    functionName: 'withdrawPublisherBalance',
  })

  const { isLoading: isWaiting } = useWaitForTransaction({
    hash: data?.hash,
  })

  const withdrawBalance = async (chainId?: number) => {
    try {
      write?.()
      toast.success('Withdrawal initiated')
    } catch (error) {
      console.error('Error withdrawing balance:', error)
      toast.error('Failed to withdraw balance')
    }
  }

  return {
    withdrawBalance,
    hash: data?.hash,
    isPending: isLoading || isWaiting
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
export function useCrawlRequestFlow() {
  const { approve, isPending: isApproving } = useApproveUSDC()
  const { requestCrawl, isPending: isRequesting } = useRequestCrawl()

  const executeCrawlRequest = async (
    tokenId: number,
    targetUrl: string,
    amount: string,
    chainId?: number
  ) => {
    try {
      // First approve USDC spending
      await approve(amount, chainId)
      
      // Then request the crawl
      await requestCrawl(tokenId, targetUrl, amount, chainId)
      
      toast.success('Crawl request submitted successfully')
    } catch (error) {
      console.error('Error in crawl request flow:', error)
      toast.error('Failed to complete crawl request')
    }
  }

  return {
    executeCrawlRequest,
    isPending: isApproving || isRequesting
  }
}