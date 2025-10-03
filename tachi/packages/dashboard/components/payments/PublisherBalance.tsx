'use client'

import { useAccount, useChainId } from 'wagmi'
import { usePublisherBalance, useWithdrawPublisherBalance, formatUSDC } from '../../lib/contracts/hooks'

interface PublisherBalanceProps {
  className?: string
}

export function PublisherBalance({ className = '' }: PublisherBalanceProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  
  const { data: balance, isLoading, refetch } = usePublisherBalance(address, chainId)
  const { withdrawBalance, isPending } = useWithdrawPublisherBalance()

  const handleWithdraw = async () => {
    if (!address || !balance || balance === BigInt(0)) return
    
    try {
      await withdrawBalance(chainId)
      // Refetch balance after successful withdrawal
      setTimeout(() => refetch(), 2000)
    } catch (error) {
      console.error('Error withdrawing balance:', error)
    }
  }

  if (!address) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <p className="text-gray-600 text-center">Connect wallet to view publisher balance</p>
      </div>
    )
  }

  const balanceAmount = balance ? formatUSDC(balance) : '0'
  const hasBalance = balance && balance > BigInt(0)

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Publisher Earnings</h3>
        {isLoading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        )}
      </div>

      <div className="text-center">
        <div className="text-3xl font-bold text-green-600 mb-2">
          {balanceAmount} USDC
        </div>
        <p className="text-gray-600 text-sm mb-6">
          Available for withdrawal
        </p>

        <button
          onClick={handleWithdraw}
          disabled={!hasBalance || isPending}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            hasBalance && !isPending
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isPending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Withdrawing...
            </span>
          ) : hasBalance ? (
            'Withdraw Earnings'
          ) : (
            'No Earnings Available'
          )}
        </button>

        {hasBalance && (
          <p className="text-xs text-gray-500 mt-2">
            Withdrawal will be sent to your connected wallet
          </p>
        )}
      </div>
    </div>
  )
}