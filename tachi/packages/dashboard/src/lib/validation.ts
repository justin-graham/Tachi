import { z } from 'zod'

// Input validation schemas
export const siteDetailsSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .max(255, 'Domain too long')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/, 'Invalid domain format')
    .refine(domain => !domain.includes('..'), 'Domain cannot contain consecutive dots'),
  
  websiteName: z
    .string()
    .min(1, 'Website name is required')
    .max(100, 'Website name too long')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Website name contains invalid characters'),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description too long')
    .regex(/^[a-zA-Z0-9\s\-_.,:;!?()]+$/, 'Description contains invalid characters'),
  
  termsURI: z
    .string()
    .url('Invalid terms URI')
    .max(500, 'Terms URI too long')
    .optional()
    .or(z.literal(''))
})

export const pricingSchema = z.object({
  pricePerCrawl: z
    .number()
    .min(0.01, 'Price must be at least $0.01')
    .max(1000, 'Price cannot exceed $1000')
    .refine(price => Number(price.toFixed(2)) === price, 'Price can only have 2 decimal places'),
  
  priceUnits: z
    .string()
    .refine(units => ['USD', 'USDC'].includes(units), 'Invalid price units')
})

export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')

export const transactionHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format')

// API request validation
export const crawlerRegistrationSchema = z.object({
  name: z
    .string()
    .min(1, 'Crawler name is required')
    .max(100, 'Crawler name too long')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Crawler name contains invalid characters'),
  
  contact: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description too long')
    .regex(/^[a-zA-Z0-9\s\-_.,:;!?()]+$/, 'Description contains invalid characters')
})

// Header validation for Cloudflare Worker
export const headerValidationSchema = z.object({
  userAgent: z
    .string()
    .max(500, 'User-Agent header too long')
    .regex(/^[a-zA-Z0-9\s\-_./:;()+=]+$/, 'User-Agent contains invalid characters'),
  
  authorization: z
    .string()
    .max(200, 'Authorization header too long')
    .regex(/^Bearer\s+0x[a-fA-F0-9]{64}$/, 'Invalid authorization format'),
  
  origin: z
    .string()
    .url('Invalid origin')
    .max(255, 'Origin too long')
    .optional(),
  
  referer: z
    .string()
    .url('Invalid referer')
    .max(500, 'Referer too long')
    .optional()
})

// Utility functions for validation
export function validateSiteDetails(data: unknown) {
  return siteDetailsSchema.safeParse(data)
}

export function validatePricing(data: unknown) {
  return pricingSchema.safeParse(data)
}

export function validateWalletAddress(address: unknown) {
  return walletAddressSchema.safeParse(address)
}

export function validateTransactionHash(hash: unknown) {
  return transactionHashSchema.safeParse(hash)
}

export function validateCrawlerRegistration(data: unknown) {
  return crawlerRegistrationSchema.safeParse(data)
}

export function validateHeaders(headers: unknown) {
  return headerValidationSchema.safeParse(headers)
}

// HTML sanitization
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim()
}

// URL validation and sanitization
export function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol')
    }
    
    return parsedUrl.toString()
  } catch {
    throw new Error('Invalid URL')
  }
}

// Domain validation
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
  return domainRegex.test(domain) && domain.length <= 255
}

export type SiteDetailsInput = z.infer<typeof siteDetailsSchema>
export type PricingInput = z.infer<typeof pricingSchema>
export type CrawlerRegistrationInput = z.infer<typeof crawlerRegistrationSchema>
export type HeaderValidationInput = z.infer<typeof headerValidationSchema>
