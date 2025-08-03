import { NextRequest, NextResponse } from 'next/server'
import { logRateLimit, logSuspiciousRequest, securityMonitor } from '@/lib/security-monitor'

// Security headers for all routes
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.walletconnect.org *.walletconnect.com *.alchemy.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: https: *.walletconnect.org",
      "connect-src 'self' wss: https: *.alchemy.com *.infura.io *.walletconnect.org *.walletconnect.com wss://relay.walletconnect.org wss://relay.walletconnect.com",
      "frame-src 'self' *.walletconnect.org *.walletconnect.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }
]

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or user agent as fallback
  const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown'
  return ip
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

function isRateLimited(key: string, limit: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  record.count++
  
  if (record.count > limit) {
    return true
  }
  
  return false
}

function detectSuspiciousRequest(request: NextRequest): { suspicious: boolean; reason?: string } {
  const userAgent = getUserAgent(request)
  const path = request.nextUrl.pathname
  
  // Check for common attack patterns
  const suspiciousPatterns = [
    /\.\.\//,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // Javascript injection
    /'.*or.*1.*=/i,  // SQL injection
    /exec\(/i,  // Code execution
    /eval\(/i,  // Code evaluation
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(path) || pattern.test(userAgent)) {
      return { suspicious: true, reason: `Suspicious pattern detected: ${pattern.source}` }
    }
  }
  
  // Check for unusual user agents
  if (userAgent.length > 1000) {
    return { suspicious: true, reason: 'User agent too long' }
  }
  
  // Check for automated scanning
  const scannerPatterns = [
    /nikto/i,
    /sqlmap/i,
    /nmap/i,
    /masscan/i,
    /burp/i,
    /acunetix/i,
    /nessus/i
  ]
  
  for (const pattern of scannerPatterns) {
    if (pattern.test(userAgent)) {
      return { suspicious: true, reason: 'Scanner detected' }
    }
  }
  
  return { suspicious: false }
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const ip = getRateLimitKey(request)
  const userAgent = getUserAgent(request)
  const path = request.nextUrl.pathname
  
  // Apply security headers
  securityHeaders.forEach(({ key, value }) => {
    response.headers.set(key, value)
  })
  
  // Check for suspicious requests
  const suspiciousCheck = detectSuspiciousRequest(request)
  if (suspiciousCheck.suspicious) {
    logSuspiciousRequest(ip, userAgent, path, suspiciousCheck.reason!)
    
    // Block obviously malicious requests
    if (suspiciousCheck.reason?.includes('Scanner detected') || 
        suspiciousCheck.reason?.includes('SQL injection') ||
        suspiciousCheck.reason?.includes('XSS')) {
      return new NextResponse(
        JSON.stringify({ error: 'Request blocked' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(securityHeaders.map(h => [h.key, h.value]))
          }
        }
      )
    }
  }
  
  // Check if IP has suspicious activity
  const activityCheck = securityMonitor.checkSuspiciousActivity(ip)
  if (activityCheck.isSuspicious) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many security violations. Please try again later.',
        reason: activityCheck.reason
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '3600', // 1 hour
          ...Object.fromEntries(securityHeaders.map(h => [h.key, h.value]))
        }
      }
    )
  }
  
  // Rate limiting
  let limit = 100 // Default: 100 requests per 15 minutes
  let windowMs = 15 * 60 * 1000 // 15 minutes
  
  if (request.nextUrl.pathname.startsWith('/api/')) {
    limit = 50 // API endpoints: 50 requests per 15 minutes
  } else if (request.nextUrl.pathname.includes('onboard') || request.nextUrl.pathname.includes('deploy')) {
    limit = 20 // Onboarding/deployment: 20 requests per 15 minutes
  }
  
  if (isRateLimited(ip, limit, windowMs)) {
    logRateLimit(ip, path, limit)
    
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '900', // 15 minutes
          ...Object.fromEntries(securityHeaders.map(h => [h.key, h.value]))
        }
      }
    )
  }
  
  // Add rate limit headers
  const record = rateLimitStore.get(ip)
  if (record) {
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, limit - record.count).toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString())
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
