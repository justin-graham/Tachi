// @ts-nocheck
/**
 * Tachi Protocol Cloudflare Worker
 * Generated from Publisher Dashboard
 * 
 * This worker intercepts AI crawler requests and enforces
 * payment through the Tachi Protocol smart contracts.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Publisher Configuration (Auto-generated from dashboard)
    const TACHI_CONFIG = {
      tokenId: "{{TOKEN_ID}}", // Will be replaced with actual token ID
      publisher: "{{PUBLISHER_ADDRESS}}", // Publisher wallet address
      domain: "{{DOMAIN}}", // Publisher domain
      pricing: "{{PRICING}}", // Price in USD (e.g., 1.50)
      contracts: {
        crawlNFT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        paymentProcessor: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        proofLedger: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        usdc: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
      },
      rpcUrl: "https://base-sepolia.g.alchemy.com/v2/7esRSpa0mWei8xuvcT1mLQdttn1KcAQ_"
    }
    
    // Detect AI Crawlers
    const userAgent = request.headers.get('User-Agent') || ''
    const isAICrawler = detectAICrawler(userAgent)
    
    if (isAICrawler) {
      console.log(`🤖 AI Crawler detected: ${userAgent}`)
      
      // Check for Tachi payment proof
      const paymentProof = request.headers.get('X-Tachi-Payment-Proof')
      const crawlerAddress = request.headers.get('X-Tachi-Crawler-Address')
      const paymentHash = request.headers.get('X-Tachi-Payment-Hash')
      
      if (!paymentProof || !crawlerAddress) {
        // Return payment required response
        return new Response(JSON.stringify({
          error: 'Payment Required',
          message: 'AI crawling requires payment through Tachi Protocol',
          protocol: {
            name: 'Tachi Protocol',
            version: '1.0',
            website: 'https://tachi.network'
          },
          payment: {
            tokenId: TACHI_CONFIG.tokenId,
            publisher: TACHI_CONFIG.publisher,
            price: TACHI_CONFIG.pricing,
            currency: 'USD',
            contracts: TACHI_CONFIG.contracts,
            rpcUrl: TACHI_CONFIG.rpcUrl
          },
          endpoints: {
            payment: 'https://api.tachi.network/payment',
            terms: `https://${TACHI_CONFIG.domain}/tachi-terms`,
            proof: `https://${TACHI_CONFIG.domain}/tachi-proof`
          },
          instructions: {
            step1: 'Fund smart account with USDC',
            step2: 'Submit payment transaction',
            step3: 'Include payment proof in X-Tachi-Payment-Proof header',
            step4: 'Retry request with proof'
          }
        }), {
          status: 402, // Payment Required
          headers: {
            'Content-Type': 'application/json',
            'X-Tachi-Token-ID': TACHI_CONFIG.tokenId.toString(),
            'X-Tachi-Publisher': TACHI_CONFIG.publisher,
            'X-Tachi-Price-USD': TACHI_CONFIG.pricing.toString(),
            'X-Tachi-Currency': 'USD',
            'X-Tachi-Contracts': JSON.stringify(TACHI_CONFIG.contracts),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'X-Tachi-Payment-Proof, X-Tachi-Crawler-Address, X-Tachi-Payment-Hash'
          }
        })
      }
      
      // Verify payment proof (in production, this should verify on-chain)
      const isValidPayment = await verifyPaymentProof(paymentProof, crawlerAddress, TACHI_CONFIG, env)
      
      if (!isValidPayment) {
        return new Response(JSON.stringify({
          error: 'Invalid Payment',
          message: 'Payment proof verification failed',
          provided: {
            proof: paymentProof,
            crawler: crawlerAddress,
            hash: paymentHash
          },
          required: {
            tokenId: TACHI_CONFIG.tokenId,
            publisher: TACHI_CONFIG.publisher,
            minAmount: TACHI_CONFIG.pricing
          }
        }), {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'X-Tachi-Error': 'INVALID_PAYMENT_PROOF'
          }
        })
      }
      
      // Payment verified - allow access and log
      console.log(`✅ Payment verified for crawler: ${crawlerAddress}`)
      console.log(`📊 Crawl logged: Token ${TACHI_CONFIG.tokenId}, Amount: $${TACHI_CONFIG.pricing}`)
      
      // Add Tachi headers to response
      const response = await fetch(request)
      const newResponse = new Response(response.body, response)
      newResponse.headers.set('X-Tachi-Paid-Access', 'true')
      newResponse.headers.set('X-Tachi-Token-ID', TACHI_CONFIG.tokenId.toString())
      newResponse.headers.set('X-Tachi-Crawler', crawlerAddress)
      
      return newResponse
    }
    
    // Handle Tachi protocol endpoints
    if (url.pathname === '/tachi-terms') {
      return new Response(JSON.stringify({
        protocol: {
          name: 'Tachi Protocol',
          version: '1.0',
          specification: 'https://docs.tachi.network/protocol'
        },
        publisher: {
          domain: TACHI_CONFIG.domain,
          address: TACHI_CONFIG.publisher,
          tokenId: TACHI_CONFIG.tokenId
        },
        pricing: {
          amount: TACHI_CONFIG.pricing,
          currency: 'USD',
          model: 'per-crawl',
          description: 'Payment required for AI crawler access'
        },
        contracts: TACHI_CONFIG.contracts,
        network: {
          name: 'Base Sepolia',
          chainId: 84532,
          rpcUrl: TACHI_CONFIG.rpcUrl
        },
        terms: {
          version: '1.0',
          effectiveDate: new Date().toISOString(),
          allowTraining: true,
          allowCommercial: true,
          attributionRequired: false,
          rateLimitPerHour: 100
        }
      }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }
    
    // Regular traffic - pass through to origin
    return fetch(request)
  }
}

/**
 * Detect if the request is from an AI crawler
 */
function detectAICrawler(userAgent) {
  const aiPatterns = [
    /bot/i,
    /crawl/i,
    /spider/i,
    /scrape/i,
    /gpt/i,
    /claude/i,
    /bard/i,
    /bing/i,
    /chatgpt/i,
    /openai/i,
    /anthropic/i,
    /ai2/i,
    /perplexity/i,
    /you\.com/i
  ]
  
  return aiPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * Verify payment proof (simplified for demo)
 * In production, this should verify the transaction on-chain
 */
async function verifyPaymentProof(proof, crawlerAddress, config, env) {
  // Demo mode - accept any proof
  if (env?.DEMO_MODE === 'true') {
    return true
  }
  
  // TODO: Implement on-chain verification
  // 1. Parse payment proof (transaction hash, signature, etc.)
  // 2. Query blockchain to verify payment
  // 3. Check payment amount matches required price
  // 4. Verify payment is recent (not replayed)
  // 5. Check crawler address matches payment sender
  
  try {
    // Placeholder verification logic
    if (proof && proof.length > 10 && crawlerAddress) {
      // In real implementation, verify on Base network
      return true
    }
    return false
  } catch (error) {
    console.error('Payment verification error:', error)
    return false
  }
}

// Example deployment configuration for wrangler.toml:
/*
name = "tachi-crawler-publisher"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production.vars]
DEMO_MODE = "false"
LOG_LEVEL = "info"

[env.staging.vars]
DEMO_MODE = "true"
LOG_LEVEL = "debug"

# Set these via: wrangler secret put SECRET_NAME
# ALCHEMY_API_KEY = "your_alchemy_api_key"
# TACHI_PRIVATE_KEY = "publisher_private_key_for_signing"
*/
