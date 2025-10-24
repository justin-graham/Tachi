# Tachi Protocol - Troubleshooting Guide

Common issues and solutions for Tachi Protocol v2.

---

## Table of Contents

- [Gateway Issues](#gateway-issues)
- [Payment Verification Failures](#payment-verification-failures)
- [SDK Errors](#sdk-errors)
- [API Issues](#api-issues)
- [Dashboard Problems](#dashboard-problems)
- [Smart Contract Issues](#smart-contract-issues)

---

## Gateway Issues

### Issue: Gateway returns 502 Bad Gateway

**Symptoms:**
- Gateway URL returns 502 error
- Health check fails

**Possible Causes:**
1. Worker not deployed
2. Environment variables missing
3. Supabase down or misconfigured

**Solutions:**

```bash
# 1. Check Cloudflare Worker status
wrangler status

# 2. Verify deployment
wrangler deployments list

# 3. Check environment variables
wrangler secret list

# 4. Redeploy
cd v2/gateway
pnpm build
wrangler deploy
```

---

### Issue: Gateway returns "Payment verification failed"

**Symptoms:**
- Valid transaction hash rejected
- Payment successful but content not returned

**Possible Causes:**
1. Transaction too old (>5 minutes)
2. Transaction not on correct network (Base)
3. Wrong contract address in gateway config
4. Payment amount too low

**Debug Steps:**

```bash
# 1. Verify transaction on Base
curl https://mainnet.base.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getTransactionReceipt",
    "params": ["0xYOUR_TX_HASH"],
    "id": 1
  }'

# 2. Check transaction is recent
# Look at blockTimestamp in response

# 3. Verify payment amount
cast tx 0xYOUR_TX_HASH --rpc-url https://mainnet.base.org
```

**Solutions:**

1. **Transaction expired:** Make new payment
2. **Wrong network:** Use Base Mainnet RPC
3. **Wrong contract:** Update `PROOF_OF_CRAWL_ADDRESS` in Cloudflare secrets
4. **Amount too low:** Pay at least the requested amount

---

### Issue: Rate limit exceeded on gateway

**Symptoms:**
- 429 status code
- "Rate limit exceeded" error

**Cause:**
Gateway limits to 100 requests per minute per IP

**Solutions:**

1. **For testing:** Wait 60 seconds and retry
2. **For production:** Implement client-side caching
3. **For high volume:** Contact team about increasing limits

---

## Payment Verification Failures

### Issue: "Transaction not found"

**Debug:**

```bash
# Check if transaction is confirmed
cast tx 0xYOUR_TX_HASH --rpc-url https://mainnet.base.org

# If null, transaction hasn't been mined yet
# Wait 10-30 seconds and retry
```

---

### Issue: "Transaction failed"

**Causes:**
1. Insufficient USDC balance
2. USDC not approved
3. Contract reverted

**Debug:**

```bash
# Check transaction receipt status
cast receipt 0xYOUR_TX_HASH --rpc-url https://mainnet.base.org

# Look for status: 0x0 (failed) or 0x1 (success)
```

**Solutions:**

```bash
# 1. Check USDC balance
cast call 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  "balanceOf(address)(uint256)" YOUR_ADDRESS \
  --rpc-url https://mainnet.base.org

# 2. Approve USDC spending
cast send 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  "approve(address,uint256)" \
  0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA \
  1000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

---

## SDK Errors

### Issue: "Network mismatch"

**Error:** `SDK configured for 'base' but detected 'base-sepolia'`

**Solution:**

```typescript
// Ensure network matches RPC URL
const tachi = new TachiSDK({
  network: 'base', // For mainnet
  rpcUrl: 'https://mainnet.base.org' // Must be mainnet URL
});
```

---

### Issue: "Insufficient USDC balance"

**Debug:**

```typescript
const balance = await tachi.getBalance();
console.log('USDC balance:', balance);
```

**Solution:**
Bridge USDC to Base Mainnet via [bridge.base.org](https://bridge.base.org)

---

### Issue: Payment hangs indefinitely

**Causes:**
1. RPC node down
2. Gas price too low
3. Network congestion

**Solutions:**

```typescript
// 1. Try different RPC
const tachi = new TachiSDK({
  rpcUrl: 'https://base.llamarpc.com' // Alternative RPC
});

// 2. Check RPC health
fetch('https://mainnet.base.org', {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    id: 1
  })
});
```

---

## API Issues

### Issue: 401 Unauthorized

**Symptoms:**
- "Missing or invalid Authorization header"

**Solutions:**

```bash
# 1. Check API key format
# Should be: Authorization: Bearer tk_...

# 2. Verify API key is active
curl https://api.tachi.ai/api/crawlers/YOUR_ID \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### Issue: 429 Too Many Requests

**Cause:**
API rate limit (60 req/min) exceeded

**Solutions:**

1. **Add delays between requests:**

```typescript
async function rateLimit(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

for (const url of urls) {
  await fetchContent(url);
  await rateLimit(1000); // 1 second between requests
}
```

2. **Batch operations:**

```typescript
// Instead of 100 individual API calls
const payments = await Promise.all(
  txHashes.map(tx => fetch(`/api/payments/${tx}`))
);
```

---

### Issue: Validation errors

**Error:** `"Validation failed"` with details array

**Example:**

```json
{
  "error": "Validation failed",
  "details": [
    {"field": "email", "message": "Invalid email format"}
  ]
}
```

**Solution:**
Check [API_REFERENCE.md](./api/API_REFERENCE.md) for field requirements

---

## Dashboard Problems

### Issue: Dashboard shows $0 revenue but payments exist

**Causes:**
1. Wallet address mismatch
2. Supabase aggregation not running
3. Dashboard querying wrong address

**Debug:**

```bash
# 1. Check payments in Supabase
# Go to: https://supabase.com/dashboard
# Table: payments
# Filter by publisher_address

# 2. Check publisher total_earnings
# Table: publishers
# Column: total_earnings
```

**Solutions:**

```sql
-- Manually trigger earnings update
SELECT increment_publisher_earnings('0xYOUR_ADDRESS', 1.25);
```

---

### Issue: Dashboard not loading

**Debug:**

```bash
# 1. Check API health
curl https://api.tachi.ai/health

# 2. Check Supabase connection
curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# 3. Check browser console
# Look for CORS or network errors
```

---

## Smart Contract Issues

### Issue: Contract calls fail with "execution reverted"

**Causes:**
1. Insufficient token approval
2. Insufficient balance
3. Contract paused
4. Invalid parameters

**Debug:**

```bash
# 1. Test contract call
cast call 0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA \
  "payPublisher(address,uint256)" \
  0xPUBLISHER_ADDRESS \
  1000000 \
  --rpc-url https://mainnet.base.org

# 2. Check contract code
cast code 0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA \
  --rpc-url https://mainnet.base.org

# 3. Simulate transaction
cast run 0xYOUR_TX_HASH --rpc-url https://mainnet.base.org
```

---

## General Debug Commands

### Check system status

```bash
# Gateway health
curl https://tachi-gateway.com/health

# API health
curl https://api.tachi.ai/health

# Check Base RPC
curl https://mainnet.base.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'
```

### Enable debug logging

```typescript
// SDK debug mode
const tachi = new TachiSDK({
  debug: true // Logs all operations
});
```

### Check deployment versions

```bash
# Gateway version
curl https://tachi-gateway.com/health

# API version
curl https://api.tachi.ai/health

# Contracts
cast call 0xCONTRACT_ADDRESS "version()(string)" \
  --rpc-url https://mainnet.base.org
```

---

## Still Having Issues?

1. **Check status page:** [status.tachi.ai](https://status.tachi.ai)
2. **Search issues:** [github.com/tachiprotocol/tachi/issues](https://github.com/tachiprotocol/tachi/issues)
3. **Ask for help:** [Discord](https://discord.gg/tachi) or [GitHub Discussions](https://github.com/tachiprotocol/tachi/discussions)

When reporting issues, include:
- Error message
- Transaction hash (if applicable)
- Wallet address (if comfortable sharing)
- Network (Base Mainnet / Sepolia)
- SDK/Gateway/API version
