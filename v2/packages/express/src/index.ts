/**
 * @tachiprotocol/express - Express middleware adapter for x402 payments
 * Thin wrapper around @tachiprotocol/core for Express apps
 */

import { handleX402Request, X402Config } from '@tachiprotocol/core';
import { Request, Response, NextFunction } from 'express';

/**
 * Creates Express middleware that handles x402 payment flow
 *
 * @example
 * ```javascript
 * const express = require('express');
 * const { tachiX402 } = require('@tachiprotocol/express');
 *
 * const app = express();
 *
 * app.use('/api/*', tachiX402({
 *   apiKey: process.env.TACHI_API_KEY,
 *   wallet: process.env.TACHI_WALLET,
 *   price: '$0.05'
 * }));
 *
 * app.listen(3000);
 * ```
 */
export function tachiX402(config: X402Config) {
  return async function middleware(req: Request, res: Response, next: NextFunction) {
    try {
      // Convert Express Request to Web Request
      const webRequest = toWebRequest(req);

      // Handle x402 flow
      const result = await handleX402Request(webRequest, config);

      if (result) {
        // Payment required or invalid - return 402 response
        res.status(result.status);

        // Set headers
        result.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });

        // Send body
        const body = await result.text();
        return res.send(body);
      }

      // Payment valid - continue to route handler
      next();
    } catch (error) {
      console.error('Tachi x402 middleware error:', error);
      // On error, continue anyway (fail open)
      next();
    }
  };
}

/**
 * Convert Express Request to Web API Request
 */
function toWebRequest(req: Request): Request {
  const protocol = req.protocol || 'https';
  const host = req.get('host') || 'localhost';
  const url = `${protocol}://${host}${req.originalUrl || req.url}`;

  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      headers.set(key, Array.isArray(value) ? value[0] : value);
    }
  });

  return new Request(url, {
    method: req.method,
    headers
  });
}

/**
 * Advanced middleware with dynamic pricing based on request
 *
 * @example
 * ```javascript
 * app.use(tachiX402({
 *   apiKey: process.env.TACHI_API_KEY,
 *   wallet: process.env.TACHI_WALLET,
 *   price: (req) => {
 *     if (req.url.includes('/premium/')) return '$0.05';
 *     if (req.url.includes('/api/')) return '$0.02';
 *     return '$0.01';
 *   }
 * }));
 * ```
 */
export type { X402Config } from '@tachiprotocol/core';
