# 🚀 Tachi v2 - Production Deployment Guide

**Last Updated:** October 12, 2025
**Status:** Production Ready ✅

---

## ✅ What's Already Deployed

### Smart Contracts (Base Mainnet)
- **CrawlNFT:** [`0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED`](https://basescan.org/address/0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED)
- **PaymentProcessor:** [`0xf00976864d9dD3c0AE788f44f38bB84022B61a04`](https://basescan.org/address/0xf00976864d9dD3c0AE788f44f38bB84022B61a04)
- **ProofOfCrawl:** [`0xb3f214dCC142b960aC82814325aD4f9181cfdBe6`](https://basescan.org/address/0xb3f214dCC142b960aC82814325aD4f9181cfdBe6)
- **License NFT:** Minted ✅ (Token ID: 1)
- **Network:** Base Mainnet (Chain ID: 8453)

### Gateway (Cloudflare Workers)
- **URL:** `https://tachi-gateway.jgrahamsport16.workers.dev`
- **Status:** Live, needs secrets update for mainnet

### Database
- **Supabase:** Schema initialized ✅
- **Test Publisher:** Added ✅

---

## 📋 Remaining Steps to Go Live

### Step 1: Update Cloudflare Worker Secrets (5 min)

Update the gateway to use mainnet contracts:

```bash
cd /Users/justin/Tachi/v2/scripts
./update-cloudflare-secrets.sh
```

This will set 7 secrets:
- `SUPABASE_URL` - Database connection
- `SUPABASE_KEY` - Database auth
- `BASE_RPC_URL` - Base Mainnet RPC
- `CRAWL_NFT_ADDRESS` - Mainnet CrawlNFT contract
- `PROOF_OF_CRAWL_ADDRESS` - Mainnet ProofOfCrawl contract
- `PUBLISHER_ADDRESS` - Your wallet address
- `PRICE_PER_REQUEST` - Price per crawl (0.01 USDC)

**Test the gateway:**
```bash
curl https://tachi-gateway.jgrahamsport16.workers.dev/health
```

---

### Step 2: Deploy Dashboard to Vercel (5 min)

#### Set Environment Variables First

Before deploying, set these environment variables in Vercel:

```bash
cd /Users/justin/Tachi/v2/dashboard

# Set environment variables via CLI
vercel env add SUPABASE_URL production
# When prompted, paste: https://yxyxiszugprlxqmmuxgnv.supabase.co

vercel env add SUPABASE_ANON_KEY production
# When prompted, paste your SUPABASE_ANON_KEY from .env

vercel env add NEXT_PUBLIC_CHAIN_ID production
# When prompted, paste: 8453

vercel env add NEXT_PUBLIC_GATEWAY_URL production
# When prompted, paste: https://tachi-gateway.jgrahamsport16.workers.dev
```

**Alternative:** Set them in Vercel dashboard at [vercel.com/dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

#### Deploy to Production

```bash
# Deploy
vercel --prod
```

Your dashboard will be live at: `https://tachi-v2-[your-username].vercel.app`

---

**Quick Reference - Environment Variables:**

| Variable | Value | Scope |
|----------|-------|-------|
| `SUPABASE_URL` | From your `.env` file | Production |
| `SUPABASE_ANON_KEY` | From your `.env` file | Production |
| `NEXT_PUBLIC_CHAIN_ID` | `8453` | Production |
| `NEXT_PUBLIC_GATEWAY_URL` | `https://tachi-gateway.jgrahamsport16.workers.dev` | Production |

---

### Step 3: Test Production End-to-End (5 min)

Update the demo script to use production:

```bash
cd /Users/justin/Tachi/v2

# Edit demo.mjs line 104 to use production gateway
sed -i '' 's|process.env.GATEWAY_URL.*|process.env.GATEWAY_URL || "https://tachi-gateway.jgrahamsport16.workers.dev"|' demo.mjs

# Run the demo with real USDC on mainnet
node demo.mjs
```

**Expected output:**
1. ✅ SDK initialized with 30 USDC balance
2. ✅ Payment sent on Base Mainnet (~2 seconds)
3. ✅ Content delivered from gateway
4. ✅ Transaction visible on [Basescan](https://basescan.org)
5. ✅ Payment logged in Supabase
6. ✅ Dashboard shows live data

---

## 🎯 Production Checklist

- [x] Smart contracts deployed to Base Mainnet
- [x] License NFT minted
- [x] `.env` updated with mainnet addresses
- [x] Production environment template created
- [ ] Cloudflare Worker secrets updated for mainnet
- [ ] Dashboard deployed to Vercel
- [ ] End-to-end test passed with real USDC
- [ ] Documentation updated

---

## 💰 Production Wallet Status

**Address:** `0xEE785221C4389E21c3473f8dC2E16ea373B70d0D`

Check balances:
```bash
# ETH balance
cast balance 0xEE785221C4389E21c3473f8dC2E16ea373B70d0D --rpc-url https://mainnet.base.org

# USDC balance
cast call 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 "balanceOf(address)(uint256)" 0xEE785221C4389E21c3473f8dC2E16ea373B70d0D --rpc-url https://mainnet.base.org
```

---

## 🔗 Production URLs

### Deployed Services
- **Gateway:** https://tachi-gateway.jgrahamsport16.workers.dev
- **Dashboard:** (Deploy to Vercel to get URL)
- **API:** (Optional - can deploy to Vercel/Railway)

### Blockchain Explorers
- **Basescan:** https://basescan.org
- **Your Wallet:** https://basescan.org/address/0xEE785221C4389E21c3473f8dC2E16ea373B70d0D

### Contract Addresses
- **CrawlNFT:** https://basescan.org/address/0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED
- **PaymentProcessor:** https://basescan.org/address/0xf00976864d9dD3c0AE788f44f38bB84022B61a04
- **ProofOfCrawl:** https://basescan.org/address/0xb3f214dCC142b960aC82814325aD4f9181cfdBe6

---

## 🛠️ Maintenance

### Updating Gateway Code

```bash
cd /Users/justin/Tachi/v2/gateway
npx wrangler deploy
```

### Updating Dashboard

```bash
cd /Users/justin/Tachi/v2/dashboard
vercel --prod
```

### Checking Logs

**Cloudflare Worker logs:**
```bash
cd /Users/justin/Tachi/v2/gateway
npx wrangler tail
```

**Vercel logs:**
```bash
vercel logs
```

---

## 📊 Production Metrics

Track your protocol performance:

1. **On-chain metrics:** View all transactions on Basescan
2. **Dashboard analytics:** View real-time stats at your Vercel URL
3. **Supabase logs:** Query `payments` and `crawl_logs` tables

---

## 🚨 Troubleshooting

### Gateway returns 402 but payment fails
- Check wallet has enough USDC
- Verify contract addresses in Cloudflare secrets
- Check RPC URL is correct for mainnet

### Dashboard not showing data
- Verify Supabase environment variables
- Check API connection in browser console
- Ensure tables are populated

### Contract call reverts
- Verify you have minted license NFT
- Check USDC approval for PaymentProcessor
- Ensure wallet has ETH for gas

---

## 📖 Next Steps

1. **Marketing:** Share your gateway URL with AI companies
2. **Monitoring:** Set up Sentry/Datadog for error tracking
3. **Scaling:** Monitor usage and adjust pricing
4. **Security:** Consider multi-sig for contract ownership

---

**Total deployment time:** ~15 minutes
**Cost:** ~$0.01 in gas fees
**Result:** Fully production-ready pay-per-crawl protocol on Base Mainnet 🎉
