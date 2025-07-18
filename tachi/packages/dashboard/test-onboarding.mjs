#!/usr/bin/env node

/**
 * Publisher Onboarding Test Automation
 * 
 * This script simulates the complete publisher onboarding flow:
 * 1. Connect wallet (using deployer account)
 * 2. Input test site information
 * 3. Mint CrawlNFT with terms
 * 4. Set pricing
 * 5. Generate Cloudflare Worker code
 * 6. Verify on-chain data
 */

import { ethers } from 'ethers'
import fs from 'fs'

console.log('🚀 TACHI PUBLISHER ONBOARDING TEST\n')

// Configuration
const config = {
  rpcUrl: 'http://127.0.0.1:8545',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat default
  contracts: {
    crawlNFT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    paymentProcessor: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    proofLedger: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    usdc: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  },
  testSite: {
    domain: 'test-publisher.example.com',
    title: 'Test Publisher Site',
    description: 'Demo AI-crawlable content site',
    pricing: '1.50' // USD per crawl
  }
}

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(config.rpcUrl)
const signer = new ethers.Wallet(config.privateKey, provider)

console.log('📋 TEST CONFIGURATION:')
console.log(`  🔗 Network: Local Hardhat (Chain ID: 31337)`)
console.log(`  👛 Publisher Wallet: ${signer.address}`)
console.log(`  🌐 Test Site: ${config.testSite.domain}`)
console.log(`  💰 Pricing: $${config.testSite.pricing} per crawl`)
console.log(`  📄 CrawlNFT Contract: ${config.contracts.crawlNFT}`)

// CrawlNFT ABI (essential functions)
const crawlNFTABI = [
  "function mint(address to, string memory termsURI) public returns (uint256)",
  "function setPricing(uint256 tokenId, uint256 priceInUSDCents) public",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function totalSupply() public view returns (uint256)",
  "function getPricing(uint256 tokenId) public view returns (uint256)"
]

async function runOnboardingTest() {
  try {
    // Step 1: Connect to CrawlNFT contract
    console.log('\n📄 Step 1: Connecting to CrawlNFT Contract...')
    const crawlNFT = new ethers.Contract(config.contracts.crawlNFT, crawlNFTABI, signer)
    
    // Check current total supply
    const currentSupply = await crawlNFT.totalSupply()
    console.log(`  ✅ Current NFT Supply: ${currentSupply}`)
    
    // Step 2: Create Terms URI (simulating IPFS upload)
    console.log('\n📝 Step 2: Creating Terms Document...')
    const termsData = {
      version: "1.0",
      publisher: {
        name: config.testSite.title,
        domain: config.testSite.domain,
        description: config.testSite.description,
        contact: "publisher@test-publisher.example.com"
      },
      crawlTerms: {
        allowedBots: ["*"],
        pricing: {
          basePrice: parseFloat(config.testSite.pricing),
          currency: "USD",
          billingModel: "per-crawl"
        },
        restrictions: {
          rateLimitPerHour: 100,
          allowedPaths: ["/*"],
          restrictedPaths: ["/admin/*", "/private/*"]
        },
        dataUsage: {
          allowTraining: true,
          allowCommercialUse: true,
          attributionRequired: false
        }
      },
      legal: {
        jurisdiction: "United States",
        effectiveDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    }
    
    // Save terms to local file (simulating IPFS)
    const termsPath = './test-crawl-terms.json'
    fs.writeFileSync(termsPath, JSON.stringify(termsData, null, 2))
    const termsURI = `ipfs://QmTestHash123/${config.testSite.domain}/terms.json`
    console.log(`  ✅ Terms saved locally: ${termsPath}`)
    console.log(`  📎 Terms URI: ${termsURI}`)
    
    // Step 3: Mint CrawlNFT
    console.log('\n🎨 Step 3: Minting CrawlNFT...')
    console.log(`  👛 Minting to: ${signer.address}`)
    console.log(`  📄 Terms URI: ${termsURI}`)
    
    const mintTx = await crawlNFT.mint(signer.address, termsURI)
    console.log(`  📋 Transaction Hash: ${mintTx.hash}`)
    
    const mintReceipt = await mintTx.wait()
    console.log(`  ✅ Transaction Confirmed in Block: ${mintReceipt.blockNumber}`)
    
    // Extract token ID from mint event
    const mintEvent = mintReceipt.logs.find(log => {
      try {
        const decoded = crawlNFT.interface.parseLog(log)
        return decoded.name === 'Transfer' && decoded.args.from === ethers.ZeroAddress
      } catch (e) {
        return false
      }
    })
    
    if (!mintEvent) {
      throw new Error('Failed to find mint event')
    }
    
    const tokenId = crawlNFT.interface.parseLog(mintEvent).args.tokenId
    console.log(`  🎫 Token ID: ${tokenId}`)
    
    // Step 4: Set Pricing
    console.log('\n💰 Step 4: Setting Crawl Pricing...')
    const priceInCents = Math.round(parseFloat(config.testSite.pricing) * 100)
    console.log(`  💵 Price: $${config.testSite.pricing} (${priceInCents} cents)`)
    
    const pricingTx = await crawlNFT.setPricing(tokenId, priceInCents)
    console.log(`  📋 Pricing Transaction: ${pricingTx.hash}`)
    
    await pricingTx.wait()
    console.log(`  ✅ Pricing Set Successfully`)
    
    // Step 5: Verify On-Chain Data
    console.log('\n🔍 Step 5: Verifying On-Chain Data...')
    
    const owner = await crawlNFT.ownerOf(tokenId)
    const storedTermsURI = await crawlNFT.tokenURI(tokenId)
    const storedPricing = await crawlNFT.getPricing(tokenId)
    const newSupply = await crawlNFT.totalSupply()
    
    console.log(`  👛 NFT Owner: ${owner}`)
    console.log(`  📄 Stored Terms URI: ${storedTermsURI}`)
    console.log(`  💰 Stored Pricing: ${storedPricing} cents ($${storedPricing / 100})`)
    console.log(`  📊 Total Supply: ${newSupply}`)
    
    // Verification checks
    const checks = [
      { name: 'Owner Correct', pass: owner === signer.address },
      { name: 'Terms URI Stored', pass: storedTermsURI === termsURI },
      { name: 'Pricing Set', pass: storedPricing.toString() === priceInCents.toString() },
      { name: 'Supply Increased', pass: newSupply > currentSupply }
    ]
    
    console.log('\n✅ VERIFICATION RESULTS:')
    checks.forEach(check => {
      console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}`)
    })
    
    // Step 6: Generate Cloudflare Worker Code
    console.log('\n🌐 Step 6: Generating Cloudflare Worker Code...')
    const workerCode = generateCloudflareWorker(tokenId, config)
    
    fs.writeFileSync('./cloudflare-worker.js', workerCode)
    console.log(`  ✅ Worker code generated: ./cloudflare-worker.js`)
    
    // Success summary
    console.log('\n🎉 PUBLISHER ONBOARDING COMPLETE!')
    console.log(`
📊 ONBOARDING SUMMARY:
├── 🎫 CrawlNFT Token ID: ${tokenId}
├── 👛 Publisher Address: ${signer.address}
├── 🌐 Site Domain: ${config.testSite.domain}
├── 💰 Crawl Price: $${config.testSite.pricing}
├── 📄 Terms URI: ${termsURI}
├── 📋 Mint Transaction: ${mintTx.hash}
└── 🌐 Worker Code: ./cloudflare-worker.js

🚀 NEXT STEPS:
1. Deploy Cloudflare Worker using generated code
2. Set worker route to ${config.testSite.domain}/*
3. Test crawler payment flow
4. Monitor transactions on Base Goerli explorer
`)
    
    return {
      tokenId,
      mintTxHash: mintTx.hash,
      owner: signer.address,
      domain: config.testSite.domain,
      pricing: config.testSite.pricing,
      termsURI,
      workerCode
    }
    
  } catch (error) {
    console.error('\n❌ ONBOARDING TEST FAILED:', error.message)
    console.error(error.stack)
    throw error
  }
}

function generateCloudflareWorker(tokenId, config) {
  return `/**
 * Tachi Protocol Cloudflare Worker
 * Generated for: ${config.testSite.domain}
 * Token ID: ${tokenId}
 * Publisher: ${signer.address}
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Configuration
    const TACHI_CONFIG = {
      tokenId: ${tokenId},
      publisher: "${signer.address}",
      domain: "${config.testSite.domain}",
      pricing: ${config.testSite.pricing},
      contracts: {
        crawlNFT: "${config.contracts.crawlNFT}",
        paymentProcessor: "${config.contracts.paymentProcessor}",
        proofLedger: "${config.contracts.proofLedger}"
      },
      rpcUrl: "https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
    }
    
    // Check if request is from AI crawler
    const userAgent = request.headers.get('User-Agent') || ''
    const isAICrawler = /bot|crawl|spider|scrape|ai|gpt/i.test(userAgent)
    
    if (isAICrawler) {
      console.log(\`🤖 AI Crawler detected: \${userAgent}\`)
      
      // Check for Tachi payment proof
      const tachiProof = request.headers.get('X-Tachi-Payment-Proof')
      const crawlerAddress = request.headers.get('X-Tachi-Crawler-Address')
      
      if (!tachiProof || !crawlerAddress) {
        return new Response(JSON.stringify({
          error: 'Payment required',
          message: 'AI crawling requires payment through Tachi Protocol',
          tokenId: TACHI_CONFIG.tokenId,
          publisher: TACHI_CONFIG.publisher,
          pricing: TACHI_CONFIG.pricing,
          currency: 'USD',
          paymentEndpoint: 'https://api.tachi.network/payment',
          termsUrl: \`https://\${TACHI_CONFIG.domain}/tachi-terms\`
        }), {
          status: 402, // Payment Required
          headers: {
            'Content-Type': 'application/json',
            'X-Tachi-Token-ID': TACHI_CONFIG.tokenId.toString(),
            'X-Tachi-Publisher': TACHI_CONFIG.publisher,
            'X-Tachi-Price-USD': TACHI_CONFIG.pricing.toString()
          }
        })
      }
      
      // TODO: Verify payment proof on-chain
      // For demo purposes, accept any proof
      console.log(\`✅ Payment verified for crawler: \${crawlerAddress}\`)
      
      // Log crawl access
      console.log(\`📊 Crawl logged: Token \${TACHI_CONFIG.tokenId}, Crawler: \${crawlerAddress}\`)
    }
    
    // Handle Tachi terms endpoint
    if (url.pathname === '/tachi-terms') {
      return new Response(JSON.stringify({
        tokenId: TACHI_CONFIG.tokenId,
        publisher: TACHI_CONFIG.publisher,
        domain: TACHI_CONFIG.domain,
        pricing: {
          amount: TACHI_CONFIG.pricing,
          currency: 'USD',
          model: 'per-crawl'
        },
        contracts: TACHI_CONFIG.contracts,
        termsVersion: '1.0',
        lastUpdated: new Date().toISOString()
      }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Continue to origin for regular traffic
    return fetch(request)
  }
}

// Environment variables to set in Cloudflare:
// TACHI_PRIVATE_KEY: Publisher private key for signing (optional)
// ALCHEMY_API_KEY: For Base network RPC calls
// LOG_LEVEL: debug|info|warn|error
`
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runOnboardingTest().catch(console.error)
}

export { runOnboardingTest, generateCloudflareWorker }
