// Domain validation utilities

export function validateDomainFormat(domain: string): boolean {
  // Basic domain format check
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
  if (!domainRegex.test(domain)) return false
  
  // Additional checks
  if (domain.startsWith('-') || domain.endsWith('-')) return false
  if (domain.includes('..')) return false
  if (domain.length > 253) return false
  
  return true
}

export function sanitizeDomain(domain: string): string {
  // Remove protocol, www, and trailing slashes
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim()
}

export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return sanitizeDomain(url)
  }
}

// Check if domain is production-ready (not localhost, test domains, etc.)
export function isProductionDomain(domain: string): boolean {
  const testDomains = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'example.com',
    'test.com',
    'demo.com'
  ]
  
  const lowerDomain = domain.toLowerCase()
  
  // Check against known test domains
  if (testDomains.some(testDomain => lowerDomain.includes(testDomain))) {
    return false
  }
  
  // Check for IP addresses
  if (/^\d+\.\d+\.\d+\.\d+/.test(domain)) {
    return false
  }
  
  // Check for .local domains
  if (domain.endsWith('.local')) {
    return false
  }
  
  return true
}

export const DOMAIN_VALIDATION_MESSAGES = {
  REQUIRED: 'Domain is required',
  INVALID_FORMAT: 'Please enter a valid domain (e.g., example.com, sub.example.org)',
  TOO_LONG: 'Domain is too long (maximum 253 characters)',
  LOCALHOST_NOT_ALLOWED: 'Localhost domains are not allowed for production',
  TEST_DOMAIN: 'Test domains are not recommended for production use'
} as const
