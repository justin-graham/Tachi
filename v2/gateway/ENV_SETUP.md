# Gateway Environment Setup

Complete guide for configuring Tachi Gateway Cloudflare Worker for production on Base Mainnet.

> **📌 Note:** Tachi now uses a **unified `.env` file** at the project root (`/v2/.env`).
> All services (API, Gateway, Contracts, Dashboard) read from this single file.
> Use the `sync-secrets.sh` script to push secrets to Cloudflare Workers.

---

## Required Environment Variables

The gateway requires 8 environment variables to function correctly:

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_KEY` | Supabase anon/service key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `BASE_RPC_URL` | Base Mainnet RPC endpoint | `https://mainnet.base.org` |
| `CRAWL_NFT_ADDRESS` | CrawlNFT contract address | `0x4fA86C0bAD6AB64009445de6EE8462Bc31A4b347` |
| `PROOF_OF_CRAWL_ADDRESS` | ProofOfCrawl contract | `0x72a604278918abeBa4EE5f2C403b0350920A98ca` |
| `PAYMENT_PROCESSOR_ADDRESS` | PaymentProcessor contract | `0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA` |
| `PRICE_PER_REQUEST` | Default price in USDC | `0.01` |
| `PUBLISHER_ADDRESS` | Default publisher wallet | `0xYourPublisherAddress` |

---

## Contract Addresses

### Base Mainnet (Chain ID: 8453)

```bash
# Deployed contract addresses
CRAWL_NFT_ADDRESS=0x4fA86C0bAD6AB64009445de6EE8462Bc31A4b347
PROOF_OF_CRAWL_ADDRESS=0x72a604278918abeBa4EE5f2C403b0350920A98ca
PAYMENT_PROCESSOR_ADDRESS=0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA

# USDC on Base Mainnet
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

**Verify contracts on BaseScan:**
- CrawlNFT: [basescan.org/address/0x4fA86C0bAD6AB64009445de6EE8462Bc31A4b347](https://basescan.org/address/0x4fA86C0bAD6AB64009445de6EE8462Bc31A4b347)
- ProofOfCrawl: [basescan.org/address/0x72a604278918abeBa4EE5f2C403b0350920A98ca](https://basescan.org/address/0x72a604278918abeBa4EE5f2C403b0350920A98ca)
- PaymentProcessor: [basescan.org/address/0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA](https://basescan.org/address/0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA)

---

## Setup Instructions

### Option A: Automated Sync (Recommended)

**Quick setup using the sync script:**

```bash
# 1. Ensure root .env is configured (should already be done)
# The file is at: /Users/justin/Tachi/v2/.env

# 2. Login to Cloudflare
cd v2/gateway
wrangler login

# 3. Run the sync script
./sync-secrets.sh
```

The script will automatically:
- Read all variables from root `.env`
- Push relevant secrets to Cloudflare Workers
- Verify the sync was successful

**That's it!** Skip to step 4 (Deploy Gateway) below.

---

### Option B: Manual Setup (Advanced)

If you prefer to set secrets manually:

```bash
# Make sure you're authenticated
wrangler login

# Set each secret individually
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_KEY
wrangler secret put BASE_RPC_URL
wrangler secret put CRAWL_NFT_ADDRESS
wrangler secret put PROOF_OF_CRAWL_ADDRESS
wrangler secret put PAYMENT_PROCESSOR_ADDRESS
wrangler secret put PRICE_PER_REQUEST
wrangler secret put PUBLISHER_ADDRESS
```

See the contract addresses section below for the values.

### 3. Verify Secrets

```bash
# List all configured secrets (values are hidden)
wrangler secret list

# Should show:
# SUPABASE_URL
# SUPABASE_KEY
# BASE_RPC_URL
# CRAWL_NFT_ADDRESS
# PROOF_OF_CRAWL_ADDRESS
# PAYMENT_PROCESSOR_ADDRESS
# PRICE_PER_REQUEST
# PUBLISHER_ADDRESS
```

### 4. Deploy Gateway

```bash
# Build
pnpm build

# Deploy to Cloudflare
wrangler deploy

# Output:
# ✨ Built successfully
# 🌍 Deploying to Cloudflare Workers...
# ✨ Success! Published to https://tachi-gateway.YOUR_SUBDOMAIN.workers.dev
```

### 5. Verify Deployment

```bash
# Test health endpoint
curl https://YOUR_GATEWAY_URL/health

# Expected response:
# {
#   "status": "ok",
#   "service": "Tachi Gateway",
#   "version": "2.0",
#   "publisher": "0xYOUR_ADDRESS"
# }

# Test payment required
curl https://YOUR_GATEWAY_URL/article/ai-training

# Expected response: 402 with payment details
```

---

## Supabase Setup

### Get Supabase Credentials

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings > API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_KEY` (for development)
   - **service_role** key → `SUPABASE_KEY` (for production - more permissions)

**⚠️ Important:** Use `service_role` key for production to bypass RLS policies.

### Initialize Database Schema

```bash
# If you haven't already, create tables
cd v2/database

# Copy schema.sql contents to Supabase SQL Editor
# Or use Supabase CLI:
supabase db push
```

---

## RPC Configuration

### Primary RPC

Default: `https://mainnet.base.org` (free, public)

**Rate Limits:** ~100 requests/second (varies)

### Backup RPC Options

If primary RPC fails, switch to a backup:

```bash
# Option 1: LlamaRPC (free)
wrangler secret put BASE_RPC_URL
# Enter: https://base.llamarpc.com

# Option 2: Alchemy (requires account)
# Enter: https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Option 3: Infura (requires account)
# Enter: https://base-mainnet.infura.io/v3/YOUR_API_KEY
```

**Recommended:** Set up monitoring to alert if RPC requests fail

---

## Optional: Gateway Private Key

For on-chain logging (writing to ProofOfCrawl contract):

```bash
wrangler secret put GATEWAY_PRIVATE_KEY
# Paste: 0xYOUR_PRIVATE_KEY

# ⚠️ Use a dedicated wallet with minimal funds!
# Fund with ~0.01 ETH for gas
```

**Note:** On-chain logging is optional. Supabase logging works without this.

---

## Environment-Specific Config

### Development (Base Sepolia)

```bash
BASE_RPC_URL=https://sepolia.base.org
CRAWL_NFT_ADDRESS=0xTestnetAddress
PAYMENT_PROCESSOR_ADDRESS=0xTestnetAddress
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Production (Base Mainnet)

```bash
BASE_RPC_URL=https://mainnet.base.org
# Use mainnet addresses (listed above)
```

---

## Verification Checklist

Before going live, verify:

- [ ] All 8 environment variables set in Cloudflare
- [ ] Health endpoint returns 200
- [ ] 402 responses include correct payment details
- [ ] Contract addresses verified on BaseScan
- [ ] Supabase connection working
- [ ] RPC calls succeeding
- [ ] Publisher address correct
- [ ] Price per request appropriate

**Test script:**

```bash
#!/bin/bash
GATEWAY_URL="https://your-gateway.workers.dev"

echo "Testing health..."
curl -s $GATEWAY_URL/health | jq

echo -e "\nTesting 402..."
curl -s $GATEWAY_URL/article/ai-training | jq '.payment'

echo -e "\nTesting catalog..."
curl -s $GATEWAY_URL/catalog | jq '.catalog | length'

echo -e "\nTesting rate limiting..."
for i in {1..105}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" $GATEWAY_URL/health)
  if [ "$STATUS" = "429" ]; then
    echo "✓ Rate limiting working (got 429 at request $i)"
    break
  fi
done
```

---

## Updating Environment Variables

To change a variable:

**Option A: Update root .env and re-sync (Recommended)**

```bash
# 1. Edit /Users/justin/Tachi/v2/.env
# Update the variable you want to change

# 2. Re-run sync script
cd v2/gateway
./sync-secrets.sh

# 3. Verify
curl https://your-gateway.workers.dev/health
```

**Option B: Manual update**

```bash
# Update the secret directly
wrangler secret put VARIABLE_NAME

# No need to redeploy - changes take effect immediately

# Verify change
curl https://your-gateway.workers.dev/health
```

**Note:** Always keep root `.env` in sync with Cloudflare secrets to avoid confusion.

---

## Security Best Practices

1. **Never commit secrets** to git
2. **Use service_role key** for production (more reliable)
3. **Rotate keys** quarterly
4. **Monitor for unusual activity**
5. **Use dedicated wallet** for gateway private key (if used)

---

## Troubleshooting

### "Supabase connection failed"

```bash
# Test connection
curl https://YOUR_PROJECT.supabase.co/rest/v1/publishers \
  -H "apikey: YOUR_KEY" \
  -H "Authorization: Bearer YOUR_KEY"

# If 401: Wrong key
# If 404: Wrong URL
# If timeout: Network issue
```

### "RPC request failed"

```bash
# Test RPC directly
curl https://mainnet.base.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'

# Should return: {"jsonrpc":"2.0","id":1,"result":"0x..."}
```

### "Contract address invalid"

```bash
# Verify contract exists
cast code 0xCONTRACT_ADDRESS --rpc-url https://mainnet.base.org

# Should return bytecode (long hex string)
# If 0x: Contract doesn't exist at that address
```

---

## Monitoring

Set up alerts for:

- Gateway response time >2s
- Error rate >5%
- RPC failures
- Supabase connection errors

**Cloudflare Dashboard:**
[dash.cloudflare.com/workers](https://dash.cloudflare.com/workers)

**Useful metrics:**
- Requests per second
- Error rate
- P50/P99 latency
- CPU time

---

## Support

Questions? Issues?

- **Troubleshooting:** [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- **Emergency:** [EMERGENCY_RUNBOOK.md](../EMERGENCY_RUNBOOK.md)
- **GitHub Issues:** [github.com/tachiprotocol/tachi](https://github.com/tachiprotocol/tachi/issues)
