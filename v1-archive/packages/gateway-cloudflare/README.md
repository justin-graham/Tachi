# Cloudflare Gateway Deployment Guide

This comprehensive guide explains how to deploy the Tachi Pay-Per-Crawl gateway on Cloudflare Workers with production-ready features including security hardening, monitoring, and performance optimization.

## Overview

The Cloudflare Gateway is a serverless edge function that:
1. Intercepts HTTP requests to publisher websites
2. Identifies AI crawlers by User-Agent patterns
3. Enforces payment requirements via HTTP 402 responses
4. Verifies payment proofs by checking blockchain transactions
5. Logs successful crawls on-chain via ProofOfCrawlLedger
6. Delivers content after successful payment verification

## Prerequisites

- **Cloudflare account** with Workers enabled (free tier sufficient)
- **Base network RPC endpoint** (Alchemy or Base official RPC)
- **Deployed Tachi contracts** - see [Contract Addresses](../../docs/CONTRACT_ADDRESSES.md)
- **Private key** for logging crawls (dedicated wallet recommended)
- **Basic knowledge** of Cloudflare Workers and environment variables
- **USDC balance** for testing payments (testnet USDC available from faucets)

## Installation

1. **Install Dependencies**
   ```bash
   cd packages/gateway-cloudflare
   npm install
   ```

2. **Configure Environment Variables**
   Create or update `wrangler.toml` with your contract addresses:
   ```toml
   name = "tachi-gateway"
   compatibility_date = "2024-01-01"
   
   [vars]
   # Network Configuration
   BASE_RPC_URL = "https://base-mainnet.alchemyapi.io/v2/YOUR-API-KEY"
   ENVIRONMENT = "production" # or "development"
   
   # Contract Addresses (see docs/CONTRACT_ADDRESSES.md)
   PAYMENT_PROCESSOR_ADDRESS = "0x..." # Your deployed PaymentProcessor
   PROOF_OF_CRAWL_LEDGER_ADDRESS = "0x..." # Your deployed ProofOfCrawlLedger  
   USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" # Base USDC
   
   # Publisher Configuration
   PUBLISHER_ADDRESS = "0x..." # Publisher's wallet address
   CRAWL_TOKEN_ID = "1" # Publisher's CrawlNFT token ID
   PRICE_USDC = "0.001" # Price per crawl in USDC (0.001 = $0.001)
   
   # Security Configuration
   RATE_LIMIT_REQUESTS = "100" # Requests per minute per IP
   MAX_REQUEST_SIZE = "10485760" # 10MB max request size
   ENABLE_LOGGING = "true" # Enable security logging
   
   # Monitoring (optional)
   SENTRY_DSN = "https://your-sentry-dsn@sentry.io/project"
   BETTER_UPTIME_HEARTBEAT_URL = "https://betteruptime.com/api/v1/heartbeat/your-key"
   
   # KV Namespaces (for rate limiting and caching)
   [[kv_namespaces]]
   binding = "USED_TX_HASHES"
   id = "your-kv-namespace-id"
   ```

3. **Set Secrets**
   ```bash
   # Set the private key for logging crawls on-chain
   wrangler secret put PRIVATE_KEY
   # Enter your private key when prompted (protocol owner's key)
   ```

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BASE_RPC_URL` | Base network RPC endpoint | `https://base-mainnet.alchemyapi.io/v2/key` |
| `PAYMENT_PROCESSOR_ADDRESS` | Deployed PaymentProcessor contract | `0x1234...` |
| `PROOF_OF_CRAWL_LEDGER_ADDRESS` | Deployed ProofOfCrawlLedger contract | `0x5678...` |
| `USDC_ADDRESS` | USDC token contract on Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| `PUBLISHER_ADDRESS` | Publisher's wallet address | `0xabcd...` |
| `CRAWL_TOKEN_ID` | Publisher's CrawlNFT token ID | `1` |
| `PRICE_USDC` | Price per crawl in USDC | `0.001` |
| `PRIVATE_KEY` | Private key for logging crawls | Set via secrets |

### Network Configuration

#### Base Mainnet
```toml
BASE_RPC_URL = "https://base-mainnet.alchemyapi.io/v2/YOUR-API-KEY"
USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
```

#### Base Sepolia (Testnet)
```toml
BASE_RPC_URL = "https://base-sepolia.alchemyapi.io/v2/YOUR-API-KEY"
USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
```

### Supported AI Crawlers

The gateway detects the following AI crawlers by User-Agent:
- GPTBot (OpenAI)
- ChatGPT
- Claude (Anthropic)
- BingAI
- Googlebot
- Baiduspider
- YandexBot
- Perplexity
- You.com
- CCBot
- Meta-ExternalAgent
- Various social media bots

## Deployment

### 1. Pre-Deployment Setup

**Create KV Namespace** (for rate limiting):
```bash
# Create KV namespace for storing used transaction hashes
wrangler kv:namespace create "USED_TX_HASHES"
# Copy the returned ID to your wrangler.toml
```

**Verify Configuration**:
```bash
# Check your configuration
wrangler whoami
wrangler kv:namespace list
```

### 2. Environment-Specific Deployment

**Development Environment** (local testing):
```bash
# Start local development server
wrangler dev --local

# Test with sample requests
curl -H "User-Agent: GPTBot/1.0" http://localhost:8787/test
```

**Staging Environment** (pre-production testing):
```bash
# Deploy to staging
wrangler deploy --env staging

# Run integration tests
npm run test:gateway:staging
```

**Production Environment** (live deployment):
```bash
# Final production deployment
wrangler deploy --env production

# Verify deployment
curl -H "User-Agent: GPTBot/1.0" https://your-worker.your-subdomain.workers.dev
```

### 3. Custom Domain Setup

After deployment, configure your custom domain:

1. **Add Custom Domain in Cloudflare Dashboard**:
   - Navigate to Workers & Pages → Your Worker → Settings → Triggers
   - Click "Add Custom Domain"
   - Enter your domain (e.g., `gateway.yourdomain.com`)
   - Follow DNS configuration instructions

2. **Configure Route Patterns** (alternative to custom domain):
   ```
   yourdomain.com/*          # Protect entire domain
   yourdomain.com/api/*      # Protect API endpoints only  
   yourdomain.com/content/*  # Protect specific content paths
   ```

### 4. Performance Testing

```bash
# Run quick load test (50 concurrent requests)
npm run test:load:quick

# Run comprehensive performance test
npm run test:load:comprehensive

# Monitor performance in production
npm run test:performance:monitor
```

## Domain Configuration

After deployment, configure your domain routes:

1. **In Cloudflare Dashboard:**
   - Go to Workers & Pages > Overview
   - Select your deployed worker
   - Go to Settings > Triggers
   - Add Custom Domains or Routes

2. **Example Routes:**
   - `example.com/*` - Protect entire domain
   - `example.com/api/*` - Protect specific paths
   - `example.com/content/*` - Protect content directory

## Payment Flow

### 1. Crawler Detection
When an AI crawler requests content:
```
GET /content HTTP/1.1
Host: example.com
User-Agent: GPTBot/1.0
```

### 2. Payment Required Response
Gateway returns 402 with payment details:
```json
{
  "error": "Payment Required",
  "message": "Please send 0.001 USDC to PaymentProcessor on Base network",
  "payment": {
    "amount": "0.001",
    "currency": "USDC",
    "network": "Base",
    "chainId": 8453,
    "recipient": "0x...",
    "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "tokenId": "1"
  },
  "instructions": [
    "1. Send the specified amount of USDC to the PaymentProcessor contract",
    "2. Wait for transaction confirmation",
    "3. Retry your request with Authorization: Bearer <transaction_hash>"
  ]
}
```

### 3. Payment Verification
Crawler retries with transaction hash:
```
GET /content HTTP/1.1
Host: example.com
User-Agent: GPTBot/1.0
Authorization: Bearer 0x1234567890abcdef...
```

### 4. Content Delivery
After successful verification:
- Content is served from origin server
- Crawl is logged asynchronously on-chain
- Response includes verification headers

## Security Considerations

1. **Private Key Management**
   - Store private keys in Cloudflare Workers secrets
   - Use a dedicated key for logging (not personal funds)
   - Rotate keys periodically

2. **Rate Limiting**
   - Configure Cloudflare rate limiting rules
   - Monitor for suspicious activity
   - Set appropriate pricing to deter abuse

3. **Transaction Verification**
   - Verifies payment amount and recipient
   - Checks transaction success status
   - Validates USDC transfer events

## Monitoring

### Logs
View worker logs:
```bash
wrangler tail --env production
```

### Metrics
Monitor in Cloudflare Dashboard:
- Request volume
- Error rates
- Response times
- Payment success rates

### Debugging
Enable detailed logging:
```javascript
console.log(`AI crawler detected: ${userAgent} from ${clientIP}`);
console.log(`Payment verified for crawler: ${crawlerAddress}`);
```

## Troubleshooting

### Common Issues

1. **Payment Verification Fails**
   - Check transaction hash format
   - Verify sufficient payment amount
   - Confirm USDC contract address
   - Check Base network connectivity

2. **On-Chain Logging Errors**
   - Verify private key has sufficient ETH for gas
   - Check ProofOfCrawlLedger contract address
   - Ensure contract is not paused

3. **CORS Issues**
   - Verify CORS headers are properly set
   - Check preflight request handling
   - Ensure all required headers are allowed

### Debug Commands

```bash
# Test worker locally
wrangler dev --local

# View real-time logs
wrangler tail

# Check environment variables
wrangler secret list
```

## Cost Optimization

1. **Bundle Size**
   - Viem library is tree-shakeable
   - Only imports necessary functions
   - Optimized for edge runtime

2. **Request Efficiency**
   - Caches blockchain responses where possible
   - Async logging doesn't block responses
   - Minimal external API calls

3. **Resource Usage**
   - Uses Cloudflare's global edge network
   - Scales automatically with demand
   - No server maintenance required

## Security Features

### Rate Limiting & DDoS Protection
- **Built-in rate limiting**: 100 requests/minute per IP (configurable)
- **Request size limits**: 10MB maximum (configurable)
- **Cloudflare native DDoS protection**: Automatic traffic filtering
- **KV-based tracking**: Prevents transaction replay attacks

### Security Headers
Automatically applied to all responses:
```javascript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY', 
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'"
}
```

### Input Validation & Sanitization
- **Header validation**: Sanitizes all incoming headers
- **URL validation**: Prevents injection attacks
- **Payment proof verification**: Validates transaction formats
- **User-Agent parsing**: Secure AI crawler detection

## Monitoring & Observability  

### Real-Time Monitoring
```bash
# View live logs
wrangler tail --env production

# Monitor with filtering
wrangler tail --format json | jq '.logs[] | select(.level == "error")'
```

### Performance Metrics
Available in Cloudflare Dashboard:
- **Request volume**: Requests per second/minute/hour
- **Response times**: P50, P95, P99 latencies  
- **Error rates**: 4xx/5xx response percentages
- **Geographic distribution**: Request origins by country
- **Cache hit rates**: Origin vs edge response ratios

### Custom Analytics
```javascript
// Add custom analytics in your worker
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
  
  // Track custom metrics
  event.waitUntil(
    logAnalytics({
      userAgent: request.headers.get('User-Agent'),
      crawlerType: detectCrawlerType(request),
      paymentRequired: paymentWasRequired,
      responseTime: Date.now() - startTime
    })
  );
});
```

### Alerting Setup
Configure alerts for:
- **High error rates** (>5% 5xx responses)
- **Payment failures** (>10% payment verification failures)  
- **Performance degradation** (>2s P95 response time)
- **Unusual traffic patterns** (10x normal volume)

## Advanced Configuration

### Multi-Publisher Setup
Support multiple publishers with dynamic configuration:
```javascript
// Dynamic publisher detection
const publisherConfig = await getPublisherByDomain(request.url);
const pricing = publisherConfig.pricePerCrawl;
const tokenId = publisherConfig.crawlTokenId;
```

### Custom Payment Models
```javascript
// Implement tiered pricing
const pricing = {
  'gptbot': 0.001,      // OpenAI
  'claude': 0.0015,     // Anthropic  
  'bingbot': 0.0005,    // Microsoft
  'default': 0.001      // Others
};
```

### Integration with Analytics Platforms
```javascript
// Google Analytics 4 integration
await gtag('event', 'ai_crawler_payment', {
  crawler_type: crawlerType,
  payment_amount: paymentAmount,
  publisher_domain: publisherDomain
});

// PostHog event tracking
await posthog.capture('crawler_payment_processed', {
  crawlerAddress: verification.crawlerAddress,
  amount: paymentAmount,
  domain: request.headers.get('Host')
});
```

## Integration with Dashboard

The gateway seamlessly integrates with the Tachi dashboard:

### 1. **Automated Configuration Generation**
- Dashboard generates complete `wrangler.toml` configuration
- Pre-filled with publisher's domain, pricing, and license details
- One-click copy for easy deployment

### 2. **Real-Time Monitoring**
- Dashboard displays live crawler activity from worker analytics
- Payment statistics aggregated from blockchain events
- Revenue tracking with USDC conversion rates

### 3. **Configuration Management**
- Update pricing and settings through dashboard
- Automatic worker reconfiguration via Cloudflare API
- A/B testing support for different pricing models

### 4. **Analytics Integration**
- Webhook notifications for successful payments
- Crawler behavior analytics and insights
- Revenue optimization recommendations

## Support

For technical support:
- Check worker logs for errors
- Review blockchain transaction details
- Verify contract addresses and ABIs
- Test with curl commands for debugging
