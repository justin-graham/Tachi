export interface CrawlRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  publisherAddress?: string; // Publisher's wallet address for license verification
}

export interface CrawlResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
}

export class GatewayCore {
  private rpcUrl: string;
  private crawlNFTAddress?: string;
  private paymentProcessorAddress?: string;

  constructor(rpcUrl?: string, crawlNFTAddress?: string, paymentProcessorAddress?: string) {
    // Store RPC URL for future blockchain integration
    this.rpcUrl = rpcUrl || 'https://eth-mainnet.g.alchemy.com/v2/demo';
    this.crawlNFTAddress = crawlNFTAddress;
    this.paymentProcessorAddress = paymentProcessorAddress;
    console.log(`Gateway initialized with RPC URL: ${this.rpcUrl}`);
    if (crawlNFTAddress) {
      console.log(`CrawlNFT contract address: ${crawlNFTAddress}`);
    }
    if (paymentProcessorAddress) {
      console.log(`PaymentProcessor contract address: ${paymentProcessorAddress}`);
    }
  }

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
    console.log(`Verifying payment token: ${paymentToken} for amount: ${amount}`);
    
    if (!this.paymentProcessorAddress) {
      console.log('PaymentProcessor contract address not set, skipping payment verification');
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
    console.log(`Verifying publisher license for: ${publisherAddress}`);
    
    if (!this.crawlNFTAddress) {
      console.log('CrawlNFT contract address not set, skipping license verification');
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
}

export default GatewayCore;
