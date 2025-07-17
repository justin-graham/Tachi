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

// Environment variables interface for type safety
interface Env {
  BASE_RPC_URL: string;
  PAYMENT_PROCESSOR_ADDRESS: string;
  PROOF_OF_CRAWL_LEDGER_ADDRESS: string;
  USDC_ADDRESS: string;
  PRIVATE_KEY: string;
  CRAWL_TOKEN_ID: string;
  PRICE_USDC: string; // Price in USDC (e.g., "1.0")
  PUBLISHER_ADDRESS: string;
}

// Known AI crawler user agents
const AI_CRAWLER_PATTERNS = [
  /GPTBot/i,
  /BingAI/i,
  /ChatGPT/i,
  /Claude/i,
  /Anthropic/i,
  /OpenAI/i,
  /Googlebot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /facebookexternalhit/i,
  /LinkedInBot/i,
  /TwitterBot/i,
  /WhatsApp/i,
  /TelegramBot/i,
  /Slackbot/i,
  /DiscordBot/i,
  /Applebot/i,
  /DuckDuckBot/i,
  /Perplexity/i,
  /You\.com/i,
  /Anthropic/i,
  /AI2Bot/i,
  /CCBot/i,
  /Meta-ExternalAgent/i,
  /Diffbot/i,
  /SemrushBot/i,
  /AhrefsBot/i,
  /MJ12bot/i,
  /DataForSeoBot/i,
  /BLEXBot/i,
];

// USDC Transfer event ABI
const USDC_TRANSFER_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)'
]);

// ProofOfCrawlLedger contract ABI (minimal for logCrawl)
const PROOF_OF_CRAWL_LEDGER_ABI = parseAbi([
  'function logCrawl(uint256 crawlTokenId, address crawlerAddress) external',
  'event CrawlLogged(uint256 indexed logId, uint256 indexed crawlTokenId, address indexed crawlerAddress, uint256 timestamp)'
]);

// PaymentProcessor event ABI for verification (currently unused but kept for future use)
// const PAYMENT_PROCESSOR_ABI = parseAbi([
//   'event Payment(address indexed crawler, address indexed publisher, uint256 amount)'
// ]);

/**
 * Checks if the request is from an AI crawler
 */
function isAICrawler(userAgent: string): boolean {
  return AI_CRAWLER_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * Extracts transaction hash from Authorization header
 */
function extractTxHash(authHeader: string): string | null {
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  return match ? match[1] : null;
}

/**
 * Creates a 402 Payment Required response
 */
function createPaymentRequiredResponse(env: Env): Response {
  const priceInSmallestUnits = parseUnits(env.PRICE_USDC, 6).toString(); // USDC has 6 decimals
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'x402-price': priceInSmallestUnits,
    'x402-currency': 'USDC',
    'x402-network': 'Base',
    'x402-recipient': env.PAYMENT_PROCESSOR_ADDRESS,
    'x402-contract': env.USDC_ADDRESS,
    'x402-chain-id': '8453',
    'x402-token-id': env.CRAWL_TOKEN_ID,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  const body = {
    error: 'Payment Required',
    message: `Please send ${env.PRICE_USDC} USDC to PaymentProcessor on Base network`,
    payment: {
      amount: env.PRICE_USDC,
      currency: 'USDC',
      network: 'Base',
      chainId: 8453,
      recipient: env.PAYMENT_PROCESSOR_ADDRESS,
      tokenAddress: env.USDC_ADDRESS,
      tokenId: env.CRAWL_TOKEN_ID,
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
 * Verifies payment by checking the transaction receipt
 */
async function verifyPayment(
  txHash: string,
  env: Env
): Promise<{ isValid: boolean; crawlerAddress?: string; error?: string }> {
  try {
    // Create public client for Base network
    const publicClient = createPublicClient({
      chain: base,
      transport: http(env.BASE_RPC_URL),
    });

    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as Hash,
    });

    if (!receipt) {
      return { isValid: false, error: 'Transaction not found' };
    }

    if (receipt.status !== 'success') {
      return { isValid: false, error: 'Transaction failed' };
    }

    // Parse logs to find USDC Transfer event
    const requiredAmount = parseUnits(env.PRICE_USDC, 6);
    let validTransfer = false;
    let crawlerAddress: string | undefined;

    // Check for USDC Transfer to PaymentProcessor
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === env.USDC_ADDRESS.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: USDC_TRANSFER_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'Transfer') {
            const { from, to, value } = decoded.args;
            
            // Check if transfer is to PaymentProcessor with sufficient amount
            if (
              to.toLowerCase() === env.PAYMENT_PROCESSOR_ADDRESS.toLowerCase() &&
              value >= requiredAmount
            ) {
              validTransfer = true;
              crawlerAddress = from;
              break;
            }
          }
        } catch (error) {
          // Skip logs that can't be decoded
          continue;
        }
      }
    }

    if (!validTransfer) {
      return { 
        isValid: false, 
        error: 'No valid USDC transfer found to PaymentProcessor' 
      };
    }

    // Optional: Verify PaymentProcessor forwarded payment to publisher
    // This adds extra security by ensuring the publisher actually received payment
    let publisherPaid = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === env.USDC_ADDRESS.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: USDC_TRANSFER_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'Transfer') {
            const { from, to, value } = decoded.args;
            
            // Check if PaymentProcessor forwarded to publisher
            if (
              from.toLowerCase() === env.PAYMENT_PROCESSOR_ADDRESS.toLowerCase() &&
              to.toLowerCase() === env.PUBLISHER_ADDRESS.toLowerCase() &&
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
      return {
        isValid: false,
        error: 'Payment not forwarded to publisher'
      };
    }

    return { isValid: true, crawlerAddress };

  } catch (error) {
    console.error('Payment verification error:', error);
    return { 
      isValid: false, 
      error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Asynchronously logs the crawl on-chain
 */
async function logCrawlOnChain(
  crawlTokenId: string,
  crawlerAddress: string,
  env: Env
): Promise<void> {
  try {
    // Create wallet client
    const account = privateKeyToAccount(env.PRIVATE_KEY as Hash);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(env.BASE_RPC_URL),
    });

    // Send transaction to log crawl
    const hash = await walletClient.writeContract({
      address: env.PROOF_OF_CRAWL_LEDGER_ADDRESS as Address,
      abi: PROOF_OF_CRAWL_LEDGER_ABI,
      functionName: 'logCrawl',
      args: [BigInt(crawlTokenId), crawlerAddress as Address],
    });

    console.log(`Crawl logged on-chain: ${hash}`);
  } catch (error) {
    console.error('Failed to log crawl on-chain:', error);
    // Don't throw - this is fire-and-forget
  }
}

/**
 * Handles CORS preflight requests
 */
function handleCORS(request: Request): Response | null {
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
 * Main fetch handler for the Cloudflare Worker
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;

    const userAgent = request.headers.get('User-Agent') || '';
    const authorization = request.headers.get('Authorization');
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Check if request is from AI crawler
    if (!isAICrawler(userAgent)) {
      // Not an AI crawler - pass through to origin
      return fetch(request);
    }

    console.log(`AI crawler detected: ${userAgent} from ${clientIP}`);

    // Check if authorization header is present
    if (!authorization) {
      // No payment proof - return 402 Payment Required
      return createPaymentRequiredResponse(env);
    }

    // Extract transaction hash from Authorization header
    const txHash = extractTxHash(authorization);
    if (!txHash) {
      return new Response('Invalid authorization format. Use: Bearer <transaction_hash>', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Verify payment
    const verification = await verifyPayment(txHash, env);
    if (!verification.isValid) {
      return new Response(
        JSON.stringify({
          error: 'Payment verification failed',
          message: verification.error,
          txHash,
        }),
        {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log(`Payment verified for crawler: ${verification.crawlerAddress}`);

    // Payment is valid - fetch content from origin
    const originRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    // Remove authorization header when forwarding to origin
    originRequest.headers.delete('Authorization');

    const originResponse = await fetch(originRequest);

    // Asynchronously log the crawl on-chain (fire-and-forget)
    if (verification.crawlerAddress) {
      ctx.waitUntil(
        logCrawlOnChain(
          env.CRAWL_TOKEN_ID,
          verification.crawlerAddress,
          env
        )
      );
    }

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
  },
} satisfies ExportedHandler<Env>;
