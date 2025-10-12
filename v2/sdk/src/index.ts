import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseUnits,
  formatUnits,
  type Address,
  type Hash
} from 'viem';
import {base, baseSepolia} from 'viem/chains';
import {privateKeyToAccount} from 'viem/accounts';

// Configuration
export interface TachiConfig {
  network: 'base' | 'base-sepolia';
  rpcUrl: string;
  privateKey: Hash;
  usdcAddress: Address;
  paymentProcessorAddress: Address;
  crawlNFTAddress?: Address;
  proofOfCrawlAddress?: Address;
  debug?: boolean;
}

// Response interface
export interface TachiResponse {
  content: string;
  statusCode: number;
  headers: Record<string, string>;
  paymentRequired: boolean;
  paymentAmount?: string;
  transactionHash?: Hash;
}

// Payment info from 402 response
interface PaymentInfo {
  amount: string;
  recipient: Address;
  tokenAddress: Address;
  chainId: number;
}

// Contract ABIs
const USDC_ABI = parseAbi([
  'function balanceOf(address) external view returns (uint256)',
  'function approve(address,uint256) external returns (bool)',
  'function allowance(address,address) external view returns (uint256)'
]);

const PAYMENT_PROCESSOR_ABI = parseAbi([
  'function payPublisher(address,uint256) external'
]);

/**
 * Tachi SDK - Pay-per-crawl for AI training data
 * @example
 * const sdk = new TachiSDK({
 *   network: 'base',
 *   rpcUrl: process.env.BASE_RPC_URL!,
 *   privateKey: process.env.PRIVATE_KEY! as Hash,
 *   usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
 *   paymentProcessorAddress: '0x...'
 * });
 *
 * const result = await sdk.fetch('https://example.com/data');
 */
export class TachiSDK {
  private config: TachiConfig;
  private publicClient: any;
  private walletClient: any;
  private account: any;

  constructor(config: TachiConfig) {
    this.config = {debug: false, ...config};
    const chain = config.network === 'base' ? base : baseSepolia;

    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl)
    });

    this.account = privateKeyToAccount(config.privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain,
      transport: http(config.rpcUrl)
    });
  }

  /**
   * Fetch content with automatic payment handling
   * @param url - The URL to fetch
   * @param options - Optional fetch options
   * @returns Response with content and payment info
   */
  async fetch(
    url: string,
    options?: {method?: string; headers?: Record<string, string>; body?: string}
  ): Promise<TachiResponse> {
    const {method = 'GET', headers = {}, body} = options || {};

    this.log(`Fetching: ${url}`);

    // Initial request
    const res = await fetch(url, {
      method,
      headers: {'User-Agent': 'TachiSDK/2.0', ...headers},
      body
    });

    // If not 402, return immediately
    if (res.status !== 402) {
      return {
        content: await res.text(),
        statusCode: res.status,
        headers: this.headersToObject(res.headers),
        paymentRequired: false
      };
    }

    this.log('Payment required (402) - processing payment...');

    // Parse payment info from 402 response
    const paymentInfo = this.parsePaymentInfo(res);
    this.log(`Payment: ${paymentInfo.amount} USDC to ${paymentInfo.recipient}`);

    // Process payment
    const txHash = await this.processPayment(paymentInfo);
    this.log(`Payment sent: ${txHash}`);

    // Retry with payment proof
    const paidRes = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'TachiSDK/2.0',
        'Authorization': `Bearer ${txHash}`,
        ...headers
      },
      body
    });

    if (paidRes.status !== 200) {
      throw new Error(`Payment verification failed: ${paidRes.status}`);
    }

    return {
      content: await paidRes.text(),
      statusCode: paidRes.status,
      headers: this.headersToObject(paidRes.headers),
      paymentRequired: true,
      paymentAmount: paymentInfo.amount,
      transactionHash: txHash
    };
  }

  /**
   * Parse payment info from 402 response headers
   */
  private parsePaymentInfo(res: Response): PaymentInfo {
    const amount = res.headers.get('x-tachi-price') || '0';
    const recipient = res.headers.get('x-tachi-recipient') as Address;
    const tokenAddress = (res.headers.get('x-tachi-token') || this.config.usdcAddress) as Address;
    const chainId = parseInt(res.headers.get('x-tachi-chain-id') || '8453');

    if (!recipient) {
      throw new Error('Invalid 402 response: missing x-tachi-recipient header');
    }

    return {
      amount: formatUnits(BigInt(amount), 6), // USDC has 6 decimals
      recipient,
      tokenAddress,
      chainId
    };
  }

  /**
   * Process USDC payment on-chain
   */
  private async processPayment(paymentInfo: PaymentInfo): Promise<Hash> {
    const amountInWei = parseUnits(paymentInfo.amount, 6);

    // Check balance
    const balance = (await this.publicClient.readContract({
      address: this.config.usdcAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [this.account.address]
    })) as bigint;

    this.log(`USDC balance: ${formatUnits(balance, 6)} USDC`);

    if (balance < amountInWei) {
      throw new Error(
        `Insufficient USDC balance. Required: ${paymentInfo.amount}, Available: ${formatUnits(balance, 6)}`
      );
    }

    // Check allowance
    const allowance = (await this.publicClient.readContract({
      address: this.config.usdcAddress,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [this.account.address, this.config.paymentProcessorAddress]
    })) as bigint;

    // Approve if needed
    if (allowance < amountInWei) {
      this.log('Approving PaymentProcessor...');
      const approveTx = await this.walletClient.writeContract({
        address: this.config.usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [this.config.paymentProcessorAddress, amountInWei]
      });
      await this.publicClient.waitForTransactionReceipt({hash: approveTx});
      this.log('Approval confirmed');
    }

    // Send payment
    const paymentTx = await this.walletClient.writeContract({
      address: this.config.paymentProcessorAddress,
      abi: PAYMENT_PROCESSOR_ABI,
      functionName: 'payPublisher',
      args: [paymentInfo.recipient, amountInWei]
    });

    await this.publicClient.waitForTransactionReceipt({hash: paymentTx});
    this.log('Payment confirmed');

    return paymentTx;
  }

  /**
   * Get USDC balance
   */
  async getBalance(): Promise<{wei: bigint; formatted: string}> {
    const balance = (await this.publicClient.readContract({
      address: this.config.usdcAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [this.account.address]
    })) as bigint;

    return {
      wei: balance,
      formatted: formatUnits(balance, 6)
    };
  }

  /**
   * Get wallet address
   */
  getAddress(): Address {
    return this.account.address;
  }

  private log(...args: any[]) {
    if (this.config.debug) console.log('[TachiSDK]', ...args);
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
}

/**
 * Convenience function for one-off requests
 */
export async function fetchWithTachi(
  url: string,
  config: TachiConfig,
  options?: {method?: string; headers?: Record<string, string>; body?: string}
): Promise<TachiResponse> {
  const sdk = new TachiSDK(config);
  return sdk.fetch(url, options);
}

// Export default
export default TachiSDK;
