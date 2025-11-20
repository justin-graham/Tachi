/**
 * @tachiprotocol/nextjs - Next.js middleware adapter for x402 payments
 * Thin wrapper around @tachiprotocol/core for Next.js apps
 */

import { handleX402Request, X402Config } from '@tachiprotocol/core';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates Next.js middleware that handles x402 payment flow
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { tachiX402 } from '@tachiprotocol/nextjs';
 *
 * export default tachiX402({
 *   apiKey: process.env.TACHI_API_KEY!,
 *   wallet: process.env.TACHI_WALLET!,
 *   price: '$0.01'
 * });
 *
 * export const config = {
 *   matcher: '/premium/:path*'
 * };
 * ```
 */
export function tachiX402(config: X402Config) {
  return async function middleware(request: NextRequest) {
    // Convert NextRequest to standard Web Request (already compatible)
    const webRequest = request as unknown as Request;

    // Handle x402 flow
    const result = await handleX402Request(webRequest, config);

    if (result) {
      // Payment required or invalid - return 402 response
      return new NextResponse(result.body, {
        status: result.status,
        headers: result.headers
      });
    }

    // Payment valid - continue to page
    return NextResponse.next();
  };
}

/**
 * Advanced middleware with dynamic pricing based on request
 *
 * @example
 * ```typescript
 * export default tachiX402({
 *   apiKey: process.env.TACHI_API_KEY!,
 *   wallet: process.env.TACHI_WALLET!,
 *   price: (req) => {
 *     if (req.url.includes('/premium/')) return '$0.05';
 *     if (req.url.includes('/api/')) return '$0.02';
 *     return '$0.01';
 *   }
 * });
 * ```
 */
export type { X402Config } from '@tachiprotocol/core';
