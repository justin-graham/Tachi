# Cloudflare Worker Deployment Guide

## Complete Step-by-Step Guide for Publishers

This guide provides detailed instructions for deploying Tachi Protocol protection using Cloudflare Workers.

## Prerequisites Checklist

- ✅ **Cloudflare Account**: Free tier is sufficient
- ✅ **Domain Access**: Either DNS control or existing Cloudflare-managed domain  
- ✅ **Base Network Wallet**: MetaMask, Coinbase Wallet, or compatible
- ✅ **Publisher License**: Minted through [Tachi Dashboard](https://dashboard.tachi.network)
- ✅ **Minimal Funding**: ~0.01 ETH for gas fees

## Step 1: Install Wrangler CLI

### Option A: Global Installation (Recommended)

```bash
npm install -g wrangler
```

### Option B: Project-Specific Installation

```bash
mkdir tachi-protection
cd tachi-protection
npm init -y
npm install --save-dev wrangler
```

### Verify Installation

```bash
wrangler --version
# Should show version 4.24.0 or higher
```

## Step 2: Authenticate with Cloudflare

### Interactive Login

```bash
wrangler login
```

This will:
1. Open your browser
2. Redirect to Cloudflare login
3. Ask for permission to access your account
4. Store authentication token locally

### Alternative: API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Set token in environment:

```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
```

## Step 3: Generate Worker Code

### Option A: Use Tachi Dashboard (Recommended)

1. Visit [Tachi Dashboard](https://dashboard.tachi.network)
2. Connect your wallet
3. Navigate to "Worker Generator"
4. Configure settings:
   - **Publisher Address**: Your wallet address
   - **Default Price**: e.g., "0.01" USDC
   - **Protected Paths**: e.g., "/api,/premium,/research"
   - **Terms URL**: Link to your terms of service
5. Click "Generate Worker Code"
6. Copy the generated code

### Option B: Manual Template

Save this as `src/index.js`:

```javascript
/**
 * Tachi Protocol Protection Worker
 * Generated for: YOUR_DOMAIN
 * Version: 1.0.0
 */

// Configuration - UPDATE THESE VALUES
const CONFIG = {
  PUBLISHER_WALLET: '0xYOUR_WALLET_ADDRESS_HERE',
  CRAWL_PRICE_USDC: '0.01',
  PROTECTED_PATHS: ['/api', '/premium', '/research'],
  CRAWL_NFT_CONTRACT: '0xa974E189038f5b0dEcEbfCe7B0A108824acF3813',
  PAYMENT_PROCESSOR: '0xBbe8D73B6B44652A5Fb20678bFa27b785Bb7Df41',
  PROOF_OF_CRAWL_LEDGER: '0xA20e592e294FEbb5ABc758308b15FED437AB1EF9',
  TERMS_URL: 'https://yoursite.com/terms',
  BASE_SEPOLIA_RPC: 'https://sepolia.base.org',
  CHAIN_ID: 84532 // Base Sepolia
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS handling
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }
    
    try {
      // Check if path needs protection
      const needsPayment = CONFIG.PROTECTED_PATHS.some(path => 
        url.pathname.startsWith(path)
      );
      
      if (!needsPayment) {
        // Allow unprotected content through
        return await fetch(request);
      }
      
      // Extract payment headers
      const paymentTx = request.headers.get('X-Payment-Transaction');
      const paymentAmount = request.headers.get('X-Payment-Amount');
      const payerAddress = request.headers.get('X-Payer-Address');
      
      if (paymentTx && paymentAmount && payerAddress) {
        console.log(`Verifying payment: ${paymentTx}`);
        
        // Verify payment on-chain
        const isValid = await verifyPayment(
          paymentTx,
          CONFIG.PUBLISHER_WALLET,
          paymentAmount,
          payerAddress
        );
        
        if (isValid) {
          console.log('Payment verified - granting access');
          // Log the successful crawl
          await logCrawlActivity(url.pathname, payerAddress, paymentAmount);
          
          // Payment verified - allow access with CORS headers
          const response = await fetch(request);
          return addCORSHeaders(response);
        } else {
          console.log('Payment verification failed');
        }
      }
      
      // Return payment required response
      console.log(`Payment required for: ${url.pathname}`);
      return new Response(JSON.stringify({
        error: 'Payment required',
        payment_details: {
          publisher_address: CONFIG.PUBLISHER_WALLET,
          price_usdc: CONFIG.CRAWL_PRICE_USDC,
          payment_processor: CONFIG.PAYMENT_PROCESSOR,
          chain_id: CONFIG.CHAIN_ID,
          currency: 'USDC',
          terms_url: CONFIG.TERMS_URL
        },
        content_hash: await hashContent(url.pathname),
        timestamp: Date.now()
      }), {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-Required': 'true',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Payment-Transaction, X-Payment-Amount, X-Payer-Address'
        }
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

/**
 * Verify payment transaction on Base Sepolia
 */
async function verifyPayment(txHash, expectedPublisher, expectedAmount, payer) {
  try {
    // Get transaction details from Base Sepolia
    const response = await fetch(CONFIG.BASE_SEPOLIA_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1
      })
    });
    
    const result = await response.json();
    
    if (!result.result) {
      console.log('Transaction not found');
      return false;
    }
    
    const tx = result.result;
    
    // Basic verification checks
    const isToCorrectContract = tx.to && 
      tx.to.toLowerCase() === CONFIG.PAYMENT_PROCESSOR.toLowerCase();
    const isFromCorrectPayer = tx.from && 
      tx.from.toLowerCase() === payer.toLowerCase();
    
    // Additional verification: check if transaction is confirmed
    const receiptResponse = await fetch(CONFIG.BASE_SEPOLIA_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 2
      })
    });
    
    const receiptResult = await receiptResponse.json();
    const isConfirmed = receiptResult.result && receiptResult.result.status === '0x1';
    
    console.log('Payment verification:', {
      txHash,
      isToCorrectContract,
      isFromCorrectPayer,
      isConfirmed,
      contractAddress: tx.to,
      expectedContract: CONFIG.PAYMENT_PROCESSOR
    });
    
    return isToCorrectContract && isFromCorrectPayer && isConfirmed;
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}

/**
 * Log crawl activity (optional)
 */
async function logCrawlActivity(path, payer, amount) {
  try {
    // This could be enhanced to log to the ProofOfCrawlLedger contract
    console.log('Crawl logged:', {
      path,
      payer,
      amount,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Logging error:', error);
  }
}

/**
 * Generate content hash
 */
async function hashContent(path) {
  const encoder = new TextEncoder();
  const data = encoder.encode(path + Date.now());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Payment-Transaction, X-Payment-Amount, X-Payer-Address',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Add CORS headers to response
 */
function addCORSHeaders(response) {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Payment-Transaction, X-Payment-Amount, X-Payer-Address');
  return newResponse;
}
```

## Step 4: Create Project Structure

### Initialize Worker Project

```bash
mkdir tachi-protection
cd tachi-protection
wrangler init --yes
```

### Project Structure

```
tachi-protection/
├── wrangler.toml         # Configuration file
├── package.json          # Dependencies
├── src/
│   └── index.js         # Worker code
└── .env                 # Environment variables (optional)
```

## Step 5: Configure wrangler.toml

Create or update `wrangler.toml`:

```toml
name = "tachi-protection"
main = "src/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Environment variables (optional - can also use wrangler secret)
[vars]
PUBLISHER_WALLET = "0xYOUR_WALLET_ADDRESS"
CRAWL_PRICE_USDC = "0.01"
PROTECTED_PATHS = "/api,/premium,/research"

# Staging environment
[env.staging]
name = "tachi-protection-staging"
route = "staging.yoursite.com/*"

# Production environment  
[env.production]
name = "tachi-protection-prod"
route = "yoursite.com/*"

# Custom domains (optional)
[[env.production.routes]]
pattern = "yoursite.com/api/*"
custom_domain = true

[[env.production.routes]]
pattern = "yoursite.com/premium/*"
custom_domain = true
```

## Step 6: Secure Configuration

### Option A: Environment Variables

```bash
# Set secrets using wrangler
wrangler secret put PUBLISHER_WALLET
# Enter your wallet address when prompted

wrangler secret put CRAWL_PRICE_USDC  
# Enter your price (e.g., "0.01")
```

### Option B: Local .env File (Development Only)

Create `.env` file:

```bash
PUBLISHER_WALLET=0xYOUR_WALLET_ADDRESS
CRAWL_PRICE_USDC=0.01
PROTECTED_PATHS=/api,/premium,/research
TERMS_URL=https://yoursite.com/terms
```

⚠️ **Never commit .env to version control!**

Add to `.gitignore`:

```gitignore
.env
node_modules/
.wrangler/
```

## Step 7: Test Locally

### Start Development Server

```bash
wrangler dev
```

This will:
1. Start local development server (usually http://localhost:8787)
2. Enable hot reloading
3. Show real-time logs

### Test Protection

```bash
# Test unprotected path (should work normally)
curl http://localhost:8787/public/test

# Test protected path (should return 402)
curl -v http://localhost:8787/api/test

# Expected response:
# HTTP/1.1 402 Payment Required
# Content-Type: application/json
# {
#   "error": "Payment required",
#   "payment_details": { ... }
# }
```

### Test with Payment Headers

```bash
# Test with payment headers (after making actual payment)
curl -H "X-Payment-Transaction: 0x..." \
     -H "X-Payment-Amount: 0.01" \
     -H "X-Payer-Address: 0x..." \
     http://localhost:8787/api/test
```

## Step 8: Deploy to Staging

### Deploy Staging Environment

```bash
wrangler deploy --env staging
```

### Verify Staging Deployment

```bash
# Test staging deployment
curl -v https://tachi-protection-staging.your-subdomain.workers.dev/api/test

# Should return 402 Payment Required
```

### Check Logs

```bash
wrangler tail --env staging
```

## Step 9: Configure Routes and Domains

### Option A: Worker Routes (Free)

In Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Go to "Settings" → "Triggers"
4. Add routes:
   - `yoursite.com/api/*`
   - `yoursite.com/premium/*`

### Option B: Custom Domains (Paid)

1. Add custom domain in worker settings
2. Configure DNS:
   ```
   CNAME api yoursite.com
   CNAME premium yoursite.com
   ```

### Option C: Route Patterns

Update `wrangler.toml`:

```toml
[[routes]]
pattern = "yoursite.com/api/*"
zone_name = "yoursite.com"

[[routes]]
pattern = "yoursite.com/premium/*"
zone_name = "yoursite.com"
```

## Step 10: Deploy to Production

### Final Configuration Check

```bash
# Verify all settings
wrangler whoami
wrangler secret list --env production
```

### Production Deployment

```bash
wrangler deploy --env production
```

### Verify Production

```bash
# Test production endpoints
curl -v https://yoursite.com/api/test

# Should return 402 Payment Required with correct payment details
```

## Step 11: Monitor and Maintain

### Monitor Logs

```bash
# Real-time logs
wrangler tail --env production

# Filter for errors
wrangler tail --env production --format json | grep ERROR
```

### Analytics and Metrics

View in Cloudflare Dashboard:
1. Workers & Pages → Your Worker
2. Analytics tab
3. Monitor:
   - Request volume
   - Success rates
   - Error rates
   - Response times

### Update Worker

```bash
# Update code
vim src/index.js

# Test locally
wrangler dev

# Deploy update
wrangler deploy --env production
```

## Troubleshooting

### Common Issues

#### 1. "Unauthorized" Error

```bash
# Re-authenticate
wrangler login --scoped

# Or use API token
export CLOUDFLARE_API_TOKEN="your-token"
```

#### 2. Route Not Working

Check:
- DNS is pointing to Cloudflare
- Zone is active in Cloudflare
- Route patterns match exactly
- Worker is deployed to correct environment

#### 3. Payment Verification Failing

Debug with:
```javascript
// Add debugging to worker
console.log('Payment verification debug:', {
  txHash,
  expectedPublisher: CONFIG.PUBLISHER_WALLET,
  actualTo: tx.to,
  expectedPayer: payer,
  actualFrom: tx.from
});
```

#### 4. CORS Issues

Ensure CORS headers are included:
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Payment-Transaction, X-Payment-Amount, X-Payer-Address'
}
```

### Debug Tools

#### Check Worker Status

```bash
# List all workers
wrangler list

# Get worker details
wrangler inspect tachi-protection

# Check routes
wrangler route list
```

#### Test RPC Connection

```javascript
// Add to worker for testing
async function testRPC() {
  try {
    const response = await fetch('https://sepolia.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });
    
    const result = await response.json();
    console.log('RPC test:', result);
    return result;
  } catch (error) {
    console.error('RPC test failed:', error);
    return null;
  }
}
```

### Performance Optimization

#### Cache Payment Verifications

```javascript
// Add to worker
const paymentCache = new Map();

async function verifyPaymentCached(txHash, ...args) {
  if (paymentCache.has(txHash)) {
    return paymentCache.get(txHash);
  }
  
  const result = await verifyPayment(txHash, ...args);
  
  // Cache for 10 minutes
  paymentCache.set(txHash, result);
  setTimeout(() => paymentCache.delete(txHash), 600000);
  
  return result;
}
```

#### Rate Limiting

```javascript
// Add rate limiting per IP
const rateLimits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, []);
  }
  
  const requests = rateLimits.get(ip)
    .filter(time => time > windowStart);
  
  if (requests.length >= 10) { // Max 10 requests per minute
    return false;
  }
  
  requests.push(now);
  rateLimits.set(ip, requests);
  return true;
}
```

## Advanced Configuration

### Multiple Pricing Tiers

```javascript
// Dynamic pricing based on content type
function getPrice(path, userAgent) {
  const basePrices = {
    '/api/basic': '0.001',
    '/api/premium': '0.01',
    '/research/': '0.10',
    '/exclusive/': '1.00'
  };
  
  // AI crawler detection
  const aiMultipliers = {
    'openai': 2.0,
    'anthropic': 2.0,
    'google': 1.5,
    'microsoft': 1.5
  };
  
  let basePrice = parseFloat(basePrices[path] || CONFIG.CRAWL_PRICE_USDC);
  
  // Apply AI multiplier
  for (const [crawler, multiplier] of Object.entries(aiMultipliers)) {
    if (userAgent.toLowerCase().includes(crawler)) {
      basePrice *= multiplier;
      break;
    }
  }
  
  return basePrice.toFixed(6);
}
```

### Content Filtering

```javascript
// Filter content based on payment amount
function filterContent(content, paymentAmount) {
  const price = parseFloat(paymentAmount);
  
  if (price >= 1.0) {
    return content; // Full access
  } else if (price >= 0.1) {
    return content.substring(0, content.length * 0.8); // 80% access
  } else {
    return content.substring(0, content.length * 0.5); // 50% access
  }
}
```

### Analytics Integration

```javascript
// Send analytics to external service
async function logAnalytics(event) {
  try {
    await fetch('https://analytics.yoursite.com/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'crawl_event',
        data: event,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
}
```

## Security Best Practices

### 1. Validate All Inputs

```javascript
function validatePaymentHeaders(tx, amount, payer) {
  // Validate transaction hash format
  if (!/^0x[a-fA-F0-9]{64}$/.test(tx)) {
    return false;
  }
  
  // Validate amount format
  if (!/^\d+(\.\d+)?$/.test(amount)) {
    return false;
  }
  
  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(payer)) {
    return false;
  }
  
  return true;
}
```

### 2. Rate Limiting

```javascript
// Implement comprehensive rate limiting
const RATE_LIMITS = {
  perIP: { requests: 100, window: 3600000 }, // 100/hour
  perPayer: { requests: 1000, window: 3600000 } // 1000/hour
};
```

### 3. Error Handling

```javascript
// Secure error responses
function handleError(error, request) {
  console.error('Worker error:', error);
  
  // Don't expose internal errors to clients
  return new Response('Service temporarily unavailable', {
    status: 503,
    headers: {
      'Retry-After': '60',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
```

## Support and Next Steps

### Getting Help

- **Documentation**: [docs.tachi.network](https://docs.tachi.network)
- **GitHub Issues**: [github.com/justin-graham/Tachi/issues](https://github.com/justin-graham/Tachi/issues)
- **Discord**: [discord.gg/tachi](https://discord.gg/tachi)
- **Email**: support@tachi.network

### Cloudflare Resources

- **Wrangler Docs**: [developers.cloudflare.com/workers/wrangler/](https://developers.cloudflare.com/workers/wrangler/)
- **Workers Platform**: [developers.cloudflare.com/workers/](https://developers.cloudflare.com/workers/)
- **Community**: [community.cloudflare.com](https://community.cloudflare.com)

### Next Steps

1. **Monitor Analytics**: Track crawl patterns and revenue
2. **Optimize Pricing**: Adjust based on demand and competition
3. **Scale Protection**: Add more content types and endpoints
4. **Community Engagement**: Share experiences with other publishers
5. **Production Deployment**: Move from testnet to mainnet when ready
