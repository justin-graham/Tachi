#!/usr/bin/env node

/**
 * Example Crawler Implementation for Tachi Pay-Per-Crawl Gateway
 * 
 * This demonstrates how an AI crawler would integrate with the Tachi protocol:
 * 1. Attempt to crawl content
 * 2. Receive 402 Payment Required response
 * 3. Parse payment requirements
 * 4. Send USDC payment to PaymentProcessor
 * 5. Retry with transaction hash
 * 6. Receive content
 */

import { createWalletClient, createPublicClient, http, parseAbi, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Example configuration
const CONFIG = {
  // Gateway URL to test against
  gatewayUrl: process.env.GATEWAY_URL || 'https://your-worker.your-subdomain.workers.dev',
  
  // Base network RPC
  rpcUrl: process.env.BASE_RPC_URL || 'https://base-mainnet.alchemyapi.io/v2/your-api-key',
  
  // Crawler's private key (for testing - use secure key management in production)
  crawlerPrivateKey: process.env.CRAWLER_PRIVATE_KEY || '0x...',
  
  // Crawler user agent
  userAgent: 'ExampleCrawler/1.0 (+https://example.com/crawler)',
  
  // Target URL to crawl
  targetUrl: '/content/article-123',
};

// USDC contract ABI (minimal for transfer)
const USDC_ABI = parseAbi([
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
]);

// PaymentProcessor contract ABI (minimal for payment)
const PAYMENT_PROCESSOR_ABI = parseAbi([
  'function payPublisher(address publisher, uint256 amount) external',
  'function payPublisherByNFT(address crawlNFT, uint256 tokenId, uint256 amount) external',
  'event Payment(address indexed crawler, address indexed publisher, uint256 amount)',
]);

class TachiCrawler {
  constructor(config) {
    this.config = config;
    this.account = privateKeyToAccount(config.crawlerPrivateKey);
    
    // Create blockchain clients
    this.publicClient = createPublicClient({
      chain: base,
      transport: http(config.rpcUrl),
    });
    
    this.walletClient = createWalletClient({
      account: this.account,
      chain: base,
      transport: http(config.rpcUrl),
    });
  }

  /**
   * Attempts to crawl content from the target URL
   */
  async crawlContent(url) {
    console.log(`🤖 Attempting to crawl: ${url}`);
    
    try {
      // Step 1: Initial request to gateway
      const response = await this.makeRequest(url);
      
      if (response.status === 200) {
        console.log('✅ Content accessed successfully (no payment required)');
        return await response.text();
      }
      
      if (response.status === 402) {
        console.log('💳 Payment required - processing payment...');
        
        // Step 2: Parse payment requirements
        const paymentInfo = await this.parsePaymentRequirements(response);
        console.log('Payment info:', paymentInfo);
        
        // Step 3: Send payment
        const txHash = await this.sendPayment(paymentInfo);
        console.log(`💰 Payment sent: ${txHash}`);
        
        // Step 4: Retry with payment proof
        const paidResponse = await this.makeRequest(url, txHash);
        
        if (paidResponse.status === 200) {
          console.log('✅ Content accessed successfully after payment');
          return await paidResponse.text();
        } else {
          throw new Error(`Payment verification failed: ${paidResponse.status}`);
        }
      }
      
      throw new Error(`Unexpected response status: ${response.status}`);
      
    } catch (error) {
      console.error('❌ Crawling failed:', error.message);
      throw error;
    }
  }

  /**
   * Makes HTTP request to the gateway
   */
  async makeRequest(url, txHash = null) {
    const fullUrl = `${this.config.gatewayUrl}${url}`;
    
    const headers = {
      'User-Agent': this.config.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    };
    
    if (txHash) {
      headers['Authorization'] = `Bearer ${txHash}`;
    }
    
    return fetch(fullUrl, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Parses payment requirements from 402 response
   */
  async parsePaymentRequirements(response) {
    const body = await response.json();
    
    const paymentInfo = {
      amount: body.payment.amount,
      currency: body.payment.currency,
      network: body.payment.network,
      chainId: body.payment.chainId,
      recipient: body.payment.recipient,
      tokenAddress: body.payment.tokenAddress,
      tokenId: body.payment.tokenId,
    };
    
    // Validate payment info
    if (!paymentInfo.amount || !paymentInfo.recipient || !paymentInfo.tokenAddress) {
      throw new Error('Invalid payment information in 402 response');
    }
    
    return paymentInfo;
  }

  /**
   * Sends USDC payment to PaymentProcessor
   */
  async sendPayment(paymentInfo) {
    console.log(`💳 Sending ${paymentInfo.amount} ${paymentInfo.currency} to ${paymentInfo.recipient}`);
    
    const amountInWei = parseUnits(paymentInfo.amount, 6); // USDC has 6 decimals
    
    // Step 1: Check USDC balance
    const balance = await this.publicClient.readContract({
      address: paymentInfo.tokenAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [this.account.address],
    });
    
    console.log(`Current USDC balance: ${balance} (${balance / 10n ** 6n} USDC)`);
    
    if (balance < amountInWei) {
      throw new Error(`Insufficient USDC balance. Need ${amountInWei}, have ${balance}`);
    }
    
    // Step 2: Approve PaymentProcessor to spend USDC
    const allowance = await this.publicClient.readContract({
      address: paymentInfo.tokenAddress,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [this.account.address, paymentInfo.recipient],
    });
    
    if (allowance < amountInWei) {
      console.log('📝 Approving PaymentProcessor to spend USDC...');
      
      const approveTx = await this.walletClient.writeContract({
        address: paymentInfo.tokenAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [paymentInfo.recipient, amountInWei],
      });
      
      console.log(`Approval transaction: ${approveTx}`);
      
      // Wait for approval confirmation
      await this.publicClient.waitForTransactionReceipt({ hash: approveTx });
      console.log('✅ Approval confirmed');
    }
    
    // Step 3: Send payment via PaymentProcessor
    const paymentTx = await this.walletClient.writeContract({
      address: paymentInfo.recipient,
      abi: PAYMENT_PROCESSOR_ABI,
      functionName: 'payPublisherByNFT',
      args: [
        paymentInfo.crawlNFTAddress || '0x0000000000000000000000000000000000000000', // Will be extracted from headers
        BigInt(paymentInfo.tokenId || 1),
        amountInWei,
      ],
    });
    
    console.log(`Payment transaction: ${paymentTx}`);
    
    // Wait for payment confirmation
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: paymentTx });
    console.log('✅ Payment confirmed');
    
    return paymentTx;
  }

  /**
   * Gets crawler's current USDC balance
   */
  async getUSDCBalance() {
    const balance = await this.publicClient.readContract({
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [this.account.address],
    });
    
    return {
      wei: balance,
      formatted: (balance / 10n ** 6n).toString(),
    };
  }
}

// Example usage
async function main() {
  console.log('🚀 Tachi Crawler Example');
  console.log('━'.repeat(50));
  
  const crawler = new TachiCrawler(CONFIG);
  
  try {
    // Check initial balance
    const balance = await crawler.getUSDCBalance();
    console.log(`💰 Crawler USDC balance: ${balance.formatted} USDC`);
    
    // Attempt to crawl content
    const content = await crawler.crawlContent(CONFIG.targetUrl);
    
    console.log('\n📄 Content received:');
    console.log(content.substring(0, 200) + '...');
    
    // Check final balance
    const finalBalance = await crawler.getUSDCBalance();
    console.log(`💰 Final USDC balance: ${finalBalance.formatted} USDC`);
    
  } catch (error) {
    console.error('❌ Crawler failed:', error.message);
    process.exit(1);
  }
}

// Run example if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default TachiCrawler;
