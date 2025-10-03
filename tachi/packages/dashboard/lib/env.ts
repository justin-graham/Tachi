import { z } from 'zod'

// Client-side environment schema (publicly available)
const clientEnv = z.object({
  NEXT_PUBLIC_CHAIN_ID: z.string().default('8453'), // Base mainnet
  NEXT_PUBLIC_ALCHEMY_KEY: z.string().min(1, 'Alchemy API key is required'),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1, 'WalletConnect project ID is required'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://tachi.ai'),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
})

// Server-side environment schema (private)
const serverEnv = z.object({
  CLOUDFLARE_API_TOKEN: z.string().min(1, 'Cloudflare API token is required'),
  DATABASE_URL: z.string().url('Database URL must be a valid URL'),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  WEBHOOK_SECRET: z.string().min(32, 'Webhook secret must be at least 32 characters').optional(),
})

// Combined environment schema for server-side validation
const combinedEnv = clientEnv.merge(serverEnv)

function createEnv() {
  // Validate client env (can be used on both client and server)
  const clientValidation = clientEnv.safeParse({
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_ALCHEMY_KEY: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  })

  if (!clientValidation.success) {
    console.error('❌ Invalid client environment variables:', clientValidation.error.format())
    throw new Error('Invalid client environment variables')
  }

  // Server-side validation (only runs on server)
  if (typeof window === 'undefined') {
    const serverValidation = serverEnv.safeParse({
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
      DATABASE_URL: process.env.DATABASE_URL,
      SENTRY_DSN: process.env.SENTRY_DSN,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    })

    if (!serverValidation.success) {
      console.error('❌ Invalid server environment variables:', serverValidation.error.format())
      throw new Error('Invalid server environment variables')
    }

    return {
      ...clientValidation.data,
      ...serverValidation.data,
    }
  }

  return clientValidation.data
}

// Export the validated environment
export const env = createEnv()

// Type exports
export type ClientEnv = z.infer<typeof clientEnv>
export type ServerEnv = z.infer<typeof serverEnv>
export type Env = z.infer<typeof combinedEnv>