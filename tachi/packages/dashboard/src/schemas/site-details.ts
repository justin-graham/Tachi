import { z } from 'zod'

// Custom domain validation function
const validateDomain = (domain: string) => {
  // Basic domain format check
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
  if (!domainRegex.test(domain)) return false
  
  // Additional checks
  if (domain.startsWith('-') || domain.endsWith('-')) return false
  if (domain.includes('..')) return false
  if (domain.length > 253) return false
  
  return true
}

// Site Details Schema with enhanced validation
export const siteDetailsSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .max(253, 'Domain is too long')
    .toLowerCase()
    .refine(validateDomain, {
      message: 'Please enter a valid domain (e.g., example.com, sub.example.org)'
    })
    .refine((domain) => !domain.includes('localhost'), {
      message: 'Localhost domains are not allowed for production'
    }),
  websiteName: z
    .string()
    .min(1, 'Website name is required')
    .max(100, 'Website name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_'".!?]+$/, 'Website name contains invalid characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .refine((desc) => desc.trim().length >= 10, {
      message: 'Description must contain meaningful content'
    }),
  contactEmail: z
    .string()
    .min(1, 'Contact email is required')
    .email('Please enter a valid email address')
    .refine((email) => email.length <= 254, {
      message: 'Email address is too long'
    }),
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_'".&,()]+$/, 'Company name contains invalid characters'),
})

// Terms of Service Schema with acceptance validation
export const termsOfServiceSchema = z.object({
  acceptDefaultTerms: z.boolean(),
  customTerms: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),
  contactEmail: z.string().email('Valid email required'),
  lastUpdated: z.date().default(() => new Date()),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms of service to continue'
  }),
  termsContent: z.string().min(100, 'Terms content must be at least 100 characters'),
})

// Enhanced Combined Schema with cross-field validation
export const siteDetailsAndTermsSchema = z.object({
  siteDetails: siteDetailsSchema,
  terms: termsOfServiceSchema,
}).refine((data) => {
  // Ensure email addresses match between site details and terms
  return data.siteDetails.contactEmail === data.terms.contactEmail
}, {
  message: 'Contact email must match between site details and terms',
  path: ['terms', 'contactEmail']
}).refine((data) => {
  // Ensure company names match
  return data.siteDetails.companyName === data.terms.companyName
}, {
  message: 'Company name must match between site details and terms',
  path: ['terms', 'companyName']
})

// Step-specific validation schema for the UI
export const siteDetailsStepSchema = z.object({
  ...siteDetailsSchema.shape,
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms of service to continue'
  }),
  termsContent: z.string().min(100, 'Terms of service must be provided'),
  termsURI: z.string().url('Valid IPFS URI is required').optional(),
})

export type SiteDetailsFormData = z.infer<typeof siteDetailsSchema>
export type TermsOfServiceData = z.infer<typeof termsOfServiceSchema>
export type SiteDetailsAndTermsData = z.infer<typeof siteDetailsAndTermsSchema>
export type SiteDetailsStepData = z.infer<typeof siteDetailsStepSchema>
