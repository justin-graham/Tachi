# Troubleshooting Guide

## Vercel Deployment Issues

### ❌ Error: "No Next.js version detected"

**Cause:** Vercel is looking in the wrong directory (root instead of `v2/dashboard`)

**Fix:**

**Option 1 - CLI (Easiest):**
```bash
# Make sure you're IN the dashboard directory
cd /Users/justin/Tachi/v2/dashboard

# Then deploy
vercel
```

**Option 2 - Web UI:**
1. Go to your Vercel project settings
2. Navigate to Settings → General
3. Find "Root Directory"
4. Set it to: `v2/dashboard`
5. Save and redeploy

---

### ❌ Error: "Module not found: @supabase/supabase-js"

**Cause:** Dependencies not installed on Vercel

**Fix:**
```bash
cd /Users/justin/Tachi/v2/dashboard
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

Then redeploy on Vercel.

---

### ❌ Error: "Cannot read contract"

**Cause:** Missing environment variables

**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add ALL environment variables from [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
3. Make sure `ADMIN_PRIVATE_KEY` is set as **Secret** (not Plain Text)
4. Click "Redeploy" after adding variables

---

## Wallet Connection Issues

### ❌ "No provider detected"

**Cause:** No wallet extension installed

**Fix:**
- Install MetaMask: https://metamask.io
- OR install Coinbase Wallet: https://www.coinbase.com/wallet
- Refresh page after installation

---

### ❌ "Wrong network"

**Cause:** Wallet connected to wrong chain

**Fix:**
1. Open your wallet extension
2. Switch network to "Base" (chain ID: 8453)
3. If Base is not in your wallet, add it:
   - Network Name: Base
   - RPC URL: https://mainnet.base.org
   - Chain ID: 8453
   - Currency: ETH
   - Block Explorer: https://basescan.org

---

## License Minting Issues

### ❌ "Failed to mint license"

**Possible causes:**

1. **Admin key not set:**
   - Check Vercel env vars
   - Make sure `ADMIN_PRIVATE_KEY` is correct
   - Redeploy after adding

2. **Admin account has no ETH:**
   - Admin wallet needs ~$0.50 ETH for gas
   - Send Base ETH to: `0xEE785221C4389E21c3473f8dC2E16ea373B70d0D`

3. **Already has license:**
   - Each wallet can only have one license
   - Check on BaseScan: https://basescan.org/address/{your-address}

**Debug:**
- Check browser console (F12) for errors
- Check Vercel logs for server errors
- Check BaseScan for recent transactions

---

## Dashboard Data Issues

### ❌ "Dashboard shows $0.00"

**Cause:** No payments yet (this is normal!)

**Fix:**
- This is expected for new publishers
- Run a test payment using the SDK
- Dashboard updates in real-time once payments arrive

---

### ❌ "Cannot fetch stats"

**Cause:** Supabase connection issue

**Fix:**
1. Check env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Verify Supabase project is active: https://supabase.com/dashboard
3. Check that database tables exist (run `schema.sql` if needed)

---

## Local Development Issues

### ❌ "npm run dev fails"

**Fix:**
```bash
cd /Users/justin/Tachi/v2/dashboard

# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

---

### ❌ "Cannot find module 'wagmi'"

**Fix:**
```bash
npm install wagmi viem@2.x @tanstack/react-query @supabase/supabase-js
```

---

## Gateway Issues

### ❌ "402 Payment Required but no payment details"

**Cause:** Gateway not configured properly

**Fix:**
1. Check Cloudflare Worker secrets are set
2. Verify contract addresses are correct
3. Check gateway logs in Cloudflare dashboard

---

### ❌ "Payment verified but content not returned"

**Cause:** Content not in gateway store

**Fix:**
- Gateway currently serves hardcoded demo content
- Add your content to `CONTENT_STORE` in `gateway/src/index.ts`
- Or integrate with your actual CMS/database

---

## Quick Checks

Before asking for help, verify:

- [ ] You're in the correct directory (`v2/dashboard`)
- [ ] All dependencies are installed (`npm install`)
- [ ] Environment variables are set (check `.env.local`)
- [ ] Wallet is connected to Base Mainnet
- [ ] You have Base ETH for gas (if minting)
- [ ] Browser console shows no errors (F12 → Console)

---

## Still Stuck?

1. **Check browser console** (F12 → Console tab)
2. **Check Vercel logs** (Dashboard → Deployments → View Function Logs)
3. **Check network requests** (F12 → Network tab)
4. **Verify on BaseScan:** https://basescan.org

---

## Common Environment Variable Issues

Make sure these are set in Vercel:

```bash
# Required (Public)
NEXT_PUBLIC_CRAWL_NFT_ADDRESS=0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=0xf00976864d9dD3c0AE788f44f38bB84022B61a04
NEXT_PUBLIC_SUPABASE_URL=https://yxyxiszugprlxqmmuxgnv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Required (Secret - mark as encrypted!)
ADMIN_PRIVATE_KEY=8bf70963...
```

**Note:** `ADMIN_PRIVATE_KEY` should be marked as "Secret" in Vercel, not "Plain Text"!

---

## Need More Help?

- Check the deployment logs in Vercel
- Verify contract deployments on BaseScan
- Test locally first (`npm run dev`)
- Check this guide again - 90% of issues are covered here!
