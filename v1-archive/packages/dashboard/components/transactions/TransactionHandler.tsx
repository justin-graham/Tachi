'use client'

import React, { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '../ui/enhanced-card'
import { EnhancedButton } from '../ui/enhanced-button'
import { EnhancedBadge } from '../ui/enhanced-badge'
import { useAccount, useChainId } from 'wagmi'
import { useApproveUSDC, useRequestCrawl, useWithdrawPublisherBalance } from '../../lib/contracts/hooks'

interface TransactionState {
  type: 'idle' | 'approving' | 'requesting' | 'withdrawing' | 'success' | 'error'
  message?: string
  txHash?: string
  error?: string
}

interface TransactionHandlerProps {
  className?: string
}

export function TransactionHandler({ className }: TransactionHandlerProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const [transactionState, setTransactionState] = useState<TransactionState>({ type: 'idle' })
  const [formData, setFormData] = useState({
    tokenId: '1',
    targetUrl: '',
    amount: '1.00'
  })

  // Contract hooks
  const { approve, hash: approveHash, isPending: isApproving, isConfirmed: isApprovalConfirmed } = useApproveUSDC(chainId)
  const { requestCrawl, hash: crawlHash, isPending: isRequesting, isConfirmed: isCrawlConfirmed } = useRequestCrawl(chainId)
  const { withdrawBalance, hash: withdrawHash, isPending: isWithdrawing, isConfirmed: isWithdrawConfirmed } = useWithdrawPublisherBalance(chainId)

  // Error handling helper
  const handleError = useCallback((error: unknown, context: string) => {
    console.error(`${context} error:`, error)
    
    let errorMessage = 'An unexpected error occurred'
    
    if (error instanceof Error) {
      // Common web3 errors
      if (error.message.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      } else if (error.message.includes('gas')) {
        errorMessage = 'Gas estimation failed. Please try again.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.'
      } else if (error.message.includes('allowance')) {
        errorMessage = 'Token allowance error. Please approve tokens first.'
      } else {
        errorMessage = error.message
      }
    }

    setTransactionState({
      type: 'error',
      error: errorMessage,
      message: `${context} failed`
    })
    
    toast.error(errorMessage, { duration: 6000 })
  }, [])

  // Transaction handlers with comprehensive error handling
  const handleApproval = useCallback(async () => {
    if (!address || !formData.amount) {
      toast.error('Please connect wallet and enter amount')
      return
    }

    try {
      setTransactionState({
        type: 'approving',
        message: 'Requesting token approval...'
      })

      await approve(formData.amount)

      setTransactionState({
        type: 'approving',
        message: 'Approval transaction submitted. Waiting for confirmation...',
        txHash: approveHash
      })

      toast.success('Approval transaction submitted!', {
        duration: 4000,
        icon: '⏳'
      })
    } catch (error) {
      handleError(error, 'Token approval')
    }
  }, [address, formData.amount, approve, approveHash, handleError])

  const handleCrawlRequest = useCallback(async () => {
    if (!address || !formData.tokenId || !formData.targetUrl || !formData.amount) {
      toast.error('Please fill in all fields')
      return
    }

    if (!isApprovalConfirmed) {
      toast.error('Please approve tokens first')
      return
    }

    try {
      setTransactionState({
        type: 'requesting',
        message: 'Submitting crawl request...'
      })

      await requestCrawl(parseInt(formData.tokenId), formData.targetUrl, formData.amount)

      setTransactionState({
        type: 'requesting',
        message: 'Crawl request submitted. Waiting for confirmation...',
        txHash: crawlHash
      })

      toast.success('Crawl request submitted!', {
        duration: 4000,
        icon: '🔍'
      })
    } catch (error) {
      handleError(error, 'Crawl request')
    }
  }, [address, formData, isApprovalConfirmed, requestCrawl, crawlHash, handleError])

  const handleWithdrawal = useCallback(async () => {
    if (!address) {
      toast.error('Please connect wallet')
      return
    }

    try {
      setTransactionState({
        type: 'withdrawing',
        message: 'Initiating withdrawal...'
      })

      await withdrawBalance()

      setTransactionState({
        type: 'withdrawing',
        message: 'Withdrawal transaction submitted. Waiting for confirmation...',
        txHash: withdrawHash
      })

      toast.success('Withdrawal initiated!', {
        duration: 4000,
        icon: '💰'
      })
    } catch (error) {
      handleError(error, 'Balance withdrawal')
    }
  }, [address, withdrawBalance, withdrawHash, handleError])

  // Update state when transactions are confirmed
  React.useEffect(() => {
    if (isApprovalConfirmed && transactionState.type === 'approving') {
      setTransactionState({
        type: 'success',
        message: 'Token approval confirmed!',
        txHash: approveHash
      })
      toast.success('Tokens approved successfully!', { icon: '✅' })
    }
  }, [isApprovalConfirmed, transactionState.type, approveHash])

  React.useEffect(() => {
    if (isCrawlConfirmed && transactionState.type === 'requesting') {
      setTransactionState({
        type: 'success',
        message: 'Crawl request confirmed!',
        txHash: crawlHash
      })
      toast.success('Crawl request confirmed!', { icon: '✅' })
    }
  }, [isCrawlConfirmed, transactionState.type, crawlHash])

  React.useEffect(() => {
    if (isWithdrawConfirmed && transactionState.type === 'withdrawing') {
      setTransactionState({
        type: 'success',
        message: 'Withdrawal completed!',
        txHash: withdrawHash
      })
      toast.success('Withdrawal completed!', { icon: '✅' })
    }
  }, [isWithdrawConfirmed, transactionState.type, withdrawHash])

  if (!address) {
    return (
      <EnhancedCard className={className}>
        <EnhancedCardContent className="text-center py-8">
          <p className="text-[#52796F]">Connect your wallet to access transaction features</p>
        </EnhancedCardContent>
      </EnhancedCard>
    )
  }

  return (
    <EnhancedCard variant="elevated" className={`bg-white ${className}`}>
      <EnhancedCardHeader>
        <EnhancedCardTitle>Transaction Center</EnhancedCardTitle>
      </EnhancedCardHeader>
      <EnhancedCardContent>
        <div className="space-y-6">
          {/* Transaction Status */}
          {transactionState.type !== 'idle' && (
            <div className={`p-4 rounded-lg border-l-4 ${
              transactionState.type === 'error' 
                ? 'bg-red-50 border-red-500' 
                : transactionState.type === 'success'
                ? 'bg-green-50 border-green-500'
                : 'bg-blue-50 border-blue-500'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${
                    transactionState.type === 'error' 
                      ? 'text-red-800' 
                      : transactionState.type === 'success'
                      ? 'text-green-800'
                      : 'text-blue-800'
                  }`}>
                    {transactionState.message}
                  </p>
                  {transactionState.error && (
                    <p className="text-red-600 text-sm mt-1">{transactionState.error}</p>
                  )}
                </div>
                {transactionState.txHash && (
                  <a
                    href={`https://basescan.org/tx/${transactionState.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-mono"
                  >
                    View TX
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Crawl Request Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1A1A1A]">Request Crawl</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-[#52796F] mb-2">
                  Token ID
                </label>
                <input
                  type="number"
                  value={formData.tokenId}
                  onChange={(e) => setFormData(prev => ({ ...prev, tokenId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  placeholder="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#52796F] mb-2">
                  Target URL
                </label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#52796F] mb-2">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                  placeholder="1.00"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <EnhancedButton
                onClick={handleApproval}
                disabled={isApproving || !formData.amount}
                variant={isApprovalConfirmed ? "outline" : "primary"}
                className="flex-1"
              >
                {isApproving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Approving...
                  </>
                ) : isApprovalConfirmed ? (
                  <>✓ Approved</>
                ) : (
                  'Approve USDC'
                )}
              </EnhancedButton>
              
              <EnhancedButton
                onClick={handleCrawlRequest}
                disabled={isRequesting || !isApprovalConfirmed || !formData.targetUrl}
                variant="primary"
                className="flex-1"
              >
                {isRequesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Requesting...
                  </>
                ) : (
                  'Request Crawl'
                )}
              </EnhancedButton>
            </div>
          </div>

          {/* Withdrawal Section */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Publisher Actions</h3>
            <EnhancedButton
              onClick={handleWithdrawal}
              disabled={isWithdrawing}
              variant="outline"
              className="w-full"
            >
              {isWithdrawing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#FF7043] border-t-transparent mr-2"></div>
                  Withdrawing...
                </>
              ) : (
                'Withdraw Publisher Balance'
              )}
            </EnhancedButton>
          </div>

          {/* Status Indicators */}
          <div className="flex space-x-2 text-sm">
            <EnhancedBadge variant={isApproving ? "warning" : isApprovalConfirmed ? "success" : "secondary"}>
              Approval: {isApproving ? "Pending" : isApprovalConfirmed ? "Confirmed" : "Required"}
            </EnhancedBadge>
            <EnhancedBadge variant={isRequesting ? "warning" : isCrawlConfirmed ? "success" : "secondary"}>
              Request: {isRequesting ? "Pending" : isCrawlConfirmed ? "Confirmed" : "Ready"}
            </EnhancedBadge>
          </div>
        </div>
      </EnhancedCardContent>
    </EnhancedCard>
  )
}