export interface CrawlRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}

export interface CrawlResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
}

export class GatewayCore {
  private rpcUrl: string;

  constructor(rpcUrl?: string) {
    // Store RPC URL for future blockchain integration
    this.rpcUrl = rpcUrl || 'https://eth-mainnet.g.alchemy.com/v2/demo';
    console.log(`Gateway initialized with RPC URL: ${this.rpcUrl}`);
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
  async verifyPayment(paymentToken: string, _amount: bigint): Promise<boolean> {
    // This would integrate with your smart contract
    // For demo purposes, always return false to show 402 response
    // In production, this would verify the payment on-chain
    console.log(`Verifying payment token: ${paymentToken}`);
    return false;
  }
}

export default GatewayCore;
