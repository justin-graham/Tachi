# Deploy Your MVP Right Now! 🚀

## 3 Simple Steps to Production

---

## Step 1: Deploy to Vercel (2 minutes)

**From your terminal:**

```bash
# Navigate to the dashboard folder
cd /Users/justin/Tachi/v2/dashboard

# Deploy with Vercel CLI
npx vercel
```

**Answer the prompts:**
- Set up and deploy? → **Y**
- Which scope? → Select your account
- Link to existing project? → **N**
- Project name? → `tachi-dashboard`
- Directory? → **./** (press Enter)
- Settings OK? → **Y**

✅ Your dashboard is now deploying!

---

## Step 2: Add Environment Variables (1 minute)

1. Go to the URL Vercel gave you
2. Click "Go to Dashboard" or visit https://vercel.com
3. Find your project → Settings → Environment Variables
4. Add these (click "Add" for each):

```
NEXT_PUBLIC_CRAWL_NFT_ADDRESS=0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=0xf00976864d9dD3c0AE788f44f38bB84022B61a04
NEXT_PUBLIC_SUPABASE_URL=https://yxyxiszugprlxqmmuxgnv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eXhpc3p1Z3BybHhxbXV4Z252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0Mjk5MzksImV4cCI6MjA3NTAwNTkzOX0.2eAm79p0b0BDxgdHrOaimu82f4OsOrBR9AUUVHiYxjQ
ADMIN_PRIVATE_KEY=8bf70963040670b1484b42de8149c7921542c519269c6219bb7220603c6fd412
```

**Important:**
- For `ADMIN_PRIVATE_KEY`, select **"Secret"** (not "Plain Text")
- Click "Save" after adding all variables

5. Click **"Redeploy"** button (top right)

✅ Your app is now configured!

---

## Step 3: Test It! (1 minute)

1. Visit your Vercel URL (something like `tachi-dashboard.vercel.app`)
2. Click **"Connect Wallet"** (top right)
3. Connect with MetaMask/Coinbase
4. Click **"Get Started"**
5. Fill in:
   - Domain: `test.com`
   - Price: `0.01`
6. Click **"Create Publisher License"**
7. Wait ~10 seconds → You'll be redirected to your dashboard!

✅ **You're live!** 🎉

---

## That's It!

**Your production MVP is now live at:** `https://your-project.vercel.app`

**What users can do:**
- Connect wallet
- Get instant license (free for them, you pay gas)
- See real-time revenue dashboard
- Start earning from AI crawlers

---

## Quick Fixes

**If you see "pnpm install failed" error:** ⚠️
- **Solution:** See [VERCEL_FIX.md](./VERCEL_FIX.md) - Go to Vercel Settings → Build & Development Settings → Set Install Command to `npm install`
- This happens because of the monorepo structure

**If deployment fails:**
- Make sure you ran `npx vercel` FROM `/v2/dashboard` directory
- Set Root Directory to `v2/dashboard` in Vercel project settings
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more issues

**If environment variables aren't working:**
- Double-check you clicked "Redeploy" after adding them
- Verify `ADMIN_PRIVATE_KEY` is marked as "Secret"

---

## Next: Share Your Site!

Your dashboard is live! Now:

1. **Test the full flow** (connect → onboard → view dashboard)
2. **Share with beta users**
3. **Monitor via Vercel dashboard** for logs/errors
4. **Watch payments** roll in via your dashboard

---

## URLs You Need

- **Your Dashboard:** Check Vercel deployment output
- **Gateway (already live):** https://tachi-gateway.jgrahamsport16.workers.dev
- **Smart Contracts:** https://basescan.org/address/0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED
- **Supabase:** https://supabase.com/dashboard

---

**Total Time: ~5 minutes**
**Cost: $0/month (free tier)**
**Status: Production-ready!**

🚀 **Your MVP is live. Go get users!**
