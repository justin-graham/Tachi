'use client'

import { Hash } from 'viem'
import { ExternalLink, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useTransactionMonitor } from '@/lib/hooks/useTransactionMonitor'

interface TransactionStatusCardProps {
  hash?: Hash
  title: string
  description?: string
  requiredConfirmations?: number
  onSuccess?: () => void
  onError?: (error: Error) => void
  showDetails?: boolean
}

export function TransactionStatusCard({
  hash,
  title,
  description,
  requiredConfirmations = 3,
  onSuccess,
  onError,
  showDetails = true
}: TransactionStatusCardProps) {
  const { 
    status, 
    isTransactionPending, 
    isTransactionConfirmed, 
    isTransactionFailed,
    isTransactionRetrying,
    getStatusText,
    getProgressPercentage,
    retryTransaction
  } = useTransactionMonitor({
    hash,
    requiredConfirmations,
    onSuccess,
    onError,
    showToasts: false, // We'll handle our own UI feedback
    maxRetries: 3,
    retryDelay: 5000
  })

  if (!hash) return null

  const getStatusIcon = () => {
    switch (status.status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
      case 'confirming':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'retrying':
        return <AlertCircle className="h-5 w-5 text-orange-600 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'confirmed':
        return 'bg-green-50 border-green-200'
      case 'failed':
        return 'bg-red-50 border-red-200'
      case 'retrying':
        return 'bg-orange-50 border-orange-200'
      case 'pending':
      case 'confirming':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getProgressColor = () => {
    switch (status.status) {
      case 'confirmed':
        return 'bg-green-600'
      case 'failed':
        return 'bg-red-600'
      case 'confirming':
        return 'bg-yellow-600'
      case 'retrying':
        return 'bg-orange-600'
      default:
        return 'bg-blue-600'
    }
  }

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  return (
    <div className={`rounded-lg border p-4 transition-colors ${getStatusColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
          {isTransactionFailed && status.canRetry && (
            <button
              onClick={() => retryTransaction()}
              className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
              disabled={isTransactionRetrying}
            >
              {isTransactionRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
          <a
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="View on Basescan"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Progress Bar */}
      {isTransactionPending && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* Transaction Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Hash:</span>
              <br />
              <code className="text-gray-900">{truncateHash(hash)}</code>
            </div>
            <div>
              <span className="text-gray-500">Confirmations:</span>
              <br />
              <span className="text-gray-900">
                {status.confirmations}/{status.requiredConfirmations}
              </span>
            </div>
            {(status.retryCount ?? 0) > 0 && (
              <div>
                <span className="text-gray-500">Retries:</span>
                <br />
                <span className="text-gray-900">
                  {status.retryCount}/{status.maxRetries}
                </span>
              </div>
            )}
          </div>

          {status.error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
              <strong>Error:</strong> {status.error.message}
            </div>
          )}

          {status.receipt && isTransactionConfirmed && (
            <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-700">
              <strong>Success!</strong> Transaction confirmed in block {status.receipt.blockNumber?.toString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Batch transaction status component
interface TransactionBatchStatusProps {
  transactions: Array<{
    hash: Hash
    title: string
    description?: string
  }>
  requiredConfirmations?: number
}

export function TransactionBatchStatus({ 
  transactions, 
  requiredConfirmations = 3 
}: TransactionBatchStatusProps) {
  if (transactions.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Transaction Status</h3>
        <span className="text-sm text-gray-500">
          {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
        </span>
      </div>
      
      {transactions.map((tx, index) => (
        <TransactionStatusCard
          key={tx.hash}
          hash={tx.hash}
          title={tx.title}
          description={tx.description}
          requiredConfirmations={requiredConfirmations}
          showDetails={false}
        />
      ))}
    </div>
  )
}