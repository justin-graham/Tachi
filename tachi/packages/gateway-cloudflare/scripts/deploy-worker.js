#!/usr/bin/env node

/**
 * Automated Cloudflare Worker Deployment Script for Tachi Protocol
 * 
 * This script uses the Cloudflare API to programmatically deploy a Tachi gateway
 * worker with pre-configured settings for publishers.
 * 
 * Usage:
 *   node deploy-worker.js --config publisher-config.json
 *   node deploy-worker.js --interactive
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Cloudflare API client for Worker deployment
 */
class CloudflareDeployment {
  constructor(apiToken, accountId) {
    this.apiToken = apiToken;
    this.accountId = accountId;
    this.baseUrl = 'https://api.cloudflare.com/client/v4';
  }

  /**
   * Make authenticated request to Cloudflare API
   */
  async request(method, endpoint, body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };

    console.log(`${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${data.errors?.[0]?.message || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update a Cloudflare Worker
   */
  async deployWorker(workerName, scriptContent, routes = []) {
    console.log(`\n🚀 Deploying worker: ${workerName}`);

    // Step 1: Create/update the worker script
    const workerEndpoint = `/accounts/${this.accountId}/workers/scripts/${workerName}`;
    
    // Prepare multipart form data for script upload
    const formData = new FormData();
    
    // Add the script content
    const scriptBlob = new Blob([scriptContent], { type: 'application/javascript' });
    formData.append('script', scriptBlob, 'index.js');

    // Add metadata (bindings, etc.)
    const metadata = {
      main_module: 'index.js',
      bindings: [],
      compatibility_date: '2024-01-01',
      compatibility_flags: []
    };
    formData.append('metadata', JSON.stringify(metadata));

    // Upload script using fetch with FormData
    const uploadResponse = await fetch(`${this.baseUrl}${workerEndpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: formData
    });

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(`Worker upload failed: ${uploadData.errors?.[0]?.message || uploadResponse.statusText}`);
    }

    console.log(`✅ Worker script uploaded successfully`);

    // Step 2: Configure routes if provided
    if (routes.length > 0) {
      await this.configureRoutes(workerName, routes);
    }

    return uploadData;
  }

  /**
   * Configure routes for the worker
   */
  async configureRoutes(workerName, routes) {
    console.log(`\n🔗 Configuring routes for ${workerName}`);

    for (const route of routes) {
      try {
        const routeData = {
          pattern: route.pattern,
          script: workerName
        };

        const response = await this.request(
          'POST',
          `/zones/${route.zoneId}/workers/routes`,
          routeData
        );

        console.log(`✅ Route configured: ${route.pattern}`);
      } catch (error) {
        console.error(`❌ Failed to configure route ${route.pattern}: ${error.message}`);
      }
    }
  }

  /**
   * Create KV namespace for the worker
   */
  async createKVNamespace(namespaceName) {
    console.log(`\n📦 Creating KV namespace: ${namespaceName}`);

    try {
      const response = await this.request(
        'POST',
        `/accounts/${this.accountId}/storage/kv/namespaces`,
        { title: namespaceName }
      );

      console.log(`✅ KV namespace created: ${response.result.id}`);
      return response.result.id;
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`ℹ️  KV namespace already exists`);
        // List namespaces to find the ID
        const namespaces = await this.listKVNamespaces();
        const existing = namespaces.find(ns => ns.title === namespaceName);
        return existing?.id;
      }
      throw error;
    }
  }

  /**
   * List existing KV namespaces
   */
  async listKVNamespaces() {
    const response = await this.request('GET', `/accounts/${this.accountId}/storage/kv/namespaces`);
    return response.result;
  }

  /**
   * Set worker environment variables (secrets)
   */
  async setWorkerSecrets(workerName, secrets) {
    console.log(`\n🔐 Setting worker secrets for ${workerName}`);

    // Note: Cloudflare API doesn't directly support setting secrets
    // This would typically be done via Wrangler CLI
    // For now, we'll provide instructions to the user

    console.log(`\n📝 Please set the following secrets using Wrangler CLI:`);
    console.log(`cd packages/gateway-cloudflare`);
    
    for (const [key, value] of Object.entries(secrets)) {
      console.log(`wrangler secret put ${key} --name ${workerName}`);
      console.log(`  # Enter: ${key.includes('PRIVATE_KEY') ? '[REDACTED]' : value}`);
    }

    return secrets;
  }

  /**
   * Get zone information for a domain
   */
  async getZoneInfo(domain) {
    const response = await this.request('GET', `/zones?name=${domain}`);
    return response.result[0];
  }
}

/**
 * Generate the complete worker script with publisher configuration
 */
function generateWorkerScript(config) {
  const {
    publisherAddress,
    crawlTokenId,
    priceUSDC,
    domain,
    // Contract addresses (these would be standard for all publishers)
    paymentProcessorAddress = '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7',
    proofOfCrawlLedgerAddress = '0x1234567890123456789012345678901234567890',
    usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  } = config;

  return `// Auto-generated Tachi Protocol Gateway Worker
// Publisher: ${publisherAddress}
// Domain: ${domain}
// Generated: ${new Date().toISOString()}

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseAbi, 
  decodeEventLog,
  parseUnits,
  Address,
  Hash
} from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Publisher Configuration (auto-generated)
const PUBLISHER_CONFIG = {
  PUBLISHER_ADDRESS: '${publisherAddress}',
  CRAWL_TOKEN_ID: '${crawlTokenId}',
  PRICE_USDC: '${priceUSDC}',
  DOMAIN: '${domain}',
  
  // Standard contract addresses
  PAYMENT_PROCESSOR_ADDRESS: '${paymentProcessorAddress}',
  PROOF_OF_CRAWL_LEDGER_ADDRESS: '${proofOfCrawlLedgerAddress}',
  USDC_ADDRESS: '${usdcAddress}',
};

// Environment variables interface
interface Env {
  // Required: Set via Wrangler secrets
  BASE_RPC_URL: string;
  PRIVATE_KEY: string;
  
  // Optional: KV and rate limiting
  USED_TX_HASHES?: KVNamespace;
  RATE_LIMITER?: RateLimiterNamespace;
  
  // Optional: Monitoring
  SENTRY_DSN?: string;
  ENVIRONMENT?: string;
  BETTER_UPTIME_HEARTBEAT_URL?: string;
}

// AI crawler detection patterns
const AI_CRAWLER_PATTERNS = [
  /GPTBot/i, /BingAI/i, /ChatGPT/i, /Claude/i, /Anthropic/i, /OpenAI/i,
  /Googlebot/i, /Baiduspider/i, /YandexBot/i, /facebookexternalhit/i,
  /LinkedInBot/i, /TwitterBot/i, /WhatsApp/i, /TelegramBot/i, /Slackbot/i,
  /DiscordBot/i, /Applebot/i, /DuckDuckBot/i, /Perplexity/i, /You\\.com/i,
  /AI2Bot/i, /CCBot/i, /Meta-ExternalAgent/i, /Diffbot/i, /SemrushBot/i,
  /AhrefsBot/i, /MJ12bot/i, /DataForSeoBot/i, /BLEXBot/i
];

// USDC Transfer event ABI
const USDC_TRANSFER_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)'
]);

/**
 * Check if the request is from an AI crawler
 */
function isAICrawler(userAgent) {
  return AI_CRAWLER_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * Extract transaction hash from Authorization header
 */
function extractTxHash(authHeader) {
  const match = authHeader.match(/^Bearer\\s+(.+)$/);
  return match ? match[1] : null;
}

/**
 * Create a 402 Payment Required response
 */
function createPaymentRequiredResponse() {
  const priceInSmallestUnits = parseUnits(PUBLISHER_CONFIG.PRICE_USDC, 6).toString();
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'x402-price': priceInSmallestUnits,
    'x402-currency': 'USDC',
    'x402-network': 'Base',
    'x402-recipient': PUBLISHER_CONFIG.PAYMENT_PROCESSOR_ADDRESS,
    'x402-contract': PUBLISHER_CONFIG.USDC_ADDRESS,
    'x402-chain-id': '8453',
    'x402-token-id': PUBLISHER_CONFIG.CRAWL_TOKEN_ID,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  const body = {
    error: 'Payment Required',
    message: \`Please send \${PUBLISHER_CONFIG.PRICE_USDC} USDC to PaymentProcessor on Base network\`,
    payment: {
      amount: PUBLISHER_CONFIG.PRICE_USDC,
      currency: 'USDC',
      network: 'Base',
      chainId: 8453,
      recipient: PUBLISHER_CONFIG.PAYMENT_PROCESSOR_ADDRESS,
      tokenAddress: PUBLISHER_CONFIG.USDC_ADDRESS,
      tokenId: PUBLISHER_CONFIG.CRAWL_TOKEN_ID,
    },
    instructions: [
      '1. Send the specified amount of USDC to the PaymentProcessor contract',
      '2. Wait for transaction confirmation',
      '3. Retry your request with Authorization: Bearer <transaction_hash>',
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 402,
    headers,
  });
}

/**
 * Verify payment by checking the transaction receipt
 */
async function verifyPayment(txHash, env) {
  try {
    // Check for replay attacks
    if (env.USED_TX_HASHES) {
      const lastUsed = await env.USED_TX_HASHES.get(txHash);
      if (lastUsed) {
        const lastUsedTime = parseInt(lastUsed);
        const currentTime = Date.now();
        if (currentTime - lastUsedTime < 3600000) { // 1 hour
          return { isValid: false, error: 'Transaction hash already used recently' };
        }
      }
    }

    // Create public client for Base network
    const publicClient = createPublicClient({
      chain: base,
      transport: http(env.BASE_RPC_URL),
    });

    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash,
    });

    if (!receipt || receipt.status !== 'success') {
      return { isValid: false, error: 'Transaction not found or failed' };
    }

    // Parse logs to find USDC Transfer event
    const requiredAmount = parseUnits(PUBLISHER_CONFIG.PRICE_USDC, 6);
    let validTransfer = false;
    let crawlerAddress;

    // Check for USDC Transfer to PaymentProcessor
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === PUBLISHER_CONFIG.USDC_ADDRESS.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: USDC_TRANSFER_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'Transfer') {
            const { from, to, value } = decoded.args;
            
            if (
              to.toLowerCase() === PUBLISHER_CONFIG.PAYMENT_PROCESSOR_ADDRESS.toLowerCase() &&
              value >= requiredAmount
            ) {
              validTransfer = true;
              crawlerAddress = from;
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }
    }

    if (!validTransfer) {
      return { isValid: false, error: 'No valid USDC transfer found to PaymentProcessor' };
    }

    // Verify PaymentProcessor forwarded payment to publisher
    let publisherPaid = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === PUBLISHER_CONFIG.USDC_ADDRESS.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: USDC_TRANSFER_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'Transfer') {
            const { from, to, value } = decoded.args;
            
            if (
              from.toLowerCase() === PUBLISHER_CONFIG.PAYMENT_PROCESSOR_ADDRESS.toLowerCase() &&
              to.toLowerCase() === PUBLISHER_CONFIG.PUBLISHER_ADDRESS.toLowerCase() &&
              value >= requiredAmount
            ) {
              publisherPaid = true;
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }
    }

    if (!publisherPaid) {
      return { isValid: false, error: 'Payment not forwarded to publisher' };
    }

    // Mark transaction as used
    if (env.USED_TX_HASHES && crawlerAddress) {
      await env.USED_TX_HASHES.put(txHash, Date.now().toString(), {
        expirationTtl: 3600 // 1 hour
      });
    }

    return { isValid: true, crawlerAddress };

  } catch (error) {
    return { 
      isValid: false, 
      error: env?.ENVIRONMENT === 'production' 
        ? 'Payment verification failed' 
        : \`Verification failed: \${error.message}\`
    };
  }
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  return null;
}

/**
 * Main fetch handler
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // Handle CORS preflight
      const corsResponse = handleCORS(request);
      if (corsResponse) return corsResponse;

      // Get request details
      const userAgent = request.headers.get('User-Agent') || '';
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

      // Check if request is from AI crawler
      if (!isAICrawler(userAgent)) {
        // Not an AI crawler - pass through to origin
        const originResponse = await fetch(request);
        const response = new Response(originResponse.body, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers: originResponse.headers,
        });
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }

      console.log(\`AI crawler detected: \${userAgent} from \${clientIP}\`);

      // Check authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return createPaymentRequiredResponse();
      }

      // Extract and verify payment
      const txHash = extractTxHash(authHeader);
      if (!txHash) {
        return new Response(JSON.stringify({
          error: 'Invalid authorization format. Use: Bearer <transaction_hash>'
        }), { status: 400 });
      }

      const verification = await verifyPayment(txHash, env);
      if (!verification.isValid) {
        return new Response(JSON.stringify({
          error: 'Payment verification failed',
          details: verification.error
        }), { status: 402 });
      }

      console.log(\`Payment verified for crawler: \${verification.crawlerAddress}\`);

      // Payment is valid - fetch content from origin
      const originRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      // Remove authorization header when forwarding to origin
      originRequest.headers.delete('Authorization');

      const originResponse = await fetch(originRequest);

      // Add CORS headers to response
      const response = new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers: originResponse.headers,
      });

      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('X-Crawler-Verified', 'true');
      response.headers.set('X-Payment-Hash', txHash);

      return response;
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error'
      }), { status: 500 });
    }
  },
};`;
}

/**
 * Generate wrangler.toml configuration
 */
function generateWranglerConfig(config) {
  const { workerName, domain, kvNamespaceId } = config;

  return `# Auto-generated Wrangler configuration for Tachi Protocol
# Publisher: ${config.publisherAddress}
# Generated: ${new Date().toISOString()}

name = "${workerName}"
main = "src/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# KV namespace for transaction replay protection
[[kv_namespaces]]
binding = "USED_TX_HASHES"
id = "${kvNamespaceId}"
preview_id = "${kvNamespaceId}"

# Routes - configure your domain routing
# Uncomment and modify as needed:
# [[routes]]
# pattern = "${domain}/*"
# zone_name = "${domain}"

# Rate limiting (requires paid Cloudflare plan)
# [[rate_limiting]]
# binding = "RATE_LIMITER"

# Environment variables (set via secrets)
# Set these using: wrangler secret put VARIABLE_NAME
# Required secrets:
# - BASE_RPC_URL
# - PRIVATE_KEY
# 
# Optional secrets:
# - SENTRY_DSN
# - BETTER_UPTIME_HEARTBEAT_URL

[env.production]
name = "${workerName}-production"

[env.staging]
name = "${workerName}-staging"
`;
}

/**
 * Interactive configuration builder
 */
async function interactiveConfig() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  console.log('\n🚀 Tachi Protocol Worker Deployment Setup');
  console.log('==========================================\n');

  try {
    const config = {};

    // Publisher information
    console.log('📋 Publisher Information');
    config.publisherName = await question('Publisher name: ');
    config.publisherAddress = await question('Publisher wallet address (0x...): ');
    config.domain = await question('Domain to protect (e.g., api.example.com): ');
    config.priceUSDC = await question('Price per request in USDC (e.g., 1.50): ');
    config.crawlTokenId = await question('CrawlNFT Token ID: ');

    console.log('\n🔧 Cloudflare Configuration');
    config.apiToken = await question('Cloudflare API Token: ');
    config.accountId = await question('Cloudflare Account ID: ');
    config.workerName = await question(`Worker name [${config.publisherName.toLowerCase().replace(/\\s+/g, '-')}-tachi-gateway]: `) || 
                       `${config.publisherName.toLowerCase().replace(/\\s+/g, '-')}-tachi-gateway`;

    console.log('\n🌐 Network Configuration');
    config.baseRpcUrl = await question('Base network RPC URL: ');
    config.privateKey = await question('Worker private key (for crawl logging): ');

    rl.close();
    return config;
  } catch (error) {
    rl.close();
    throw error;
  }
}

/**
 * Main deployment function
 */
async function deployTachiWorker(config) {
  console.log('\n🚀 Starting Tachi Worker Deployment');
  console.log('====================================');

  const { apiToken, accountId, workerName, domain } = config;

  // Initialize Cloudflare client
  const cf = new CloudflareDeployment(apiToken, accountId);

  try {
    // Step 1: Create KV namespace
    const kvNamespaceId = await cf.createKVNamespace(`${workerName}-tx-hashes`);
    config.kvNamespaceId = kvNamespaceId;

    // Step 2: Generate worker script
    console.log('\n📝 Generating worker script...');
    const workerScript = generateWorkerScript(config);

    // Step 3: Deploy worker
    await cf.deployWorker(workerName, workerScript);

    // Step 4: Configure secrets
    const secrets = {
      BASE_RPC_URL: config.baseRpcUrl,
      PRIVATE_KEY: config.privateKey,
    };
    await cf.setWorkerSecrets(workerName, secrets);

    // Step 5: Generate configuration files
    console.log('\n📁 Generating configuration files...');
    
    const wranglerConfig = generateWranglerConfig(config);
    await fs.writeFile('wrangler.toml', wranglerConfig);
    console.log('✅ wrangler.toml created');

    await fs.writeFile('src/index.js', workerScript);
    console.log('✅ src/index.js created');

    // Step 6: Success summary
    console.log('\n🎉 Deployment Complete!');
    console.log('========================');
    console.log(\`Worker Name: \${workerName}\`);
    console.log(\`Domain: \${domain}\`);
    console.log(\`Price: \${config.priceUSDC} USDC per request\`);
    console.log(\`KV Namespace: \${kvNamespaceId}\`);

    console.log('\n📋 Next Steps:');
    console.log('1. Set the required secrets using Wrangler CLI');
    console.log('2. Configure your domain routing in Cloudflare dashboard');
    console.log('3. Test the worker with a sample request');
    console.log('4. Monitor the worker logs for any issues');

    console.log('\n🔗 Useful URLs:');
    console.log(\`Worker Dashboard: https://dash.cloudflare.com/\${accountId}/workers/services/view/\${workerName}\`);
    console.log(\`KV Dashboard: https://dash.cloudflare.com/\${accountId}/workers/kv/namespaces/\${kvNamespaceId}\`);

    return {
      success: true,
      workerName,
      kvNamespaceId,
      domain,
      deploymentUrl: \`https://\${workerName}.\${accountId}.workers.dev\`
    };

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  try {
    let config;

    if (args.includes('--interactive')) {
      config = await interactiveConfig();
    } else if (args.includes('--config')) {
      const configIndex = args.indexOf('--config');
      const configFile = args[configIndex + 1];
      
      if (!configFile) {
        throw new Error('Please provide a config file path after --config');
      }

      const configContent = await fs.readFile(configFile, 'utf-8');
      config = JSON.parse(configContent);
    } else {
      console.log('Usage:');
      console.log('  node deploy-worker.js --interactive');
      console.log('  node deploy-worker.js --config publisher-config.json');
      console.log('');
      console.log('For help: node deploy-worker.js --help');
      return;
    }

    const result = await deployTachiWorker(config);
    
    if (result.success) {
      console.log('\\n✅ Deployment completed successfully!');
      process.exit(0);
    } else {
      console.log('\\n❌ Deployment failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('\\n💥 Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main();
}

export { CloudflareDeployment, generateWorkerScript, generateWranglerConfig, deployTachiWorker };