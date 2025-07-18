/**
 * Alchemy Account Kit Integration for Tachi Protocol
 * Implements ERC-4337 Account Abstraction for gasless crawler payments
 */

import {
  createModularAccountAlchemyClient,
  type AlchemySmartAccountClient,
} from "@alchemy/aa-alchemy"
import {
  type SmartAccountSigner,
  type UserOperationRequest,
  LocalAccountSigner,
  WalletClientSigner,
} from "@alchemy/aa-core"
import { createWalletClient, http, type Address, type Hash, parseUnits, encodeFunctionData } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { base, baseSepolia } from "viem/chains"

// ERC-20 USDC ABI for token transfers
const USDC_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const

// PaymentProcessor ABI for direct payments
const PAYMENT_PROCESSOR_ABI = [
  {
    inputs: [
      { name: "crawlNFT", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" }
    ],
    name: "payPublisherByNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

export interface AlchemyAccountConfig {
  apiKey: string
  chainId: number
  rpcUrl?: string
  gasManagerPolicyId?: string // For sponsored transactions
}

export interface PaymentDetails {
  publisherAddress: Address
  crawlNFTAddress: Address
  tokenId: bigint
  amount: bigint // Amount in USDC smallest units (6 decimals)
  usdcAddress: Address
  paymentProcessorAddress?: Address
}

export interface TransactionResult {
  hash: Hash
  userOpHash: Hash
  smartAccountAddress: Address
  success: boolean
  receipt?: any
  error?: string
}

/**
 * Alchemy Account Abstraction Client for Tachi Protocol
 * Handles gasless payments for AI crawlers using ERC-4337
 */
export class TachiAAClient {
  private client: AlchemySmartAccountClient | null = null
  private config: AlchemyAccountConfig
  private signer: SmartAccountSigner | null = null

  constructor(config: AlchemyAccountConfig) {
    this.config = config
  }

  /**
   * Initialize the AA client with a signer (private key or wallet)
   */
  async initialize(signerPrivateKey: `0x${string}` | SmartAccountSigner): Promise<void> {
    try {
      // Create signer from private key if provided
      if (typeof signerPrivateKey === 'string') {
        const account = privateKeyToAccount(signerPrivateKey)
        this.signer = new LocalAccountSigner(account)
      } else {
        this.signer = signerPrivateKey
      }

      // Get chain configuration
      const chain = this.getChain()

      // Create Alchemy client with smart account
      this.client = await createModularAccountAlchemyClient({
        apiKey: this.config.apiKey,
        chain,
        signer: this.signer,
        gasManagerConfig: this.config.gasManagerPolicyId ? {
          policyId: this.config.gasManagerPolicyId,
        } : undefined,
      })

      console.log('✅ Alchemy AA Client initialized')
      console.log('📍 Smart Account Address:', await this.getSmartAccountAddress())
    } catch (error) {
      console.error('❌ Failed to initialize Alchemy AA Client:', error)
      throw error
    }
  }

  /**
   * Get the smart account address
   */
  async getSmartAccountAddress(): Promise<Address> {
    if (!this.client) {
      throw new Error('AA Client not initialized')
    }
    const address = this.client.account?.address
    if (!address) {
      throw new Error('Smart account not initialized')
    }
    return address
  }

  /**
   * Check USDC balance of the smart account
   */
  async getUSDCBalance(usdcAddress: Address): Promise<bigint> {
    if (!this.client) {
      throw new Error('AA Client not initialized')
    }

    const smartAccountAddress = await this.getSmartAccountAddress()
    
    const balance = await this.client.readContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [smartAccountAddress],
    })

    return balance as bigint
  }

  /**
   * Execute a gasless payment for crawl access
   * Option 1: Direct USDC transfer to publisher
   */
  async payPublisherDirect(paymentDetails: PaymentDetails): Promise<TransactionResult> {
    if (!this.client) {
      throw new Error('AA Client not initialized')
    }

    const smartAccountAddress = await this.getSmartAccountAddress()
    
    try {
      console.log('💰 Initiating gasless payment...')
      console.log('🏛️ From Smart Account:', smartAccountAddress)
      console.log('👤 To Publisher:', paymentDetails.publisherAddress)
      console.log('💵 Amount:', paymentDetails.amount.toString(), 'USDC units')

      // Check balance first
      const balance = await this.getUSDCBalance(paymentDetails.usdcAddress)
      if (balance < paymentDetails.amount) {
        throw new Error(`Insufficient USDC balance. Required: ${paymentDetails.amount}, Available: ${balance}`)
      }

      // Execute USDC transfer via UserOperation
      const userOpResult = await this.client.sendUserOperation({
        account: this.client.account!,
        uo: {
          target: paymentDetails.usdcAddress,
          data: encodeFunctionData({
            abi: USDC_ABI,
            functionName: 'transfer',
            args: [paymentDetails.publisherAddress, paymentDetails.amount],
          }),
          value: BigInt(0),
        },
      })

      console.log('📋 UserOperation Hash:', userOpResult.hash)

      // Wait for the transaction to be mined
      const txReceipt = await this.client.waitForUserOperationTransaction({
        hash: userOpResult.hash,
      })

      console.log('✅ Payment completed! Transaction Hash:', txReceipt)

      return {
        hash: txReceipt,
        userOpHash: userOpResult.hash,
        smartAccountAddress,
        success: true,
        receipt: txReceipt,
      }
    } catch (error) {
      console.error('❌ Payment failed:', error)
      return {
        hash: '0x0' as Hash,
        userOpHash: '0x0' as Hash,
        smartAccountAddress,
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      }
    }
  }

  /**
   * Execute a gasless payment through PaymentProcessor contract
   * Option 2: Use PaymentProcessor for enhanced tracking
   */
  async payViaPaymentProcessor(paymentDetails: PaymentDetails): Promise<TransactionResult> {
    if (!this.client || !paymentDetails.paymentProcessorAddress) {
      throw new Error('AA Client not initialized or PaymentProcessor address missing')
    }

    const smartAccountAddress = await this.getSmartAccountAddress()

    try {
      console.log('💰 Initiating payment via PaymentProcessor...')
      console.log('🏛️ From Smart Account:', smartAccountAddress)
      console.log('🏭 PaymentProcessor:', paymentDetails.paymentProcessorAddress)
      console.log('🎫 CrawlNFT Token ID:', paymentDetails.tokenId.toString())
      console.log('💵 Amount:', paymentDetails.amount.toString(), 'USDC units')

      // First approve USDC to PaymentProcessor (if needed)
      // Note: In production, you might want to check current allowance first
      const approvalResult = await this.client.sendUserOperation({
        account: this.client.account!,
        uo: {
          target: paymentDetails.usdcAddress,
          data: encodeFunctionData({
            abi: [
              {
                inputs: [
                  { name: "spender", type: "address" },
                  { name: "amount", type: "uint256" }
                ],
                name: "approve",
                outputs: [{ name: "", type: "bool" }],
                stateMutability: "nonpayable",
                type: "function"
              }
            ],
            functionName: 'approve',
            args: [paymentDetails.paymentProcessorAddress, paymentDetails.amount],
          }),
          value: BigInt(0),
        },
      })

      await this.client.waitForUserOperationTransaction({
        hash: approvalResult.hash,
      })

      console.log('✅ USDC approved for PaymentProcessor')

      // Execute payment via PaymentProcessor
      const paymentResult = await this.client.sendUserOperation({
        account: this.client.account!,
        uo: {
          target: paymentDetails.paymentProcessorAddress,
          data: encodeFunctionData({
            abi: PAYMENT_PROCESSOR_ABI,
            functionName: 'payPublisherByNFT',
            args: [
              paymentDetails.crawlNFTAddress,
              paymentDetails.tokenId,
              paymentDetails.amount,
            ],
          }),
          value: BigInt(0),
        },
      })

      console.log('📋 Payment UserOperation Hash:', paymentResult.hash)

      const txReceipt = await this.client.waitForUserOperationTransaction({
        hash: paymentResult.hash,
      })

      console.log('✅ Payment via PaymentProcessor completed!')
      console.log('🧾 Transaction Hash:', txReceipt)

      return {
        hash: txReceipt,
        userOpHash: paymentResult.hash,
        smartAccountAddress,
        success: true,
        receipt: txReceipt,
      }
    } catch (error) {
      console.error('❌ PaymentProcessor payment failed:', error)
      return {
        hash: '0x0' as Hash,
        userOpHash: '0x0' as Hash,
        smartAccountAddress,
        success: false,
        error: error instanceof Error ? error.message : 'PaymentProcessor payment failed',
      }
    }
  }

  /**
   * Fund the smart account with USDC from an EOA
   * Utility function for testing and initial setup
   */
  async fundSmartAccount(
    fromPrivateKey: `0x${string}`,
    usdcAddress: Address,
    amount: bigint
  ): Promise<Hash> {
    if (!this.client) {
      throw new Error('AA Client not initialized')
    }

    const smartAccountAddress = await this.getSmartAccountAddress()
    const chain = this.getChain()
    
    // Create EOA wallet client for funding
    const account = privateKeyToAccount(fromPrivateKey)
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(),
    })

    console.log('💸 Funding smart account with USDC...')
    console.log('📤 From EOA:', account.address)
    console.log('📥 To Smart Account:', smartAccountAddress)
    console.log('💵 Amount:', amount.toString(), 'USDC units')

    const hash = await walletClient.writeContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [smartAccountAddress, amount],
    })

    console.log('✅ Funding transaction sent:', hash)
    return hash
  }

  /**
   * Batch multiple payments in a single UserOperation
   * Useful for multiple crawl requests or bulk operations
   */
  async batchPayments(payments: PaymentDetails[]): Promise<TransactionResult> {
    if (!this.client) {
      throw new Error('AA Client not initialized')
    }

    const smartAccountAddress = await this.getSmartAccountAddress()

    try {
      console.log('🔄 Initiating batch payment...')
      console.log('📊 Number of payments:', payments.length)

      // Prepare batch calls
      const calls = payments.map(payment => ({
        target: payment.usdcAddress as Address,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [payment.publisherAddress, payment.amount],
        }),
        value: BigInt(0),
      }))

      // Execute batch UserOperation
      const userOpResult = await this.client.sendUserOperation({
        account: this.client.account!,
        uo: calls,
      })

      console.log('📋 Batch UserOperation Hash:', userOpResult.hash)

      const txReceipt = await this.client.waitForUserOperationTransaction({
        hash: userOpResult.hash,
      })

      console.log('✅ Batch payment completed!')
      console.log('🧾 Transaction Hash:', txReceipt)

      return {
        hash: txReceipt,
        userOpHash: userOpResult.hash,
        smartAccountAddress,
        success: true,
        receipt: txReceipt,
      }
    } catch (error) {
      console.error('❌ Batch payment failed:', error)
      return {
        hash: '0x0' as Hash,
        userOpHash: '0x0' as Hash,
        smartAccountAddress,
        success: false,
        error: error instanceof Error ? error.message : 'Batch payment failed',
      }
    }
  }

  /**
   * Get gas estimates for a payment operation
   */
  async estimatePaymentGas(paymentDetails: PaymentDetails): Promise<{
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
  }> {
    if (!this.client) {
      throw new Error('AA Client not initialized')
    }

    // Build the user operation for estimation
    const uo = await this.client.buildUserOperation({
      account: this.client.account!,
      uo: {
        target: paymentDetails.usdcAddress,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [paymentDetails.publisherAddress, paymentDetails.amount],
        }),
        value: BigInt(0),
      },
    })

    return {
      maxFeePerGas: BigInt(uo.maxFeePerGas || 0),
      maxPriorityFeePerGas: BigInt(uo.maxPriorityFeePerGas || 0),
      preVerificationGas: BigInt(uo.preVerificationGas || 0),
      verificationGasLimit: BigInt(uo.verificationGasLimit || 0),
      callGasLimit: BigInt(uo.callGasLimit || 0),
    }
  }

  /**
   * Get the appropriate chain configuration
   */
  private getChain() {
    switch (this.config.chainId) {
      case 8453:
        return base
      case 84532:
        return baseSepolia
      default:
        throw new Error(`Unsupported chain ID: ${this.config.chainId}`)
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.client = null
    this.signer = null
    console.log('🔌 AA Client disconnected')
  }
}

/**
 * Utility function to create a TachiAAClient with environment configuration
 */
export function createTachiAAClient(
  apiKey: string,
  chainId: number = 84532, // Default to Base Sepolia
  gasManagerPolicyId?: string
): TachiAAClient {
  return new TachiAAClient({
    apiKey,
    chainId,
    gasManagerPolicyId,
  })
}

/**
 * Helper function to convert USD amount to USDC smallest units
 */
export function usdToUsdcUnits(usdAmount: number): bigint {
  return parseUnits(usdAmount.toString(), 6) // USDC has 6 decimals
}

/**
 * Example usage function for testing
 */
export async function testPayment(
  alchemyApiKey: string,
  crawlerPrivateKey: `0x${string}`,
  paymentDetails: PaymentDetails
): Promise<void> {
  const aaClient = createTachiAAClient(alchemyApiKey, 84532) // Base Sepolia

  try {
    // Initialize the client
    await aaClient.initialize(crawlerPrivateKey)

    // Check balance
    const balance = await aaClient.getUSDCBalance(paymentDetails.usdcAddress)
    console.log('💰 Current USDC Balance:', balance.toString())

    // Execute payment
    const result = await aaClient.payPublisherDirect(paymentDetails)
    console.log('🎉 Payment successful!', result)

  } catch (error) {
    console.error('❌ Test payment failed:', error)
  } finally {
    aaClient.disconnect()
  }
}
