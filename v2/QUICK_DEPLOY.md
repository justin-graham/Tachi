# Quick Deploy Guide - 5 Minutes to Production

## Prerequisites
- GitHub account
- Vercel account (free)
- Your dashboard code pushed to GitHub

## Step 1: Deploy Dashboard to Vercel (2 min)

### Option A: Using Vercel CLI (Recommended - Easiest)

```bash
cd /Users/justin/Tachi/v2/dashboard

# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy from the dashboard directory
vercel
```

**When prompted, answer:**
- "Set up and deploy?" → **Y** (Yes)
- "Which scope?" → Select your account
- "Link to existing project?" → **N** (No, first time)
- "What's your project's name?" → `tachi-dashboard`
- "In which directory is your code located?" → **./** (just press Enter)
- Settings OK? → **Y** (Yes)

Vercel will automatically detect Next.js and deploy!

### Option B: Using Vercel Web UI

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project" → Connect GitHub
3. Select your repository
4. **Important:** Set "Root Directory" to `v2/dashboard`
5. Framework: Next.js (auto-detected)
6. Click "Deploy"

**If using Option B, you MUST set the Root Directory or it will fail!**

## Step 2: Set Environment Variables in Vercel (1 min)

In Vercel dashboard → Settings → Environment Variables, add:

```
NEXT_PUBLIC_CRAWL_NFT_ADDRESS=0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=0xf00976864d9dD3c0AE788f44f38bB84022B61a04
NEXT_PUBLIC_SUPABASE_URL=https://yxyxiszugprlxqmmuxgnv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eXhpc3p1Z3BybHhxbXV4Z252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0Mjk5MzksImV4cCI6MjA3NTAwNTkzOX0.2eAm79p0b0BDxgdHrOaimu82f4OsOrBR9AUUVHiYxjQ
ADMIN_PRIVATE_KEY=8bf70963040670b1484b42de8149c7921542c519269c6219bb7220603c6fd412
```

**Important:** Set ADMIN_PRIVATE_KEY to "Secret" (not "Plain Text")!

## Step 3: Redeploy (30 sec)

After adding env vars, click "Redeploy" in Vercel dashboard.

## Step 4: Test Your Live Site! (1 min)

Visit your Vercel URL (e.g., `tachi-dashboard.vercel.app`):

1. Connect wallet (MetaMask/Coinbase)
2. Click "Get Started"
3. Fill in domain & price
4. Submit → Get license NFT
5. View your dashboard!

## That's It! 🎉

Your production dashboard is live and users can sign up immediately.

---

## Optional: Custom Domain (2 min)

In Vercel dashboard → Settings → Domains:
1. Add your domain (e.g., `dashboard.tachi.ai`)
2. Update DNS records as instructed
3. Done!

---

## Gateway is Already Deployed

Your Cloudflare Worker gateway is already live at:
```
https://tachi-gateway.jgrahamsport16.workers.dev
```

No additional deployment needed!

---

## What Users See

**Landing page:** Professional marketing site with "Get Started" button
**Onboard page:** Simple form (domain + price) → instant license
**Dashboard:** Real-time revenue, requests, and stats
**Settings:** Integration code & gateway URL

**Total time from code to production: ~5 minutes**
