# Publisher Onboarding Guide

Complete step-by-step guide to start earning with Tachi Protocol.

---

## Overview

Tachi Protocol lets you monetize your web content through micropayments. AI developers and crawlers pay per access with instant USDC settlements on Base.

**Benefits:**
- 💰 Earn per access (as low as $0.001/request)
- ⚡ Instant settlement (no NET-30 delays)
- 🔒 Verifiable on-chain audit trail
- 🚀 Zero setup fees

---

## Prerequisites

Before you begin, you'll need:

1. **Ethereum wallet** (MetaMask, Coinbase Wallet, etc.)
2. **Domain name** for your content
3. **Email address** for notifications
4. **~$0.50 worth of ETH** on Base Mainnet for gas (one-time)

---

## Step 1: Register as Publisher

### Option A: Using the Dashboard (Recommended)

1. Go to [tachi.ai/onboard](https://tachi.ai/onboard)
2. Click "Connect Wallet"
3. Fill in registration form:
   - **Domain:** your-site.com
   - **Name:** Your Publishing Company
   - **Email:** your@email.com
   - **Price:** $0.01 (or custom amount)
4. Click "Register"
5. Approve transaction in wallet (costs ~$0.10 in gas)
6. **Save your license NFT details** - this proves your publisher status

### Option B: Using API

```bash
curl -X POST https://api.tachi.ai/api/publishers/register \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "name": "Example Publisher",
    "email": "publisher@example.com",
    "walletAddress": "0xYOUR_WALLET_ADDRESS",
    "pricePerRequest": 0.01
  }'
```

**Response:**
```json
{
  "success": true,
  "publisher": {
    "id": "uuid",
    "wallet_address": "0x...",
    "price_per_request": "0.01"
  }
}
```

---

## Step 2: Configure Your Content

You have two options for serving content through Tachi:

### Option A: Use Tachi Gateway Directly

**Best for:** Simple content, demos, testing

Upload your content to the gateway's built-in storage:

```bash
# Contact team to add your content to gateway
# Or deploy your own gateway instance
```

### Option B: Proxy Your Website (Production)

**Best for:** Existing websites, CMSs, dynamic content

The gateway fetches content from your actual website:

```
User → Tachi Gateway → Your Website → User
          ↓
      (verifies payment)
```

**No code changes needed on your site!**

---

## Step 3: Test the Integration

### Test with SDK

```bash
npm install @tachiprotocol/sdk
```

```typescript
import {TachiSDK} from '@tachiprotocol/sdk';

const tachi = new TachiSDK({
  network: 'base',
  privateKey: process.env.TEST_WALLET_KEY,
  rpcUrl: 'https://mainnet.base.org'
});

// Auto-payment fetch
const response = await tachi.fetch(
  'https://tachi-gateway.com/your-content'
);

console.log('Content:', await response.json());
```

### Test with curl

```bash
# 1. Try without payment (should get 402)
curl https://tachi-gateway.com/your-content

# Response:
# {
#   "error": "Payment required",
#   "payment": {
#     "recipient": "0xYOUR_ADDRESS",
#     "amount": "0.01",
#     ...
#   }
# }

# 2. Pay via PaymentProcessor contract
cast send 0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA \
  "payPublisher(address,uint256)" \
  0xYOUR_ADDRESS \
  10000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org

# 3. Use transaction hash to fetch content
curl https://tachi-gateway.com/your-content \
  -H "Authorization: Bearer 0xYOUR_TX_HASH"
```

---

## Step 4: Access Your Dashboard

1. Go to [tachi.ai/dashboard](https://tachi.ai/dashboard)
2. Connect the same wallet you registered with
3. View your stats:
   - 📊 Today's requests & revenue
   - 💰 All-time earnings
   - 📈 7-day revenue chart
   - 🔗 Recent crawl requests with tx links

**Dashboard Features:**
- Real-time request monitoring
- Revenue analytics
- Top accessed URLs
- Price adjustment tools
- Integration code snippets

---

## Step 5: Configure Pricing

You can adjust pricing anytime:

### Via Dashboard

1. Go to Dashboard > Settings
2. Enter new price per request
3. Click "Update Price"
4. Changes take effect immediately

### Via API

```bash
curl -X PATCH https://api.tachi.ai/api/publishers/YOUR_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WALLET_ADDRESS" \
  -d '{"pricePerRequest": 0.02}'
```

**Pricing Recommendations:**
- **News articles:** $0.005 - $0.02
- **Research papers:** $0.10 - $1.00
- **Datasets:** $1.00 - $10.00
- **API access:** $0.001 - $0.01 per call

---

## Step 6: Production Checklist

Before going live with real users:

- [ ] Test payment flow end-to-end
- [ ] Verify dashboard shows correct stats
- [ ] Set appropriate pricing
- [ ] Add monitoring/alerts
- [ ] Document your API/content for crawlers
- [ ] Announce to potential users

---

## Integration Examples

### For Blog/News Site

```typescript
// Protect specific article routes
app.get('/articles/:id', async (req, res) => {
  const articleUrl = `https://tachi-gateway.com/article/${req.params.id}`;

  try {
    const content = await tachi.fetch(articleUrl);
    res.send(await content.text());
  } catch (error) {
    if (error.status === 402) {
      res.status(402).json({
        message: 'Payment required',
        instructions: error.payment
      });
    }
  }
});
```

### For Dataset API

```python
import requests

def fetch_protected_data(endpoint):
    gateway_url = f"https://tachi-gateway.com/dataset/{endpoint}"

    # SDK handles payment automatically
    response = tachi_sdk.fetch(gateway_url)

    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to fetch: {response.status_code}")
```

---

## Monitoring & Analytics

### View Earnings

```bash
# Get today's stats
curl https://api.tachi.ai/api/dashboard/stats/0xYOUR_ADDRESS

# Get revenue breakdown
curl https://api.tachi.ai/api/dashboard/revenue/0xYOUR_ADDRESS?days=30
```

### Export Data

```bash
# Get all payments
curl https://api.tachi.ai/api/payments?publisherAddress=0xYOUR_ADDRESS&limit=1000 \
  > payments.json

# Convert to CSV
cat payments.json | jq -r '.payments[] | [.timestamp, .amount, .tx_hash] | @csv'
```

---

## Withdraw Earnings

Your earnings accumulate in your wallet automatically with each payment!

**To check balance:**

```bash
# Check USDC balance
cast call 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  "balanceOf(address)(uint256)" \
  0xYOUR_ADDRESS \
  --rpc-url https://mainnet.base.org
```

**To withdraw/transfer:**

Use any wallet app (MetaMask, Coinbase Wallet, etc.) to send USDC to:
- Another wallet
- Exchange (to convert to fiat)
- DeFi protocol (to earn yield)

---

## Troubleshooting

### "License NFT not found"

Make sure you completed the onboarding transaction. Check:
```bash
cast call 0x4fA86C0bAD6AB64009445de6EE8462Bc31A4b347 \
  "balanceOf(address)(uint256)" \
  0xYOUR_ADDRESS \
  --rpc-url https://mainnet.base.org
```

Should return `1` (or higher).

### "No revenue showing in dashboard"

1. Check wallet address matches registration
2. Verify payments exist: `api.tachi.ai/api/payments?publisherAddress=0xYOUR_ADDRESS`
3. Check Supabase earnings aggregation

### "Crawler can't access my content"

1. Verify content is in gateway or proxy is configured
2. Test with curl (see Step 3)
3. Check gateway logs for errors

**More help:** [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)

---

## Next Steps

1. **Promote your integration** - Let AI developers know you accept micropayments
2. **Join the community** - [Discord](https://discord.gg/tachi) | [Twitter](https://twitter.com/tachiprotocol)
3. **Experiment with pricing** - Find the optimal rate for your content
4. **Scale up** - Add more content, higher limits

---

## Support

- **Docs:** [docs.tachi.ai](https://docs.tachi.ai)
- **API Reference:** [API_REFERENCE.md](../api/API_REFERENCE.md)
- **Issues:** [GitHub](https://github.com/tachiprotocol/tachi/issues)
- **Discord:** [discord.gg/tachi](https://discord.gg/tachi)

Welcome to Tachi! Start earning from your content today. 🚀
