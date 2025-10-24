# Tachi v2 - Production Deployment Checklist

**Before you deploy:** Review this checklist to ensure everything is configured correctly.

---

## ✅ Prerequisites

- [ ] Node.js 18+ installed
- [ ] pnpm or npm installed
- [ ] Cloudflare account (free tier OK)
- [ ] Vercel account (free tier OK)
- [ ] Supabase account (free tier OK)
- [ ] Base mainnet ETH for gas
- [ ] npm account (for publishing SDK)

---

## 📋 Step 1: Deploy Smart Contracts (If not already done)

**Status:** ✅ Already deployed on Base Mainnet

Contracts:
- CrawlNFT: `0x4fA86C0bAD6AB64009445de6EE8462Bc31A4b347`
- PaymentProcessor: `0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA`
- ProofOfCrawl: `0x72a604278918abeBa4EE5f2C403b0350920A98ca`

If deploying new contracts:
```bash
cd v2/contracts
forge build
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
```

---

## 📋 Step 2: Set Up Supabase Database

- [ ] Create Supabase project at https://supabase.com
- [ ] Run `v2/database/schema.sql` in SQL Editor
- [ ] Enable Row Level Security on all tables
- [ ] Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- [ ] Verify tables created: `publishers`, `crawlers`, `payments`, `crawl_logs`

**Migration for existing databases:**
```sql
ALTER TABLE payments ADD COLUMN IF NOT EXISTS onchain_logged BOOLEAN DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS onchain_tx TEXT;
ALTER TABLE crawl_logs ADD COLUMN IF NOT EXISTS onchain_logged BOOLEAN DEFAULT false;
ALTER TABLE crawl_logs ADD COLUMN IF NOT EXISTS onchain_tx TEXT;
```

---

## 📋 Step 3: Deploy Gateway (Cloudflare Workers)

```bash
cd v2/gateway

# Install dependencies
npm install

# Set secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler secret put BASE_RPC_URL
wrangler secret put CRAWL_NFT_ADDRESS
wrangler secret put PROOF_OF_CRAWL_ADDRESS
wrangler secret put PAYMENT_PROCESSOR_ADDRESS
wrangler secret put PRICE_PER_REQUEST  # e.g., "0.01"
wrangler secret put PUBLISHER_ADDRESS  # Your default publisher wallet
wrangler secret put GATEWAY_PRIVATE_KEY  # Optional: for on-chain logging

# Deploy
wrangler deploy
```

**Secrets to set:**
- [x] `SUPABASE_URL`: From Supabase project settings
- [x] `SUPABASE_KEY`: Anon/public key
- [x] `BASE_RPC_URL`: `https://mainnet.base.org`
- [x] `CRAWL_NFT_ADDRESS`: `0x4fA86C0bAD6AB64009445de6EE8462Bc31A4b347`
- [x] `PROOF_OF_CRAWL_ADDRESS`: `0x72a604278918abeBa4EE5f2C403b0350920A98ca`
- [x] `PAYMENT_PROCESSOR_ADDRESS`: `0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA`
- [x] `PRICE_PER_REQUEST`: `0.01`
- [x] `PUBLISHER_ADDRESS`: Your wallet address
- [x] `GATEWAY_PRIVATE_KEY`: (Optional) Private key for on-chain logging

**Test gateway:**
```bash
curl https://your-gateway.workers.dev/health
# Should return: {"status":"ok","service":"Tachi Gateway",...}
```

---

## 📋 Step 4: Publish SDK to npm

```bash
cd v2/sdk

# Install dependencies
npm install

# Build
npm run build

# Verify build
ls dist/
# Should see: index.js, index.d.ts

# Test locally first
npm pack
# Creates tachi-sdk-2.0.0.tgz

# Publish to npm (requires npm login)
npm login
npm publish --access public
```

**Verify publication:**
```bash
npm view @tachi/sdk
# Should show version 2.0.0
```

**Test installation:**
```bash
mkdir test-tachi && cd test-tachi
npm init -y
npm install @tachi/sdk
```

---

## 📋 Step 5: Deploy Dashboard (Vercel)

```bash
cd v2/dashboard

# Install dependencies
npm install

# Set environment variables in Vercel dashboard or .env.production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_CRAWL_NFT_ADDRESS=0x4fA86C0bAD6AB64009445de6EE8462Bc31A4b347
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA
NEXT_PUBLIC_PROOF_OF_CRAWL_ADDRESS=0x72a604278918abeBa4EE5f2C403b0350920A98ca
NEXT_PUBLIC_GATEWAY_URL=https://your-gateway.workers.dev
ADMIN_PRIVATE_KEY=your_admin_private_key_for_minting_licenses

# Deploy
vercel
```

**Vercel environment variables:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_CRAWL_NFT_ADDRESS`
- [ ] `NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS`
- [ ] `NEXT_PUBLIC_PROOF_OF_CRAWL_ADDRESS`
- [ ] `NEXT_PUBLIC_GATEWAY_URL`
- [ ] `ADMIN_PRIVATE_KEY` (server-only, for minting licenses)

**Test dashboard:**
1. Visit your Vercel URL
2. Connect wallet
3. Navigate to /onboard
4. Fill form and submit
5. Check transaction on BaseScan
6. Verify license in /dashboard

---

## 📋 Step 6: Set Up Batch On-Chain Logging

This syncs Supabase logs to the ProofOfCrawl contract for immutable audit trails.

```bash
cd v2

# Create .env if not exists
cp .env.example .env

# Add these variables:
ADMIN_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_PROOF_OF_CRAWL_ADDRESS=0x72a604278918abeBa4EE5f2C403b0350920A98ca

# Install dependencies
npm install

# Test batch script
node scripts/batch-log-onchain.mjs
```

**Set up cron job (optional):**

Using GitHub Actions (recommended):
```yaml
# .github/workflows/batch-log.yml
name: Batch Log On-Chain
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger
jobs:
  log:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/batch-log-onchain.mjs
        env:
          ADMIN_PRIVATE_KEY: ${{ secrets.ADMIN_PRIVATE_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_PROOF_OF_CRAWL_ADDRESS: ${{ secrets.PROOF_OF_CRAWL_ADDRESS }}
```

Or use a cron job on a server:
```bash
# crontab -e
0 */6 * * * cd /path/to/tachi/v2 && node scripts/batch-log-onchain.mjs >> /var/log/tachi-batch.log 2>&1
```

---

## 📋 Step 7: End-to-End Testing

### Test Publisher Flow
1. [ ] Visit dashboard
2. [ ] Connect wallet (MetaMask)
3. [ ] Navigate to /onboard
4. [ ] Fill form (domain, price)
5. [ ] Submit → License NFT minted
6. [ ] Check BaseScan for tx
7. [ ] View /dashboard → Stats should load
8. [ ] Check /directory → Publisher appears

### Test Crawler Flow
1. [ ] Install SDK: `npm install @tachi/sdk`
2. [ ] Create test script:
```javascript
import {TachiSDK} from '@tachi/sdk';

const sdk = new TachiSDK({
  network: 'base',
  rpcUrl: 'https://mainnet.base.org',
  privateKey: `0x${process.env.PRIVATE_KEY}`,
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  paymentProcessorAddress: '0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA',
  debug: true
});

const gatewayUrl = 'https://your-gateway.workers.dev?publisher=0xPUBLISHER&target=https://example.com';
const result = await sdk.fetch(gatewayUrl);
console.log(result);
```
3. [ ] Run: `node test-crawler.mjs`
4. [ ] Verify payment on BaseScan
5. [ ] Check Supabase → New entry in `payments` and `crawl_logs`
6. [ ] Check dashboard → Revenue updated

### Test Gateway Proxying
1. [ ] Test 402 response:
```bash
curl https://your-gateway.workers.dev?publisher=0xABC&target=https://example.com
```
Should return 402 Payment Required

2. [ ] Test with payment (via SDK):
```bash
node v2/demo.mjs
```
Should fetch real content from target URL

---

## 📋 Step 8: Monitoring & Maintenance

### Set Up Monitoring

**Cloudflare Workers:**
- [ ] Enable email alerts for errors
- [ ] Set up request analytics in Cloudflare dashboard

**Supabase:**
- [ ] Enable database logging
- [ ] Set up alerts for high usage

**Vercel:**
- [ ] Enable deployment notifications
- [ ] Monitor bandwidth usage

### Regular Maintenance

**Daily:**
- [ ] Check Supabase for new crawl_logs
- [ ] Verify gateway health: `curl https://gateway.workers.dev/health`

**Weekly:**
- [ ] Run batch on-chain logger: `node scripts/batch-log-onchain.mjs`
- [ ] Review BaseScan for ProofOfCrawl events
- [ ] Check dashboard analytics

**Monthly:**
- [ ] Review Cloudflare/Vercel/Supabase usage
- [ ] Update dependencies: `npm update`
- [ ] Review and respond to GitHub issues

---

## 📋 Step 9: Post-Launch

- [ ] Announce on Twitter/X
- [ ] Post in Discord/Telegram
- [ ] Write launch blog post
- [ ] Submit to Product Hunt
- [ ] Update docs with real examples
- [ ] Create demo video
- [ ] Reach out to early publishers
- [ ] Reach out to AI companies

---

## 🚨 Troubleshooting

### Gateway returns 500 errors
- Check Cloudflare Workers logs
- Verify all secrets are set: `wrangler secret list`
- Test RPC connection: `curl https://mainnet.base.org`

### License minting fails
- Check `ADMIN_PRIVATE_KEY` has Base ETH
- Verify CrawlNFT contract address
- Check Vercel function logs

### Dashboard not loading
- Check browser console for errors
- Verify Supabase credentials
- Check Vercel deployment logs

### SDK payment fails
- Verify USDC balance: `sdk.getBalance()`
- Check PaymentProcessor address
- Ensure crawler has approved USDC

### Batch logging fails
- Check `ADMIN_PRIVATE_KEY` has Base ETH
- Verify ProofOfCrawl contract address
- Check Supabase connection

---

## ✅ Final Checklist

- [ ] Smart contracts deployed on Base Mainnet
- [ ] Supabase database created and migrated
- [ ] Gateway deployed to Cloudflare Workers
- [ ] SDK published to npm
- [ ] Dashboard deployed to Vercel
- [ ] Batch on-chain logger configured
- [ ] End-to-end test completed
- [ ] Monitoring set up
- [ ] Documentation updated
- [ ] Ready for users! 🚀

---

**Estimated deployment time:** 30-45 minutes

**Cost:** $0/month (all on free tiers)

**Support:** [GitHub Issues](https://github.com/yourusername/tachi/issues) | [Discord](https://discord.gg/tachi)
