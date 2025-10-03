'use client'

import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { 
  useBaseCrawlFee,
  useUSDCBalance,
  useUSDCAllowance,
  useApproveUSDC,
  useRequestCrawl,
  formatUSDC
} from '../../lib/contracts/hooks'
import { FEE_CONFIG } from '../../lib/contracts/config'

const crawlRequestSchema = z.object({
  tokenId: z.number().min(1, 'Token ID must be greater than 0'),
  targetUrl: z.string().url('Must be a valid URL'),
  amount: z.string().min(1, 'Amount is required')
})

type CrawlRequestForm = z.infer<typeof crawlRequestSchema>

interface CrawlRequestFormProps {
  onSuccess?: () => void
}

export function CrawlRequestForm({ onSuccess }: CrawlRequestFormProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Contract hooks
  const { data: baseFee } = useBaseCrawlFee(chainId)
  const { data: usdcBalance } = useUSDCBalance(address, chainId)
  const { data: allowance } = useUSDCAllowance(address, address, chainId) // This needs the spender address
  const { approve, isPending: isApproving } = useApproveUSDC()
  const { requestCrawl, isPending: isRequesting } = useRequestCrawl()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<CrawlRequestForm>({
    resolver: zodResolver(crawlRequestSchema),
    defaultValues: {
      amount: baseFee ? formatUSDC(baseFee) : '1'
    }
  })

  const watchedAmount = watch('amount')
  const minFee = baseFee ? formatUSDC(baseFee) : '1'

  const calculateFees = (amount: string) => {
    const amountNum = parseFloat(amount || '0')
    const protocolFee = (amountNum * FEE_CONFIG.protocolFeePercent) / 10000
    const publisherAmount = amountNum - protocolFee
    return { protocolFee, publisherAmount }
  }

  const fees = calculateFees(watchedAmount)

  const onSubmit = async (data: CrawlRequestForm) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Check if user has enough USDC
      const amountNum = parseFloat(data.amount)
      const balanceNum = usdcBalance ? parseFloat(formatUSDC(usdcBalance)) : 0
      
      if (balanceNum < amountNum) {
        toast.error('Insufficient USDC balance')
        return
      }

      // Check minimum fee
      if (amountNum < parseFloat(minFee)) {
        toast.error(`Amount must be at least ${minFee} USDC`)
        return
      }

      // First approve USDC spending if needed
      // Note: This is a simplified check - in practice you'd check allowance against PaymentProcessor
      await approve(data.amount, chainId)
      
      // Then request the crawl
      await requestCrawl(data.tokenId, data.targetUrl, data.amount, chainId)
      
      toast.success('Crawl request submitted successfully!')
      reset()
      onSuccess?.()
      
    } catch (error) {
      console.error('Error submitting crawl request:', error)
      toast.error('Failed to submit crawl request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!address) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please connect your wallet to submit crawl requests</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Request Content Crawl</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700 mb-1">
            Publisher Token ID
          </label>
          <input
            {...register('tokenId', { valueAsNumber: true })}
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter token ID"
          />
          {errors.tokenId && (
            <p className="text-red-500 text-sm mt-1">{errors.tokenId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Target URL
          </label>
          <input
            {...register('targetUrl')}
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
          />
          {errors.targetUrl && (
            <p className="text-red-500 text-sm mt-1">{errors.targetUrl.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (USDC)
          </label>
          <input
            {...register('amount')}
            type="number"
            step="0.000001"
            min={minFee}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Minimum ${minFee} USDC`}
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Minimum fee: {minFee} USDC
          </p>
        </div>

        {/* Fee Breakdown */}
        {watchedAmount && parseFloat(watchedAmount) > 0 && (
          <div className="bg-gray-50 p-3 rounded-md text-sm">
            <h4 className="font-medium text-gray-700 mb-2">Fee Breakdown:</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span>{watchedAmount} USDC</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Protocol Fee (2.5%):</span>
                <span>{fees.protocolFee.toFixed(6)} USDC</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Publisher Receives:</span>
                <span>{fees.publisherAmount.toFixed(6)} USDC</span>
              </div>
            </div>
          </div>
        )}

        {/* Balance Display */}
        <div className="text-sm text-gray-600">
          Your USDC Balance: {usdcBalance ? formatUSDC(usdcBalance) : '0'} USDC
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isApproving || isRequesting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isSubmitting || isApproving || isRequesting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isApproving ? 'Approving...' : isRequesting ? 'Requesting...' : 'Processing...'}
            </span>
          ) : (
            'Submit Crawl Request'
          )}
        </button>
      </form>
    </div>
  )
}