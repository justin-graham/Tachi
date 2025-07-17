import { type Address } from 'viem'

/**
 * Configuration interface for generating Cloudflare Worker scripts
 */
export interface WorkerConfig {
  // Site configuration
  domain: string
  publisherAddress: Address
  crawlTokenId: string
  
  // Pricing configuration
  priceUSDC: string // e.g., "0.005"
  priceUnits: string // e.g., "5000" (USDC smallest units)
  
  // Contract addresses
  paymentProcessorAddress: Address
  proofOfCrawlLedgerAddress: Address
  usdcAddress: Address
  crawlNftAddress: Address
  
  // Network configuration
  chainId: number
  rpcUrl: string
  networkName: string
  
  // Optional configuration
  termsURI?: string
  ownerPrivateKey?: string // For logging crawls (will be stored as secret)
}

/**
 * Generates a complete Cloudflare Worker script based on configuration
 */
export function generateWorkerScript(config: WorkerConfig): string {
  return `/**
 * Tachi Pay-Per-Crawl Cloudflare Worker
 * Generated for: ${config.domain}
 * 
 * This worker enforces payment requirements for AI crawlers
 * and logs successful crawls on-chain.
 */

import { createPublicClient, createWalletClient, http, parseAbi, parseUnits, formatUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

// Configuration
const CONFIG = {
  // Site Information
  DOMAIN: '${config.domain}',
  PUBLISHER_ADDRESS: '${config.publisherAddress}',
  CRAWL_TOKEN_ID: '${config.crawlTokenId}',
  
  // Pricing Configuration  
  PRICE_USDC: '${config.priceUSDC}', // Price in USDC (e.g., "0.005")
  PRICE_UNITS: '${config.priceUnits}', // Price in USDC smallest units (e.g., "5000")
  
  // Contract Addresses
  PAYMENT_PROCESSOR_ADDRESS: '${config.paymentProcessorAddress}',
  PROOF_OF_CRAWL_LEDGER_ADDRESS: '${config.proofOfCrawlLedgerAddress}',
  USDC_ADDRESS: '${config.usdcAddress}',
  CRAWL_NFT_ADDRESS: '${config.crawlNftAddress}',
  
  // Network Configuration
  CHAIN_ID: ${config.chainId},
  NETWORK_NAME: '${config.networkName}',
  ${config.termsURI ? `TERMS_URI: '${config.termsURI}',` : ''}
}

// Environment interface for Cloudflare Worker
interface Env {
  BASE_RPC_URL: string
  PRIVATE_KEY: string // For logging crawls on-chain (set as secret)
}

// AI Crawler User-Agent patterns
const AI_CRAWLER_PATTERNS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /Claude-Web/i,
  /anthropic-ai/i,
  /Claude/i,
  /Bard/i,
  /AI2Bot/i,
  /PerplexityBot/i,
  /YouBot/i,
  /Diffbot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /WhatsApp/i,
  /Googlebot/i,
  /bingbot/i,
  /slurp/i,
  /DuckDuckBot/i
]

// Contract ABIs (minimal)
const USDC_TRANSFER_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
])

const PAYMENT_PROCESSOR_ABI = parseAbi([
  'function payPublisherByNFT(address crawlNFT, uint256 tokenId, uint256 amount) external',
])

const PROOF_OF_CRAWL_LEDGER_ABI = parseAbi([
  'function logCrawl(uint256 crawlTokenId, address crawler, string memory userAgent, uint256 timestamp) external',
])

/**
 * Checks if the request is from an AI crawler
 */
function isAICrawler(userAgent: string): boolean {
  if (!userAgent) return false
  return AI_CRAWLER_PATTERNS.some(pattern => pattern.test(userAgent))
}

/**
 * Extracts transaction hash from Authorization header
 */
function extractTxHash(authHeader: string): string | null {
  if (!authHeader) return null
  
  // Support both "Bearer <hash>" and direct hash formats
  const match = authHeader.match(/(?:Bearer\\s+)?(0x[a-fA-F0-9]{64})/)
  return match ? match[1] : null
}

/**
 * Creates a 402 Payment Required response
 */
function createPaymentRequiredResponse(env: Env): Response {
  const priceInSmallestUnits = parseUnits(CONFIG.PRICE_USDC, 6).toString() // USDC has 6 decimals

  const paymentInfo = {
    error: 'Payment Required',
    message: \`Please send \${CONFIG.PRICE_USDC} USDC to PaymentProcessor on \${CONFIG.NETWORK_NAME} network\`,
    payment: {
      amount: CONFIG.PRICE_USDC,
      currency: 'USDC',
      network: CONFIG.NETWORK_NAME,
      chainId: CONFIG.CHAIN_ID,
      recipient: CONFIG.PAYMENT_PROCESSOR_ADDRESS,
      tokenAddress: CONFIG.USDC_ADDRESS,
      crawlNFTAddress: CONFIG.CRAWL_NFT_ADDRESS,
      tokenId: CONFIG.CRAWL_TOKEN_ID,
    },
    instructions: [
      'Send the specified amount of USDC to the PaymentProcessor contract',
      'Wait for transaction confirmation on the blockchain',
      'Retry your request with Authorization: Bearer <transaction_hash>'
    ],
  }

  return new Response(JSON.stringify(paymentInfo, null, 2), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
      // Payment protocol headers
      'x402-price': priceInSmallestUnits,
      'x402-currency': 'USDC',
      'x402-chain-id': CONFIG.CHAIN_ID.toString(),
      'x402-recipient': CONFIG.PAYMENT_PROCESSOR_ADDRESS,
      'x402-contract': CONFIG.USDC_ADDRESS,
      'x402-crawl-nft': CONFIG.CRAWL_NFT_ADDRESS,
      'x402-token-id': CONFIG.CRAWL_TOKEN_ID,
    },
  })
}

/**
 * Verifies payment by checking the transaction receipt
 */
async function verifyPayment(
  txHash: string,
  env: Env
): Promise<{ isValid: boolean; crawlerAddress?: string; error?: string }> {
  try {
    // Create public client for Base network
    const publicClient = createPublicClient({
      chain: base,
      transport: http(env.BASE_RPC_URL),
    })

    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as \`0x\${string}\`,
    })

    if (!receipt) {
      return { isValid: false, error: 'Transaction not found' }
    }

    if (receipt.status !== 'success') {
      return { isValid: false, error: 'Transaction failed' }
    }

    // Parse logs to find USDC Transfer event
    const requiredAmount = parseUnits(CONFIG.PRICE_USDC, 6)
    let validTransfer = false
    let crawlerAddress: string | undefined

    // Check for USDC Transfer to PaymentProcessor
    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() === CONFIG.USDC_ADDRESS.toLowerCase() &&
        log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event
      ) {
        const [, from, to, value] = log.topics
        const amount = BigInt(log.data)

        if (
          to?.toLowerCase().includes(CONFIG.PAYMENT_PROCESSOR_ADDRESS.slice(2).toLowerCase()) &&
          amount >= requiredAmount
        ) {
          validTransfer = true
          crawlerAddress = \`0x\${from?.slice(-40)}\` // Extract address from padded topic
          break
        }
      }
    }

    if (!validTransfer) {
      return { isValid: false, error: 'No valid USDC transfer found' }
    }

    return { isValid: true, crawlerAddress }
  } catch (error) {
    console.error('Payment verification error:', error)
    return { isValid: false, error: 'Payment verification failed' }
  }
}

/**
 * Asynchronously logs the crawl on-chain
 */
async function logCrawlOnChain(
  crawlTokenId: string,
  crawlerAddress: string,
  userAgent: string,
  env: Env
): Promise<void> {
  try {
    if (!env.PRIVATE_KEY) {
      console.warn('No private key configured for on-chain logging')
      return
    }

    const account = privateKeyToAccount(env.PRIVATE_KEY as \`0x\${string}\`)
    
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(env.BASE_RPC_URL),
    })

    // Log the crawl on-chain (async, don't block response)
    await walletClient.writeContract({
      address: CONFIG.PROOF_OF_CRAWL_LEDGER_ADDRESS as \`0x\${string}\`,
      abi: PROOF_OF_CRAWL_LEDGER_ABI,
      functionName: 'logCrawl',
      args: [
        BigInt(crawlTokenId),
        crawlerAddress as \`0x\${string}\`,
        userAgent,
        BigInt(Math.floor(Date.now() / 1000)), // Current timestamp
      ],
    })

    console.log(\`Crawl logged on-chain for crawler: \${crawlerAddress}\`)
  } catch (error) {
    console.error('On-chain logging error:', error)
    // Don't throw - logging failure shouldn't block content delivery
  }
}

/**
 * Handles CORS preflight requests
 */
function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  return null
}

/**
 * Main fetch handler for the Cloudflare Worker
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    const corsResponse = handleCORS(request)
    if (corsResponse) return corsResponse

    const userAgent = request.headers.get('User-Agent') || ''
    const authHeader = request.headers.get('Authorization')

    // Check if this is an AI crawler
    if (isAICrawler(userAgent)) {
      // If no payment proof provided, return 402
      if (!authHeader) {
        return createPaymentRequiredResponse(env)
      }

      // Extract and verify transaction hash
      const txHash = extractTxHash(authHeader)
      if (!txHash) {
        return createPaymentRequiredResponse(env)
      }

      // Verify payment
      const verification = await verifyPayment(txHash, env)
      if (!verification.isValid) {
        return new Response(
          JSON.stringify({
            error: 'Payment verification failed',
            message: verification.error || 'Invalid payment proof',
            details: 'Please ensure you have sent the correct amount to the PaymentProcessor contract',
          }),
          {
            status: 402,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // Payment verified - log crawl asynchronously
      if (verification.crawlerAddress) {
        ctx.waitUntil(
          logCrawlOnChain(
            CONFIG.CRAWL_TOKEN_ID,
            verification.crawlerAddress,
            userAgent,
            env
          )
        )
      }

      // Continue to serve content (fall through to normal handling)
    }

    // Normal request handling - fetch from origin or serve your content
    // This is where you would integrate with your existing website/CMS
    
    // For this example, we'll return a simple HTML response
    // In production, you might fetch from your origin server or R2 bucket
    const htmlContent = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${CONFIG.DOMAIN} - Pay-Per-Crawl Content</title>
</head>
<body>
    <h1>Welcome to \${CONFIG.DOMAIN}</h1>
    <p>This content is protected by Tachi Pay-Per-Crawl protocol.</p>
    <p>AI crawlers pay \${CONFIG.PRICE_USDC} USDC per request.</p>
    
    <!-- Your actual content goes here -->
    <article>
        <h2>Sample Article</h2>
        <p>This is sample content that would be served to both human users and paid AI crawlers.</p>
        <p>Replace this section with your actual website content or integrate with your CMS.</p>
    </article>
</body>
</html>\`

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
      },
    })
  },
}
`
}

/**
 * Generates wrangler.toml configuration file
 */
export function generateWranglerConfig(config: WorkerConfig): string {
  return `# Cloudflare Worker configuration for ${config.domain}
# Generated by Tachi Dashboard

name = "${config.domain.replace(/\./g, '-')}-tachi-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-15"
compatibility_flags = ["nodejs_compat"]

# Environment Variables
[vars]
BASE_RPC_URL = "${config.rpcUrl}"

# Production Environment
[env.production]
name = "${config.domain.replace(/\./g, '-')}-tachi-gateway"
route = { pattern = "${config.domain}/*", zone_name = "${config.domain}" }

# Staging Environment  
[env.staging]
name = "${config.domain.replace(/\./g, '-')}-tachi-gateway-staging"
route = { pattern = "staging.${config.domain}/*", zone_name = "${config.domain}" }

# Development Environment
[env.development]
name = "${config.domain.replace(/\./g, '-')}-tachi-gateway-dev"

# Note: Set your private key as a secret using:
# wrangler secret put PRIVATE_KEY --env production
# wrangler secret put PRIVATE_KEY --env staging
`
}

/**
 * Generates deployment instructions
 */
export function generateDeploymentInstructions(config: WorkerConfig): string[] {
  return [
    "## 🚀 Deployment Instructions",
    "",
    "### 1. Prerequisites",
    "- Cloudflare account with Workers enabled",
    "- Domain managed by Cloudflare",
    "- Node.js and npm installed",
    "",
    "### 2. Install Wrangler CLI",
    "```bash",
    "npm install -g wrangler",
    "wrangler login",
    "```",
    "",
    "### 3. Create Worker Project",
    "```bash",
    `mkdir ${config.domain}-tachi-worker`,
    `cd ${config.domain}-tachi-worker`,
    "npm init -y",
    "npm install viem",
    "```",
    "",
    "### 4. Save Files",
    "1. Copy the generated worker script to `src/index.ts`",
    "2. Copy the wrangler.toml configuration to `wrangler.toml`",
    "",
    "### 5. Set Private Key Secret",
    "```bash",
    "# Set private key for on-chain logging (keep this secure!)",
    "wrangler secret put PRIVATE_KEY --env production",
    "# Enter your private key when prompted",
    "```",
    "",
    "### 6. Deploy to Staging",
    "```bash",
    "wrangler deploy --env staging",
    "```",
    "",
    "### 7. Test Your Deployment",
    "```bash",
    `curl -H \"User-Agent: GPTBot/1.0\" https://staging.${config.domain}/`,
    "# Should return 402 Payment Required",
    "```",
    "",
    "### 8. Deploy to Production",
    "```bash",
    "wrangler deploy --env production",
    "```",
    "",
    "### 9. Configure Domain Routes",
    "In your Cloudflare Dashboard:",
    "1. Go to Workers & Pages > Overview",
    "2. Select your deployed worker",
    "3. Go to Settings > Triggers",
    `4. Add route: ${config.domain}/*`,
    "",
    "### 🔍 Monitoring & Debugging",
    "```bash",
    "# View real-time logs",
    "wrangler tail --env production",
    "",
    "# Check deployment status",
    "wrangler deployments list",
    "```",
    "",
    "### ⚡ Quick Test Commands",
    "```bash",
    "# Test AI crawler (should get 402)",
    `curl -H \"User-Agent: GPTBot/1.0\" https://${config.domain}/`,
    "",
    "# Test human user (should get content)",
    `curl -H \"User-Agent: Mozilla/5.0\" https://${config.domain}/`,
    "",
    "# Test with payment proof",
    `curl -H \"User-Agent: GPTBot/1.0\" -H \"Authorization: Bearer 0x...\" https://${config.domain}/`,
    "```",
    "",
    "### 💡 Next Steps",
    "- Monitor crawler payments in the Tachi dashboard",
    "- Adjust pricing based on demand",
    "- Integrate with your existing CMS or origin server",
    "- Set up analytics and monitoring",
  ]
}

export function getNetworkConfig(chainId: number) {
  const configs = {
    31337: {
      name: 'Local Hardhat',
      rpcUrl: 'http://127.0.0.1:8545',
      usdcAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address, // MockUSDC
      paymentProcessorAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as Address,
      proofOfCrawlLedgerAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as Address,
    },
    84532: {
      name: 'Base Sepolia',
      rpcUrl: 'https://base-sepolia.alchemyapi.io/v2/YOUR-API-KEY',
      usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address, // Base Sepolia USDC
      paymentProcessorAddress: '0x...' as Address, // Will be deployed
      proofOfCrawlLedgerAddress: '0x...' as Address, // Will be deployed
    },
    8453: {
      name: 'Base Mainnet',
      rpcUrl: 'https://base-mainnet.alchemyapi.io/v2/YOUR-API-KEY',
      usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, // Base USDC
      paymentProcessorAddress: '0x...' as Address, // Will be deployed
      proofOfCrawlLedgerAddress: '0x...' as Address, // Will be deployed
    },
  }
  
  return configs[chainId as keyof typeof configs]
}
