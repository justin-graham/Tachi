import { NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security monitoring functions
export function logRateLimit(ip: string, path: string, limit?: number) {
  console.log(`[RATE_LIMIT] ${ip} - ${path} (limit: ${limit || 'default'})`)
}

export function logSuspiciousRequest(ip: string, userAgent: string, path: string, reason: string) {
  console.log(`[SECURITY] Suspicious request from ${ip}: ${reason} - ${path} (UA: ${userAgent})`)
}

export interface SecurityMonitorOptions {
  rateLimit?: {
    requests: number
    window: number // in milliseconds
  }
  blockSuspiciousIPs?: boolean
  logAllRequests?: boolean
}

export function securityMonitor(req: NextRequest, options: SecurityMonitorOptions = {}) {
  const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  
  // Default rate limiting: 100 requests per minute
  const { requests = 100, window = 60000 } = options.rateLimit || {}
  
  // Get or create rate limit entry
  const key = clientIp
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + window })
    return { allowed: true, remaining: requests - 1 }
  }
  
  current.count++
  
  if (current.count > requests) {
    logRateLimit(clientIp, req.nextUrl.pathname)
    return { allowed: false, remaining: 0 }
  }
  
  return { allowed: true, remaining: requests - current.count }
}

export function checkSuspiciousActivity(ip: string) {
  // Simple suspicious activity detection
  const entry = rateLimitStore.get(ip)
  
  if (!entry) {
    return { isSuspicious: false }
  }
  
  // Consider suspicious if more than 200 requests in the window
  if (entry.count > 200) {
    return { 
      isSuspicious: true, 
      reason: 'Excessive request rate detected' 
    }
  }
  
  return { isSuspicious: false }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute
