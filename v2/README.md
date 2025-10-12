# 🚀 Tachi v2 - Pay-Per-Crawl Protocol

**Status:** Production Ready 🌐
**Network:** Base Mainnet (Live)
**Gateway:** https://tachi-gateway.jgrahamsport16.workers.dev

> **Simple, efficient, beautiful. Under 2,700 lines of code total.**

## What is Tachi?

Tachi enables fair compensation for AI training data through blockchain-based micropayments.

**For Publishers:** Protect your content and earn USDC per request
**For AI Companies:** Access protected content by paying in USDC on Base

---

## 📦 Project Structure

```
v2/
├── contracts/        # Smart contracts (Solidity + Foundry)
├── sdk/             # TypeScript SDK for crawlers
├── gateway/         # Cloudflare Worker for publishers
├── api/             # Express API + Supabase
├── database/        # Supabase SQL schema
└── dashboard/       # Next.js 15 dashboard (Neo-brutalist UI)
```

---

## ✨ Features

- **Sub-cent payments:** $0.001 - $1.00 per request in USDC
- **Instant settlement:** ~2 second finality on Base L2
- **Verifiable logs:** Every crawl recorded on-chain
- **Simple SDK:** 3-line integration with auto-payment
- **Neo-brutalist dashboard:** Beautiful, retro-inspired publisher UI

---

## 🎯 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Foundry (for contracts)
- Base Sepolia testnet ETH
- Supabase account (free tier)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/tachi.git
cd tachi/v2
pnpm install
```

### 2. Deploy Contracts

```bash
cd contracts
cp ../.env.example .env
# Add your PRIVATE_KEY and BASESCAN_API_KEY to .env

forge build
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
```

Contract addresses will be saved to `deployments/latest.env`.

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `database/schema.sql` in the SQL Editor
3. Copy your Supabase URL and anon key to `.env`

### 4. Start Services

```bash
# Terminal 1 - API
cd api
npm install
npm run dev

# Terminal 2 - Dashboard
cd dashboard
npm install
npm run dev

# Terminal 3 - Gateway (optional - deploy to Cloudflare)
cd gateway
npm install
wrangler deploy
```

### 5. Run Demo

```bash
cd v2
node demo.mjs
```

See the full flow: payment → verification → content delivery → logging.

---

## 📊 Architecture

```
┌─────────────┐     402      ┌──────────┐     verify    ┌──────────┐
│   Crawler   │ ──────────▶ │  Gateway  │ ────────────▶ │   Base   │
│   + SDK     │              │  Worker   │               │   L2     │
└─────────────┘              └──────────┘               └──────────┘
      │                            │                          │
      │ pay USDC                   │ log crawl                │
      ▼                            ▼                          ▼
┌─────────────┐              ┌──────────┐               ┌──────────┐
│  Payment    │              │ Supabase │               │ On-Chain │
│ Processor   │              │    DB    │               │  Ledger  │
└─────────────┘              └──────────┘               └──────────┘
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
| Blockchain | Base (Coinbase L2) |
| Contracts | Solidity 0.8.28 + Foundry |
| SDK | TypeScript + Viem |
| Gateway | Cloudflare Workers |
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
- **CrawlNFT:** `0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED`
- **PaymentProcessor:** `0xf00976864d9dD3c0AE788f44f38bB84022B61a04`
- **ProofOfCrawl:** `0xb3f214dCC142b960aC82814325aD4f9181cfdBe6`

All contracts [verified on Basescan](https://basescan.org) ✅

---

## 📖 Documentation

- **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** - Production deployment guide ⭐
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Testnet deployment (for development)
- [SDK API Reference](./sdk/README.md) - How to use the SDK
- [Contract Docs](./contracts/src/) - Inline Solidity docs
- [Gateway Config](./gateway/README.md) - Cloudflare Worker setup

---

## 💡 Code Stats

| Component | Lines | Notes |
|-----------|-------|-------|
| Contracts | ~430 | 3 Solidity contracts + deploy |
| SDK | ~285 | TypeScript SDK with Viem |
| Gateway | ~360 | Enhanced Cloudflare Worker |
| API | ~520 | Express + dashboard routes |
| Database | ~120 | SQL schema + policies |
| Dashboard | ~710 | 5 pages + layout + styles |
| **TOTAL** | **~2,425** | **Clean, focused MVP** |

---

## ⚡ Why v2?

**v1 had 10,000+ lines** with:
- ❌ Multiple blockchain libraries
- ❌ Complex middleware
- ❌ Over-engineered monitoring
- ❌ Unused features

**v2 has ~2,400 lines** with:
- ✅ 75%+ less code
- ✅ One way to do things
- ✅ Every line matters
- ✅ Beautiful neo-brutalist UI
- ✅ Focused MVP features

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
Clean v2 → `/v2` (you are here)
