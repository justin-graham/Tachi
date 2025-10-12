import { useState, useEffect, useRef } from 'react'
import { useWaitForTransaction, usePublicClient } from 'wagmi'
import { Hash } from 'viem'
import { toast } from 'react-hot-toast'

export interface TransactionStatus {
  hash?: Hash
  status: 'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed' | 'retrying'
  confirmations: number
  requiredConfirmations: number
  error?: Error
  receipt?: any
  retryCount?: number
  maxRetries?: number
  isRetrying?: boolean
  canRetry?: boolean
}

export interface UseTransactionMonitorOptions {
  hash?: Hash
  requiredConfirmations?: number
  onSuccess?: (receipt: any) => void
  onError?: (error: Error) => void
  showToasts?: boolean
  maxRetries?: number
  retryDelay?: number
  enabled?: boolean
}

export function useTransactionMonitor({
  hash,
  requiredConfirmations = 3,
  onSuccess,
  onError,
  showToasts = true,
  maxRetries = 3,
  retryDelay = 5000,
  enabled = true
}: UseTransactionMonitorOptions = {}) {
  const [status, setStatus] = useState<TransactionStatus>({
    status: 'idle',
    confirmations: 0,
    requiredConfirmations,
    retryCount: 0,
    maxRetries,
    isRetrying: false,
    canRetry: true
  })

  const publicClient = usePublicClient()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const intervalRef = useRef<NodeJS.Timeout>()

  // Use wagmi's built-in transaction waiting
  const { 
    data: receipt, 
    isError, 
    isLoading, 
    error,
    isSuccess,
    refetch
  } = useWaitForTransaction({
    hash,
    enabled: !!hash && enabled,
    confirmations: requiredConfirmations,
    timeout: 300000, // 5 minute timeout
  })
  
  const retryTimeoutRef = useRef<NodeJS.Timeout>()

  // Monitor transaction confirmations in real-time
  useEffect(() => {
    if (!hash || !publicClient) return

    setStatus(prev => ({
      ...prev,
      hash,
      status: 'pending',
      confirmations: 0
    }))

    if (showToasts) {
      toast.loading('Transaction submitted...', { id: hash })
    }

    const monitorConfirmations = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber()
        const txReceipt = await publicClient.getTransactionReceipt({ hash })
        
        if (txReceipt) {
          const confirmations = Number(currentBlock - txReceipt.blockNumber)
          
          setStatus(prev => ({
            ...prev,
            status: confirmations >= requiredConfirmations ? 'confirmed' : 'confirming',
            confirmations,
            receipt: txReceipt
          }))

          if (showToasts && confirmations > 0 && confirmations < requiredConfirmations) {
            toast.loading(
              `Transaction confirming... (${confirmations}/${requiredConfirmations})`,
              { id: hash }
            )
          }
        }
      } catch (err) {
        console.error('Error monitoring transaction:', err)
      }
    }

    // Check immediately
    monitorConfirmations()

    // Then check every 2 seconds
    intervalRef.current = setInterval(monitorConfirmations, 2000)

    // Cleanup after 10 minutes
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 600000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [hash, publicClient, requiredConfirmations, showToasts, enabled])

  // Handle transaction completion
  useEffect(() => {
    if (isSuccess && receipt) {
      setStatus(prev => ({
        ...prev,
        status: 'confirmed',
        receipt,
        confirmations: requiredConfirmations
      }))

      if (showToasts) {
        toast.success('Transaction confirmed!', { id: hash })
      }

      onSuccess?.(receipt)
    }
  }, [isSuccess, receipt, onSuccess, hash, showToasts, requiredConfirmations])

  // Retry function
  const retryTransaction = async () => {
    if (!status.canRetry || (status.retryCount || 0) >= maxRetries) return

    const newRetryCount = (status.retryCount || 0) + 1
    
    setStatus(prev => ({
      ...prev,
      status: 'retrying',
      isRetrying: true,
      retryCount: newRetryCount,
      canRetry: newRetryCount < maxRetries,
      error: undefined
    }))

    if (showToasts) {
      toast.loading(`Retrying transaction... (${newRetryCount}/${maxRetries})`, { id: hash })
    }

    // Wait for retry delay
    await new Promise(resolve => {
      retryTimeoutRef.current = setTimeout(resolve, retryDelay)
    })

    try {
      // Attempt to refetch transaction status
      await refetch()
      
      setStatus(prev => ({
        ...prev,
        status: 'pending',
        isRetrying: false
      }))
    } catch (retryError) {
      setStatus(prev => ({
        ...prev,
        status: 'failed',
        isRetrying: false,
        error: retryError as Error,
        canRetry: newRetryCount < maxRetries
      }))

      if (showToasts) {
        toast.error(`Retry ${newRetryCount} failed: ${(retryError as Error).message}`, { id: hash })
      }
    }
  }

  // Handle transaction error with retry logic
  useEffect(() => {
    if (isError && error) {
      const currentRetryCount = status.retryCount || 0
      const canRetry = currentRetryCount < maxRetries

      setStatus(prev => ({
        ...prev,
        status: 'failed',
        error: error as Error,
        canRetry
      }))

      if (showToasts) {
        const message = canRetry 
          ? `Transaction failed: ${error.message}. Retrying in ${retryDelay/1000}s...`
          : `Transaction failed: ${error.message}`
        toast.error(message, { id: hash })
      }

      // Auto-retry if enabled and within retry limit
      if (canRetry) {
        retryTimeoutRef.current = setTimeout(() => {
          retryTransaction()
        }, retryDelay)
      } else {
        onError?.(error as Error)
      }
    }
  }, [isError, error, onError, hash, showToasts, maxRetries, retryDelay, status.retryCount])

  // Helper functions
  const isTransactionPending = status.status === 'pending' || status.status === 'confirming' || status.status === 'retrying'
  const isTransactionConfirmed = status.status === 'confirmed'
  const isTransactionFailed = status.status === 'failed'
  const isTransactionRetrying = status.status === 'retrying'

  const getStatusText = () => {
    switch (status.status) {
      case 'idle':
        return 'Ready'
      case 'pending':
        return 'Pending...'
      case 'confirming':
        return `Confirming (${status.confirmations}/${status.requiredConfirmations})`
      case 'confirmed':
        return 'Confirmed'
      case 'failed':
        return status.canRetry ? `Failed - Retry ${(status.retryCount || 0) + 1}/${status.maxRetries}` : 'Failed'
      case 'retrying':
        return `Retrying (${status.retryCount}/${status.maxRetries})...`
      default:
        return 'Unknown'
    }
  }

  const getProgressPercentage = () => {
    if (status.status === 'confirmed') return 100
    if (status.status === 'failed' && !status.canRetry) return 0
    if (status.status === 'retrying') {
      // Show partial progress during retry
      const retryProgress = ((status.retryCount || 0) / (status.maxRetries || 1)) * 30
      return Math.min(30, retryProgress)
    }
    if (status.confirmations === 0) return 10
    return Math.min(90, (status.confirmations / status.requiredConfirmations) * 80 + 10)
  }

  return {
    status,
    isTransactionPending,
    isTransactionConfirmed,
    isTransactionFailed,
    isTransactionRetrying,
    getStatusText,
    getProgressPercentage,
    retryTransaction,
    // Expose wagmi state for advanced usage
    wagmi: {
      receipt,
      isError,
      isLoading,
      error,
      isSuccess
    }
  }
}
