// Cloudflare Workers Rate Limiter Types
// https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

interface RateLimitResult {
  success: boolean;
  count?: number;
  error?: string;
}

interface RateLimiterNamespace {
  limit(options: { key: string }): Promise<RateLimitResult>;
}

// Export for global use
declare global {
  interface RateLimiterNamespace {
    limit(options: { key: string }): Promise<RateLimitResult>;
  }
}

export {};
