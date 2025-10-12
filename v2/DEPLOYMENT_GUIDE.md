# Tachi v2 Deployment Guide

## Prerequisites

- Node.js 20+
- pnpm 8+
- Foundry (for smart contracts)
- Base Sepolia testnet ETH
- Supabase account (free tier)

---

## Step 1: Deploy Smart Contracts

```bash
cd v2/contracts

# Set up environment
cp ../.env.example .env
# Edit .env and add your PRIVATE_KEY and BASESCAN_API_KEY

# Build contracts
forge build

# Deploy to Base Sepolia
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify

# Addresses will be saved to deployments/latest.env
```

After deployment, copy the contract addresses to your root `.env` file.

---

## Step 2: Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Once created, go to SQL Editor
3. Run the schema from `v2/database/schema.sql`
4. Go to Settings → API to get your:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. Add these to your root `.env` file

---

## Step 3: Deploy Gateway (Cloudflare Worker)

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
wrangler secret put PRICE_PER_REQUEST
wrangler secret put PUBLISHER_ADDRESS

# Deploy
wrangler deploy
```

---

## Step 4: Start API Server

```bash
cd v2/api

# Install dependencies
npm install

# Copy contract addresses and Supabase creds to .env
cp ../.env .env

# Start server
npm run dev
```

---

## Step 5: Start Dashboard

```bash
cd v2/dashboard

# Install dependencies
npm install

# Set up environment
cp ../.env .env.local

# Start dashboard
npm run dev
```

---

## Step 6: Test the Flow

See `v2/demo.mjs` for a complete end-to-end test script.

```bash
cd v2
node demo.mjs
```

---

## Production Deployment

### Contracts
- Deploy to Base Mainnet using `--rpc-url base`
- Use a hardware wallet or secure key management

### API
- Deploy to your preferred hosting (Railway, Render, Fly.io)
- Set environment variables in hosting platform

### Gateway
- Already on Cloudflare Workers (production-ready)
- Configure custom domain in Cloudflare dashboard

### Dashboard
- Deploy to Vercel: `cd dashboard && vercel`
- Set environment variables in Vercel dashboard

---

## Monitoring

Check contract events on Base:
- Sepolia: https://sepolia.basescan.org
- Mainnet: https://basescan.org

Monitor API health:
- `GET /health` endpoint

Check Supabase logs:
- Supabase Dashboard → Database → Logs
