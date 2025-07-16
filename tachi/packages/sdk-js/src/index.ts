import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import 'cross-fetch/polyfill';

export interface TachiSDKConfig {
  gatewayUrl: string;
  rpcUrl?: string;
  contractAddress?: string;
  privateKey?: string;
}

export interface CrawlOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface CrawlResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    statusCode: number;
    timestamp: number;
    cost?: string;
  };
}

export class TachiSDK {
  private config: TachiSDKConfig;
  private publicClient: any;
  private walletClient: any;
  private account: any;

  constructor(config: TachiSDKConfig) {
    this.config = config;
    
    // Initialize viem clients
    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http(config.rpcUrl || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
    });

    if (config.privateKey) {
      this.account = privateKeyToAccount(config.privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: mainnet,
        transport: http(config.rpcUrl || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
      });
    }
  }

  async crawl(options: CrawlOptions): Promise<CrawlResult> {
    const timestamp = Date.now();
    
    try {
      // Validate options
      if (!options.url) {
        throw new Error('URL is required');
      }

      // Make the request to the gateway
      const response = await this.makeGatewayRequest(options);
      
      return {
        success: true,
        data: response.data,
        metadata: {
          statusCode: response.statusCode || 200,
          timestamp,
          cost: response.cost,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          statusCode: 500,
          timestamp,
        },
      };
    }
  }

  private async makeGatewayRequest(options: CrawlOptions): Promise<any> {
    const { url, method = 'GET', headers = {}, body, timeout = 30000 } = options;
    
    const gatewayUrl = new URL(this.config.gatewayUrl);
    gatewayUrl.searchParams.set('url', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(gatewayUrl.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: method !== 'GET' ? JSON.stringify({ body }) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gateway request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Payment and contract interaction methods
  async getBalance(address?: string): Promise<string> {
    if (!this.publicClient) {
      throw new Error('Public client not initialized');
    }

    const targetAddress = address || this.account?.address;
    if (!targetAddress) {
      throw new Error('No address provided');
    }

    const balance = await this.publicClient.getBalance({
      address: targetAddress,
    });

    return formatEther(balance);
  }

  async sendPayment(to: string, amount: string): Promise<string> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet client not initialized');
    }

    const hash = await this.walletClient.sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(amount),
    });

    return hash;
  }

  // Utility methods
  async waitForTransaction(hash: string): Promise<any> {
    if (!this.publicClient) {
      throw new Error('Public client not initialized');
    }

    return await this.publicClient.waitForTransactionReceipt({
      hash: hash as `0x${string}`,
    });
  }

  // Configuration methods
  updateConfig(newConfig: Partial<TachiSDKConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): TachiSDKConfig {
    return { ...this.config };
  }
}

export default TachiSDK;
