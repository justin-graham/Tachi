# Publisher Integration Guide

## Complete Setup Guide for Website Publishers

This guide walks you through setting up Tachi Protocol protection on your website to monetize AI crawler access.

## Prerequisites

- **Cloudflare Account**: With Workers enabled (free tier sufficient)
- **Base Network Wallet**: MetaMask, Coinbase Wallet, or similar
- **Minimal Funding**: ~0.01 ETH for gas fees
- **Domain Access**: Ability to modify DNS or deploy workers

## Step 1: Get Your Publisher License

### Option A: Use the Dashboard (Recommended)

1. Visit [Tachi Dashboard](https://dashboard.tachi.network)
2. Connect your wallet (Base Sepolia for testing, Base Mainnet for production)
3. Click "Mint Publisher License"
4. Sign the transaction (costs ~$0.50 in gas)
5. Wait for confirmation (~30 seconds)

### Option B: Direct Contract Interaction

```javascript
// Using ethers.js
const contract = new ethers.Contract(
    '0xa974E189038f5b0dEcEbfCe7B0A108824acF3813', // CrawlNFT contract
    ['function mintMyLicense(string termsURI)'],
    wallet
);

await contract.mintMyLicense('https://yoursite.com/terms');
```

## Step 2: Configure Pricing Strategy

### Pricing Recommendations

- **API Endpoints**: $0.01 - $0.10 per request
- **Blog Articles**: $0.001 - $0.01 per article  
- **Premium Content**: $0.10 - $1.00 per access
- **Research Papers**: $1.00 - $10.00 per paper

### Dynamic Pricing Example

```javascript
function getPrice(path, userAgent) {
    // Base pricing
    const basePrices = {
        '/api/': 0.05,
        '/blog/': 0.01,
        '/premium/': 0.50,
        '/research/': 2.00
    };
    
    // AI crawler detection and pricing
    const aiCrawlers = {
        'openai': 1.5,    // 50% premium
        'anthropic': 1.5,
        'google': 1.2,
        'generic': 1.0
    };
    
    let basePrice = basePrices[path] || 0.01;
    let multiplier = 1.0;
    
    // Detect crawler type
    for (const [crawler, mult] of Object.entries(aiCrawlers)) {
        if (userAgent.toLowerCase().includes(crawler)) {
            multiplier = mult;
            break;
        }
    }
    
    return (basePrice * multiplier).toFixed(4);
}
```

## Step 3: Generate Cloudflare Worker Code

### Using the Dashboard

1. Go to "Worker Generator" in the dashboard
2. Enter your configuration:
   - **Publisher Address**: Your wallet address
   - **Default Price**: e.g., "0.01"
   - **Protected Paths**: e.g., "/api,/premium"
   - **Terms URL**: Link to your terms of service
3. Copy the generated code

### Manual Template

```javascript
// Generated Tachi Protection Worker
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Configuration
        const CONFIG = {
            PUBLISHER_WALLET: '0xYOUR_WALLET_ADDRESS',
            CRAWL_PRICE_USDC: '0.01',
            PROTECTED_PATHS: ['/api', '/premium'],
            CRAWL_NFT_CONTRACT: '0xa974E189038f5b0dEcEbfCe7B0A108824acF3813',
            PAYMENT_PROCESSOR: '0xBbe8D73B6B44652A5Fb20678bFa27b785Bb7Df41',
            TERMS_URL: 'https://yoursite.com/terms'
        };
        
        // Check if path needs protection
        const needsPayment = CONFIG.PROTECTED_PATHS.some(path => 
            url.pathname.startsWith(path)
        );
        
        if (!needsPayment) {
            return fetch(request);
        }
        
        // Check for payment headers
        const paymentTx = request.headers.get('X-Payment-Transaction');
        const paymentAmount = request.headers.get('X-Payment-Amount');
        const payerAddress = request.headers.get('X-Payer-Address');
        
        if (paymentTx && paymentAmount && payerAddress) {
            // Verify payment on-chain
            const isValid = await verifyPayment(
                paymentTx, 
                CONFIG.PUBLISHER_WALLET,
                paymentAmount,
                payerAddress
            );
            
            if (isValid) {
                // Payment verified - allow access
                return fetch(request);
            }
        }
        
        // Return payment required
        return new Response(JSON.stringify({
            error: 'Payment required',
            payment_details: {
                publisher_address: CONFIG.PUBLISHER_WALLET,
                price_usdc: CONFIG.CRAWL_PRICE_USDC,
                payment_processor: CONFIG.PAYMENT_PROCESSOR,
                chain_id: 84532, // Base Sepolia
                currency: 'USDC',
                terms_url: CONFIG.TERMS_URL
            },
            content_hash: await hashContent(url.pathname),
            timestamp: Date.now()
        }), {
            status: 402,
            headers: {
                'Content-Type': 'application/json',
                'X-Payment-Required': 'true'
            }
        });
    }
};

async function verifyPayment(txHash, publisher, amount, payer) {
    // Implementation depends on your verification strategy
    // Can use blockchain RPC calls or trusted oracle
    try {
        const response = await fetch(`https://sepolia.base.org`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionByHash',
                params: [txHash],
                id: 1
            })
        });
        
        const result = await response.json();
        // Verify transaction details match expected payment
        return result.result && 
               result.result.to.toLowerCase() === publisher.toLowerCase();
    } catch (error) {
        console.error('Payment verification failed:', error);
        return false;
    }
}

async function hashContent(path) {
    const encoder = new TextEncoder();
    const data = encoder.encode(path + Date.now());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

## Step 4: Deploy to Cloudflare

### Prerequisites

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate**:
   ```bash
   wrangler login
   ```

### Create Worker Project

1. **Initialize Project**:
   ```bash
   mkdir tachi-protection
   cd tachi-protection
   wrangler init
   ```

2. **Configure wrangler.toml**:
   ```toml
   name = "tachi-protection"
   main = "src/index.js"
   compatibility_date = "2024-01-01"
   
   [vars]
   PUBLISHER_WALLET = "0xYOUR_WALLET_ADDRESS"
   CRAWL_PRICE_USDC = "0.01"
   PROTECTED_PATHS = "/api,/premium"
   
   [env.staging]
   name = "tachi-protection-staging"
   
   [env.production]
   name = "tachi-protection-prod"
   ```

3. **Add Worker Code**:
   - Save the generated code to `src/index.js`
   - Test locally: `wrangler dev`

4. **Deploy**:
   ```bash
   # Deploy to staging
   wrangler deploy --env staging
   
   # Deploy to production
   wrangler deploy --env production
   ```

### Route Configuration

1. **Add Custom Domain** (in Cloudflare Dashboard):
   - Go to Workers & Pages → Your Worker
   - Click "Add Custom Domain"
   - Enter your domain: `api.yoursite.com`

2. **Set Up Route Patterns**:
   ```
   yoursite.com/api/*
   yoursite.com/premium/*
   *.yoursite.com/*
   ```

## Step 5: Testing Your Setup

### Test Protection is Working

```bash
# Should return 402 Payment Required
curl -v https://yoursite.com/api/protected

# Expected response:
# HTTP/1.1 402 Payment Required
# Content-Type: application/json
# {
#   "error": "Payment required",
#   "payment_details": { ... }
# }
```

### Test with Payment

```bash
# With payment headers (after making payment)
curl -H "X-Payment-Transaction: 0x..." \
     -H "X-Payment-Amount: 0.01" \
     -H "X-Payer-Address: 0x..." \
     https://yoursite.com/api/protected
```

### Automated Testing Script

```javascript
// test-protection.js
async function testProtection() {
    const testUrls = [
        'https://yoursite.com/api/test',
        'https://yoursite.com/premium/content'
    ];
    
    for (const url of testUrls) {
        console.log(`Testing: ${url}`);
        
        const response = await fetch(url);
        
        if (response.status === 402) {
            console.log('✅ Protection working');
            const data = await response.json();
            console.log(`Price: ${data.payment_details.price_usdc} USDC`);
        } else {
            console.log('❌ Protection not working');
        }
    }
}

testProtection();
```

## Step 6: Monitor and Optimize

### Dashboard Analytics

Monitor your earnings and crawl activity through the Tachi Dashboard:

- **Total Earnings**: Real-time USDC earnings
- **Crawl Activity**: Requests per day/hour
- **Top Crawlers**: Which AI companies are accessing your content
- **Popular Content**: Most accessed endpoints

### Performance Optimization

1. **Cache Payment Verifications**:
   ```javascript
   // In your worker
   const paymentCache = new Map();
   
   async function verifyPaymentCached(txHash) {
       if (paymentCache.has(txHash)) {
           return paymentCache.get(txHash);
       }
       
       const result = await verifyPayment(txHash);
       paymentCache.set(txHash, result);
       
       // Cache for 1 hour
       setTimeout(() => paymentCache.delete(txHash), 3600000);
       
       return result;
   }
   ```

2. **Rate Limiting**:
   ```javascript
   // Add rate limiting per payer
   const rateLimits = new Map();
   
   function checkRateLimit(payerAddress) {
       const now = Date.now();
       const windowStart = now - 60000; // 1 minute window
       
       if (!rateLimits.has(payerAddress)) {
           rateLimits.set(payerAddress, []);
       }
       
       const requests = rateLimits.get(payerAddress)
           .filter(time => time > windowStart);
       
       if (requests.length >= 10) { // Max 10 requests per minute
           return false;
       }
       
       requests.push(now);
       rateLimits.set(payerAddress, requests);
       return true;
   }
   ```

### Revenue Optimization

1. **A/B Test Pricing**: Try different prices for different content types
2. **Dynamic Pricing**: Adjust prices based on demand
3. **Bundle Deals**: Offer discounts for bulk access
4. **Premium Tiers**: Different pricing for different crawler types

## Troubleshooting

### Common Issues

1. **Worker Not Triggering 402**:
   - Check route configuration
   - Verify protected paths in code
   - Test with curl/Postman

2. **Payment Verification Failing**:
   - Check RPC endpoint connectivity
   - Verify contract addresses
   - Ensure transaction finality

3. **Performance Issues**:
   - Implement caching
   - Use KV storage for frequently accessed data
   - Optimize payment verification logic

### Debug Mode

```javascript
// Add debug logging to your worker
const DEBUG = true;

function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[TACHI DEBUG] ${message}`, data);
    }
}

// Use throughout your worker
debugLog('Processing request', { url: request.url });
debugLog('Payment verification result', { isValid, txHash });
```

## Advanced Configuration

### Multi-Chain Support

```javascript
const NETWORKS = {
    'base-sepolia': {
        chainId: 84532,
        rpcUrl: 'https://sepolia.base.org',
        contracts: {
            crawlNft: '0xa974E189038f5b0dEcEbfCe7B0A108824acF3813'
        }
    },
    'base-mainnet': {
        chainId: 8453,
        rpcUrl: 'https://mainnet.base.org',
        contracts: {
            crawlNft: '0x...' // Production address
        }
    }
};
```

### Content-Based Pricing

```javascript
function getContentPrice(content) {
    const wordCount = content.split(' ').length;
    const basePrice = 0.001; // $0.001 per word
    
    // Premium content multipliers
    if (content.includes('exclusive') || content.includes('premium')) {
        return Math.max(basePrice * wordCount * 2, 0.10);
    }
    
    return Math.max(basePrice * wordCount, 0.01);
}
```

## Support and Resources

- **Dashboard**: [dashboard.tachi.network](https://dashboard.tachi.network)
- **Documentation**: [docs.tachi.network](https://docs.tachi.network)
- **GitHub Issues**: [github.com/justin-graham/Tachi/issues](https://github.com/justin-graham/Tachi/issues)
- **Discord Support**: [discord.gg/tachi](https://discord.gg/tachi)

## Next Steps

After successful deployment:

1. **Test with Real Crawlers**: Monitor actual AI crawler behavior
2. **Optimize Pricing**: Adjust based on demand and competition  
3. **Scale Protection**: Add more content types and endpoints
4. **Community**: Join the Tachi publisher community for best practices
