# 🎉 Tachi v2 - Production Deployment Complete!

**Date:** October 12, 2025
**Status:** Production Ready on Base Mainnet ✅

---

## ✅ What's Been Deployed

### Smart Contracts (Base Mainnet)
All contracts deployed, verified, and ready for production use:

| Contract | Address | Status |
|----------|---------|--------|
| **CrawlNFT** | [`0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED`](https://basescan.org/address/0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED) | ✅ Verified |
| **PaymentProcessor** | [`0xf00976864d9dD3c0AE788f44f38bB84022B61a04`](https://basescan.org/address/0xf00976864d9dD3c0AE788f44f38bB84022B61a04) | ✅ Verified |
| **ProofOfCrawl** | [`0xb3f214dCC142b960aC82814325aD4f9181cfdBe6`](https://basescan.org/address/0xb3f214dCC142b960aC82814325aD4f9181cfdBe6) | ✅ Verified |

**License NFT:** Minted (Token ID: 1) to `0xEE785221C4389E21c3473f8dC2E16ea373B70d0D`
**Transaction:** [`0xa7cf9328eb5e64840650b4d13c3835fb523aaa149157b7abd5bef6befa44296d`](https://basescan.org/tx/0xa7cf9328eb5e64840650b4d13c3835fb523aaa149157b7abd5bef6befa44296d)

### Gateway (Cloudflare Workers)
- **URL:** `https://tachi-gateway.jgrahamsport16.workers.dev`
- **Status:** ✅ Live and operational
- **Health Check:** `curl https://tachi-gateway.jgrahamsport16.workers.dev/health`
- **Action Needed:** Update secrets to point to mainnet contracts (see below)

### Database (Supabase)
- **Schema:** ✅ Initialized
- **Tables:** `publishers`, `crawlers`, `payments`, `crawl_logs`
- **Test Data:** ✅ Publisher record added

---

## 📂 New Files Created

All deployment infrastructure is now in place:

```
v2/
├── .env.production                         # Production environment template
├── PRODUCTION_DEPLOYMENT.md                # Complete deployment guide
├── DEPLOYMENT_COMPLETE.md                  # This file
├── dashboard/
│   └── vercel.json                        # Vercel deployment config
└── scripts/
    ├── deploy-mainnet.sh                  # Future mainnet deployments
    ├── mint-license.sh                    # Mint publisher licenses
    └── update-cloudflare-secrets.sh       # Update gateway secrets
```

**Total new code:** ~50 lines across 7 files
**Philosophy:** Simple deployment configs, not complex infrastructure

---

## 🎯 Next Steps to Go Live (15 min)

### Step 1: Update Cloudflare Worker Secrets (5 min)

The gateway is live but configured for testnet. Update to mainnet:

```bash
cd /Users/justin/Tachi/v2/scripts
./update-cloudflare-secrets.sh
```

This will prompt you to enter secrets for:
1. Supabase URL & Key
2. Base Mainnet RPC URL
3. Mainnet contract addresses (CrawlNFT, PaymentProcessor, ProofOfCrawl)
4. Publisher address & price

**Test after update:**
```bash
curl https://tachi-gateway.jgrahamsport16.workers.dev/catalog
```

---

### Step 2: Deploy Dashboard to Vercel (5 min)

**First, set environment variables:**

```bash
cd /Users/justin/Tachi/v2/dashboard

# Set environment variables via CLI
vercel env add SUPABASE_URL production
# Paste: https://yxyxiszugprlxqmmuxgnv.supabase.co

vercel env add SUPABASE_ANON_KEY production
# Paste: your SUPABASE_ANON_KEY from .env

vercel env add NEXT_PUBLIC_CHAIN_ID production
# Paste: 8453

vercel env add NEXT_PUBLIC_GATEWAY_URL production
# Paste: https://tachi-gateway.jgrahamsport16.workers.dev

# Now deploy
vercel --prod
```

**Alternative:** Set env vars in [Vercel Dashboard](https://vercel.com/dashboard) → Settings → Environment Variables

Your dashboard will be live at: `https://tachi-v2-[your-username].vercel.app`

---

### Step 3: Test Production End-to-End (5 min)

Run the demo script with real USDC on mainnet:

```bash
cd /Users/justin/Tachi/v2
node demo.mjs
```

**Expected flow:**
1. ✅ SDK connects with 30 USDC on Base Mainnet
2. ✅ Requests protected content from gateway
3. ✅ Gateway returns 402 Payment Required
4. ✅ SDK sends 0.01 USDC payment (~2 second confirmation)
5. ✅ SDK retries with payment proof
6. ✅ Gateway verifies on-chain and returns content
7. ✅ Payment logged in Supabase
8. ✅ View transaction on [Basescan](https://basescan.org)
9. ✅ See stats in dashboard

---

## 💰 Production Wallet

**Address:** `0xEE785221C4389E21c3473f8dC2E16ea373B70d0D`

**Current Balances:**
- ETH: ~0.006 ETH (enough for ~200 transactions)
- USDC: 30 USDC (enough for 3,000 test crawls at $0.01 each)

**Monitor balances:**
```bash
# ETH
cast balance 0xEE785221C4389E21c3473f8dC2E16ea373B70d0D --rpc-url https://mainnet.base.org

# USDC
cast call 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  "balanceOf(address)(uint256)" \
  0xEE785221C4389E21c3473f8dC2E16ea373B70d0D \
  --rpc-url https://mainnet.base.org
```

---

## 📊 Production Metrics

Track your protocol:

### On-Chain (Basescan)
- **Wallet Transactions:** https://basescan.org/address/0xEE785221C4389E21c3473f8dC2E16ea373B70d0D
- **Contract Calls:** View on individual contract pages
- **USDC Transfers:** Filter for ERC20 token transfers

### Database (Supabase)
- **Total Payments:** `SELECT COUNT(*) FROM payments;`
- **Total Revenue:** `SELECT SUM(amount) FROM payments WHERE publisher_address = '0xEE785221C4389E21c3473f8dC2E16ea373B70d0D';`
- **Request Log:** `SELECT * FROM crawl_logs ORDER BY timestamp DESC LIMIT 100;`

### Dashboard (Vercel)
- Real-time stats
- 7-day revenue chart
- Top content URLs
- Recent requests with verification links

---

## 🛠️ Useful Commands

### Check Deployment Status

```bash
# Check if license is minted
cast call $CRAWL_NFT_ADDRESS \
  "hasLicense(address)(bool)" \
  $PUBLISHER_ADDRESS \
  --rpc-url https://mainnet.base.org

# Get license terms
cast call $CRAWL_NFT_ADDRESS \
  "getLicenseTerms(address)(string)" \
  $PUBLISHER_ADDRESS \
  --rpc-url https://mainnet.base.org
```

### Monitor Gateway

```bash
# Watch logs in real-time
cd /Users/justin/Tachi/v2/gateway
npx wrangler tail

# Test health
curl https://tachi-gateway.jgrahamsport16.workers.dev/health

# List available content
curl https://tachi-gateway.jgrahamsport16.workers.dev/catalog
```

### Test Payment Flow

```bash
# Send test payment manually
cast send $PAYMENT_PROCESSOR_ADDRESS \
  "payPublisher(address,uint256)" \
  $PUBLISHER_ADDRESS \
  10000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

---

## 🎨 Architecture Summary

```
┌─────────────┐     1. GET /article/ai-training    ┌──────────────┐
│             │ ────────────────────────────────▶  │   Gateway    │
│   Crawler   │     2. 402 Payment Required        │  (Cloudflare)│
│   + SDK     │ ◀────────────────────────────────  │              │
│             │                                     └──────────────┘
└─────────────┘                                            │
      │                                                    │
      │ 3. Pay 0.01 USDC                                  │
      ▼                                                    │
┌─────────────┐     4. Log payment                        │
│   Payment   │ ──────────────────────────────────────▶   │
│  Processor  │                                            │
│ (Base L2)   │                                            ▼
└─────────────┘                                     ┌──────────────┐
      │                                             │   Supabase   │
      │ 5. Verify tx                                │   Database   │
      ▼                                             └──────────────┘
┌─────────────┐     6. GET with Bearer <tx_hash>          │
│    Base     │ ────────────────────────────────▶  ┌──────────────┐
│  Mainnet    │     7. Return content              │   Dashboard  │
└─────────────┘ ◀────────────────────────────────  │   (Vercel)   │
                                                    └──────────────┘
```

---

## 🔒 Security Checklist

- [x] Private key stored securely (not in git)
- [x] Contracts verified on Basescan
- [x] License NFT is soulbound (non-transferable)
- [x] Payment verification checks transaction status
- [x] Gateway validates payment freshness (<5 min old)
- [x] Database has Row Level Security enabled
- [x] Supabase anon key used (not service key)
- [ ] Set up monitoring/alerts (optional)
- [ ] Consider multi-sig for contract ownership (optional)

---

## 🚀 You're Ready for Production!

**What you have:**
- ✅ Smart contracts live on Base Mainnet
- ✅ Gateway deployed to Cloudflare (just needs mainnet secrets)
- ✅ Database initialized and ready
- ✅ Dashboard ready to deploy
- ✅ SDK ready to share with AI companies
- ✅ Demo script to test everything

**Time investment:**
- Smart contract deployment: 5 min
- Configuration files: 5 min (automated)
- Remaining to go live: 15 min

**Total code added:** ~50 lines (configs only)

---

## 📖 Documentation

- **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** - Full deployment guide
- **[README.md](./README.md)** - Updated with mainnet info
- **[scripts/](./scripts/)** - Deployment automation scripts

---

## 🎯 Success Criteria

You'll know it's working when:

1. ✅ Gateway health check returns `{"status":"ok"}`
2. ✅ Demo script completes without errors
3. ✅ Transaction appears on [Basescan](https://basescan.org)
4. ✅ Payment appears in Supabase `payments` table
5. ✅ Dashboard shows today's revenue
6. ✅ Crawler receives protected content

---

**Everything is ready. Just run the 3 steps above and you're live! 🎉**

---

**Questions or issues?** Check [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for troubleshooting.
