# Tachi x402 Middleware Integration Guide

## Overview

Tachi now supports the **x402 payment protocol** - an industry standard for HTTP-native micropayments backed by Coinbase, Cloudflare, Google, and Visa. With x402 middleware, publishers can monetize their content with just **6 lines of code**, and AI agents using any x402-compatible client can automatically pay for access.

## Key Benefits

✅ **Original URLs** - Content stays at `yoursite.com/article`, not a gateway URL
✅ **Zero SDK Required** - Any x402 client works automatically (Anthropic Claude, custom agents)
✅ **6 Lines of Code** - Minimal integration effort
✅ **Platform Agnostic** - Works on Next.js, Express, Vercel, Cloudflare Workers, etc.
✅ **Instant Payments** - Sub-second verification via Coinbase facilitator
✅ **Dynamic Pricing** - Set different prices per route

---

## Quick Start (Next.js)

### 1. Sign Up & Get API Key

1. Visit [tachi.ai/dashboard/settings](https://tachi.ai/dashboard/settings)
2. Connect your wallet
3. Click "Generate API Key"
4. Copy your API key

### 2. Install Middleware

```bash
npm install @tachiprotocol/nextjs
```

### 3. Create Middleware File

Create `middleware.ts` in your project root:

```typescript
// middleware.ts
import { tachiX402 } from '@tachiprotocol/nextjs';

export default tachiX402({
  apiKey: process.env.TACHI_API_KEY!,
  wallet: process.env.TACHI_WALLET!,
  price: '$0.01'
});

export const config = {
  matcher: '/premium/:path*'  // Protect these routes
};
```

### 4. Add Environment Variables

```bash
# .env.local
TACHI_API_KEY=your_api_key_here
TACHI_WALLET=0xYourWalletAddress
```

### 5. Deploy

```bash
npm run build && npm run start
```

**Done!** Any x402-compatible AI agent can now pay to access your content at its original URL.

---

## How It Works

### Payment Flow

```
1. Agent → GET https://yoursite.com/premium/article
2. Middleware → Check X-PAYMENT header
3. Missing payment → Return 402 (x402 format)
4. Agent → Pay via x402 (USDC on Base)
5. Agent → Retry GET with X-PAYMENT header
6. Middleware → Verify via Coinbase facilitator
7. Middleware → Log to Tachi dashboard
8. Middleware → Serve content
```

### Technical Details

- **Payment Method**: USDC on Base L2 (sub-cent transactions)
- **Verification**: Coinbase facilitator API (~100ms)
- **Logging**: Async fire-and-forget to Tachi API
- **Settlement**: Instant to your wallet

---

## Advanced Configuration

### Dynamic Pricing

Price content based on path, time, or any logic:

```typescript
export default tachiX402({
  apiKey: process.env.TACHI_API_KEY!,
  wallet: process.env.TACHI_WALLET!,
  price: (req) => {
    // Premium content costs more
    if (req.url.includes('/premium/')) return '$0.05';

    // API endpoints
    if (req.url.includes('/api/')) return '$0.02';

    // Default price
    return '$0.01';
  }
});
```

### Custom Matcher Patterns

Protect specific routes:

```typescript
export const config = {
  matcher: [
    '/premium/:path*',
    '/api/:path*',
    '/articles/:id/full'
  ]
};
```

### Custom Facilitator

Use your own payment facilitator:

```typescript
export default tachiX402({
  apiKey: process.env.TACHI_API_KEY!,
  wallet: process.env.TACHI_WALLET!,
  price: '$0.01',
  facilitatorUrl: 'https://your-facilitator.com'
});
```

---

## Platform-Specific Guides

### Express.js

```bash
npm install @tachiprotocol/express
```

```javascript
const express = require('express');
const { tachiX402 } = require('@tachiprotocol/express');

const app = express();

// Protect specific routes
app.use('/api/*', tachiX402({
  apiKey: process.env.TACHI_API_KEY,
  wallet: process.env.TACHI_WALLET,
  price: '$0.05'
}));

app.listen(3000);
```

### Cloudflare Workers

```bash
npm install @tachiprotocol/cloudflare
```

```typescript
import { handleX402Request } from '@tachiprotocol/core';

export default {
  async fetch(request: Request): Promise<Response> {
    const result = await handleX402Request(request, {
      apiKey: env.TACHI_API_KEY,
      wallet: env.TACHI_WALLET,
      price: '$0.01'
    });

    if (result) return result; // 402 response

    // Continue to origin
    return fetch(request);
  }
};
```

---

## Testing Your Integration

### 1. Test with curl

```bash
# Should return 402 with payment requirements
curl -i https://yoursite.com/premium/article
```

Expected response:

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "x402Version": "1",
  "paymentRequirements": [{
    "scheme": "erc20",
    "network": "base",
    "maxAmountRequired": "10000",
    "resource": "https://yoursite.com/premium/article",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "payTo": "0xYourWallet",
    "timeout": 300
  }]
}
```

### 2. Test with x402 Client

```typescript
import { x402Client } from '@coinbase/x402-sdk';

const client = new x402Client({
  network: 'base',
  privateKey: process.env.PRIVATE_KEY
});

const response = await client.fetch('https://yoursite.com/premium/article');
// Auto-pays if 402, returns content
```

---

## Dashboard Analytics

After integrating middleware, view analytics at [tachi.ai/dashboard](https://tachi.ai/dashboard):

- **Total Revenue** - Earnings from x402 payments
- **Request Count** - Number of paid crawls
- **Top Content** - Most accessed URLs
- **Recent Payments** - Live payment feed with tx hashes

---

## FAQ

### Does this work with my existing site?

Yes! The middleware sits in front of your existing routes. No changes to your backend needed.

### What if a user visits in a browser?

You can detect user agents and only require payment for AI crawlers:

```typescript
export default tachiX402({
  apiKey: process.env.TACHI_API_KEY!,
  wallet: process.env.TACHI_WALLET!,
  price: (req) => {
    // Free for browsers, paid for AI agents
    const ua = req.headers.get('user-agent') || '';
    if (ua.includes('Mozilla')) return '$0';
    return '$0.01';
  }
});
```

### Can I still use the gateway model?

Yes! You can deploy both:
- Middleware for x402 clients (at original URLs)
- Gateway for legacy Tachi SDK clients

### How do refunds work?

Payments are on-chain and final. To refund, transfer USDC directly to the crawler's wallet address (visible in dashboard).

### What's the minimum price?

Technically $0.000001 (1 wei), but recommended minimum is $0.001 to cover gas on Base L2.

---

## Migration from Legacy Gateway

If you're currently using the centralized Tachi gateway:

### Before (Gateway Model)
```
Content: https://publisher.com/article
Crawlers access: https://gateway.tachi.ai/article  ❌
```

### After (x402 Middleware)
```
Content: https://publisher.com/article
Crawlers access: https://publisher.com/article  ✅
```

**Migration Steps:**

1. Install middleware package
2. Add `middleware.ts` (6 lines)
3. Deploy
4. Update documentation for AI agents (point to original URL)
5. Deprecate gateway URL

---

## Troubleshooting

### "Invalid API key" error

- Check API key is correct in env vars
- Regenerate API key in dashboard if needed
- Verify API key has no extra whitespace

### Payments not logging in dashboard

- Check `tachiApiUrl` if using custom API
- Verify API endpoint is accessible
- Check browser console for errors

### 402 response not showing

- Verify middleware is loaded (add console.log)
- Check matcher pattern matches your route
- Ensure middleware file is named `middleware.ts`

---

## Support

- **Docs**: [docs.tachi.ai](https://docs.tachi.ai)
- **Dashboard**: [tachi.ai/dashboard](https://tachi.ai/dashboard)
- **GitHub**: [github.com/tachiprotocol](https://github.com/tachiprotocol)
- **Discord**: [discord.gg/tachi](https://discord.gg/tachi)

---

## Architecture Reference

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Agent requests: https://publisher.com/article     │
│         ↓                                           │
│  [Next.js Middleware]                               │
│         ↓                                           │
│  [@tachiprotocol/nextjs] (adapter)                  │
│         ↓                                           │
│  [@tachiprotocol/core] (x402 engine)                │
│         ↓                                           │
│  Check X-PAYMENT header?                            │
│    ├─ No  → Return 402 (PaymentRequirements)        │
│    └─ Yes → Verify via Coinbase facilitator         │
│              ├─ Valid   → Log to Tachi API          │
│              │            → Serve content            │
│              └─ Invalid → Return 402                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

**Last Updated**: November 2025
**x402 Version**: 1.0
**Tachi Version**: 3.0
