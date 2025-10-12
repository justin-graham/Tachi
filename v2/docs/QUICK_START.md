# Tachi v2 Quick Start

## For Publishers

### 1. Register Your Domain

```bash
curl -X POST https://api.tachi.ai/api/publishers/register \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "name": "Example Publisher",
    "email": "publisher@example.com",
    "walletAddress": "0x...",
    "pricePerRequest": 0.01
  }'
```

### 2. Deploy Cloudflare Worker

```bash
cd gateway
npm install
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler secret put PUBLISHER_ADDRESS
wrangler secret put PRICE_PER_REQUEST
wrangler deploy
```

### 3. Start Earning

Your content is now protected! Crawlers will automatically pay per request.

---

## For AI Companies

### 1. Install SDK

```bash
npm install @tachi/sdk
```

### 2. Use It

```typescript
import {TachiSDK} from '@tachi/sdk';

const sdk = new TachiSDK({
  network: 'base',
  rpcUrl: process.env.BASE_RPC_URL!,
  privateKey: process.env.PRIVATE_KEY!,
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  paymentProcessorAddress: '0x...'
});

const result = await sdk.fetch('https://example.com/api/data');
console.log(result.content); // Payment happens automatically!
```

### 3. Fund Your Wallet

- Get USDC on Base network
- Keep ~$5 ETH for gas fees

That's it!
