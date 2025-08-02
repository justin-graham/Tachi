# 🚀 Tachi Protocol Base Sepolia Deployment Guide

## Pre-Deployment Checklist

### 1. Fund Test Accounts
Before deploying to Base Sepolia, ensure you have:

- **Base Sepolia ETH** for gas fees (minimum 0.1 ETH recommended)
  - Get from: https://bridge.base.org/deposit or Base Sepolia faucet
- **Base Sepolia USDC** for payment testing (minimum 1 USDC recommended)
  - Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
  - Get from Aave V3 Faucet or bridge from mainnet

### 2. Environment Configuration

Create `.env` file in `/packages/contracts/`:
```bash
# REQUIRED: Private key for deployment (DO NOT use for mainnet!)
PRIVATE_KEY=your_private_key_here

# Base Sepolia RPC
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Optional: BaseScan API key for contract verification
BASESCAN_API_KEY=your_basescan_api_key_here
```

### 3. Wrangler Configuration

Ensure Wrangler is configured:
```bash
cd packages/gateway-cloudflare
npx wrangler login
npx wrangler whoami  # Verify login
```

## Deployment Process

### Step 1: Deploy Smart Contracts

```bash
cd packages/contracts

# Deploy CrawlNFT (Self-Minting)
npx hardhat run scripts/deploy-self-mint.ts --network baseSepolia

# Deploy PaymentProcessor
npx hardhat run scripts/deploy-payment-processor.ts --network baseSepolia

# Deploy ProofOfCrawlLedger
npx hardhat run scripts/deploy-ledger.ts --network baseSepolia
```

**Expected Output:**
```
CrawlNFT deployed to: 0x[address]
PaymentProcessor deployed to: 0x[address]
ProofOfCrawlLedger deployed to: 0x[address]
```

### Step 2: Mint Publisher License

```bash
# Update the script with your publisher address and run:
npx hardhat run scripts/mint-test-license.ts --network baseSepolia
```

### Step 3: Configure Cloudflare Worker

Update `packages/gateway-cloudflare/wrangler.toml`:

```toml
name = "tachi-gateway-basesepolia"
main = "dist/index.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { 
  BASE_RPC_URL = "https://sepolia.base.org",
  PAYMENT_PROCESSOR_ADDRESS = "0x[PaymentProcessor_address]",
  PROOF_OF_CRAWL_LEDGER_ADDRESS = "0x[ProofOfCrawlLedger_address]",
  USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  PRIVATE_KEY = "your_private_key_here",
  CRAWL_TOKEN_ID = "1",
  PRICE_USDC = "0.01",
  PUBLISHER_ADDRESS = "0x[publisher_address]"
}
```

### Step 4: Deploy Cloudflare Worker

```bash
cd packages/gateway-cloudflare
npm run build
npx wrangler deploy --env production
```

**Expected Output:**
```
✅ Successfully deployed to https://tachi-gateway-basesepolia.[your-subdomain].workers.dev
```

### Step 5: Run End-to-End Test

```bash
cd packages/contracts

# Update e2e-integration-test.mjs with deployed addresses
node e2e-integration-test.mjs
```

## Validation Tests

### Test 1: AI Crawler Detection
```bash
curl -H "User-Agent: GPTBot/1.0" https://your-worker-url.workers.dev/test
# Expected: 402 Payment Required
```

### Test 2: Payment Flow
```bash
# 1. Get payment details from 402 response
# 2. Send USDC payment to PaymentProcessor
# 3. Retry with transaction hash
curl -H "User-Agent: GPTBot/1.0" \
     -H "Authorization: Bearer 0x[transaction_hash]" \
     https://your-worker-url.workers.dev/test
# Expected: 200 OK with content
```

### Test 3: Regular User Access
```bash
curl -H "User-Agent: Mozilla/5.0 (Regular Browser)" \
     https://your-worker-url.workers.dev/test
# Expected: 200 OK with content (no payment required)
```

## Monitoring & Verification

### Contract Verification on BaseScan
- CrawlNFT: https://sepolia.basescan.org/address/[address]
- PaymentProcessor: https://sepolia.basescan.org/address/[address]
- ProofOfCrawlLedger: https://sepolia.basescan.org/address/[address]

### Payment Verification
Monitor payment events:
```bash
# Check Payment events on PaymentProcessor contract
# Event signature: Payment(address indexed from, address indexed publisher, uint256 amount)
```

### Worker Logs
```bash
npx wrangler tail --env production
```

## Common Issues & Solutions

### Issue: "Insufficient funds for gas"
**Solution:** Fund deployer account with more Base Sepolia ETH

### Issue: "Contract deployment timeout"
**Solution:** Try again or increase gas price in hardhat.config.ts

### Issue: "Worker deployment failed"
**Solution:** 
- Verify Wrangler authentication: `npx wrangler whoami`
- Check environment variables in wrangler.toml
- Ensure TypeScript compilation succeeds: `npm run build`

### Issue: "Payment verification fails"
**Solution:**
- Verify RPC_URL is correct in worker environment
- Check that USDC address matches Base Sepolia USDC
- Ensure transaction hash is valid and confirmed

## Success Criteria

✅ **Deployment Successful When:**
- All 3 contracts deployed to Base Sepolia
- Publisher license NFT minted successfully
- Cloudflare Worker deployed and accessible
- AI crawler receives 402 Payment Required
- Payment transaction processes successfully
- Content returned after valid payment
- Regular users access content without payment

## Next Steps After Successful Testing

1. **Security Audit** - Review all contract code
2. **Gas Optimization** - Optimize contract deployment costs
3. **Mainnet Deployment** - Deploy to Base mainnet
4. **Production Monitoring** - Set up alerting and analytics
5. **SDK Updates** - Update SDK examples with mainnet addresses

---

## Emergency Procedures

### Contract Issues
If contracts need to be redeployed:
1. Update contract addresses in worker environment
2. Redeploy worker with new addresses
3. Update SDK configurations

### Worker Issues
If worker becomes unavailable:
1. Check worker logs: `npx wrangler tail`
2. Redeploy worker: `npx wrangler deploy --env production`
3. Verify environment variables

---

**⚠️ Important:** This is a testnet deployment guide. For mainnet deployment, use secure private key management and additional security reviews.
