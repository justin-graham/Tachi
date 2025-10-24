import {Request, Response, NextFunction} from 'express';
import {AuthRequest} from './auth.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(maxRequests: number = 60, windowMs: number = 60000) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Use API key if authenticated, otherwise use IP address
    const identifier = req.user?.id || req.ip || 'unknown';
    const now = Date.now();

    let entry = rateLimitStore.get(identifier);

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(identifier, entry);
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
        limit: maxRequests,
        retryAfter
      });
    }

    entry.count++;
    return next();
  };
}
