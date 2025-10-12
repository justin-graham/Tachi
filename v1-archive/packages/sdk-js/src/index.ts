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
// Removed ethers and cross-fetch imports - using viem for all blockchain operations

/**
 * Configuration interface for TachiSDK initialization
 * 
 * @interface TachiConfig
 * @description Core configuration object for initializing the Tachi SDK with network,
 * payment, and API settings required for pay-per-crawl functionality.
 */
export interface TachiConfig {
  /** 
   * Base URL for Tachi API endpoints (optional)
   * @example 'https://api.tachi.ai' or 'http://localhost:3001' for local development
   */
  apiUrl?: string;
  
  /** 
   * API key for authenticated requests to Tachi services (optional)
   * Obtained through crawler registration
   */
  apiKey?: string;
  
  /** 
   * Target blockchain network for payments
   * @example 'base' for mainnet, 'base-sepolia' for testnet
   */
  network: 'base' | 'base-sepolia';
  
  /** 
   * RPC endpoint URL for blockchain interactions
   * @example 'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY'
   */
  rpcUrl: string;
  
  /** 
   * Smart account contract address (optional, for advanced usage)
   * Used for smart account-based payment flows
   */
  smartAccountAddress?: Address;
  
  /** 
   * Private key for the crawler's wallet (required for payments)
   * @example '0x1234567890abcdef...'
   * @security Keep this secure and never log or expose
   */
  ownerPrivateKey?: Hash;
  
  /** 
   * USDC token contract address on the target network
   * @example '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' for Base mainnet
   */
  usdcAddress: Address;
  
  /** 
   * PaymentProcessor contract address for handling payments
   * @example '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7'
   */
  paymentProcessorAddress: Address;
  
  /** 
   * User-Agent string for HTTP requests (optional)
   * @default 'TachiSDK/1.0'
   * @example 'MyCrawler/2.0 (+https://example.com/crawler-info)'
   */
  userAgent?: string;
  
  /** 
   * Request timeout in milliseconds (optional)
   * @default 30000
   */
  timeout?: number;
  
  /** 
   * Maximum number of retry attempts for failed requests (optional)
   * @default 3
   */
  maxRetries?: number;
  
  /** 
   * Blockchain client library preference (optional)
   * @default false (uses Viem)
   * @description If true, uses Ethers.js instead of Viem for blockchain interactions
   */
  useEthers?: boolean;
  
  /** 
   * Enable debug logging (optional)
   * @default false
   * @description Enables detailed console logging for debugging purposes
   */
  debug?: boolean;
}

/**
 * Crawler registration data for Tachi API registration
 * 
 * @interface CrawlerRegistration
 * @description Data structure for registering a new crawler with the Tachi Protocol API
 */
export interface CrawlerRegistration {
  /** 
   * Display name for the crawler (optional)
   * @example 'Research Bot' or 'Content Aggregator'
   */
  name?: string;
  
  /** 
   * Contact information for the crawler operator (optional)
   * @example 'admin@company.com' or 'https://company.com/contact'
   */
  contact?: string;
  
  /** 
   * Brief description of the crawler's purpose (optional)
   * @example 'Academic research crawler for AI training data'
   */
  description?: string;
  
  /** 
   * Name of the company or organization operating the crawler (optional)
   * @example 'AI Research Labs Inc.'
   */
  companyName?: string;
  
  /** 
   * Type of entity operating the crawler (optional)
   * @example 'startup' for startup companies, 'enterprise' for large organizations
   */
  type?: 'individual' | 'startup' | 'enterprise';
}

/**
 * Payment information extracted from HTTP 402 Payment Required responses
 * 
 * @interface PaymentInfo
 * @description Contains all necessary payment details for processing publisher payments
 */
export interface PaymentInfo {
  /** 
   * Payment amount in human-readable format
   * @example '1.50' for 1.50 USDC
   */
  amount: string;
  
  /** 
   * Currency type for the payment
   * @example 'USDC'
   */
  currency: string;
  
  /** 
   * Blockchain network name
   * @example 'Base' or 'Ethereum'
   */
  network: string;
  
  /** 
   * Blockchain network chain ID
   * @example 8453 for Base mainnet, 84532 for Base Sepolia
   */
  chainId: number;
  
  /** 
   * Publisher's wallet address to receive payment
   * @example '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7'
   */
  recipient: Address;
  
  /** 
   * Token contract address (USDC contract)
   * @example '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
   */
  tokenAddress: Address;
  
  /** 
   * Optional NFT token ID for publisher's license (optional)
   * Used when payment is tied to a specific publisher NFT
   */
  tokenId?: string;
}

/**
 * Response object returned by fetchWithTachi method
 * 
 * @interface TachiResponse
 * @description Complete response data from a Tachi-enabled content fetch operation
 */
export interface TachiResponse {
  /** 
   * The fetched content as a string
   * Can be HTML, JSON, text, or any other content type
   */
  content: string;
  
  /** 
   * HTTP status code from the final response
   * @example 200 for success, 402 if payment was required initially
   */
  statusCode: number;
  
  /** 
   * HTTP response headers as key-value pairs
   * @example { 'content-type': 'application/json', 'cache-control': 'no-cache' }
   */
  headers: Record<string, string>;
  
  /** 
   * Whether payment was required for this request
   * @description true if a 402 response was encountered and payment was processed
   */
  paymentRequired: boolean;
  
  /** 
   * Amount paid for content access (optional)
   * Only present if paymentRequired is true
   * @example '1.50' for 1.50 USDC
   */
  paymentAmount?: string;
  
  /** 
   * Blockchain transaction hash for the payment (optional)
   * Only present if paymentRequired is true
   * @example '0x1234567890abcdef...'
   */
  transactionHash?: string;
}

/**
 * Base error class for all Tachi SDK errors
 * 
 * @class TachiError
 * @extends Error
 * @description Custom error class that includes error codes and additional details
 */
export class TachiError extends Error {
  /**
   * Create a new TachiError
   * @param message - Human-readable error message
   * @param code - Machine-readable error code for programmatic handling
   * @param details - Additional error context or debugging information
   */
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'TachiError';
  }
}

/**
 * Error class for payment-related failures
 * 
 * @class PaymentError
 * @extends TachiError
 * @description Thrown when blockchain payment transactions fail or when there are
 * insufficient funds, invalid payment information, or payment verification issues
 */
export class PaymentError extends TachiError {
  /**
   * Create a new PaymentError
   * @param message - Description of the payment failure
   * @param details - Additional payment context (amounts, addresses, transaction info)
   */
  constructor(message: string, details?: any) {
    super(message, 'PAYMENT_ERROR', details);
  }
}

/**
 * Error class for network and HTTP request failures
 * 
 * @class NetworkError
 * @extends TachiError
 * @description Thrown when HTTP requests fail due to network issues, timeouts,
 * or server errors unrelated to payment processing
 */
export class NetworkError extends TachiError {
  /**
   * Create a new NetworkError
   * @param message - Description of the network failure
   * @param details - Additional network context (URLs, response codes, retry info)
   */
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
  }
}


// Shared ABI strings for both Viem and Ethers
const USDC_ABI_STRINGS = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
];

const PAYMENT_PROCESSOR_ABI_STRINGS = [
  'function payPublisher(address publisher, uint256 amount) external',
  'function payPublisherByNFT(address crawlNFT, uint256 tokenId, uint256 amount) external',
  'function getUSDCTokenAddress() external view returns (address)',
  'event Payment(address indexed crawler, address indexed publisher, uint256 amount)',
];

// Viem parsed ABIs
const USDC_ABI = parseAbi(USDC_ABI_STRINGS);
const PAYMENT_PROCESSOR_ABI = parseAbi(PAYMENT_PROCESSOR_ABI_STRINGS);

/**
 * Main SDK class for Tachi Protocol pay-per-crawl functionality
 * 
 * @class TachiSDK
 * @description The primary interface for AI crawlers to interact with Tachi Protocol.
 * Provides automated payment processing for protected content, supporting both
 * Viem and Ethers.js for blockchain interactions.
 * 
 * @example
 * ```typescript
 * const sdk = new TachiSDK({
 *   network: 'base',
 *   rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-KEY',
 *   ownerPrivateKey: '0x...',
 *   usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
 *   paymentProcessorAddress: '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7'
 * });
 * 
 * const result = await sdk.fetchWithTachi('https://protected-site.com/api/data');
 * console.log(result.content);
 * ```
 */
class TachiSDK {
  private config: TachiConfig;
  
  // Viem clients
  private publicClient: any;
  private walletClient: any;
  private account: any;
  
  // Ethers clients
  // Removed ethers providers - using viem publicClient and walletClient only

  /**
   * Create a new TachiSDK instance
   * 
   * @param config - Configuration object with network, payment, and API settings
   * 
   * @example
   * ```typescript
   * const sdk = new TachiSDK({
   *   network: 'base',
   *   rpcUrl: process.env.BASE_RPC_URL,
   *   ownerPrivateKey: process.env.CRAWLER_PRIVATE_KEY,
   *   usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
   *   paymentProcessorAddress: '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7',
   *   userAgent: 'MyCrawler/1.0 (+https://mycompany.com/crawler)',
   *   debug: true
   * });
   * ```
   */
  constructor(config: TachiConfig) {
    this.config = {
      userAgent: 'TachiSDK/1.0',
      timeout: 30000,
      maxRetries: 3,
      useEthers: false,
      debug: false,
      ...config,
    };

    // Initialize blockchain clients
    this.initializeClients();
  }

  /**
   * Internal debug logging helper
   * @private
   * @param args - Arguments to log to console when debug mode is enabled
   */
  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[TachiSDK]', ...args);
    }
  }

  /**
   * Initialize blockchain clients (both Viem and Ethers)
   * @private
   * @description Sets up the appropriate blockchain client based on configuration.
   * Initializes either Viem or Ethers.js clients for contract interactions.
   */
  private initializeClients() {
    if (this.config.useEthers) {
      // Initialize Ethers clients
      this.ethersProvider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      
      if (this.config.ownerPrivateKey) {
        this.ethersSigner = new ethers.Wallet(this.config.ownerPrivateKey, this.ethersProvider);
      }
    } else {
      // Initialize Viem clients
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
  }

  /**
   * Fetch content from a URL with automatic payment processing
   * 
   * @param url - The URL to fetch content from
   * @param options - Optional HTTP request configuration
   * @param options.method - HTTP method (default: 'GET')
   * @param options.headers - Additional HTTP headers to include
   * @param options.body - Request body for POST/PUT requests
   * 
   * @returns Promise that resolves to TachiResponse with content and payment info
   * 
   * @throws {NetworkError} When HTTP requests fail due to network issues
   * @throws {PaymentError} When payment processing fails
   * 
   * @example
   * ```typescript
   * // Simple GET request
   * const result = await sdk.fetchWithTachi('https://api.example.com/data');
   * 
   * // POST request with custom headers
   * const result = await sdk.fetchWithTachi('https://api.example.com/search', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ query: 'AI research' })
   * });
   * 
   * if (result.paymentRequired) {
   *   console.log(`Paid ${result.paymentAmount} USDC for content`);
   *   console.log(`Transaction: ${result.transactionHash}`);
   * }
   * ```
   */
  async fetchWithTachi(url: string, options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<TachiResponse> {
    const { method = 'GET', headers = {}, body } = options || {};

    // Step 1: Initial request
    this.log(`Fetching: ${url}`);
    
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

    this.log('Payment required - processing payment...');

    // Step 2: Parse payment requirements
    const paymentInfo = await this.parsePaymentInfo(initialResponse);
    this.log(`Payment info:`, paymentInfo);

    // Step 3: Process payment
    const transactionHash = await this.processPayment(paymentInfo);
    this.log(`Payment sent: ${transactionHash}`);

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
        this.log(`Request attempt ${attempt} failed:`, error);

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
   * Process payment using wallet client (Viem or Ethers)
   */
  private async processPayment(paymentInfo: PaymentInfo): Promise<string> {
    if (this.config.useEthers) {
      return this.processPaymentWithEthers(paymentInfo);
    } else {
      return this.processPaymentWithViem(paymentInfo);
    }
  }

  /**
   * Process payment using Viem
   */
  private async processPaymentWithViem(paymentInfo: PaymentInfo): Promise<string> {
    if (!this.walletClient || !this.account) {
      throw new PaymentError('Wallet client not initialized. Private key required for payments.');
    }

    // Convert amount to wei (USDC has 6 decimals)
    const amountInWei = parseUnits(paymentInfo.amount, 6);

    this.log(`Sending ${paymentInfo.amount} USDC to ${paymentInfo.recipient}`);

    try {
      // Check USDC balance
      const balance = await this.publicClient.readContract({
        address: paymentInfo.tokenAddress,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [this.account.address],
      });

      this.log(`USDC balance: ${formatUnits(balance, 6)} USDC`);

      if (balance < amountInWei) {
        throw new PaymentError(
          `Insufficient USDC balance. Required: ${paymentInfo.amount}, Available: ${formatUnits(balance, 6)}`,
          { required: paymentInfo.amount, available: formatUnits(balance, 6) }
        );
      }

      // Check allowance for PaymentProcessor
      const allowance = await this.publicClient.readContract({
        address: paymentInfo.tokenAddress,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [this.account.address, this.config.paymentProcessorAddress],
      });

      // Approve PaymentProcessor if needed
      if (allowance < amountInWei) {
        this.log('Approving PaymentProcessor to spend USDC...');
        
        const approveTx = await this.walletClient.writeContract({
          address: paymentInfo.tokenAddress,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [this.config.paymentProcessorAddress, amountInWei],
        });

        this.log(`Approval transaction: ${approveTx}`);
        
        // Wait for approval confirmation
        await this.publicClient.waitForTransactionReceipt({ hash: approveTx });
        this.log('Approval confirmed');
      }

      // Send payment via PaymentProcessor
      const paymentTx = await this.walletClient.writeContract({
        address: this.config.paymentProcessorAddress,
        abi: PAYMENT_PROCESSOR_ABI,
        functionName: 'payPublisher',
        args: [paymentInfo.recipient, amountInWei],
      });

      this.log(`Payment transaction: ${paymentTx}`);

      // Wait for payment confirmation
      await this.publicClient.waitForTransactionReceipt({ hash: paymentTx });
      this.log('Payment confirmed');

      return paymentTx;

    } catch (error) {
      if (this.config.debug) {
        console.error('[TachiSDK] Payment failed:', error);
      }
      throw new PaymentError(
        `Payment transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { paymentInfo, error }
      );
    }
  }

  /**
   * Process payment using Ethers
   */
  private async processPaymentWithEthers(paymentInfo: PaymentInfo): Promise<string> {
    if (!this.ethersSigner || !this.ethersProvider) {
      throw new PaymentError('Ethers signer not initialized. Private key required for payments.');
    }

    // Convert amount to wei (USDC has 6 decimals)
    const amountInWei = ethers.parseUnits(paymentInfo.amount, 6);

    this.log(`Sending ${paymentInfo.amount} USDC to ${paymentInfo.recipient}`);

    try {
      // Create contract instances
      const usdcContract = new ethers.Contract(paymentInfo.tokenAddress, USDC_ABI_STRINGS, this.ethersSigner);
      const paymentProcessorContract = new ethers.Contract(this.config.paymentProcessorAddress, PAYMENT_PROCESSOR_ABI_STRINGS, this.ethersSigner);

      // Check USDC balance
      const balance = await usdcContract.balanceOf(this.ethersSigner.address);
      this.log(`USDC balance: ${ethers.formatUnits(balance, 6)} USDC`);

      if (balance < amountInWei) {
        throw new PaymentError(
          `Insufficient USDC balance. Required: ${paymentInfo.amount}, Available: ${ethers.formatUnits(balance, 6)}`,
          { required: paymentInfo.amount, available: ethers.formatUnits(balance, 6) }
        );
      }

      // Check allowance for PaymentProcessor
      const allowance = await usdcContract.allowance(this.ethersSigner.address, this.config.paymentProcessorAddress);

      // Approve PaymentProcessor if needed
      if (allowance < amountInWei) {
        this.log('Approving PaymentProcessor to spend USDC...');
        
        const approveTx = await usdcContract.approve(this.config.paymentProcessorAddress, amountInWei);
        this.log(`Approval transaction: ${approveTx.hash}`);
        
        // Wait for approval confirmation
        await approveTx.wait();
        this.log('Approval confirmed');
      }

      // Send payment via PaymentProcessor
      const paymentTx = await paymentProcessorContract.payPublisher(paymentInfo.recipient, amountInWei);
      this.log(`Payment transaction: ${paymentTx.hash}`);

      // Wait for payment confirmation
      await paymentTx.wait();
      this.log('Payment confirmed');

      return paymentTx.hash;

    } catch (error) {
      if (this.config.debug) {
        console.error('[TachiSDK] Payment failed:', error);
      }
      throw new PaymentError(
        `Payment transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { paymentInfo, error }
      );
    }
  }

  /**
   * Get the USDC balance for the configured wallet
   * 
   * @returns Promise that resolves to balance information in both wei and human-readable format
   * @returns {object} balance - Balance information object
   * @returns {bigint} balance.wei - Raw balance in wei (USDC has 6 decimals)
   * @returns {string} balance.formatted - Human-readable balance (e.g., "150.50")
   * 
   * @throws {TachiError} When account is not initialized (private key required)
   * 
   * @example
   * ```typescript
   * const balance = await sdk.getUSDCBalance();
   * console.log(`USDC Balance: ${balance.formatted} USDC`);
   * console.log(`Raw balance: ${balance.wei} wei`);
   * 
   * // Check if sufficient balance for payment
   * const requiredAmount = parseFloat('1.50'); // 1.50 USDC
   * if (parseFloat(balance.formatted) >= requiredAmount) {
   *   console.log('Sufficient balance for payment');
   * }
   * ```
   */
  async getUSDCBalance(): Promise<{ wei: bigint; formatted: string }> {
    if (this.config.useEthers) {
      return this.getUSDCBalanceWithEthers();
    } else {
      return this.getUSDCBalanceWithViem();
    }
  }

  /**
   * Get USDC balance using Viem
   */
  private async getUSDCBalanceWithViem(): Promise<{ wei: bigint; formatted: string }> {
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
   * Get USDC balance using Ethers
   */
  private async getUSDCBalanceWithEthers(): Promise<{ wei: bigint; formatted: string }> {
    if (!this.ethersSigner || !this.ethersProvider) {
      throw new TachiError('Ethers signer not initialized. Private key required.', 'CONFIG_ERROR');
    }

    const usdcContract = new ethers.Contract(this.config.usdcAddress, USDC_ABI_STRINGS, this.ethersProvider);
    const balance = await usdcContract.balanceOf(this.ethersSigner.address);

    return {
      wei: balance,
      formatted: ethers.formatUnits(balance, 6),
    };
  }

  /**
   * Get the wallet address associated with this SDK instance
   * 
   * @returns The wallet address if private key was provided, null otherwise
   * 
   * @example
   * ```typescript
   * const address = sdk.getAccountAddress();
   * if (address) {
   *   console.log(`Wallet address: ${address}`);
   * } else {
   *   console.log('No private key configured');
   * }
   * ```
   */
  getAccountAddress(): Address | null {
    if (this.config.useEthers) {
      return this.ethersSigner?.address as Address || null;
    } else {
      return this.account?.address || null;
    }
  }

  // === Tachi API Integration Methods ===

  /**
   * Register this crawler with the Tachi Protocol API
   * 
   * @param data - Optional crawler registration information
   * @returns Promise that resolves to registration response with API key
   * 
   * @throws {Error} When registration fails due to network or validation errors
   * 
   * @example
   * ```typescript
   * const result = await sdk.registerCrawler({
   *   name: 'Research Crawler',
   *   contact: 'admin@university.edu',
   *   description: 'Academic research data collection',
   *   companyName: 'University Research Lab',
   *   type: 'enterprise'
   * });
   * 
   * console.log(`Registration successful! API Key: ${result.apiKey}`);
   * ```
   */
  async registerCrawler(data: CrawlerRegistration = {}): Promise<any> {
    const apiUrl = this.config.apiUrl || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/api/crawlers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.config.userAgent!,
      },
      body: JSON.stringify({
        name: data.name || 'AI Crawler',
        contact: data.contact || 'crawler@example.com',
        description: data.description || 'Automated content crawler',
        companyName: data.companyName || 'AI Company',
        type: data.type || 'startup',
      }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Store API key if provided
    if (result.apiKey) {
      this.config.apiKey = result.apiKey;
    }

    return result;
  }

  /**
   * Authenticate with Tachi API using API key
   */
  async authenticate(apiKey?: string): Promise<any> {
    const key = apiKey || this.config.apiKey;
    if (!key) {
      throw new Error('API key required for authentication');
    }

    const apiUrl = this.config.apiUrl || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/api/crawlers/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.config.userAgent!,
      },
      body: JSON.stringify({ apiKey: key }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get publishers directory from Tachi API
   */
  async getPublishersDirectory(): Promise<any> {
    const apiUrl = this.config.apiUrl || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/api/publishers/directory`, {
      headers: {
        'User-Agent': this.config.userAgent!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch publishers: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch content through Tachi API with authentication
   */
  async fetchContent(domain: string, path: string, token?: string): Promise<any> {
    const apiUrl = this.config.apiUrl || 'http://localhost:3001';
    const url = `${apiUrl}/api/content/${domain}/${path}`;
    
    const headers: Record<string, string> = {
      'User-Agent': this.config.userAgent!,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Content fetch failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get content pricing for a domain
   */
  async getContentPricing(domain: string): Promise<any> {
    const apiUrl = this.config.apiUrl || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/api/content/pricing/${domain}`, {
      headers: {
        'User-Agent': this.config.userAgent!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pricing: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Perform batch content requests
   */
  async batchRequest(requests: Array<{ domain: string; path: string }>, token?: string): Promise<any> {
    const apiUrl = this.config.apiUrl || 'http://localhost:3001';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': this.config.userAgent!,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiUrl}/api/content/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requests }),
    });

    if (!response.ok) {
      throw new Error(`Batch request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<any> {
    const apiUrl = this.config.apiUrl || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/health`, {
      headers: {
        'User-Agent': this.config.userAgent!,
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
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
 * Convenience function for quick one-off content fetching without creating an SDK instance
 * 
 * @param url - The URL to fetch content from
 * @param config - TachiSDK configuration object
 * @param options - Optional HTTP request configuration
 * @returns Promise that resolves to TachiResponse with content and payment info
 * 
 * @example
 * ```typescript
 * import { fetchWithTachi } from '@tachi/sdk-js';
 * 
 * const result = await fetchWithTachi(
 *   'https://protected-api.com/data',
 *   {
 *     network: 'base',
 *     rpcUrl: process.env.BASE_RPC_URL!,
 *     ownerPrivateKey: process.env.CRAWLER_PRIVATE_KEY!,
 *     usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
 *     paymentProcessorAddress: '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7'
 *   }
 * );
 * 
 * console.log(result.content);
 * ```
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
 * Create a pre-configured SDK instance for any supported network
 * 
 * @param network - Network name ('base', 'base-sepolia')
 * @param config - Configuration object
 * @param useEthers - Whether to use Ethers.js instead of Viem
 * @returns TachiSDK instance configured for the specified network
 * 
 * @example
 * ```typescript
 * const sdk = createNetworkSDK('base', {
 *   rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-KEY',
 *   ownerPrivateKey: process.env.CRAWLER_PRIVATE_KEY,
 *   paymentProcessorAddress: '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7'
 * });
 * ```
 */
export function createNetworkSDK(
  network: 'base' | 'base-sepolia',
  config: Omit<TachiConfig, 'network' | 'usdcAddress' | 'useEthers'>,
  useEthers = false
): TachiSDK {
  const networkConfig = {
    base: { usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address },
    'base-sepolia': { usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address }
  };

  return new TachiSDK({
    ...config,
    network,
    usdcAddress: networkConfig[network].usdcAddress,
    useEthers,
  });
}

// Backward compatibility aliases
export const createBaseSDK = (config: Omit<TachiConfig, 'network' | 'usdcAddress'>) => createNetworkSDK('base', config);
export const createBaseSepoliaSDK = (config: Omit<TachiConfig, 'network' | 'usdcAddress'>) => createNetworkSDK('base-sepolia', config);

// Export types and classes
export { TachiSDK };
export default TachiSDK;
