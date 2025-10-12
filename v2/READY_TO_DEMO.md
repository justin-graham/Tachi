# 🎉 Tachi v2 - Ready to Demo!

**Status:** All prerequisites complete! ✅

---

## ✅ What's Done

### 1. Wallet Configured
- **Address:** `0xEE785221C4389E21c3473f8dC2E16ea373B70d0D`
- **ETH Balance:** 0.01 ETH (enough for gas fees)
- **USDC Balance:** 10 USDC (enough for 1000 test requests!)

### 2. Smart Contracts Deployed
- **CrawlNFT:** `0xf00976864d9dD3c0AE788f44f38bB84022B61a04`
- **PaymentProcessor:** `0xb3f214dCC142b960aC82814325aD4f9181cfdBe6`
- **ProofOfCrawl:** `0xE39F3d4c5bE182d93C64BD08E21596522D9557D2`
- **Network:** Base Sepolia
- **Deployer:** Your wallet (you own all contracts)

### 3. Publisher License Minted
- ✅ License NFT minted for your wallet
- ✅ `hasLicense()` returns `true`
- ✅ Ready to receive payments

### 4. SDK Built
- ✅ TypeScript compiled to JavaScript
- ✅ Located in `sdk/dist/`
- ✅ Ready for use in `demo.mjs`

### 5. Dashboard Connected
- ✅ All 3 pages wired to live API
- ✅ No more mock data
- ✅ Ready to display real transactions

---

## 🚀 Next Steps (30 minutes)

### Step 1: Initialize Supabase Database (5 min)

1. Go to: https://supabase.com/dashboard/project/yxyxiszugprlxqmmuxgnv
2. Navigate to: **SQL Editor**
3. Copy contents of `database/schema.sql`
4. Paste and click **Run**
5. Add test publisher record:

```sql
INSERT INTO publishers (domain, name, email, wallet_address, price_per_request)
VALUES (
  'tachi.ai',
  'Tachi Test Publisher',
  'publisher@tachi.ai',
  '0xEE785221C4389E21c3473f8dC2E16ea373B70d0D',
  0.01
);
```

---

### Step 2: Start Services (3 min)

**Terminal 1 - API:**
```bash
cd /Users/justin/Tachi/v2/api
npm install
npm run dev
```
Should start on `http://localhost:3001`

**Terminal 2 - Dashboard:**
```bash
cd /Users/justin/Tachi/v2/dashboard
npm install
npm run dev
```
Should start on `http://localhost:3000`

**Terminal 3 - Gateway (local):**
```bash
cd /Users/justin/Tachi/v2/gateway
npm install
npx wrangler dev
```
Should start on `http://localhost:8787`

---

### Step 3: Update Demo Script (2 min)

Edit `/Users/justin/Tachi/v2/demo.mjs` line ~104:

Change:
```javascript
const gatewayUrl = process.env.GATEWAY_URL || 'https://gateway.tachi.workers.dev';
```

To:
```javascript
const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:8787';
```

---

### Step 4: Run End-to-End Demo (5 min)

```bash
cd /Users/justin/Tachi/v2
node demo.mjs
```

**Expected Flow:**
1. SDK initializes with your wallet
2. Checks USDC balance (shows 10 USDC)
3. Requests content from gateway
4. Gateway returns 402 Payment Required
5. SDK approves PaymentProcessor
6. SDK sends USDC payment on-chain
7. SDK retries request with transaction hash
8. Gateway verifies payment
9. Gateway logs to Supabase
10. Gateway returns content
11. Success! ✅

**You'll see:**
- Transaction hash on Basescan
- Content delivered
- Payment logged

**Check dashboard:**
- Open: http://localhost:3000/dashboard
- See your request appear in real-time!

---

### Step 5: Deploy Gateway to Cloudflare (10 min)

```bash
cd /Users/justin/Tachi/v2/gateway

# Set secrets (one by one)
wrangler secret put SUPABASE_URL
# Paste: https://yxyxiszugprlxqmmuxgnv.supabase.co

wrangler secret put SUPABASE_KEY
# Paste your anon key from .env

wrangler secret put BASE_RPC_URL
# Paste: https://sepolia.base.org

wrangler secret put CRAWL_NFT_ADDRESS
# Paste: 0xf00976864d9dD3c0AE788f44f38bB84022B61a04

wrangler secret put PROOF_OF_CRAWL_ADDRESS
# Paste: 0xE39F3d4c5bE182d93C64BD08E21596522D9557D2

wrangler secret put PUBLISHER_ADDRESS
# Paste: 0xEE785221C4389E21c3473f8dC2E16ea373B70d0D

wrangler secret put PRICE_PER_REQUEST
# Paste: 0.01

# Deploy!
wrangler deploy
```

You'll get a URL like:
`https://tachi-gateway.your-subdomain.workers.dev`

Update `.env`:
```bash
GATEWAY_URL=https://tachi-gateway.your-subdomain.workers.dev
```

---

## 📊 System Status

```
✅ Wallet: 0xEE78...0d0D (10 USDC, 0.01 ETH)
✅ Contracts deployed to Base Sepolia
✅ License NFT minted
✅ SDK built
✅ Dashboard connected to API
⚠️ Supabase tables (need to run schema.sql)
⚠️ Services (need to start)
⚠️ Gateway (local dev or Cloudflare deploy)
```

---

## 🔗 Important Links

### Deployed Contracts (Base Sepolia)
- **CrawlNFT:** https://sepolia.basescan.org/address/0xf00976864d9dD3c0AE788f44f38bB84022B61a04
- **PaymentProcessor:** https://sepolia.basescan.org/address/0xb3f214dCC142b960aC82814325aD4f9181cfdBe6
- **ProofOfCrawl:** https://sepolia.basescan.org/address/0xE39F3d4c5bE182d93C64BD08E21596522D9557D2

### Your Wallet
- **Basescan:** https://sepolia.basescan.org/address/0xEE785221C4389E21c3473f8dC2E16ea373B70d0D

### Supabase
- **Dashboard:** https://supabase.com/dashboard/project/yxyxiszugprlxqmmuxgnv
- **SQL Editor:** https://supabase.com/dashboard/project/yxyxiszugprlxqmmuxgnv/sql

---

## 🎯 Success Criteria

After completing steps 1-5, you'll have:

1. ✅ Full end-to-end payment flow working
2. ✅ On-chain transaction proof on Basescan
3. ✅ Content delivered after payment
4. ✅ Dashboard showing live stats
5. ✅ Gateway deployed to Cloudflare (production-ready!)

**Total time:** ~25 minutes from now to fully working MVP! 🚀

---

## 💡 Quick Commands

**Check setup status:**
```bash
cd /Users/justin/Tachi/v2
./scripts/check-setup.sh
```

**Check balances:**
```bash
source .env
cast balance $PUBLISHER_ADDRESS --rpc-url $BASE_SEPOLIA_RPC
cast call $USDC_BASE_SEPOLIA "balanceOf(address)" $PUBLISHER_ADDRESS --rpc-url $BASE_SEPOLIA_RPC
```

**Verify license:**
```bash
source .env
cast call $CRAWL_NFT_ADDRESS "hasLicense(address)" $PUBLISHER_ADDRESS --rpc-url $BASE_SEPOLIA_RPC
```

---

**You're 95% there! Just need to initialize the database and start the services.** 🎉
