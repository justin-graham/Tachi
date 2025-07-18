/**
 * React Hook for Alchemy Account Abstraction
 * Provides gasless payment functionality for the Tachi dashboard
 */

import { useState, useCallback, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { type Address } from 'viem'
import { 
  TachiAAClient, 
  type PaymentDetails, 
  type TransactionResult, 
  createTachiAAClient,
  usdToUsdcUnits 
} from '@/utils/alchemy-aa'

export interface UseAlchemyAAConfig {
  apiKey: string
  gasManagerPolicyId?: string
  autoInitialize?: boolean
}

export interface AAPaymentState {
  isInitializing: boolean
  isInitialized: boolean
  isPaymentPending: boolean
  smartAccountAddress: Address | null
  usdcBalance: bigint | null
  lastPaymentResult: TransactionResult | null
  error: string | null
}

export interface PaymentRequest {
  publisherAddress: Address
  crawlNFTAddress: Address
  tokenId: bigint
  amountUSD: number // Amount in USD (will be converted to USDC units)
  usdcAddress: Address
  paymentProcessorAddress?: Address
  usePaymentProcessor?: boolean
}

/**
 * Hook for managing Alchemy Account Abstraction payments
 */
export function useAlchemyAA(config: UseAlchemyAAConfig) {
  const { address: connectedAddress } = useAccount()
  const chainId = useChainId()
  
  const [client, setClient] = useState<TachiAAClient | null>(null)
  const [state, setState] = useState<AAPaymentState>({
    isInitializing: false,
    isInitialized: false,
    isPaymentPending: false,
    smartAccountAddress: null,
    usdcBalance: null,
    lastPaymentResult: null,
    error: null,
  })

  /**
   * Initialize the AA client
   */
  const initialize = useCallback(async (signerPrivateKey?: `0x${string}`) => {
    if (!config.apiKey) {
      setState(prev => ({ ...prev, error: 'Alchemy API key required' }))
      return false
    }

    setState(prev => ({ 
      ...prev, 
      isInitializing: true, 
      error: null 
    }))

    try {
      const aaClient = createTachiAAClient(
        config.apiKey,
        chainId,
        config.gasManagerPolicyId
      )

      // For demo purposes, we'll use a predefined test private key
      // In production, this should be generated securely or provided by the user
      const testPrivateKey = signerPrivateKey || 
        process.env.NEXT_PUBLIC_AA_TEST_PRIVATE_KEY as `0x${string}` ||
        '0x1234567890123456789012345678901234567890123456789012345678901234' // Fallback test key

      await aaClient.initialize(testPrivateKey)
      
      const smartAccountAddress = await aaClient.getSmartAccountAddress()
      
      setClient(aaClient)
      setState(prev => ({
        ...prev,
        isInitializing: false,
        isInitialized: true,
        smartAccountAddress,
      }))

      console.log('✅ Account Abstraction initialized for address:', smartAccountAddress)
      return true
    } catch (error) {
      console.error('❌ Failed to initialize AA:', error)
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: error instanceof Error ? error.message : 'Failed to initialize Account Abstraction',
      }))
      return false
    }
  }, [config.apiKey, config.gasManagerPolicyId, chainId])

  /**
   * Check USDC balance of the smart account
   */
  const checkBalance = useCallback(async (usdcAddress: Address) => {
    if (!client || !state.isInitialized) {
      setState(prev => ({ ...prev, error: 'AA client not initialized' }))
      return null
    }

    try {
      const balance = await client.getUSDCBalance(usdcAddress)
      setState(prev => ({ ...prev, usdcBalance: balance }))
      return balance
    } catch (error) {
      console.error('Failed to check balance:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to check balance' 
      }))
      return null
    }
  }, [client, state.isInitialized])

  /**
   * Execute a gasless payment
   */
  const executePayment = useCallback(async (paymentRequest: PaymentRequest): Promise<TransactionResult | null> => {
    if (!client || !state.isInitialized) {
      setState(prev => ({ ...prev, error: 'AA client not initialized' }))
      return null
    }

    setState(prev => ({ 
      ...prev, 
      isPaymentPending: true, 
      error: null,
      lastPaymentResult: null 
    }))

    try {
      const paymentDetails: PaymentDetails = {
        publisherAddress: paymentRequest.publisherAddress,
        crawlNFTAddress: paymentRequest.crawlNFTAddress,
        tokenId: paymentRequest.tokenId,
        amount: usdToUsdcUnits(paymentRequest.amountUSD),
        usdcAddress: paymentRequest.usdcAddress,
        paymentProcessorAddress: paymentRequest.paymentProcessorAddress,
      }

      console.log('💳 Executing gasless payment:', {
        publisher: paymentRequest.publisherAddress,
        amount: `$${paymentRequest.amountUSD} USDC`,
        useProcessor: paymentRequest.usePaymentProcessor,
      })

      let result: TransactionResult

      if (paymentRequest.usePaymentProcessor && paymentRequest.paymentProcessorAddress) {
        result = await client.payViaPaymentProcessor(paymentDetails)
      } else {
        result = await client.payPublisherDirect(paymentDetails)
      }

      setState(prev => ({
        ...prev,
        isPaymentPending: false,
        lastPaymentResult: result,
      }))

      // Refresh balance after payment
      await checkBalance(paymentRequest.usdcAddress)

      return result
    } catch (error) {
      console.error('❌ Payment failed:', error)
      setState(prev => ({
        ...prev,
        isPaymentPending: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      }))
      return null
    }
  }, [client, state.isInitialized, checkBalance])

  /**
   * Fund the smart account with USDC (for testing)
   */
  const fundAccount = useCallback(async (
    fromPrivateKey: `0x${string}`,
    usdcAddress: Address,
    amountUSD: number
  ): Promise<boolean> => {
    if (!client || !state.isInitialized) {
      setState(prev => ({ ...prev, error: 'AA client not initialized' }))
      return false
    }

    try {
      const amount = usdToUsdcUnits(amountUSD)
      const hash = await client.fundSmartAccount(fromPrivateKey, usdcAddress, amount)
      
      console.log('💰 Funding transaction sent:', hash)
      
      // Refresh balance after funding
      setTimeout(() => checkBalance(usdcAddress), 3000) // Wait 3s for confirmation
      
      return true
    } catch (error) {
      console.error('❌ Funding failed:', error)
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Funding failed' 
      }))
      return false
    }
  }, [client, state.isInitialized, checkBalance])

  /**
   * Batch multiple payments
   */
  const batchPayments = useCallback(async (
    paymentRequests: PaymentRequest[]
  ): Promise<TransactionResult | null> => {
    if (!client || !state.isInitialized) {
      setState(prev => ({ ...prev, error: 'AA client not initialized' }))
      return null
    }

    setState(prev => ({ 
      ...prev, 
      isPaymentPending: true, 
      error: null 
    }))

    try {
      const paymentDetails = paymentRequests.map(req => ({
        publisherAddress: req.publisherAddress,
        crawlNFTAddress: req.crawlNFTAddress,
        tokenId: req.tokenId,
        amount: usdToUsdcUnits(req.amountUSD),
        usdcAddress: req.usdcAddress,
        paymentProcessorAddress: req.paymentProcessorAddress,
      }))

      const result = await client.batchPayments(paymentDetails)

      setState(prev => ({
        ...prev,
        isPaymentPending: false,
        lastPaymentResult: result,
      }))

      // Refresh balance after batch payment
      if (paymentRequests.length > 0) {
        await checkBalance(paymentRequests[0].usdcAddress)
      }

      return result
    } catch (error) {
      console.error('❌ Batch payment failed:', error)
      setState(prev => ({
        ...prev,
        isPaymentPending: false,
        error: error instanceof Error ? error.message : 'Batch payment failed',
      }))
      return null
    }
  }, [client, state.isInitialized, checkBalance])

  /**
   * Get gas estimates for a payment
   */
  const estimateGas = useCallback(async (paymentRequest: PaymentRequest) => {
    if (!client || !state.isInitialized) {
      return null
    }

    try {
      const paymentDetails: PaymentDetails = {
        publisherAddress: paymentRequest.publisherAddress,
        crawlNFTAddress: paymentRequest.crawlNFTAddress,
        tokenId: paymentRequest.tokenId,
        amount: usdToUsdcUnits(paymentRequest.amountUSD),
        usdcAddress: paymentRequest.usdcAddress,
        paymentProcessorAddress: paymentRequest.paymentProcessorAddress,
      }

      return await client.estimatePaymentGas(paymentDetails)
    } catch (error) {
      console.error('Gas estimation failed:', error)
      return null
    }
  }, [client, state.isInitialized])

  /**
   * Disconnect and cleanup
   */
  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect()
      setClient(null)
    }
    setState({
      isInitializing: false,
      isInitialized: false,
      isPaymentPending: false,
      smartAccountAddress: null,
      usdcBalance: null,
      lastPaymentResult: null,
      error: null,
    })
  }, [client])

  /**
   * Auto-initialize if enabled
   */
  useEffect(() => {
    if (config.autoInitialize && !state.isInitialized && !state.isInitializing) {
      initialize()
    }
  }, [config.autoInitialize, state.isInitialized, state.isInitializing, initialize])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (client) {
        client.disconnect()
      }
    }
  }, [client])

  return {
    // State
    ...state,
    
    // Actions
    initialize,
    checkBalance,
    executePayment,
    fundAccount,
    batchPayments,
    estimateGas,
    disconnect,
    
    // Computed values
    isReady: state.isInitialized && !state.isInitializing,
    hasError: !!state.error,
    
    // Utils
    formatBalance: (balance: bigint) => (Number(balance) / 1e6).toFixed(6), // Convert USDC units to decimal
  }
}

/**
 * Hook for AA payment with default Alchemy configuration
 */
export function useAlchemyAAPayment() {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''
  const gasManagerPolicyId = process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID

  return useAlchemyAA({
    apiKey,
    gasManagerPolicyId,
    autoInitialize: false, // Manual initialization for better UX
  })
}
