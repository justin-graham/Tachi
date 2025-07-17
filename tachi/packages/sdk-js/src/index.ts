import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseAbi, 
  parseUnits, 
  Address, 
  Hash,
  formatUnits
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import 'cross-fetch/polyfill';

// Configuration interface
export interface TachiConfig {
  // Network configuration
  network: 'base' | 'base-sepolia';
  rpcUrl: string;
  
  // Smart account configuration
  smartAccountAddress?: Address;
  ownerPrivateKey?: Hash;
  
  // Payment configuration
  usdcAddress: Address;
  paymentProcessorAddress: Address;
  
  // Request configuration
  userAgent?: string;
  timeout?: number;
  maxRetries?: number;
}

// Payment information from 402 response
export interface PaymentInfo {
  amount: string;
  currency: string;
  network: string;
  chainId: number;
  recipient: Address;
  tokenAddress: Address;
  tokenId?: string;
}

// Response from fetchWithTachi
export interface TachiResponse {
  content: string;
  statusCode: number;
  headers: Record<string, string>;
  paymentRequired: boolean;
  paymentAmount?: string;
  transactionHash?: string;
}

// Error types
export class TachiError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'TachiError';
  }
}

export class PaymentError extends TachiError {
  constructor(message: string, details?: any) {
    super(message, 'PAYMENT_ERROR', details);
  }
}

export class NetworkError extends TachiError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
  }
}

// USDC contract ABI
const USDC_ABI = parseAbi([
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
]);

// PaymentProcessor contract ABI
const PAYMENT_PROCESSOR_ABI = parseAbi([
  'function payPublisher(address publisher, uint256 amount) external',
  'function payPublisherByNFT(address crawlNFT, uint256 tokenId, uint256 amount) external',
  'function getUSDCTokenAddress() external view returns (address)',
  'event Payment(address indexed crawler, address indexed publisher, uint256 amount)',
]);

/**
 * Tachi SDK for AI crawlers
 * Handles pay-per-crawl protocol with automatic payment processing
 */
class TachiSDK {
  private config: TachiConfig;
  private publicClient: any;
  private walletClient: any;
  private account: any;

  constructor(config: TachiConfig) {
    this.config = {
      userAgent: 'TachiSDK/1.0',
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };

    // Initialize blockchain clients
    this.initializeClients();
  }

  /**
   * Initialize blockchain clients
   */
  private initializeClients() {
    const chain = this.config.network === 'base' ? base : baseSepolia;
    
    this.publicClient = createPublicClient({
      chain,
      transport: http(this.config.rpcUrl),
    });

    // Initialize wallet client if private key is provided
    if (this.config.ownerPrivateKey) {
      this.account = privateKeyToAccount(this.config.ownerPrivateKey);
      this.walletClient = createWalletClient({
        account: this.account,
        chain,
        transport: http(this.config.rpcUrl),
      });
    }
  }

  /**
   * Main function to fetch content with automatic payment handling
   */
  async fetchWithTachi(url: string, options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<TachiResponse> {
    const { method = 'GET', headers = {}, body } = options || {};

    // Step 1: Initial request
    console.log(`[TachiSDK] Fetching: ${url}`);
    
    const initialResponse = await this.makeHttpRequest(url, {
      method,
      headers: {
        'User-Agent': this.config.userAgent!,
        ...headers,
      },
      body,
    });

    // If not 402, return content immediately
    if (initialResponse.status !== 402) {
      return {
        content: await initialResponse.text(),
        statusCode: initialResponse.status,
        headers: this.headersToObject(initialResponse.headers),
        paymentRequired: false,
      };
    }

    console.log('[TachiSDK] Payment required - processing payment...');

    // Step 2: Parse payment requirements
    const paymentInfo = await this.parsePaymentInfo(initialResponse);
    console.log(`[TachiSDK] Payment info:`, paymentInfo);

    // Step 3: Process payment
    const transactionHash = await this.processPayment(paymentInfo);
    console.log(`[TachiSDK] Payment sent: ${transactionHash}`);

    // Step 4: Retry request with payment proof
    const paidResponse = await this.makeHttpRequest(url, {
      method,
      headers: {
        'User-Agent': this.config.userAgent!,
        'Authorization': `Bearer ${transactionHash}`,
        ...headers,
      },
      body,
    });

    if (paidResponse.status !== 200) {
      throw new PaymentError(
        `Payment verification failed: ${paidResponse.status}`,
        { transactionHash, status: paidResponse.status }
      );
    }

    return {
      content: await paidResponse.text(),
      statusCode: paidResponse.status,
      headers: this.headersToObject(paidResponse.headers),
      paymentRequired: true,
      paymentAmount: paymentInfo.amount,
      transactionHash,
    };
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeHttpRequest(url: string, options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
  }): Promise<Response> {
    const { method, headers, body } = options;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;

      } catch (error) {
        lastError = error as Error;
        console.log(`[TachiSDK] Request attempt ${attempt} failed:`, error);

        if (attempt === this.config.maxRetries) {
          throw new NetworkError(
            `Request failed after ${this.config.maxRetries} attempts`,
            { url, lastError }
          );
        }

        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError!;
  }

  /**
   * Parse payment information from 402 response
   */
  private async parsePaymentInfo(response: Response): Promise<PaymentInfo> {
    const headers = response.headers;
    const body = await response.json();

    // Parse from headers (preferred)
    const price = headers.get('x402-price');
    const currency = headers.get('x402-currency');
    const recipient = headers.get('x402-recipient');
    const tokenAddress = headers.get('x402-contract');
    const chainId = headers.get('x402-chain-id');

    // Convert price from wei to USDC if needed
    let amount = price || body.payment?.amount || '0';
    if (price && currency === 'USDC') {
      // Convert from wei to USDC (6 decimals)
      amount = formatUnits(BigInt(price), 6);
    }

    // Fallback to body parsing
    const paymentInfo: PaymentInfo = {
      amount,
      currency: currency || body.payment?.currency || 'USDC',
      network: body.payment?.network || 'Base',
      chainId: parseInt(chainId || body.payment?.chainId || '8453'),
      recipient: (recipient || body.payment?.recipient) as Address,
      tokenAddress: (tokenAddress || body.payment?.tokenAddress) as Address,
      tokenId: body.payment?.tokenId,
    };

    // Validate required fields
    if (!paymentInfo.recipient || !paymentInfo.tokenAddress) {
      throw new PaymentError('Invalid payment information in 402 response', { paymentInfo });
    }

    return paymentInfo;
  }

  /**
   * Process payment using wallet client
   */
  private async processPayment(paymentInfo: PaymentInfo): Promise<string> {
    if (!this.walletClient || !this.account) {
      throw new PaymentError('Wallet client not initialized. Private key required for payments.');
    }

    // Convert amount to wei (USDC has 6 decimals)
    const amountInWei = parseUnits(paymentInfo.amount, 6);

    console.log(`[TachiSDK] Sending ${paymentInfo.amount} USDC to ${paymentInfo.recipient}`);

    try {
      // Check USDC balance
      const balance = await this.publicClient.readContract({
        address: paymentInfo.tokenAddress,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [this.account.address],
      });

      console.log(`[TachiSDK] USDC balance: ${formatUnits(balance, 6)} USDC`);

      if (balance < amountInWei) {
        throw new PaymentError(
          `Insufficient USDC balance. Required: ${paymentInfo.amount}, Available: ${formatUnits(balance, 6)}`,
          { required: paymentInfo.amount, available: formatUnits(balance, 6) }
        );
      }

      // Check allowance
      const allowance = await this.publicClient.readContract({
        address: paymentInfo.tokenAddress,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [this.account.address, paymentInfo.recipient],
      });

      // Approve if needed
      if (allowance < amountInWei) {
        console.log('[TachiSDK] Approving PaymentProcessor to spend USDC...');
        
        const approveTx = await this.walletClient.writeContract({
          address: paymentInfo.tokenAddress,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [paymentInfo.recipient, amountInWei],
        });

        console.log(`[TachiSDK] Approval transaction: ${approveTx}`);
        
        // Wait for approval confirmation
        await this.publicClient.waitForTransactionReceipt({ hash: approveTx });
        console.log('[TachiSDK] Approval confirmed');
      }

      // Send payment via PaymentProcessor
      const paymentTx = await this.walletClient.writeContract({
        address: paymentInfo.recipient,
        abi: PAYMENT_PROCESSOR_ABI,
        functionName: 'payPublisher',
        args: [this.config.paymentProcessorAddress, amountInWei],
      });

      console.log(`[TachiSDK] Payment transaction: ${paymentTx}`);

      // Wait for payment confirmation
      await this.publicClient.waitForTransactionReceipt({ hash: paymentTx });
      console.log('[TachiSDK] Payment confirmed');

      return paymentTx;

    } catch (error) {
      console.error('[TachiSDK] Payment failed:', error);
      throw new PaymentError(
        `Payment transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { paymentInfo, error }
      );
    }
  }

  /**
   * Get USDC balance for the account
   */
  async getUSDCBalance(): Promise<{ wei: bigint; formatted: string }> {
    if (!this.account) {
      throw new TachiError('Account not initialized. Private key required.', 'CONFIG_ERROR');
    }

    const balance = await this.publicClient.readContract({
      address: this.config.usdcAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [this.account.address],
    });

    return {
      wei: balance,
      formatted: formatUnits(balance, 6),
    };
  }

  /**
   * Get account address
   */
  getAccountAddress(): Address | null {
    return this.account?.address || null;
  }

  /**
   * Convert Headers to plain object
   */
  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Convenience function for quick usage
 */
export async function fetchWithTachi(
  url: string, 
  config: TachiConfig, 
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
): Promise<TachiResponse> {
  const sdk = new TachiSDK(config);
  return sdk.fetchWithTachi(url, options);
}

/**
 * Create a pre-configured SDK instance for Base mainnet
 */
export function createBaseSDK(config: Omit<TachiConfig, 'network' | 'usdcAddress'>): TachiSDK {
  return new TachiSDK({
    ...config,
    network: 'base',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  });
}

/**
 * Create a pre-configured SDK instance for Base Sepolia testnet
 */
export function createBaseSepoliaSDK(config: Omit<TachiConfig, 'network' | 'usdcAddress'>): TachiSDK {
  return new TachiSDK({
    ...config,
    network: 'base-sepolia',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  });
}

// Export types and classes
export { TachiSDK };
export default TachiSDK;
