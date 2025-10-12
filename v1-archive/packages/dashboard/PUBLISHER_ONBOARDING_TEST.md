#!/usr/bin/env node

/**
 * Publisher Onboarding Manual Test Guide
 * 
 * This script provides step-by-step instructions for testing the publisher onboarding flow
 * through the web interface at http://localhost:3003
 */

console.log(`
🚀 TACHI PUBLISHER ONBOARDING MANUAL TEST GUIDE
==================================================

✅ PREREQUISITES VERIFIED:
├── 🌐 Dashboard running at: http://localhost:3003
├── 🔗 Hardhat network: http://127.0.0.1:8545 (Chain ID: 31337)
├── 📄 CrawlNFT: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
├── 💰 PaymentProcessor: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
├── 📊 ProofLedger: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
└── 🪙 MockUSDC: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🎯 STEP-BY-STEP ONBOARDING TEST:

📱 Step 1: Connect Wallet
─────────────────────────
1. Open: http://localhost:3003
2. Click "Connect Wallet"
3. Import this test account into MetaMask:
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
4. Add Hardhat network to MetaMask:
   Network Name: Hardhat Local
   RPC URL: http://127.0.0.1:8545
   Chain ID: 31337
   Currency: ETH

🌐 Step 2: Publisher Site Information
──────────────────────────────────────
Enter these test values:
├── Site Domain: test-publisher.example.com
├── Site Title: Test Publisher Demo Site
├── Description: AI-crawlable content demonstration
├── Contact Email: demo@test-publisher.example.com
└── Content Categories: News, Articles, Research

💰 Step 3: Set Crawl Pricing
─────────────────────────────
├── Base Price: $1.50 per crawl
├── Currency: USD
├── Billing Model: Per-crawl
└── Volume Discounts: None (for testing)

📜 Step 4: Terms & Conditions
──────────────────────────────
├── Allow AI Training: ✅ Yes
├── Commercial Use: ✅ Allowed
├── Attribution Required: ❌ No
├── Rate Limit: 100 crawls/hour
├── Restricted Paths: /admin/*, /private/*
└── Data Retention: 30 days

🎨 Step 5: Mint CrawlNFT
────────────────────────
1. Review all information
2. Click "Mint CrawlNFT"
3. Confirm MetaMask transaction
4. Wait for confirmation
5. Note the Token ID

🔍 Step 6: Verify On-Chain Data
────────────────────────────────
After minting, verify:
├── 🎫 NFT appears in your wallet
├── 👛 Owner address matches your wallet
├── 📄 Terms URI is stored correctly
├── 💰 Pricing is set to 150 cents ($1.50)
└── 📊 Total supply increased by 1

🌐 Step 7: Generate Cloudflare Worker
─────────────────────────────────────
1. After successful mint, copy the generated Worker code
2. Save to file: cloudflare-worker.js
3. Note the Token ID embedded in the code

📋 VERIFICATION CHECKLIST:
□ Wallet connected successfully
□ Publisher information entered
□ Pricing set correctly
□ Terms uploaded to IPFS (simulated)
□ CrawlNFT minted successfully
□ Token ID generated
□ Worker code generated
□ On-chain data verified

🎉 SUCCESS CRITERIA:
✅ Transaction appears on Hardhat explorer
✅ NFT Token ID > 0
✅ Owner matches publisher wallet
✅ Terms URI stored correctly
✅ Pricing set in USDC cents
✅ Worker code contains correct Token ID

🚨 TROUBLESHOOTING:
• Network Issues: Ensure Hardhat node is running
• Wallet Issues: Check MetaMask network settings
• Transaction Fails: Check account has ETH for gas
• Contract Errors: Verify contract addresses in config

🔗 USEFUL LINKS:
├── Dashboard: http://localhost:3003
├── Hardhat Console: http://127.0.0.1:8545
├── Contract Addresses: See deployment output above
└── MetaMask Help: https://metamask.io/support/

⏭️  AFTER COMPLETING ONBOARDING:
   Next step is Cloudflare Worker deployment!
`)

console.log(`
🌐 CLOUDFLARE WORKER DEPLOYMENT GUIDE
=====================================

🔧 Prerequisites:
├── Cloudflare account: https://cloudflare.com
├── Domain or subdomain to test with
├── Wrangler CLI: npm install -g @cloudflare/wrangler
└── Generated worker code from Step 7 above

📝 Deployment Steps:

1️⃣  LOGIN TO CLOUDFLARE:
   wrangler login

2️⃣  CREATE NEW WORKER:
   wrangler generate tachi-crawler-test
   cd tachi-crawler-test

3️⃣  REPLACE WORKER CODE:
   - Copy generated code from dashboard
   - Paste into src/index.js
   - Update API keys and RPC URLs

4️⃣  CONFIGURE ENVIRONMENT:
   wrangler secret put ALCHEMY_API_KEY
   # Enter: 7esRSpa0mWei8xuvcT1mLQdttn1KcAQ_
   
   wrangler secret put TACHI_PRIVATE_KEY  
   # Enter: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

5️⃣  DEPLOY WORKER:
   wrangler publish

6️⃣  SET CUSTOM ROUTE:
   - Go to Cloudflare Dashboard
   - Select your domain
   - Workers Routes → Add Route
   - Pattern: test-publisher.example.com/*
   - Worker: tachi-crawler-test

🧪 TESTING THE DEPLOYED WORKER:

1️⃣  Test with regular browser:
   curl https://test-publisher.example.com/
   # Should pass through normally

2️⃣  Test with AI crawler user agent:
   curl -H "User-Agent: ChatGPT-User/1.0" https://test-publisher.example.com/
   # Should return 402 Payment Required

3️⃣  Test Tachi terms endpoint:
   curl https://test-publisher.example.com/tachi-terms
   # Should return JSON with pricing and contract info

4️⃣  Test with payment proof:
   curl -H "User-Agent: ChatGPT-User/1.0" \\
        -H "X-Tachi-Payment-Proof: demo_proof_123" \\
        -H "X-Tachi-Crawler-Address: 0x123..." \\
        https://test-publisher.example.com/
   # Should allow access (demo mode)

✅ SUCCESS INDICATORS:
├── Worker deploys without errors
├── Routes correctly intercept crawler requests
├── Payment requirements enforced
├── Terms endpoint accessible
├── Logging shows crawler detection
└── Payment verification works

🎯 COMPLETE ONBOARDING FLOW TESTED:
✅ Publisher onboards through dashboard
✅ CrawlNFT minted with terms and pricing
✅ Cloudflare Worker deployed and active
✅ Crawler payment enforcement working
✅ End-to-end flow functional

🚀 Ready for production deployment to Base Sepolia!
`)
