/**
 * Request interface for crawl operations through Tachi Protocol gateway
 * 
 * @interface CrawlRequest
 * @description Defines the structure for requesting content crawls through the gateway,
 * including optional publisher verification and payment authentication.
 */
export interface CrawlRequest {
  /** 
   * Target URL to crawl
   * @example 'https://example.com/api/data'
   */
  url: string;
  
  /** 
   * HTTP method for the request (optional)
   * @default 'GET'
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  
  /** 
   * Custom HTTP headers to include in the request (optional)
   * @example { 'Content-Type': 'application/json', 'User-Agent': 'MyCrawler/1.0' }
   */
  headers?: Record<string, string>;
  
  /** 
   * Request body for POST/PUT requests (optional)
   * @example JSON.stringify({ query: 'search term' })
   */
  body?: string;
  
  /** 
   * Publisher's wallet address for license verification (optional)
   * @example '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7'
   * @description When provided, verifies the publisher has a valid CrawlNFT license
   */
  publisherAddress?: string;
  
  /** 
   * CrawlNFT token ID to use directly (optional)
   * @example 123
   * @description Bypasses publisher address lookup when provided
   */
  crawlTokenId?: number;
  
  /** 
   * Crawler's wallet address (optional)
   * @example '0x1234567890123456789012345678901234567890'
   * @description Overrides automatic crawler address extraction from payment token
   */
  crawlerAddress?: string;
}

/**
 * Response interface for crawl operations
 * 
 * @interface CrawlResponse
 * @description Standard response format for all gateway crawl operations,
 * providing success status, data, error information, and HTTP status codes.
 */
export interface CrawlResponse {
  /** 
   * Whether the crawl operation was successful
   */
  success: boolean;
  
  /** 
   * Response data from the crawled URL (optional)
   * Can be JSON object, text string, or other content types
   */
  data?: any;
  
  /** 
   * Error message if the operation failed (optional)
   * @example 'Payment required - Invalid or insufficient payment'
   */
  error?: string;
  
  /** 
   * HTTP status code for the response
   * @example 200 for success, 402 for payment required, 403 for forbidden
   */
  statusCode: number;
}

/**
 * Core gateway class for processing Tachi Protocol crawl requests
 * 
 * @class GatewayCore
 * @description Central processing engine for the Tachi Protocol gateway that handles
 * content crawling requests with payment verification, publisher license validation,
 * and on-chain crawl logging.
 * 
 * @example
 * ```typescript
 * const gateway = new GatewayCore(
 *   'https://base-mainnet.g.alchemy.com/v2/YOUR-KEY',
 *   '0x1234...', // CrawlNFT contract address
 *   '0x5678...', // PaymentProcessor contract address
 *   '0x9abc...'  // ProofOfCrawlLedger contract address
 * );
 * 
 * const response = await gateway.handleRequest({
 *   url: 'https://api.example.com/data',
 *   headers: { 'authorization': 'Bearer payment_token_123' },
 *   publisherAddress: '0xpublisher...'
 * });
 * ```
 */
export class GatewayCore {
  /** RPC endpoint URL for blockchain interactions */
  private rpcUrl: string;
  
  /** CrawlNFT contract address for license verification */
  private crawlNFTAddress?: string;
  
  /** PaymentProcessor contract address for payment verification */
  private paymentProcessorAddress?: string;
  
  /** ProofOfCrawlLedger contract address for crawl logging */
  private proofOfCrawlLedgerAddress?: string;

  /**
   * Initialize the GatewayCore with blockchain contract addresses
   * 
   * @param rpcUrl - Blockchain RPC endpoint URL (defaults to Ethereum mainnet demo)
   * @param crawlNFTAddress - CrawlNFT contract address for license verification
   * @param paymentProcessorAddress - PaymentProcessor contract address for payments
   * @param proofOfCrawlLedgerAddress - ProofOfCrawlLedger contract for logging
   * 
   * @example
   * ```typescript
   * // Basic initialization with RPC only
   * const gateway = new GatewayCore('https://base-mainnet.g.alchemy.com/v2/YOUR-KEY');
   * 
   * // Full initialization with all contracts
   * const gateway = new GatewayCore(
   *   'https://base-mainnet.g.alchemy.com/v2/YOUR-KEY',
   *   '0x1234567890123456789012345678901234567890', // CrawlNFT
   *   '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7', // PaymentProcessor
   *   '0x9abcdef012345678901234567890123456789012'  // ProofOfCrawlLedger
   * );
   * ```
   */
  constructor(
    rpcUrl?: string, 
    crawlNFTAddress?: string, 
    paymentProcessorAddress?: string,
    proofOfCrawlLedgerAddress?: string
  ) {
    this.rpcUrl = rpcUrl || 'https://eth-mainnet.g.alchemy.com/v2/demo';
    this.crawlNFTAddress = crawlNFTAddress;
    this.paymentProcessorAddress = paymentProcessorAddress;
    this.proofOfCrawlLedgerAddress = proofOfCrawlLedgerAddress;
  }

  /**
   * Process a crawl request with payment verification and content fetching
   * 
   * @param request - The crawl request containing URL, headers, and optional publisher info
   * @returns Promise resolving to crawl response with success status and data
   * 
   * @throws {Error} When request validation fails or network errors occur
   * 
   * @example
   * ```typescript
   * const response = await gateway.handleRequest({
   *   url: 'https://api.example.com/data',
   *   method: 'POST',
   *   headers: { 
   *     'authorization': 'Bearer payment_token_123',
   *     'content-type': 'application/json'
   *   },
   *   body: JSON.stringify({ query: 'search term' }),
   *   publisherAddress: '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7'
   * });
   * 
   * if (response.success) {
   *   console.log('Content:', response.data);
   * } else {
   *   console.error('Error:', response.error, 'Status:', response.statusCode);
   * }
   * ```
   */
  async handleRequest(request: CrawlRequest): Promise<CrawlResponse> {
    try {
      // Validate request
      if (!request.url) {
        return {
          success: false,
          error: 'URL is required',
          statusCode: 400,
        };
      }

      // Check for payment/authentication
      const paymentToken = request.headers?.['x-tachi-payment'] || request.headers?.['authorization'];
      if (!paymentToken) {
        return {
          success: false,
          error: 'Payment required - Missing payment token',
          statusCode: 402,
        };
      }

      // Verify payment (placeholder implementation)
      const isPaymentValid = await this.verifyPayment(paymentToken, BigInt(100000));
      if (!isPaymentValid) {
        return {
          success: false,
          error: 'Payment required - Invalid or insufficient payment',
          statusCode: 402,
        };
      }

      // Check if publisher has a valid license (if publisherAddress is provided)
      if (request.publisherAddress) {
        const hasValidLicense = await this.verifyPublisherLicense(request.publisherAddress);
        if (!hasValidLicense) {
          return {
            success: false,
            error: 'Publisher license required - No valid CrawlNFT license found',
            statusCode: 403, // Forbidden
          };
        }
      }

      // Perform the crawl request
      const response = await this.performCrawl(request);
      
      // Log the crawl to the ProofOfCrawlLedger after successful crawl
      if (request.publisherAddress) {
        await this.logCrawl(request, paymentToken);
      }
      
      return {
        success: true,
        data: response,
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
      };
    }
  }

  private async performCrawl(request: CrawlRequest): Promise<any> {
    const { url, method = 'GET', headers = {}, body } = request;

    const response = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'Tachi-Gateway/1.0',
        ...headers,
      },
      body: method !== 'GET' ? body : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  // Helper method to verify payment/authentication
  async verifyPayment(paymentToken: string, amount: bigint): Promise<boolean> {
    // This would integrate with your smart contract
    // For demo purposes, always return false to show 402 response
    // In production, this would verify the payment on-chain
    // Verify payment token against required amount
    
    if (!this.paymentProcessorAddress) {
      // PaymentProcessor contract address not set, cannot verify payment
      return false; // Require payment processor for payment verification
    }
    
    // In production, this would:
    // 1. Parse the payment token to extract transaction hash or payment details
    // 2. Verify the payment was made to the PaymentProcessor contract
    // 3. Check that the payment amount matches the required amount
    // 4. Verify the payment was made by the correct crawler address
    // 5. Ensure the payment hasn't been used before (prevent double-spending)
    
    // For demo, simulate payment verification logic
    const validPaymentTokens = [
      'payment_tx_0x1234567890abcdef', // Example payment transaction hash
      'payment_token_valid_demo_key',
      'usdc_payment_confirmed_123'
    ];
    
    return validPaymentTokens.includes(paymentToken);
  }

  // Helper method to verify publisher has a valid CrawlNFT license
  async verifyPublisherLicense(publisherAddress: string): Promise<boolean> {
    // This would integrate with the CrawlNFT contract
    // For demo purposes, simulate license verification
    // Verify publisher license for provided address
    
    if (!this.crawlNFTAddress) {
      // CrawlNFT contract address not set, allowing request
      return true; // Allow if no NFT contract is configured
    }
    
    // In production, this would:
    // 1. Connect to the CrawlNFT contract using this.crawlNFTAddress
    // 2. Call hasLicense(publisherAddress) to check if they have a license
    // 3. Optionally verify the license terms are still valid
    
    // For demo, return true for specific addresses, false for others
    const validPublishers = [
      '0x1234567890123456789012345678901234567890',
      '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7'
    ];
    
    return validPublishers.includes(publisherAddress.toLowerCase());
  }

  // Helper method to log crawl to ProofOfCrawlLedger
  async logCrawl(request: CrawlRequest, paymentToken: string): Promise<void> {
    // Log crawl activity for publisher and URL
    
    if (!this.proofOfCrawlLedgerAddress) {
      // ProofOfCrawlLedger contract address not set, skipping crawl logging
      return;
    }
    
    // In production, this would:
    // 1. Connect to the ProofOfCrawlLedger contract using this.proofOfCrawlLedgerAddress
    // 2. Look up the publisher's CrawlNFT token ID from the CrawlNFT contract
    // 3. Extract the crawler address from the payment token or transaction
    // 4. Call logCrawl(crawlTokenId, crawlerAddress) on the ProofOfCrawlLedger contract
    // 5. Optionally use logCrawlWithURL() to include the URL in the log
    
    try {
      // Use provided crawlTokenId or look it up from the publisher address
      const crawlTokenId = request.crawlTokenId || 
        await this.getCrawlTokenIdForPublisher(request.publisherAddress!);
      
      // Use provided crawler address or extract from payment token
      const crawlerAddress = request.crawlerAddress || 
        this.extractCrawlerFromPaymentToken(paymentToken);
      
      // Would log crawl with token ID, crawler address, and URL
      
      // In production, this would make an actual smart contract call:
      // await proofOfCrawlLedgerContract.logCrawlWithURL(crawlTokenId, crawlerAddress, request.url);
      
      // Crawl logged successfully to ProofOfCrawlLedger
    } catch (error) {
      // Failed to log crawl - continuing with main flow
      // Don't throw error here - crawl logging failure shouldn't break the main flow
    }
  }

  // Helper method to get crawl token ID for a publisher
  private async getCrawlTokenIdForPublisher(publisherAddress: string): Promise<number> {
    // In production, this would query the CrawlNFT contract to find the token ID
    // owned by the publisher address
    // Get crawl token ID for publisher address
    
    // For demo, simulate returning a token ID based on the publisher address
    const mockTokenIds: Record<string, number> = {
      '0x1234567890123456789012345678901234567890': 1,
      '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7': 2,
    };
    
    return mockTokenIds[publisherAddress.toLowerCase()] || 1;
  }

  // Helper method to extract crawler address from payment token
  private extractCrawlerFromPaymentToken(paymentToken: string): string {
    // In production, this would parse the payment token to extract the crawler's address
    // The payment token might contain transaction hash, signature, or other data
    // Extract crawler address from payment token
    
    // For demo, simulate extracting crawler address
    if (paymentToken.includes('payment_tx_')) {
      return '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7'; // Mock crawler address
    }
    
    return '0x1234567890123456789012345678901234567890'; // Default mock address
  }
}

export default GatewayCore;
