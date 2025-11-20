# Tachi x402 Middleware Packages

## Overview

This directory contains the x402 middleware implementation for Tachi Protocol. The middleware enables publishers to monetize their content with just 6 lines of code, while maintaining original URLs and supporting any x402-compatible AI agent.

## 🎯 What Changed

**Before (Gateway Model):**
- ❌ Crawlers had to use different URL (`gateway.tachi.ai`)
- ❌ Required custom SDK distribution
- ❌ Limited to Tachi ecosystem

**After (x402 Middleware):**
- ✅ Crawlers use original URLs (`publisher.com/article`)
- ✅ Works with any x402 client (Anthropic Claude, custom agents)
- ✅ 6 lines of code integration
- ✅ Industry standard backed by Coinbase/Cloudflare

## 📦 Packages

### [@tachiprotocol/core](./core)
**Lines of Code:** ~230

Core x402 payment verification engine. Platform-agnostic, dependency-free implementation.

**Key Functions:**
- `handleX402Request()` - Main handler for x402 flow
- `create402Response()` - Returns x402-compliant payment requirements
- `verifyPayment()` - Verifies payment via Coinbase facilitator
- `logPayment()` - Logs to Tachi API for dashboard analytics

**Features:**
- Zero dependencies (uses native `fetch`)
- Supports dynamic pricing (string or function)
- Async payment logging (fire-and-forget)
- Coinbase facilitator integration

---

### [@tachiprotocol/nextjs](./nextjs)
**Lines of Code:** ~60

Next.js middleware adapter. Wraps core package for Next.js apps.

**Usage:**
```typescript
// middleware.ts
import { tachiX402 } from '@tachiprotocol/nextjs';

export default tachiX402({
  apiKey: process.env.TACHI_API_KEY!,
  wallet: process.env.TACHI_WALLET!,
  price: '$0.01'
});

export const config = {
  matcher: '/premium/:path*'
};
```

**Features:**
- Compatible with Next.js 13+ App Router
- Supports dynamic pricing functions
- TypeScript-first with full type safety

---

### [@tachiprotocol/express](./express)
**Lines of Code:** ~90

Express middleware adapter. Wraps core package for Express apps.

**Usage:**
```javascript
const { tachiX402 } = require('@tachiprotocol/express');

app.use('/api/*', tachiX402({
  apiKey: process.env.TACHI_API_KEY,
  wallet: process.env.TACHI_WALLET,
  price: '$0.05'
}));
```

**Features:**
- Compatible with Express 4+
- Request/response conversion layer
- Error handling (fail open on errors)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Agent: GET https://publisher.com/article   │
│             ↓                                │
│  [Platform Middleware] (Next.js/Express)    │
│             ↓                                │
│  [@tachiprotocol/nextjs or /express]        │
│             ↓                                │
│  [@tachiprotocol/core]                      │
│             ↓                                │
│  Check X-PAYMENT header?                    │
│    ├─ No  → 402 (PaymentRequirements)       │
│    └─ Yes → Verify via Coinbase facilitator │
│              ├─ Valid → Log to Tachi API    │
│              │         → Return null (next)  │
│              └─ Invalid → 402 again          │
└─────────────────────────────────────────────┘
```

## 🔄 Payment Flow

1. **Initial Request**: Agent requests content (no payment)
2. **402 Response**: Middleware returns payment requirements in x402 format
3. **Payment**: Agent pays USDC on Base via x402 protocol
4. **Retry with Proof**: Agent retries with `X-PAYMENT` header
5. **Verification**: Middleware verifies via Coinbase facilitator (~100ms)
6. **Logging**: Middleware logs payment to Tachi API (async)
7. **Content Delivery**: Middleware serves protected content

## 📊 Database Changes

Added to support x402:

```sql
-- Publishers table
ALTER TABLE publishers
ADD COLUMN api_key VARCHAR(64) UNIQUE,
ADD COLUMN api_key_created_at TIMESTAMP;

-- Payments table
ALTER TABLE payments
ADD COLUMN path TEXT;

-- Indexes
CREATE INDEX idx_publishers_api_key ON publishers(api_key);
CREATE INDEX idx_payments_path ON payments(path);
```

## 🔌 API Endpoints Added

### `POST /v1/payments/middleware-log`
Logs payments from x402 middleware.

**Request:**
```json
{
  "apiKey": "abc123...",
  "txHash": "0x...",
  "amount": "10000",
  "crawler": "0x...",
  "path": "/article/123"
}
```

**Response:**
```json
{
  "success": true
}
```

### `POST /api/generate-api-key`
Generates API key for publisher (dashboard endpoint).

**Request:**
```json
{
  "address": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": "abc123..."
}
```

## 📱 Dashboard Updates

Added to Settings page:

- **API Key Management**
  - Generate/regenerate API key
  - Copy to clipboard
  - Show creation date

- **Integration Code Example**
  - Auto-populated with publisher's API key, wallet, and price
  - Copy-paste ready
  - Installation instructions

## 📖 Documentation

- **[X402_MIDDLEWARE.md](../docs/X402_MIDDLEWARE.md)** - Complete integration guide
  - Quick start for Next.js, Express, Cloudflare Workers
  - Advanced configuration examples
  - Testing guide
  - Troubleshooting

## 🚀 Publishing Packages

To publish to npm:

```bash
# Build all packages
cd packages/core && pnpm build
cd packages/nextjs && pnpm build
cd packages/express && pnpm build

# Publish (from each package directory)
npm publish --access public
```

## 🧪 Testing Middleware

### Test with curl:
```bash
curl -i https://yoursite.com/premium/article
# Should return 402 with x402 PaymentRequirements JSON
```

### Test with x402 client:
```typescript
import { x402Client } from '@coinbase/x402-sdk';

const client = new x402Client({
  network: 'base',
  privateKey: process.env.PRIVATE_KEY
});

const response = await client.fetch('https://yoursite.com/premium/article');
// Auto-pays and returns content
```

## 📊 Stats

**Total New Code:** ~380 lines
- Core: ~230 lines
- Next.js adapter: ~60 lines
- Express adapter: ~90 lines

**Files Changed:**
- `/packages/core/` - New package
- `/packages/nextjs/` - New package
- `/packages/express/` - New package
- `/api/src/routes/payments.ts` - Added middleware-log endpoint
- `/dashboard/app/api/check-license/route.ts` - Returns API key
- `/dashboard/app/api/generate-api-key/route.ts` - New endpoint
- `/dashboard/app/dashboard/settings/page.tsx` - Added API key UI
- `/database/schema.sql` - Added api_key and path columns
- `/database/migrations/002_add_x402_support.sql` - Migration script

## 🎯 Publisher Experience

**Setup Time:** ~5 minutes

1. Visit dashboard → Settings
2. Generate API key (1 click)
3. `npm install @tachiprotocol/nextjs`
4. Create `middleware.ts` (copy-paste 6 lines)
5. Add env vars
6. Deploy

**Result:** Content monetized, works with any x402 client, zero URL changes.

## 🔗 Related

- [Coinbase x402 Spec](https://github.com/coinbase/x402)
- [x402 Foundation](https://x402.org)
- [Tachi Dashboard](https://tachi.ai/dashboard)

---

**Built with:** TypeScript, Viem, Next.js, Express
**License:** MIT
**Version:** 3.0.0
