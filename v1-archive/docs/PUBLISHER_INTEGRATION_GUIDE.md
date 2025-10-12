# Publisher Integration Guide

This comprehensive guide walks publishers through the complete process of integrating with the Tachi Protocol to monetize their content through AI crawler payments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Integration](#step-by-step-integration)
4. [Testing Your Setup](#testing-your-setup)
5. [Going Live](#going-live)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

### What is Tachi Protocol?

Tachi Protocol enables content publishers to:
- **Protect content** from unauthorized AI crawling
- **Monetize AI training data** through micro-payments in USDC
- **Maintain full control** over who accesses their content
- **Track usage transparently** with on-chain logging

### How It Works

1. **AI crawlers** request your content
2. **Gateway detects** crawler by User-Agent
3. **Payment required** (HTTP 402) response returned
4. **Crawler pays** required USDC amount to smart contract
5. **Payment verified** on Base blockchain
6. **Content delivered** to crawler
7. **Revenue flows** directly to your wallet

*[Diagram placeholder: Flow diagram showing crawler → gateway → payment → content delivery]*

---

## Prerequisites

Before starting, ensure you have:

### Technical Requirements
- [ ] **Domain ownership** - You must own the domain to protect
- [ ] **Web3 wallet** (MetaMask recommended) with Base network configured
- [ ] **Cloudflare account** (free tier is sufficient)
- [ ] **Basic knowledge** of DNS and web hosting

### Financial Requirements
- [ ] **ETH on Base** for transaction fees (~$5 worth)
- [ ] **USDC on Base** for testing (optional - get from faucets)

### Preparation Checklist
- [ ] Domain is live and accessible
- [ ] Cloudflare account is verified
- [ ] Wallet is connected to Base network
- [ ] Basic understanding of smart contracts

---

## Step-by-Step Integration

### Step 1: Connect Your Wallet & Access Dashboard

1. **Visit the Tachi Dashboard**
   ```
   https://dashboard.tachi.ai
   ```
   *[Screenshot placeholder: Dashboard homepage with "Connect Wallet" button]*

2. **Connect Your Web3 Wallet**
   - Click "Connect Wallet"
   - Select MetaMask (or your preferred wallet)
   - Approve the connection request
   
   *[Screenshot placeholder: Wallet connection modal showing MetaMask selection]*

3. **Switch to Base Network**
   - Confirm you're on Base network (Chain ID: 8453)
   - If not, click "Switch Network" when prompted
   - Or manually add Base network:
     ```
     Network Name: Base
     RPC URL: https://mainnet.base.org
     Chain ID: 8453
     Currency Symbol: ETH
     Block Explorer: https://basescan.org
     ```

   *[Screenshot placeholder: Network switching confirmation in MetaMask]*

### Step 2: Configure Your Website

1. **Enter Domain Information**
   - Input your domain (e.g., `myblog.com`)
   - **Important**: Don't include `http://` or `https://`
   - Verify domain ownership if prompted
   
   *[Screenshot placeholder: Domain input field with validation]*

2. **Customize Terms of Service**
   - Review the default AI crawler terms
   - Modify terms to match your content licensing preferences
   - These terms will be stored on IPFS and linked to your license NFT
   
   *[Screenshot placeholder: Terms of service editor with default text]*

   **Key terms to consider:**
   - Commercial use restrictions
   - Attribution requirements
   - Data retention policies
   - Contact information for disputes

3. **Configure Content Protection Scope**
   Choose what to protect:
   - [ ] **Entire domain** (`yourdomain.com/*`)
   - [ ] **Specific paths** (`yourdomain.com/api/*`, `/content/*`)
   - [ ] **File types** (`.pdf`, `.json`, specific endpoints)
   
   *[Screenshot placeholder: Content scope selection interface]*

### Step 3: Set Your Pricing Strategy

1. **Determine Price Per Crawl**
   
   **Pricing Guidelines:**
   - **High-value content**: $0.01+ (research papers, premium articles)
   - **Standard content**: $0.003-$0.007 (blog posts, news articles)
   - **High-volume sites**: $0.001-$0.003 (forums, social content)
   
   *[Screenshot placeholder: Pricing slider with recommendations]*

2. **Consider Your Content Value**
   
   **Factors to evaluate:**
   - Content uniqueness and quality
   - Research depth and expertise required
   - Target audience (enterprise vs. consumer AI)
   - Update frequency and freshness
   - Domain authority and traffic volume

3. **Review Competitive Pricing**
   - Research similar publishers in your niche
   - Consider your content's unique value proposition
   - Start conservatively and adjust based on data

   *[Screenshot placeholder: Pricing comparison chart with industry benchmarks]*

### Step 4: Mint Your Publisher License

1. **Review License Preview**
   - Verify domain, terms, and pricing are correct
   - Check the metadata that will be stored in your NFT
   - Ensure all information is accurate before proceeding
   
   *[Screenshot placeholder: License NFT preview showing metadata]*

2. **Execute the Mint Transaction**
   - Click "Mint License NFT"
   - Review transaction details in MetaMask
   - **Gas fee**: ~$0.10-0.50 on Base network
   - Confirm and wait for transaction completion
   
   *[Screenshot placeholder: MetaMask transaction confirmation dialog]*

3. **License NFT Confirmation**
   - Transaction hash displayed for verification
   - NFT now visible in your wallet
   - Token ID assigned (note this number - you'll need it)
   
   *[Screenshot placeholder: Successful mint confirmation with token ID]*

### Step 5: Deploy Your Cloudflare Gateway

1. **Download Generated Configuration**
   - Dashboard generates customized Cloudflare Worker script
   - Click "Download Worker Configuration"
   - Save both the JavaScript file and `wrangler.toml` config
   
   *[Screenshot placeholder: Download configuration files interface]*

2. **Set Up Cloudflare Worker**
   
   **Option A: Cloudflare Dashboard (Recommended for beginners)**
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to "Workers & Pages"
   - Click "Create Application" → "Create Worker"
   - Replace default code with your downloaded script
   - Click "Save and Deploy"
   
   *[Screenshot placeholder: Cloudflare Workers editor with Tachi script]*

   **Option B: Wrangler CLI (Advanced users)**
   ```bash
   # Install Wrangler CLI
   npm install -g wrangler
   
   # Authenticate with Cloudflare
   wrangler login
   
   # Deploy your worker
   cd your-tachi-worker-directory
   wrangler deploy
   ```

3. **Configure Environment Variables**
   
   In Cloudflare Dashboard:
   - Go to your worker → Settings → Environment Variables
   - Add the following variables from your downloaded config:
   
   | Variable | Value | Description |
   |----------|-------|-------------|
   | `BASE_RPC_URL` | Your Alchemy/Base RPC URL | Blockchain connection |
   | `PRICE_USDC` | Your price (e.g., "0.005") | Price per crawl in USDC |
   | `PUBLISHER_ADDRESS` | Your wallet address | Payment destination |
   | `CRAWL_TOKEN_ID` | Your NFT token ID | License identifier |
   
   *[Screenshot placeholder: Environment variables configuration in Cloudflare]*

### Step 6: Configure Domain Routing

1. **Set Up Custom Domain** (Recommended)
   
   In your Cloudflare Worker:
   - Go to Settings → Triggers
   - Click "Add Custom Domain"
   - Enter your domain (e.g., `api.yourdomain.com`)
   - Follow DNS configuration instructions
   
   *[Screenshot placeholder: Custom domain configuration]*

2. **Alternative: Route Patterns**
   
   If you prefer route patterns:
   - Add routes like `yourdomain.com/api/*`
   - This protects specific URL patterns
   - More granular control over what's protected
   
   *[Screenshot placeholder: Route patterns configuration]*

3. **DNS Configuration**
   
   Update your DNS settings:
   ```
   Type: CNAME
   Name: api (or your subdomain)
   Content: your-worker.your-subdomain.workers.dev
   ```

---

## Testing Your Setup

### Test 1: Verify AI Crawler Detection

```bash
# Test with AI crawler user-agent
curl -H "User-Agent: GPTBot/1.0" https://yourdomain.com/test-endpoint

# Expected response: HTTP 402 with payment instructions
```

**Expected Response:**
```json
{
  "error": "Payment Required",
  "message": "Please send 0.005 USDC to PaymentProcessor on Base network",
  "payment": {
    "amount": "0.005",
    "currency": "USDC",
    "network": "Base",
    "chainId": 8453,
    "recipient": "0x...",
    "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  }
}
```

*[Screenshot placeholder: Terminal showing 402 response with payment details]*

### Test 2: Verify Regular Traffic Passes Through

```bash
# Test with regular browser user-agent
curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" https://yourdomain.com/test-endpoint

# Expected: Normal content response (200 OK)
```

### Test 3: End-to-End Payment Test

1. **Simulate Payment** (using testnet):
   - Use Base Sepolia testnet for testing
   - Get testnet USDC from faucets
   - Send test payment to PaymentProcessor contract
   - Retry request with transaction hash

2. **Verify Payment Flow**:
   ```bash
   # Make payment, then retry with transaction hash
   curl -H "User-Agent: GPTBot/1.0" \
        -H "Authorization: Bearer 0x[transaction-hash]" \
        https://yourdomain.com/test-endpoint
   
   # Expected: Content delivered with success headers
   ```

*[Screenshot placeholder: Successful payment test showing content delivery]*

---

## Going Live

### Pre-Launch Checklist

- [ ] **All tests passing** on Base Sepolia testnet
- [ ] **Domain routing** configured correctly
- [ ] **Pricing strategy** finalized and competitive
- [ ] **Terms of service** reviewed and legal-compliant
- [ ] **Monitoring setup** configured (see next section)
- [ ] **Backup plan** ready in case of issues

### Launch Process

1. **Switch to Base Mainnet**
   - Update environment variables to use mainnet contracts
   - Change RPC URL to Base mainnet
   - Verify all configurations are production-ready

2. **Deploy Production Worker**
   ```bash
   wrangler deploy --env production
   ```

3. **Announce to Community**
   - Share integration success on social media
   - Join Tachi Discord/Telegram for support
   - Consider writing a case study

### Post-Launch Monitoring

1. **Monitor Worker Logs**
   ```bash
   wrangler tail --env production
   ```

2. **Check Payment Flow**
   - Verify payments are being received
   - Monitor blockchain transactions
   - Track revenue in your wallet

3. **Performance Monitoring**
   - Response times and error rates
   - AI crawler activity patterns
   - Revenue metrics and trends

---

## Monitoring & Analytics

### Cloudflare Analytics

Access detailed metrics in your Cloudflare Dashboard:

1. **Traffic Analytics**
   - Request volume by hour/day/month
   - Geographic distribution of requests
   - User-Agent analysis (identify AI crawlers)
   
   *[Screenshot placeholder: Cloudflare analytics dashboard]*

2. **Performance Metrics**
   - Response time percentiles (P50, P95, P99)
   - Error rate tracking (4xx, 5xx responses)
   - Cache hit rates and bandwidth usage

3. **Security Events**
   - Rate limiting triggers
   - Blocked malicious requests
   - DDoS attack mitigation

### Revenue Tracking

1. **On-Chain Analytics**
   - Monitor your wallet for USDC payments
   - Track payment frequency and patterns
   - Use BaseScan to verify all transactions
   
   *[Screenshot placeholder: BaseScan showing payment transactions]*

2. **Tachi Dashboard Analytics** (Coming Soon)
   - Integrated revenue dashboard
   - AI crawler behavior insights
   - Performance optimization recommendations

### Custom Monitoring Setup

```javascript
// Add custom analytics to your worker
addEventListener('fetch', event => {
  const start = Date.now();
  
  event.respondWith(handleRequest(event.request));
  
  event.waitUntil(
    logCustomMetrics({
      timestamp: Date.now(),
      userAgent: event.request.headers.get('User-Agent'),
      isAICrawler: isAICrawler(userAgent),
      responseTime: Date.now() - start,
      paymentRequired: paymentWasRequired,
      revenue: paymentAmount || 0
    })
  );
});
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. **"Payment verification failed" errors**

**Symptoms:**
- Crawlers receive 402 responses even after payment
- Valid transaction hashes rejected

**Solutions:**
- ✅ Verify transaction hash format (0x prefix required)
- ✅ Check payment amount matches your configured price
- ✅ Ensure USDC contract address is correct for your network
- ✅ Confirm transaction is confirmed on-chain (wait 1-2 blocks)

#### 2. **Regular users getting 402 responses**

**Symptoms:**
- Human visitors see payment required messages
- Search engines blocked from indexing

**Solutions:**
- ✅ Review User-Agent detection logic
- ✅ Add exceptions for legitimate crawlers (Google, Bing)
- ✅ Test with various browser user-agents
- ✅ Check route patterns aren't too broad

#### 3. **Worker deployment failures**

**Symptoms:**
- Wrangler deploy commands fail
- Environment variables not accessible

**Solutions:**
- ✅ Verify Cloudflare authentication (`wrangler whoami`)
- ✅ Check environment variable syntax in `wrangler.toml`
- ✅ Ensure KV namespaces are created and bound
- ✅ Validate JavaScript syntax in worker code

#### 4. **Low crawler adoption**

**Symptoms:**
- Few payment requests received
- Expected AI traffic not materializing

**Solutions:**
- ✅ Verify content is valuable for AI training
- ✅ Check pricing competitiveness
- ✅ Ensure content is discoverable by crawlers
- ✅ Review and improve content quality

### Debug Commands

```bash
# Test worker locally
wrangler dev --local

# View real-time logs
wrangler tail --format json

# Test specific endpoints
curl -v -H "User-Agent: GPTBot/1.0" https://your-domain.com/api/test

# Check environment variables
wrangler secret list
```

### Support Resources

- **GitHub Issues**: [Report bugs](https://github.com/tachi-protocol/tachi/issues)
- **Discord Community**: [Join discussions](#)
- **Documentation**: [Browse docs](https://docs.tachi.ai)
- **Email Support**: support@tachi.ai

---

## Best Practices

### Security Best Practices

1. **Private Key Management**
   - Use dedicated wallet for protocol operations
   - Never hardcode private keys in worker code
   - Store secrets in Cloudflare Workers secrets
   - Rotate keys periodically

2. **Access Control**
   - Implement proper rate limiting
   - Monitor for unusual traffic patterns
   - Use strong CSP headers
   - Validate all inputs and headers

3. **Financial Security**
   - Start with conservative pricing
   - Monitor revenue patterns
   - Set up payment alerts
   - Keep small amounts in hot wallet

### Performance Optimization

1. **Caching Strategy**
   - Cache static responses when possible
   - Use Cloudflare's native caching features
   - Implement smart cache invalidation
   - Monitor cache hit rates

2. **Response Time Optimization**
   - Minimize external API calls
   - Use async processing for non-critical operations
   - Optimize blockchain queries
   - Monitor and optimize slow endpoints

3. **Cost Management**
   - Monitor Cloudflare Workers usage
   - Optimize for minimal compute time
   - Use KV storage efficiently
   - Track RPC call costs

### Content Strategy

1. **Quality Over Quantity**
   - Focus on unique, high-value content
   - Ensure content is well-structured for AI consumption
   - Regular updates and fresh content
   - Proper metadata and semantic markup

2. **Pricing Strategy**
   - Start with market research
   - A/B test different price points
   - Monitor crawler behavior changes
   - Adjust based on demand patterns

3. **User Experience**
   - Ensure human visitors aren't affected
   - Maintain fast page load times
   - Clear communication about AI crawler policies
   - Responsive customer support

---

## Success Stories & Case Studies

### Case Study 1: Technical Blog Revenue

**Publisher**: DevInsights Blog  
**Content**: Programming tutorials and tech reviews  
**Implementation**: Full domain protection with $0.005/crawl pricing  
**Results**: 
- 🎯 **$247/month** average revenue
- 📈 **1,200+ crawler requests** monthly
- ⚡ **<100ms** added latency
- 👥 **Zero impact** on human visitors

*[Screenshot placeholder: Revenue dashboard showing monthly growth]*

### Case Study 2: Research Institution

**Publisher**: University Research Database  
**Content**: Academic papers and research data  
**Implementation**: API endpoint protection with $0.02/crawl pricing  
**Results**:
- 💰 **$890/month** revenue from AI companies
- 🔬 **Premium content** monetization
- 📊 **Detailed usage analytics** for research insights
- 🤝 **Partnership opportunities** with AI companies

### Case Study 3: News Media Site

**Publisher**: LocalNews Today  
**Content**: Breaking news and investigative journalism  
**Implementation**: Content-specific protection with dynamic pricing  
**Results**:
- 📰 **$156/month** additional revenue stream
- 🚀 **Increased content quality** investment
- 🎯 **Selective protection** for premium articles
- 📱 **Mobile-first** implementation

---

## Advanced Integration Patterns

### Multi-Domain Management

```javascript
// Support multiple domains with different pricing
const domainConfig = {
  'site1.com': { price: '0.005', tokenId: '1' },
  'site2.com': { price: '0.010', tokenId: '2' },
  'blog.example.com': { price: '0.003', tokenId: '3' }
};

const domain = new URL(request.url).hostname;
const config = domainConfig[domain] || defaultConfig;
```

### Dynamic Pricing

```javascript
// Implement time-based or content-based pricing
const getDynamicPrice = (content, crawler) => {
  const basePrice = 0.005;
  
  // Premium content multiplier
  if (content.isPremium) return basePrice * 2;
  
  // Off-peak hours discount
  const hour = new Date().getHours();
  if (hour >= 2 && hour <= 6) return basePrice * 0.8;
  
  // Bulk crawler discounts
  if (crawler.monthlyVolume > 10000) return basePrice * 0.9;
  
  return basePrice;
};
```

### Integration with Existing Analytics

```javascript
// Google Analytics 4 integration
gtag('event', 'ai_crawler_payment', {
  event_category: 'revenue',
  event_label: crawlerType,
  value: paymentAmount,
  custom_parameters: {
    publisher_domain: domain,
    content_type: contentType
  }
});

// PostHog integration
posthog.capture('crawler_payment_received', {
  amount_usd: paymentAmount,
  crawler_address: verification.crawlerAddress,
  content_path: request.url,
  timestamp: Date.now()
});
```

---

## Future Roadmap

### Upcoming Features

- **🎛️ Advanced Dashboard**: Real-time analytics and configuration management
- **🤖 AI Crawler SDK**: Official SDK for AI companies to integrate easily
- **💳 Multiple Payment Options**: Support for additional cryptocurrencies
- **📊 Revenue Optimization**: AI-powered pricing recommendations
- **🔗 API Management**: Advanced API protection and usage analytics
- **🌐 Multi-Chain Support**: Expansion to other blockchain networks

### Community Initiatives

- **📚 Educational Content**: Workshops and tutorials for publishers
- **🤝 Partner Program**: Integration with CMS platforms and hosting providers
- **🏆 Publisher Rewards**: Recognition and incentives for successful integrations
- **📈 Market Research**: Regular reports on AI crawler behavior and trends

---

**🎉 Congratulations!** You've successfully integrated with Tachi Protocol and can now monetize your content through AI crawler payments. Welcome to the future of fair AI training data compensation!

For ongoing support and community discussions, join our [Discord server](#) and follow [@TachiProtocol](#) on Twitter for the latest updates.