# Fix Vercel Deployment Issues ✅

## Problem: "pnpm install" fails

**Cause:** Vercel detects the root workspace config and tries to use `pnpm`, but the dashboard should use `npm`.

---

## Solution: Configure Vercel Project Settings

### Option 1: Via Vercel Dashboard (Easiest) ⭐

1. Go to your Vercel project dashboard
2. Click **Settings** → **General**
3. Scroll down to **Build & Development Settings**
4. Override these settings:

```
Install Command: npm install
Build Command: npm run build
Output Directory: .next (leave as default)
```

5. Scroll to **Root Directory**
   - Set to: `v2/dashboard`
   - Check "Include source files outside of the Root Directory"

6. Click **Save**
7. Go to **Deployments** tab → Click **"Redeploy"**

---

### Option 2: Via vercel.json (Already Done) ✅

The `v2/dashboard/vercel.json` file is already configured:

```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs"
}
```

This should work, but if Vercel still uses pnpm, use Option 1 above.

---

## Complete Deployment Steps

### 1. Deploy from Dashboard Directory

```bash
cd /Users/justin/Tachi/v2/dashboard
npx vercel
```

### 2. When Prompted

- Set up and deploy? → **Y**
- Which scope? → Select your account
- Link to existing project? → **N** (first time) or **Y** (if redeploying)
- Project name? → `tachi-dashboard`
- Directory? → **./** (press Enter)
- Settings OK? → **Y**

### 3. If Build Still Fails

Go to Vercel dashboard and manually set:
- **Install Command:** `npm install`
- **Root Directory:** `v2/dashboard`
- **Framework:** Next.js

Then click **Redeploy**.

---

## Environment Variables (Don't Forget!)

After successful deployment, add these in Vercel → Settings → Environment Variables:

```bash
NEXT_PUBLIC_CRAWL_NFT_ADDRESS=0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=0xf00976864d9dD3c0AE788f44f38bB84022B61a04
NEXT_PUBLIC_SUPABASE_URL=https://yxyxiszugprlxqmmuxgnv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eXhpc3p1Z3BybHhxbXV4Z252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0Mjk5MzksImV4cCI6MjA3NTAwNTkzOX0.2eAm79p0b0BDxgdHrOaimu82f4OsOrBR9AUUVHiYxjQ

# Mark this one as SECRET (not plain text)
ADMIN_PRIVATE_KEY=8bf70963040670b1484b42de8149c7921542c519269c6219bb7220603c6fd412
```

Then click **Redeploy**.

---

## Alternative: Deploy Without Workspace

If you want to completely avoid workspace issues:

```bash
# Option A: Remove dashboard from workspace temporarily
# Edit /Users/justin/Tachi/v2/package.json
# Remove "dashboard" from workspaces array
# Then deploy

# Option B: Copy dashboard to a separate directory
cp -r /Users/justin/Tachi/v2/dashboard /tmp/tachi-dashboard
cd /tmp/tachi-dashboard
npm install  # This will create package-lock.json
vercel
```

---

## Verify Deployment

After successful deployment, visit your URL and test:

1. ✅ Page loads
2. ✅ "Connect Wallet" button appears
3. ✅ Can connect wallet
4. ✅ Can navigate to /onboard
5. ✅ All API routes work

---

## Quick Reference

**Error Message:** `Command "pnpm install" exited with 1`
**Fix:** Set Install Command to `npm install` in Vercel settings

**Error Message:** `No Next.js version detected`
**Fix:** Set Root Directory to `v2/dashboard`

**Error Message:** `Cannot find module`
**Fix:** Add missing env vars, then redeploy

---

## Still Having Issues?

1. Check the **Function Logs** in Vercel for detailed errors
2. Verify `vercel.json` is in `/v2/dashboard/` directory
3. Make sure you deployed FROM the dashboard directory
4. Try the "Alternative" method above
5. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more solutions

---

**Bottom line:** Explicitly tell Vercel to use `npm install` and set root to `v2/dashboard`. The monorepo structure confuses it otherwise.
