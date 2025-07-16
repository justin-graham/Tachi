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
  async verifyPayment(_address: string, _amount: bigint): Promise<boolean> {
    // This would integrate with your smart contract
    // For now, return true as a placeholder
    return true;
  }
}

export default GatewayCore;
