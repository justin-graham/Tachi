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
  // KV namespace for storing used transaction hashes
  USED_TX_HASHES?: KVNamespace;
  // Security configuration
  RATE_LIMIT_REQUESTS?: string; // requests per minute
  MAX_REQUEST_SIZE?: string; // max request size in bytes
  ENABLE_LOGGING?: string; // enable security logging
}

// Input validation and sanitization
interface SanitizedHeaders {
  userAgent: string;
  authorization: string;
  origin?: string;
  referer?: string;
}

// Rate limiting store (using KV in production)
const RATE_LIMIT_PREFIX = 'rate_limit:';
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Security configuration
const MAX_HEADER_LENGTH = 500;
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
const DEFAULT_RATE_LIMIT = 100; // requests per minute

/**
 * Sanitize and validate input strings
 */
function sanitizeString(input: string, maxLength: number = MAX_HEADER_LENGTH): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .slice(0, maxLength)
    .replace(/[<>\"'&\x00-\x1f\x7f-\x9f]/g, '') // Remove control chars and dangerous characters
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

/**
 * Validate and sanitize request headers
 */
function sanitizeHeaders(request: Request): SanitizedHeaders {
  const userAgent = sanitizeString(request.headers.get('User-Agent') || '', 500);
  const authorization = sanitizeString(request.headers.get('Authorization') || '', 200);
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  
  return {
    userAgent,
    authorization,
    origin: origin ? sanitizeString(origin, 255) : undefined,
    referer: referer ? sanitizeString(referer, 500) : undefined
  };
}

/**
 * Check request size limits
 */
function validateRequestSize(request: Request, maxSize: number = MAX_REQUEST_SIZE): boolean {
  const contentLength = request.headers.get('Content-Length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    return size <= maxSize;
  }
  return true; // If no content-length header, assume it's valid
}

/**
 * Rate limiting using KV storage
 */
async function checkRateLimit(
  request: Request, 
  env: Env, 
  limit: number = DEFAULT_RATE_LIMIT
): Promise<{ allowed: boolean; remaining: number }> {
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `${RATE_LIMIT_PREFIX}${clientIP}`;
  
  if (!env.USED_TX_HASHES) {
    // Fallback: allow if KV not available
    return { allowed: true, remaining: limit };
  }
  
  try {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Get current count
    const currentData = await env.USED_TX_HASHES.get(key);
    let requests: number[] = currentData ? JSON.parse(currentData) : [];
    
    // Filter out old requests
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= limit) {
      return { allowed: false, remaining: 0 };
    }
    
    // Add current request
    requests.push(now);
    
    // Store updated data
    await env.USED_TX_HASHES.put(key, JSON.stringify(requests), {
      expirationTtl: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
    
    return { allowed: true, remaining: limit - requests.length };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open: allow request if rate limiting fails
    return { allowed: true, remaining: limit };
  }
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  type: 'payment' | 'auth' | 'validation' | 'rate_limit' | 'size_limit',
  status: number = 400,
  details?: string
): Response {
  const errors = {
    payment: 'Payment verification failed',
    auth: 'Authentication required',
    validation: 'Invalid request format',
    rate_limit: 'Rate limit exceeded',
    size_limit: 'Request too large'
  };
  
  const message = errors[type];
  
  // In production, avoid exposing detailed error information
  const body = process.env.NODE_ENV === 'production' 
    ? { error: message }
    : { error: message, details };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
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
 * Includes replay attack protection
 */
async function verifyPayment(
  txHash: string,
  env: Env
): Promise<{ isValid: boolean; crawlerAddress?: string; error?: string }> {
  try {
    // ✅ SECURITY: Check for transaction hash replay
    if (env.USED_TX_HASHES) {
      const lastUsed = await env.USED_TX_HASHES.get(txHash);
      if (lastUsed) {
        const lastUsedTime = parseInt(lastUsed);
        const currentTime = Date.now();
        // Prevent reuse within 1 hour
        if (currentTime - lastUsedTime < 3600000) {
          return { 
            isValid: false, 
            error: 'Transaction hash already used recently' 
          };
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

    // ✅ SECURITY: Mark transaction hash as used to prevent replay
    if (env.USED_TX_HASHES && crawlerAddress) {
      await env.USED_TX_HASHES.put(txHash, Date.now().toString(), {
        expirationTtl: 3600 // Expire after 1 hour
      });
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
    try {
      // Validate request size
      const maxSize = env.MAX_REQUEST_SIZE ? parseInt(env.MAX_REQUEST_SIZE) : MAX_REQUEST_SIZE;
      if (!validateRequestSize(request, maxSize)) {
        return createErrorResponse('size_limit', 413);
      }
      
      // Rate limiting
      const rateLimit = env.RATE_LIMIT_REQUESTS ? parseInt(env.RATE_LIMIT_REQUESTS) : DEFAULT_RATE_LIMIT;
      const rateLimitCheck = await checkRateLimit(request, env, rateLimit);
      
      if (!rateLimitCheck.allowed) {
        const response = createErrorResponse('rate_limit', 429);
        response.headers.set('Retry-After', '60');
        response.headers.set('X-RateLimit-Limit', rateLimit.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        return response;
      }
      
      // Handle CORS preflight
      const corsResponse = handleCORS(request);
      if (corsResponse) return corsResponse;

      // Sanitize and validate headers
      const headers = sanitizeHeaders(request);
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

      // Security logging
      if (env.ENABLE_LOGGING === 'true') {
        console.log(`Request from ${clientIP}: ${headers.userAgent}`);
      }

      // Check if request is from AI crawler
      if (!isAICrawler(headers.userAgent)) {
        // Not an AI crawler - pass through to origin
        return fetch(request);
      }

      console.log(`AI crawler detected: ${headers.userAgent} from ${clientIP}`);

      // Check if authorization header is present
      if (!headers.authorization) {
        // No payment proof - return 402 Payment Required
        return createPaymentRequiredResponse(env);
      }

      // Extract transaction hash from Authorization header
      const txHash = extractTxHash(headers.authorization);
      if (!txHash) {
        return createErrorResponse('validation', 400, 'Invalid authorization format. Use: Bearer <transaction_hash>');
      }

      // Verify payment
      const verification = await verifyPayment(txHash, env);
      if (!verification.isValid) {
        return createErrorResponse('payment', 402, verification.error);
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

      // Add security headers and CORS to response
      const response = new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers: originResponse.headers,
      });

      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('X-Crawler-Verified', 'true');
      response.headers.set('X-Payment-Hash', txHash);
      response.headers.set('X-RateLimit-Limit', rateLimit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitCheck.remaining.toString());

      return response;
      
    } catch (error) {
      console.error('Worker error:', error);
      return createErrorResponse('validation', 500, 'Internal server error');
    }
  },
} satisfies ExportedHandler<Env>;
