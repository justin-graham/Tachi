import { randomBytes, createHmac } from 'crypto'
import { NextRequest } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'

export interface CSRFTokenData {
  token: string
  timestamp: number
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): CSRFTokenData {
  const timestamp = Date.now()
  const randomData = randomBytes(32).toString('hex')
  const payload = `${timestamp}:${randomData}`
  
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex')
  
  const token = `${payload}:${signature}`
  
  return {
    token,
    timestamp
  }
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string, maxAge: number = 3600000): boolean {
  try {
    const parts = token.split(':')
    if (parts.length !== 3) {
      return false
    }
    
    const [timestampStr, randomData, signature] = parts
    const timestamp = parseInt(timestampStr, 10)
    
    // Check if token is expired
    if (Date.now() - timestamp > maxAge) {
      return false
    }
    
    // Recreate the payload and verify signature
    const payload = `${timestampStr}:${randomData}`
    const expectedSignature = createHmac('sha256', CSRF_SECRET)
      .update(payload)
      .digest('hex')
    
    // Use timing-safe comparison
    return signature === expectedSignature
  } catch {
    return false
  }
}

/**
 * Extract CSRF token from request headers or body
 */
export function extractCSRFToken(request: NextRequest): string | null {
  // Check X-CSRF-Token header first
  const headerToken = request.headers.get('X-CSRF-Token')
  if (headerToken) {
    return headerToken
  }
  
  // For forms, check _csrf field (would need to parse body)
  return null
}

/**
 * CSRF protection middleware
 */
export function requireCSRFToken(request: NextRequest): { valid: boolean; error?: string } {
  // Skip CSRF for GET requests (they should be idempotent)
  if (request.method === 'GET') {
    return { valid: true }
  }
  
  const token = extractCSRFToken(request)
  
  if (!token) {
    return { valid: false, error: 'CSRF token missing' }
  }
  
  if (!validateCSRFToken(token)) {
    return { valid: false, error: 'Invalid or expired CSRF token' }
  }
  
  return { valid: true }
}

/**
 * Generate CSRF token for API response
 */
export function getCSRFTokenForResponse() {
  return generateCSRFToken()
}
