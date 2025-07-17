# Cloudflare Gateway Deployment Guide

This guide explains how to deploy the Tachi Pay-Per-Crawl gateway on Cloudflare Workers.

## Overview

The Cloudflare Gateway is a serverless edge function that:
1. Intercepts HTTP requests to publisher websites
2. Identifies AI crawlers by User-Agent patterns
3. Enforces payment requirements via HTTP 402 responses
4. Verifies payment proofs by checking blockchain transactions
5. Logs successful crawls on-chain via ProofOfCrawlLedger
6. Delivers content after successful payment verification

## Prerequisites

- Cloudflare account with Workers enabled
- Base network RPC endpoint (Alchemy recommended)
- Deployed Tachi contracts (PaymentProcessor, ProofOfCrawlLedger)
- Private key for logging crawls (protocol owner)

## Installation

1. **Install Dependencies**
   ```bash
   cd packages/gateway-cloudflare
   npm install
   ```

2. **Configure Environment Variables**
   Update `wrangler.toml` with your contract addresses:
   ```toml
   [vars]
   BASE_RPC_URL = "https://base-mainnet.alchemyapi.io/v2/YOUR-API-KEY"
   PAYMENT_PROCESSOR_ADDRESS = "0x..." # Your deployed PaymentProcessor
   PROOF_OF_CRAWL_LEDGER_ADDRESS = "0x..." # Your deployed ProofOfCrawlLedger
   USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" # Base USDC
   PUBLISHER_ADDRESS = "0x..." # Publisher's wallet address
   CRAWL_TOKEN_ID = "1" # Publisher's CrawlNFT token ID
   PRICE_USDC = "0.001" # Price per crawl in USDC
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

1. **Development Environment**
   ```bash
   wrangler dev --env development
   ```

2. **Staging Environment**
   ```bash
   wrangler deploy --env staging
   ```

3. **Production Environment**
   ```bash
   wrangler deploy --env production
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

## Integration with Dashboard

The gateway is designed to work with the Tachi dashboard:
1. Dashboard generates worker configuration
2. Publisher deploys to their Cloudflare account
3. Dashboard monitors payment and crawl statistics
4. Real-time updates via blockchain events

## Support

For technical support:
- Check worker logs for errors
- Review blockchain transaction details
- Verify contract addresses and ABIs
- Test with curl commands for debugging
