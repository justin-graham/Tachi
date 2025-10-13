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
}

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

    // TODO: Verify amount and recipient by decoding tx input
    // For MVP, we trust that SDK sent correct amount to correct address
    // In production, decode the PaymentProcessor.payPublisher() call data

    return {
      valid: true,
      crawlerAddress: tx.from,
      amount: env.PRICE_PER_REQUEST
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {valid: false, reason: 'Verification error'};
  }
}

/**
 * Log crawl event to Supabase
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

    // Also log payment
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
  } catch (error) {
    console.error('Failed to log crawl:', error);
    // Don't throw - logging failure shouldn't block content
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
