import { z } from 'zod'

// Client-side environment schema (publicly available)
// These variables are exposed to the browser, so never include secrets here
const clientEnv = z.object({
  NEXT_PUBLIC_CHAIN_ID: z.string().min(1, 'NEXT_PUBLIC_CHAIN_ID is required').default('8453'), // Base mainnet
  NEXT_PUBLIC_ALCHEMY_KEY: z.string().min(1, 'NEXT_PUBLIC_ALCHEMY_KEY is required'),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1, 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_CRAWL_NFT_ADDRESS: z.string().optional(),
})

// Server-side environment schema (private)
// These variables are only available on the server and should contain sensitive data
const serverEnv = z.object({
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').optional(),
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  WEBHOOK_SECRET: z.string().min(32, 'WEBHOOK_SECRET must be at least 32 characters').optional(),
  ADMIN_WALLET_PRIVATE_KEY: z.string().optional(),
  TACHI_API_BASE_URL: z.string().url('TACHI_API_BASE_URL must be a valid URL').optional(),
  BASE_RPC_URL: z.string().url('BASE_RPC_URL must be a valid URL').optional(),
  AUTO_PROCESS_WITHDRAWALS: z.enum(['true', 'false']).optional(),
  GOOGLE_OAUTH_AUTHORIZE_URL: z.string().url().optional(),
  GITHUB_OAUTH_AUTHORIZE_URL: z.string().url().optional(),
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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_CRAWL_NFT_ADDRESS: process.env.NEXT_PUBLIC_CRAWL_NFT_ADDRESS,
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
      ADMIN_WALLET_PRIVATE_KEY: process.env.ADMIN_WALLET_PRIVATE_KEY,
      TACHI_API_BASE_URL: process.env.TACHI_API_BASE_URL,
      BASE_RPC_URL: process.env.BASE_RPC_URL,
      AUTO_PROCESS_WITHDRAWALS: process.env.AUTO_PROCESS_WITHDRAWALS,
      GOOGLE_OAUTH_AUTHORIZE_URL: process.env.GOOGLE_OAUTH_AUTHORIZE_URL,
      GITHUB_OAUTH_AUTHORIZE_URL: process.env.GITHUB_OAUTH_AUTHORIZE_URL,
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
