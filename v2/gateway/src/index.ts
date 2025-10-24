/**
 * Tachi Gateway - Cloudflare Worker
 * Neo-brutalist pay-per-crawl gateway with real content serving
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  BASE_RPC_URL: string;
  CRAWL_NFT_ADDRESS: string;
  PROOF_OF_CRAWL_ADDRESS: string;
  PRICE_PER_REQUEST: string;
  PUBLISHER_ADDRESS: string;
  GATEWAY_PRIVATE_KEY?: string; // Optional: for on-chain logging
  PAYMENT_PROCESSOR_ADDRESS: string;
}

// Rate limiting (in-memory, per worker instance)
const rateLimitStore = new Map<string, {count: number; resetTime: number}>();

// Demo content store - replace with actual CMS/database in production
const CONTENT_STORE: Record<string, {title: string; content: string; type: string}> = {
  '/article/ai-training': {
    title: 'The Future of AI Training Data',
    content:
      'AI models require vast amounts of high-quality training data. This article explores the economics of data sourcing and the emerging market for paid content access. Publishers are increasingly seeking fair compensation for their valuable datasets, while AI companies need reliable, legal access to training materials. The Tachi protocol bridges this gap with micropayments and verifiable on-chain logging...',
    type: 'article'
  },
  '/dataset/financial-news': {
    title: 'Financial News Dataset Q1 2025',
    content: JSON.stringify({
      records: 1250,
      period: '2025-Q1',
      categories: ['markets', 'crypto', 'regulation'],
      format: 'json',
      sample: {
        date: '2025-01-15',
        headline: 'Base L2 reaches 10M daily transactions',
        category: 'crypto',
        sentiment: 0.82
      }
    }),
    type: 'dataset'
  },
  '/api/market-data': {
    title: 'Real-time Market Data API',
    content: JSON.stringify({
      timestamp: new Date().toISOString(),
      markets: [
        {symbol: 'BTC/USD', price: 94250, change: 2.3},
        {symbol: 'ETH/USD', price: 3420, change: 1.8},
        {symbol: 'BASE/USD', price: 1.2, change: 0.5}
      ]
    }),
    type: 'api'
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    // Rate limiting (100 req/min per IP)
    const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
    const rateLimit = checkRateLimit(clientIP, 100, 60000);
    if (!rateLimit.allowed) {
      return jsonResponse({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${rateLimit.retryAfter} seconds.`,
        limit: 100
      }, 429);
    }

    // Get publisher address from query param or use default
    const publisherAddress = url.searchParams.get('publisher') || env.PUBLISHER_ADDRESS;

    // Health check
    if (url.pathname === '/health') {
      return jsonResponse({status: 'ok', service: 'Tachi Gateway', version: '2.0', publisher: publisherAddress});
    }

    // List available content
    if (url.pathname === '/' || url.pathname === '/catalog') {
      return jsonResponse({
        catalog: Object.keys(CONTENT_STORE).map((path) => ({
          path,
          title: CONTENT_STORE[path].title,
          type: CONTENT_STORE[path].type,
          price: env.PRICE_PER_REQUEST
        }))
      });
    }

    // Check publisher domain verification for proxy mode
    const targetUrl = url.searchParams.get('target');
    if (targetUrl) {
      try {
        const domain = new URL(targetUrl).hostname.replace(/^www\./, '');
        const verifyRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/publishers?wallet_address=eq.${publisherAddress}&domain=eq.${domain}&select=domain_verified`,
          {headers: {apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}`}}
        );
        const publishers = await verifyRes.json();
        if (!publishers?.[0]?.domain_verified) {
          return jsonResponse({error: 'Domain not verified', message: 'Add TXT record: tachi-verify=' + publisherAddress.toLowerCase()}, 403);
        }
      } catch (e) {
        return jsonResponse({error: 'Invalid target URL'}, 400);
      }
    }

    // Check for payment proof
    const authHeader = request.headers.get('authorization');
    const paymentTxHash = authHeader?.replace('Bearer ', '');

    if (!paymentTxHash) {
      // No payment - return 402 Payment Required
      return paymentRequiredResponse(env, url.pathname, publisherAddress);
    }

    // Verify payment transaction
    try {
      const verification = await verifyPayment(paymentTxHash, env);

      if (!verification.valid) {
        return jsonResponse(
          {
            error: 'Payment verification failed',
            message: verification.reason || 'Invalid or expired payment'
          },
          402
        );
      }

      // Log the crawl to Supabase
      await logCrawl({
        txHash: paymentTxHash,
        path: url.pathname,
        publisherAddress,
        crawlerAddress: verification.crawlerAddress,
        amount: verification.amount,
        env
      });

      // Return protected content
      // Check if proxying to external URL
      const targetUrl = url.searchParams.get('target');

      if (targetUrl) {
        // Proxy mode: fetch from publisher's actual site
        try {
          const targetResponse = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'TachiGateway/2.0',
              'X-Tachi-Payment': paymentTxHash,
              'X-Tachi-Publisher': publisherAddress
            }
          });

          const contentType = targetResponse.headers.get('content-type') || 'text/plain';
          const targetContent = await targetResponse.text();

          return new Response(targetContent, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'X-Tachi-Payment': paymentTxHash,
              'X-Tachi-Verified': 'true',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (proxyError: any) {
          return jsonResponse({
            error: 'Failed to fetch target content',
            message: proxyError.message,
            target: targetUrl
          }, 502);
        }
      }

      // Demo mode: serve built-in content
      const content = getContent(url.pathname);

      if (!content) {
        return jsonResponse({error: 'Content not found', path: url.pathname}, 404);
      }

      return jsonResponse({
        success: true,
        payment: {
          txHash: paymentTxHash,
          amount: verification.amount,
          verified: true
        },
        content: {
          title: content.title,
          type: content.type,
          data: content.content
        }
      });
    } catch (error: any) {
      console.error('Gateway error:', error);
      return jsonResponse({error: 'Server error', message: error.message}, 500);
    }
  }
};

/**
 * Verify payment transaction on Base
 */
async function verifyPayment(
  txHash: string,
  env: Env
): Promise<{
  valid: boolean;
  reason?: string;
  crawlerAddress?: string;
  amount?: string;
}> {
  try {
    // Get transaction receipt
    const receiptRes = await fetch(env.BASE_RPC_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1
      })
    });

    const receiptData = await receiptRes.json();
    const receipt = receiptData.result;

    if (!receipt) {
      return {valid: false, reason: 'Transaction not found'};
    }

    if (receipt.status !== '0x1') {
      return {valid: false, reason: 'Transaction failed'};
    }

    // Get transaction details
    const txRes = await fetch(env.BASE_RPC_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 2
      })
    });

    const txData = await txRes.json();
    const tx = txData.result;

    if (!tx) {
      return {valid: false, reason: 'Transaction details not found'};
    }

    // Get block timestamp to check recency
    const blockRes = await fetch(env.BASE_RPC_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [receipt.blockNumber, false],
        id: 3
      })
    });

    const blockData = await blockRes.json();
    const blockTimestamp = parseInt(blockData.result.timestamp, 16);
    const now = Math.floor(Date.now() / 1000);

    // Payment must be within last 5 minutes
    if (now - blockTimestamp > 300) {
      return {valid: false, reason: 'Payment expired (>5 min old)'};
    }

    // Verify transaction is to PaymentProcessor contract
    if (tx.to?.toLowerCase() !== env.PAYMENT_PROCESSOR_ADDRESS.toLowerCase()) {
      return {valid: false, reason: 'Transaction not to PaymentProcessor'};
    }

    // Decode payPublisher(address publisher, uint256 amount) call data
    // Function signature: 0x + first 4 bytes of keccak256("payPublisher(address,uint256)")
    const input = tx.input;
    if (!input || input.length < 138) {
      return {valid: false, reason: 'Invalid transaction input'};
    }

    // Extract and validate function selector (first 4 bytes)
    // keccak256("payPublisher(address,uint256)") = 0xf7260d3e...
    const selector = input.slice(0, 10);
    const expectedSelector = '0xf7260d3e';

    if (selector !== expectedSelector) {
      return {valid: false, reason: 'Invalid function (expected payPublisher)'};
    }

    // Extract parameters (address = bytes 4-36, amount = bytes 36-68)
    const recipientAddress = '0x' + input.slice(34, 74);
    const amountHex = input.slice(74, 138);
    const amountWei = parseInt(amountHex, 16);
    const amountUsdc = (amountWei / 1e6).toFixed(2);

    // Verify minimum payment amount (should match PRICE_PER_REQUEST)
    const expectedAmount = Math.floor(parseFloat(env.PRICE_PER_REQUEST) * 1e6);
    if (amountWei < expectedAmount) {
      return {
        valid: false,
        reason: `Payment too low: ${amountUsdc} USDC (expected ${env.PRICE_PER_REQUEST})`
      };
    }

    return {
      valid: true,
      crawlerAddress: tx.from,
      amount: amountUsdc
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {valid: false, reason: 'Verification error'};
  }
}

/**
 * Log crawl event to Supabase and on-chain
 */
async function logCrawl(params: {
  txHash: string;
  path: string;
  publisherAddress: string;
  crawlerAddress?: string;
  amount?: string;
  env: Env;
}): Promise<void> {
  try {
    // Log to Supabase
    await fetch(`${params.env.SUPABASE_URL}/rest/v1/crawl_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: params.env.SUPABASE_KEY,
        Authorization: `Bearer ${params.env.SUPABASE_KEY}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        tx_hash: params.txHash,
        path: params.path,
        publisher_address: params.publisherAddress,
        crawler_address: params.crawlerAddress,
        timestamp: new Date().toISOString()
      })
    });

    // Also log payment to Supabase
    if (params.amount && params.crawlerAddress) {
      await fetch(`${params.env.SUPABASE_URL}/rest/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: params.env.SUPABASE_KEY,
          Authorization: `Bearer ${params.env.SUPABASE_KEY}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          tx_hash: params.txHash,
          crawler_address: params.crawlerAddress,
          publisher_address: params.publisherAddress,
          amount: params.amount,
          timestamp: new Date().toISOString()
        })
      });
    }

    // Log on-chain to ProofOfCrawl (if gateway key is configured)
    if (params.env.GATEWAY_PRIVATE_KEY && params.crawlerAddress && params.amount) {
      await logOnChain({
        crawlerAddress: params.crawlerAddress,
        publisherAddress: params.publisherAddress,
        amount: params.amount,
        txHash: params.txHash,
        url: params.path,
        env: params.env
      });
    }
  } catch (error) {
    console.error('Failed to log crawl:', error);
    // Don't throw - logging failure shouldn't block content
  }
}

/**
 * Log payment and crawl event on-chain via ProofOfCrawl contract
 */
async function logOnChain(params: {
  crawlerAddress: string;
  publisherAddress: string;
  amount: string;
  txHash: string;
  url: string;
  env: Env;
}): Promise<void> {
  try {
    // Note: This is a simplified implementation
    // In production, you'd use viem or ethers to properly sign and send transactions
    // For now, we'll log the intent and skip actual tx submission in the gateway
    // The ProofOfCrawl contract owner can batch-log events from Supabase data

    console.log('On-chain log requested:', {
      crawler: params.crawlerAddress,
      publisher: params.publisherAddress,
      amount: params.amount,
      txHash: params.txHash,
      url: params.url
    });

    // Future: Implement actual contract call via JSON-RPC
    // This would require building and signing a transaction in the worker
    // For MVP, we rely on Supabase logs and periodic on-chain batching
  } catch (error) {
    console.error('Failed to log on-chain:', error);
  }
}

/**
 * Get content from store
 */
function getContent(path: string): (typeof CONTENT_STORE)[string] | null {
  return CONTENT_STORE[path] || null;
}

/**
 * Return 402 Payment Required response
 */
function paymentRequiredResponse(env: Env, path: string, publisherAddress: string): Response {
  const priceInWei = Math.floor(parseFloat(env.PRICE_PER_REQUEST) * 1e6).toString();

  return new Response(
    JSON.stringify({
      error: 'Payment required',
      message: 'Include payment transaction hash in Authorization header',
      instructions: {
        step1: 'Pay publisher via PaymentProcessor contract',
        step2: 'Include tx hash in Authorization: Bearer <tx_hash>',
        step3: 'Retry request with payment proof'
      },
      payment: {
        recipient: publisherAddress,
        amount: env.PRICE_PER_REQUEST,
        amountWei: priceInWei,
        token: 'USDC',
        chainId: 84532
      },
      content: {
        path,
        available: !!CONTENT_STORE[path]
      }
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Tachi-Price': priceInWei,
        'X-Tachi-Recipient': publisherAddress,
        'X-Tachi-Token': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC Base Sepolia
        'X-Tachi-Chain-Id': '84532',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'X-Tachi-Price,X-Tachi-Recipient,X-Tachi-Token,X-Tachi-Chain-Id'
      }
    }
  );
}

/**
 * Helper: JSON response
 */
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Helper: CORS response
 */
function corsResponse(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Check rate limit for identifier
 */
function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): {allowed: boolean; retryAfter?: number} {
  const now = Date.now();
  let entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, {count: 1, resetTime: now + windowMs});
    return {allowed: true};
  }

  if (entry.count >= maxRequests) {
    return {allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000)};
  }

  entry.count++;
  return {allowed: true};
}
