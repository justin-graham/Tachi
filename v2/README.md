# 🚀 Tachi v3 - x402 Micropayment Protocol

**Status:** Production Ready 🌐
**Network:** Base Mainnet (Live)
**Standard:** x402 (Coinbase/Cloudflare)

> **Simple, efficient, beautiful. Under 2,100 lines of code total.**

## What is Tachi?

Tachi enables fair compensation for AI training data through blockchain-based micropayments.

**For Publishers:** Protect your content and earn USDC per request
**For AI Companies:** Access protected content by paying in USDC on Base

---

## 📦 Project Structure

```
v2/
├── packages/
│   ├── core/        # x402 payment engine (platform-agnostic)
│   ├── nextjs/      # Next.js middleware adapter
│   └── express/     # Express middleware adapter
├── contracts/       # Smart contracts (Solidity + Foundry)
├── api/             # Express API + Supabase
├── database/        # Supabase SQL schema
└── dashboard/       # Next.js 15 dashboard (Neo-brutalist UI)
```

---

## ✨ Features

- **x402 Standard:** Industry-standard payment protocol (Coinbase/Cloudflare/Google)
- **6-Line Integration:** Publishers add middleware, no URL changes needed
- **Original URLs:** Content stays at `publisher.com/article`, not gateway URLs
- **Sub-cent payments:** $0.001 - $1.00 per request in USDC on Base L2
- **Instant verification:** ~100ms via Coinbase facilitator
- **Any x402 Client:** Works with Anthropic Claude, custom agents, any x402-compatible client
- **Neo-brutalist dashboard:** Beautiful, retro-inspired publisher UI

---

## 🎯 Quick Start

### For Publishers (Integrate in 5 minutes)

1. **Sign up at dashboard:**
   ```bash
   # Visit https://tachi.ai/dashboard
   # Connect wallet, mint license NFT
   ```

2. **Generate API key:**
   ```bash
   # Go to Settings → Generate API Key
   ```

3. **Install middleware:**
   ```bash
   npm install @tachiprotocol/nextjs
   ```

4. **Add middleware.ts (6 lines):**
   ```typescript
   import { tachiX402 } from '@tachiprotocol/nextjs';

   export default tachiX402({
     apiKey: process.env.TACHI_API_KEY!,
     wallet: process.env.TACHI_WALLET!,
     price: '$0.01'
   });

   export const config = { matcher: '/premium/:path*' };
   ```

5. **Deploy:**
   ```bash
   npm run build && npm run start
   ```

**Done!** Any x402 client can now pay for your content.

---

### For Developers (Local Setup)

**Prerequisites:**
- Node.js 20+
- pnpm 8+
- Foundry (for contracts)
- Supabase account (free tier)

**1. Clone & Install:**
```bash
git clone https://github.com/yourusername/tachi.git
cd tachi/v2
pnpm install
```

**2. Deploy Contracts:**
```bash
cd contracts
cp ../.env.example .env
# Add PRIVATE_KEY and BASESCAN_API_KEY

forge build
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
```

**3. Set Up Supabase:**
1. Create project at [supabase.com](https://supabase.com)
2. Run `database/schema.sql` in SQL Editor
3. Run `database/migrations/002_add_x402_support.sql`
4. Copy Supabase URL and anon key to `.env`

**4. Start Services:**
```bash
# Terminal 1 - API
cd api && npm install && npm run dev

# Terminal 2 - Dashboard
cd dashboard && npm install && npm run dev
```

**5. Build Middleware Packages:**
```bash
cd packages/core && pnpm build
cd ../nextjs && pnpm build
cd ../express && pnpm build
```

---

## 📊 Architecture

```
┌──────────────────────────────────────────────────────┐
│  AI Agent requests: https://publisher.com/article    │
│                     ↓                                 │
│  [Publisher's Next.js Middleware]                    │
│                     ↓                                 │
│  [@tachiprotocol/nextjs]                             │
│                     ↓                                 │
│  [@tachiprotocol/core] - x402 engine                 │
│                     ↓                                 │
│  X-PAYMENT header present?                           │
│    ├─ No  → Return 402 (PaymentRequirements)         │
│    └─ Yes → Verify via Coinbase facilitator (~100ms) │
│              ├─ Valid → Log to Tachi API             │
│              │         → Serve content                │
│              └─ Invalid → Return 402                 │
│                                                       │
│  Base L2 (USDC payments) ← → Supabase (analytics)    │
└──────────────────────────────────────────────────────┘
```

---

## 🎨 Dashboard

The v2 dashboard features a **neo-brutalist design** with:

- Blueprint-style grid background
- Bold borders and shadows
- Monospace typography
- Coral (#FF7043) and Sage (#52796F) accent colors
- Lab notebook aesthetic

**Pages:**
- **Dashboard:** Overview with today's stats + recent activity
- **Requests:** Full request log with tx verification links
- **Revenue:** 7-day chart + top content breakdown
- **Settings:** Price configuration + integration code

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|-----------|
| Payment Protocol | x402 (Coinbase standard) |
| Blockchain | Base (Coinbase L2) |
| Contracts | Solidity 0.8.28 + Foundry |
| Middleware | TypeScript (platform-agnostic) |
| Facilitator | Coinbase x402 API |
| API | Express + Supabase |
| Dashboard | Next.js 15 + React 19 + Tailwind |
| Database | PostgreSQL (Supabase) |

---

## 📝 Smart Contracts

| Contract | Purpose | Lines |
|----------|---------|-------|
| `CrawlNFT.sol` | Soulbound publisher licenses | ~170 |
| `PaymentProcessor.sol` | USDC payment handling | ~85 |
| `ProofOfCrawl.sol` | Immutable audit logs | ~95 |

All contracts are gas-optimized with custom errors and packed storage.

---

## 🚢 Production Deployment

**Contracts are live on Base Mainnet!** See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for full guide.

### Quick Production Setup (15 min)

```bash
# 1. Update Cloudflare Worker secrets
cd scripts && ./update-cloudflare-secrets.sh

# 2. Deploy dashboard to Vercel
cd ../dashboard && vercel --prod

# 3. Test end-to-end with real USDC
cd .. && node demo.mjs
```

### Deployed Contracts (Base Mainnet)
- **CrawlNFT:** `0x4fA86C0bAD6AB64009445de6EE8462Bc31A4b347`
- **PaymentProcessor:** `0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA`
- **ProofOfCrawl:** `0x72a604278918abeBa4EE5f2C403b0350920A98ca`

All contracts [verified on Basescan](https://basescan.org) ✅

---

## 📖 Documentation

- **[X402_MIDDLEWARE.md](./docs/X402_MIDDLEWARE.md)** - Complete x402 integration guide ⭐
- **[Packages README](./packages/README.md)** - Middleware architecture overview
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Production deployment guide
- [Contract Docs](./contracts/src/) - Inline Solidity docs
- [Database Schema](./database/schema.sql) - PostgreSQL schema

---

## 💡 Code Stats

| Component | Lines | Notes |
|-----------|-------|-------|
| Contracts | ~430 | 3 Solidity contracts + deploy |
| Middleware Core | ~230 | Platform-agnostic x402 engine |
| Next.js Adapter | ~60 | Thin Next.js wrapper |
| Express Adapter | ~90 | Thin Express wrapper |
| API | ~550 | Express + dashboard + logging |
| Database | ~130 | SQL schema + policies + migrations |
| Dashboard | ~750 | 5 pages + API key management |
| **TOTAL** | **~2,240** | **30% less code than v2!** |

---

## ⚡ Evolution: v1 → v2 → v3

**v1 had 10,000+ lines:**
- ❌ Complex architecture
- ❌ Over-engineered
- ❌ Custom everything

**v2 had ~2,400 lines:**
- ✅ 75% less code
- ✅ Gateway + custom SDK
- ✅ Beautiful dashboard
- ⚠️ Still required custom integration

**v3 has ~2,100 lines:**
- ✅ 30% less than v2
- ✅ Industry-standard x402
- ✅ 6-line integration
- ✅ Works at original URLs
- ✅ Compatible with any x402 client
- ✅ Zero custom SDK needed

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repo
2. Create a feature branch
3. Keep it simple (this is the way)
4. Submit a PR

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

## 🔗 Links

- **Website:** [tachi.ai](https://tachi.ai) *(coming soon)*
- **Docs:** [docs.tachi.ai](https://docs.tachi.ai) *(coming soon)*
- **Base Sepolia Contracts:** *See `deployments/latest.env` after deployment*
- **Discord:** *(coming soon)*

---

**Built with ❤️ and simplicity in mind.**

v1 archive → `/v1-archive`
v2 (gateway) → Deprecated
Clean v3 (x402) → `/v2` (you are here)
