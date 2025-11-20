/**
 * @tachiprotocol/core - x402 payment verification engine
 * Minimal, dependency-free implementation of x402 payment protocol
 */

// ============================================================================
// Types
// ============================================================================

export interface X402Config {
  apiKey: string;
  wallet: string;
  price: string | ((request: Request) => string);
  facilitatorUrl?: string;
  tachiApiUrl?: string;
}

interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  asset: string;
  payTo: string;
  timeout: number;
}

interface PaymentPayload {
  x402Version: string;
  scheme: string;
  network: string;
  txHash?: string;
  amount?: string;
  from?: string;
  [key: string]: any;
}

// ============================================================================
// Constants
// ============================================================================

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC
const COINBASE_FACILITATOR = 'https://api.coinbase.com/x402';
const TACHI_API = 'https://api.tachi.ai';

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Handles x402 payment flow for a request
 * Returns 402 Response if payment required/invalid
 * Returns null if payment valid (caller should continue to content)
 */
export async function handleX402Request(
  request: Request,
  config: X402Config
): Promise<Response | null> {
  // Check for payment header
  const payment = parsePaymentHeader(request);

  if (!payment) {
    // No payment provided - return 402
    return create402Response(request, config);
  }

  // Verify payment via facilitator
  const valid = await verifyPayment(payment, request, config);

  if (valid) {
    // Log to Tachi API for analytics (don't await - fire and forget)
    logPayment(payment, request, config).catch(() => {});

    // Payment valid - continue to content
    return null;
  }

  // Invalid payment - return 402 again
  return create402Response(request, config);
}

// ============================================================================
// 402 Response Creation
// ============================================================================

function create402Response(request: Request, config: X402Config): Response {
  const price = typeof config.price === 'function'
    ? config.price(request)
    : config.price;

  const priceInUsdc = parsePrice(price);

  const paymentRequirement: PaymentRequirement = {
    scheme: 'erc20',
    network: 'base',
    maxAmountRequired: priceInUsdc,
    resource: request.url,
    description: 'Payment required for content access',
    asset: USDC_ADDRESS,
    payTo: config.wallet,
    timeout: 300
  };

  const body = {
    x402Version: '1',
    paymentRequirements: [paymentRequirement]
  };

  return new Response(JSON.stringify(body), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Required': 'x402'
    }
  });
}

// ============================================================================
// Payment Verification
// ============================================================================

async function verifyPayment(
  payment: PaymentPayload,
  request: Request,
  config: X402Config
): Promise<boolean> {
  try {
    const facilitatorUrl = config.facilitatorUrl || COINBASE_FACILITATOR;

    const price = typeof config.price === 'function'
      ? config.price(request)
      : config.price;

    const priceInUsdc = parsePrice(price);

    const paymentRequirement: PaymentRequirement = {
      scheme: 'erc20',
      network: 'base',
      maxAmountRequired: priceInUsdc,
      resource: request.url,
      asset: USDC_ADDRESS,
      payTo: config.wallet,
      timeout: 300
    };

    const response = await fetch(`${facilitatorUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentPayload: payment,
        paymentRequirements: {
          x402Version: '1',
          paymentRequirements: [paymentRequirement]
        }
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
}

// ============================================================================
// Payment Logging
// ============================================================================

async function logPayment(
  payment: PaymentPayload,
  request: Request,
  config: X402Config
): Promise<void> {
  try {
    const apiUrl = config.tachiApiUrl || TACHI_API;
    const url = new URL(request.url);

    await fetch(`${apiUrl}/v1/payments/middleware-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: config.apiKey,
        txHash: payment.txHash || 'unknown',
        amount: payment.amount || '0',
        crawler: payment.from || 'unknown',
        path: url.pathname
      })
    });
  } catch (error) {
    // Silently fail - logging shouldn't block content delivery
    console.error('Payment logging failed:', error);
  }
}

// ============================================================================
// Utilities
// ============================================================================

function parsePaymentHeader(request: Request): PaymentPayload | null {
  try {
    const header = request.headers.get('X-PAYMENT');
    if (!header) return null;

    // x402 spec: payment payload is base64-encoded JSON
    const decoded = atob(header);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse payment header:', error);
    return null;
  }
}

function parsePrice(priceStr: string): string {
  try {
    // Support formats: "$0.01", "0.01", "10000" (raw USDC)
    let dollars: number;

    if (priceStr.startsWith('$')) {
      dollars = parseFloat(priceStr.substring(1));
    } else if (priceStr.includes('.')) {
      dollars = parseFloat(priceStr);
    } else {
      // Already in USDC format (6 decimals)
      return priceStr;
    }

    // Convert to USDC (6 decimals)
    return Math.floor(dollars * 1_000_000).toString();
  } catch (error) {
    console.error('Failed to parse price:', error);
    return '10000'; // Default to $0.01
  }
}

// ============================================================================
// Exports
// ============================================================================

export { USDC_ADDRESS, COINBASE_FACILITATOR, TACHI_API };
