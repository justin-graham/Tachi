# Tachi v2 - Next Steps to MVP Complete

## ✅ Completed (Just Now)

1. **SDK Build Fixed** - TypeScript now compiles to JavaScript in `sdk/dist/`
2. **Contract Addresses Synced** - `.env` now has all deployed contract addresses
3. **Dashboard Connected to API** - All 3 pages now fetch live data from API

## 🚀 Remaining Steps (45 minutes)

### Step 1: Get Base Sepolia Testnet ETH (10 min)

Your wallet needs ETH for gas fees:
- **Wallet:** `0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d`
- **Get ETH from:** https://www.alchemy.com/faucets/base-sepolia
  - OR: https://docs.base.org/docs/tools/network-faucets

You need ~0.01 ETH for minting and testing.

---

### Step 2: Mint Publisher License NFT (2 min)

Once you have testnet ETH:

```bash
cd /Users/justin/Tachi/v2

# Mint license
source .env && cast send $CRAWL_NFT_ADDRESS \
  "mintLicense(address,string)" \
  $PUBLISHER_ADDRESS \
  "https://tachi.ai/terms/v1" \
  --private-key $PRIVATE_KEY \
  --rpc-url $BASE_SEPOLIA_RPC

# Verify it worked
cast call $CRAWL_NFT_ADDRESS \
  "hasLicense(address)" \
  $PUBLISHER_ADDRESS \
  --rpc-url $BASE_SEPOLIA_RPC
```

Should return `true` (0x0000...0001)

---

### Step 3: Set Up Supabase Tables (5 min)

The schema is already created (`database/schema.sql`), but you need to:

1. Go to https://supabase.com/dashboard
2. Select your project: `yxyxiszugprlxqmmuxgnv`
3. Navigate to: SQL Editor
4. Copy/paste the contents of `/Users/justin/Tachi/v2/database/schema.sql`
5. Click "Run"

**Add test publisher record:**
```sql
INSERT INTO publishers (domain, name, email, wallet_address, price_per_request)
VALUES (
  'tachi.ai',
  'Tachi Test Publisher',
  'publisher@tachi.ai',
  '0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d',
  0.01
);
```

---

### Step 4: Get Testnet USDC (5 min)

Your crawler wallet needs USDC to pay:

```bash
# Check if you have USDC
cast call 0x036CbD53842c5426634e7929541eC2318f3dCF7e \
  "balanceOf(address)" \
  0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d \
  --rpc-url https://sepolia.base.org

# If balance is 0, you need to get testnet USDC from Circle:
# https://faucet.circle.com/
```

---

### Step 5: Start All Services (3 min)

**Terminal 1 - API:**
```bash
cd /Users/justin/Tachi/v2/api
npm install
npm run dev
# Should start on port 3001
```

**Terminal 2 - Dashboard:**
```bash
cd /Users/justin/Tachi/v2/dashboard
npm install
npm run dev
# Should start on port 3000
```

**Terminal 3 - Gateway (local testing):**
```bash
cd /Users/justin/Tachi/v2/gateway
npm install
npx wrangler dev
# Should start on port 8787
```

---

### Step 6: Update Demo Script for Local Gateway (2 min)

Edit `/Users/justin/Tachi/v2/demo.mjs`:

Change line ~104:
```javascript
const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:8787';
```

---

### Step 7: Run End-to-End Demo (5 min)

```bash
cd /Users/justin/Tachi/v2
node demo.mjs
```

**Expected output:**
1. ✅ SDK initialized
2. ✅ Payment sent to publisher
3. ✅ Content delivered from gateway
4. ✅ Transaction logged on-chain
5. ✅ Visible in dashboard at http://localhost:3000/dashboard

---

### Step 8: Deploy Gateway to Cloudflare (10 min)

```bash
cd /Users/justin/Tachi/v2/gateway

# Set secrets
wrangler secret put SUPABASE_URL
# Paste: https://yxyxiszugprlxqmmuxgnv.supabase.co

wrangler secret put SUPABASE_KEY
# Paste your anon key from .env

wrangler secret put BASE_RPC_URL
# Paste: https://sepolia.base.org

wrangler secret put CRAWL_NFT_ADDRESS
# Paste: 0xF045deeB509cAf99DF5a021d7a98eADF6411Daa6

wrangler secret put PROOF_OF_CRAWL_ADDRESS
# Paste: 0x022cF2f017fc84b00A45c020dbe7aa785eCE7479

wrangler secret put PUBLISHER_ADDRESS
# Paste: 0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d

wrangler secret put PRICE_PER_REQUEST
# Paste: 0.01

# Deploy!
wrangler deploy
```

You'll get a URL like: `https://tachi-gateway.your-subdomain.workers.dev`

Update `.env` with:
```
GATEWAY_URL=https://tachi-gateway.your-subdomain.workers.dev
```

---

## 🎉 Success Criteria

After completing these steps, you should have:

1. ✅ Smart contracts deployed on Base Sepolia
2. ✅ Publisher license NFT minted
3. ✅ Supabase database with tables
4. ✅ API running on port 3001
5. ✅ Dashboard running on port 3000
6. ✅ Gateway deployed to Cloudflare
7. ✅ Demo script successfully runs end-to-end
8. ✅ Dashboard shows live transaction data

---

## 🐛 Common Issues

### "Gas required exceeds allowance"
- Need Base Sepolia ETH in wallet
- Get from faucet (see Step 1)

### "Payment verification failed"
- Need testnet USDC in wallet
- Get from Circle faucet (see Step 4)

### "Failed to fetch stats" in dashboard
- Make sure API is running on port 3001
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`

### Gateway returns 500 error
- Check all wrangler secrets are set correctly
- Verify Supabase credentials work
- Check RPC URL is accessible

---

## 📊 Code Summary

Total production code: **~1,935 lines**

- Contracts: 350 lines (3 Solidity files)
- SDK: 250 lines (1 TypeScript file)
- Gateway: 300 lines (1 TypeScript file)
- API: 250 lines (4 route files)
- Database: 120 lines (SQL schema)
- Dashboard: 665 lines (3 pages + layout)

**Simple. Focused. Ship-ready.** 🚀
