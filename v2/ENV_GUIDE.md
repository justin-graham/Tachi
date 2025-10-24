# Tachi Environment Variables - Quick Reference

## 📁 New Unified Structure

Tachi now uses a **single `.env` file** at the project root:

```
v2/
├── .env                    ✅ ONLY .env FILE (all services use this)
├── api/
│   └── src/index.ts       → reads from ../../.env
├── contracts/
│   └── foundry.toml       → env_file = "../.env"
├── gateway/
│   └── sync-secrets.sh    🔄 Syncs .env to Cloudflare
└── dashboard/             → reads .env automatically (Next.js)
```

---

## 🚀 Quick Start

### 1. All environment variables are in one place:

**File:** `/Users/justin/Tachi/v2/.env`

```bash
# Already configured with:
# - Contract addresses
# - Supabase credentials
# - Publisher settings
# - RPC URLs
# - All API settings
```

### 2. Each service automatically reads from root `.env`:

| Service | How it reads .env |
|---------|-------------------|
| **API** | `dotenv.config({path: '../../.env'})` |
| **Contracts** | `foundry.toml`: `env_file = "../.env"` |
| **Dashboard** | Next.js auto-loads from root |
| **Gateway** | Use `./gateway/sync-secrets.sh` |

### 3. For Cloudflare Worker (Gateway):

```bash
cd v2/gateway
./sync-secrets.sh
```

This pushes secrets from `.env` to Cloudflare Workers.

---

## 📝 Environment Variables Reference

### Blockchain & Wallet
- `PRIVATE_KEY` - Deployment wallet private key
- `BASESCAN_API_KEY` - For contract verification

### Contract Addresses (Base Mainnet)
- `CRAWL_NFT_ADDRESS` - `0x02e0fDc8656dd07Ad55651E36E1C1667E1f572ED`
- `PAYMENT_PROCESSOR_ADDRESS` - `0xf00976864d9dD3c0AE788f44f38bB84022B61a04`
- `PROOF_OF_CRAWL_ADDRESS` - `0xb3f214dCC142b960aC82814325aD4f9181cfdBe6`

### Contract Addresses (Base Sepolia)
- `CRAWL_NFT_ADDRESS_SEPOLIA`
- `PAYMENT_PROCESSOR_ADDRESS_SEPOLIA`
- `PROOF_OF_CRAWL_ADDRESS_SEPOLIA`

### RPC URLs
- `BASE_RPC_URL` - `https://mainnet.base.org`
- `BASE_MAINNET_RPC` - Same as above
- `BASE_SEPOLIA_RPC` - `https://sepolia.base.org`

### Supabase
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` / `SUPABASE_ANON_KEY` - API keys
- `NEXT_PUBLIC_SUPABASE_URL` - Public URL for frontend
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key

### Publisher Settings
- `PUBLISHER_ADDRESS` - Your wallet address
- `PRICE_PER_REQUEST` - Default price (e.g., 0.01)

### API Settings
- `PORT` - API server port (default: 3001)
- `CORS_ORIGINS` - Comma-separated allowed origins

### URLs
- `GATEWAY_URL` - Your Cloudflare Worker URL
- `NEXT_PUBLIC_API_URL` - Your API URL (for frontend)
- `NEXT_PUBLIC_GATEWAY_URL` - Gateway URL (for frontend)

---

## 🔄 How to Update Environment Variables

### Option 1: Update Everywhere (Recommended)

```bash
# 1. Edit the root .env file
vim /Users/justin/Tachi/v2/.env

# 2. Sync to Cloudflare Worker
cd v2/gateway
./sync-secrets.sh

# 3. Restart services (if running)
# API: Restart your API server
# Dashboard: Restart Next.js dev server
# Contracts: No restart needed
```

### Option 2: Update Cloudflare Only

```bash
cd v2/gateway
wrangler secret put VARIABLE_NAME
```

**⚠️ Warning:** This creates inconsistency with root `.env`. Use Option 1 instead.

---

## ✅ Benefits

- **Single source of truth** - All env vars in one file
- **No duplication** - Update once, applies everywhere
- **Easier to maintain** - One file to manage
- **No out-of-sync values** - All services read the same values
- **Simpler CI/CD** - One file to configure in deployments

---

## 🔍 Verification

### Check API reads from root .env:

```bash
cd v2/api
node -e "require('dotenv').config({path:'../.env'}); console.log(process.env.SUPABASE_URL)"
```

### Check Contracts reads from root .env:

```bash
cd v2/contracts
forge script script/Deploy.s.sol --rpc-url base -vvv
# Should show variables from root .env
```

### Check Gateway secrets:

```bash
cd v2/gateway
wrangler secret list
```

---

## 🚨 Troubleshooting

### "Environment variable not found"

1. Check the variable exists in `/Users/justin/Tachi/v2/.env`
2. Restart the service
3. For gateway, run `./sync-secrets.sh` again

### "Cannot read .env file"

1. Verify file path is correct
2. Check file permissions: `chmod 600 v2/.env`

### "Cloudflare secrets out of sync"

```bash
cd v2/gateway
./sync-secrets.sh
```

---

## 📚 Related Documentation

- **Gateway Setup:** [gateway/ENV_SETUP.md](gateway/ENV_SETUP.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Emergency Runbook:** [EMERGENCY_RUNBOOK.md](EMERGENCY_RUNBOOK.md)

---

**Last Updated:** 2025-01-23
