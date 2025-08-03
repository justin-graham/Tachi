/**
 * Environment validation and configuration management
 */

export interface EnvConfig {
  // Public environment variables (safe to expose to client)
  public: {
    walletConnectProjectId: string
    alchemyApiKey: string
    baseRpcUrl: string
    contractAddresses: {
      crawlNFT: string
      paymentProcessor: string
      proofLedger: string
      usdc: string
    }
    chainId: number
  }
  
  // Private environment variables (server-side only)
  private: {
    csrfSecret: string
    webhookSecret?: string
    securityWebhookUrl?: string
    securityWebhookToken?: string
  }
  
  // Security configuration
  security: {
    enableCSRF: boolean
    enableRateLimit: boolean
    rateLimitRequests: number
    rateLimitWindow: number
    maxRequestSize: number
    enableSecurityLogging: boolean
  }
}

/**
 * Validate required environment variables
 */
function validateRequiredEnvVars(): { valid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
    'NEXT_PUBLIC_BASE_RPC_URL',
    'NEXT_PUBLIC_CRAWLNFT_ADDRESS',
    'NEXT_PUBLIC_PAYMENTPROCESSOR_ADDRESS',
    'NEXT_PUBLIC_PROOF_LEDGER_ADDRESS',
    'NEXT_PUBLIC_USDC_ADDRESS'
  ]
  
  const missing = required.filter(envVar => !process.env[envVar])
  
  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * Validate environment variable formats
 */
function validateEnvFormats(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate Ethereum addresses
  const addressVars = [
    'NEXT_PUBLIC_CRAWLNFT_ADDRESS',
    'NEXT_PUBLIC_PAYMENTPROCESSOR_ADDRESS', 
    'NEXT_PUBLIC_PROOF_LEDGER_ADDRESS',
    'NEXT_PUBLIC_USDC_ADDRESS'
  ]
  
  addressVars.forEach(envVar => {
    const address = process.env[envVar]
    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      errors.push(`${envVar} is not a valid Ethereum address`)
    }
  })
  
  // Validate URLs
  const urlVars = ['NEXT_PUBLIC_BASE_RPC_URL']
  urlVars.forEach(envVar => {
    const url = process.env[envVar]
    if (url) {
      try {
        new URL(url)
      } catch {
        errors.push(`${envVar} is not a valid URL`)
      }
    }
  })
  
  // Validate WalletConnect Project ID (should be UUID-like)
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  if (projectId && !/^[a-zA-Z0-9]{32}$/.test(projectId) && projectId !== '2f05a7c0b1e6d7a8b9c8d7e6f5a4b3c2') {
    errors.push('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID should be a 32-character hex string')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Check for development fallbacks in production
 */
function checkProductionSecurity(): { secure: boolean; warnings: string[] } {
  const warnings: string[] = []
  
  if (process.env.NODE_ENV === 'production') {
    // Check for development fallbacks
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    if (projectId === '2f05a7c0b1e6d7a8b9c8d7e6f5a4b3c2') {
      warnings.push('Using development fallback WalletConnect Project ID in production')
    }
    
    // Check for missing security settings
    if (!process.env.CSRF_SECRET) {
      warnings.push('CSRF_SECRET not set - using default (insecure)')
    }
    
    if (!process.env.SECURITY_WEBHOOK_URL) {
      warnings.push('SECURITY_WEBHOOK_URL not set - security alerts will not be sent')
    }
    
    // Check RPC URL
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL
    if (rpcUrl?.includes('localhost') || rpcUrl?.includes('127.0.0.1')) {
      warnings.push('Using localhost RPC URL in production')
    }
  }
  
  return {
    secure: warnings.length === 0,
    warnings
  }
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): {
  config: EnvConfig | null
  validation: {
    valid: boolean
    errors: string[]
    warnings: string[]
  }
} {
  const requiredCheck = validateRequiredEnvVars()
  const formatCheck = validateEnvFormats()
  const securityCheck = checkProductionSecurity()
  
  const validation = {
    valid: requiredCheck.valid && formatCheck.valid,
    errors: [
      ...requiredCheck.missing.map(env => `Missing required environment variable: ${env}`),
      ...formatCheck.errors
    ],
    warnings: securityCheck.warnings
  }
  
  if (!validation.valid) {
    return { config: null, validation }
  }
  
  // Build configuration object
  const config: EnvConfig = {
    public: {
      walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
      alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '',
      baseRpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL!,
      contractAddresses: {
        crawlNFT: process.env.NEXT_PUBLIC_CRAWLNFT_ADDRESS!,
        paymentProcessor: process.env.NEXT_PUBLIC_PAYMENTPROCESSOR_ADDRESS!,
        proofLedger: process.env.NEXT_PUBLIC_PROOF_LEDGER_ADDRESS!,
        usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS!
      },
      chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337', 10)
    },
    
    private: {
      csrfSecret: process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
      webhookSecret: process.env.WEBHOOK_SECRET,
      securityWebhookUrl: process.env.SECURITY_WEBHOOK_URL,
      securityWebhookToken: process.env.SECURITY_WEBHOOK_TOKEN
    },
    
    security: {
      enableCSRF: process.env.ENABLE_CSRF !== 'false',
      enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
      rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100', 10),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
      maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE || '1048576', 10), // 1MB
      enableSecurityLogging: process.env.ENABLE_SECURITY_LOGGING === 'true'
    }
  }
  
  return { config, validation }
}

/**
 * Validate configuration at runtime
 */
export function validateRuntimeConfig(config: EnvConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate chain ID
  const supportedChains = [1, 8453, 84532, 31337] // Mainnet, Base, Base Sepolia, Hardhat
  if (!supportedChains.includes(config.public.chainId)) {
    errors.push(`Unsupported chain ID: ${config.public.chainId}`)
  }
  
  // Validate rate limit settings
  if (config.security.rateLimitRequests <= 0) {
    errors.push('Rate limit requests must be positive')
  }
  
  if (config.security.rateLimitWindow <= 0) {
    errors.push('Rate limit window must be positive')
  }
  
  if (config.security.maxRequestSize <= 0) {
    errors.push('Max request size must be positive')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get sanitized config for client-side use
 */
export function getClientConfig(config: EnvConfig) {
  return {
    walletConnect: {
      projectId: config.public.walletConnectProjectId
    },
    contracts: config.public.contractAddresses,
    network: {
      rpcUrl: config.public.baseRpcUrl,
      chainId: config.public.chainId
    }
  }
}

/**
 * Development helper to check configuration
 */
export function checkConfiguration(): void {
  const { config, validation } = loadEnvConfig()
  
  console.log('🔍 ENVIRONMENT CONFIGURATION CHECK')
  console.log('================================')
  
  if (!validation.valid) {
    console.log('❌ Configuration INVALID')
    validation.errors.forEach(error => console.log(`  • ${error}`))
  } else {
    console.log('✅ Configuration VALID')
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Security Warnings:')
    validation.warnings.forEach(warning => console.log(`  • ${warning}`))
  }
  
  if (config) {
    const runtimeCheck = validateRuntimeConfig(config)
    if (!runtimeCheck.valid) {
      console.log('\n❌ Runtime Validation FAILED')
      runtimeCheck.errors.forEach(error => console.log(`  • ${error}`))
    }
  }
  
  console.log('\n🔧 Environment Variables Status:')
  console.log(`  • NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
  console.log(`  • Chain ID: ${config?.public.chainId || 'N/A'}`)
  console.log(`  • CSRF Protection: ${config?.security.enableCSRF ? 'Enabled' : 'Disabled'}`)
  console.log(`  • Rate Limiting: ${config?.security.enableRateLimit ? 'Enabled' : 'Disabled'}`)
  console.log(`  • Security Logging: ${config?.security.enableSecurityLogging ? 'Enabled' : 'Disabled'}`)
}
