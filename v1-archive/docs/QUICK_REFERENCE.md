# Tachi Protocol - Quick Reference

## 🚨 Emergency Fixes

### "Insufficient funds for gas"
```bash
# Need ETH on Base network (not Ethereum!)
# Get ETH: bridge.base.org or buy on Coinbase → send to Base
# Minimum: ~$2-5 worth of ETH
```

### "Payment required" but I already paid
```bash
# Check transaction status
wrangler tail  # In Cloudflare Worker logs

# Verify payment went to correct address
# Check BaseScan.org with your transaction hash
```

### Cloudflare Worker not deploying
```bash
wrangler secret list                    # Check all secrets are set
wrangler kv:namespace list             # Check KV namespace exists
wrangler validate                      # Validate wrangler.toml
```

### SDK won't connect
```bash
# Check environment variables
echo $BASE_RPC_URL                     # Should start with https://
echo $CRAWLER_PRIVATE_KEY              # Should be 66 chars (0x + 64)
echo $PAYMENT_PROCESSOR_ADDRESS        # Should be valid contract address
```

---

## ⚡ Quick Setup Checklist

### For Publishers
- [ ] MetaMask with Base network added
- [ ] ETH on Base for gas fees (~$5)
- [ ] CrawlNFT license from Tachi team
- [ ] Cloudflare Worker deployed
- [ ] Environment variables configured
- [ ] Test crawl request working

### For AI Companies
- [ ] MetaMask with Base network added  
- [ ] ETH on Base for gas fees (~$5)
- [ ] USDC on Base for payments (~$50+)
- [ ] SDK installed and configured
- [ ] Private key in environment variables
- [ ] Test payment working

---

## 🔧 Common Commands

### Environment Setup
```bash
# Add Base to MetaMask: chainlist.org → search "Base" → Add

# Check balances
cast balance --rpc-url https://mainnet.base.org 0xYourAddress        # ETH
cast call --rpc-url https://mainnet.base.org 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 "balanceOf(address)(uint256)" 0xYourAddress  # USDC
```

### Cloudflare Worker
```bash
# Deploy
wrangler publish

# Check logs
wrangler tail

# Set secret
wrangler secret put VARIABLE_NAME

# List secrets
wrangler secret list
```

### SDK Usage
```javascript
// Basic crawl
const result = await sdk.fetchWithTachi('https://api.example.com');

// Check balance
const balance = await sdk.getUSDCBalance();
console.log(`USDC: ${balance.formatted}`);

// Handle errors
try {
  const result = await sdk.fetchWithTachi(url);
} catch (error) {
  if (error instanceof PaymentError) {
    console.log('Add more USDC!');
  }
}
```

---

## 📋 Required Environment Variables

### Cloudflare Worker (All Required)
```bash
BASE_RPC_URL                    # https://base-mainnet.g.alchemy.com/v2/KEY
PAYMENT_PROCESSOR_ADDRESS       # 0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7
PROOF_OF_CRAWL_LEDGER_ADDRESS  # Contract address
USDC_ADDRESS                   # 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
PRIVATE_KEY                    # 0x1234567890abcdef...
CRAWL_TOKEN_ID                 # Your NFT token ID
PRICE_USDC                     # 1.50 (price per request)
PUBLISHER_ADDRESS              # Your wallet address
```

### SDK Configuration (Required)
```bash
BASE_RPC_URL                   # Same as above
CRAWLER_PRIVATE_KEY           # Your crawler's private key
PAYMENT_PROCESSOR_ADDRESS     # Same as above
```

---

## 🌐 Network Information

### Base Mainnet
```
Chain ID: 8453
RPC: https://mainnet.base.org
Explorer: https://basescan.org
USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Base Sepolia (Testnet)
```
Chain ID: 84532
RPC: https://sepolia.base.org
Explorer: https://sepolia.basescan.org
USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

---

## 🔍 Debugging Steps

### Payment Issues
1. **Check network**: Must be Base (Chain ID 8453)
2. **Check USDC balance**: Need enough for the request price
3. **Check ETH balance**: Need for gas fees (~$0.05 per transaction)
4. **Verify contract addresses**: Use BaseScan to confirm

### Worker Issues  
1. **Check environment variables**: All required fields set
2. **Check KV namespace**: Created and bound in wrangler.toml
3. **Check logs**: `wrangler tail` for real-time errors
4. **Test locally**: `wrangler dev` before deploying

### SDK Issues
1. **Check imports**: `@tachi/sdk-js` installed correctly
2. **Check configuration**: All required fields provided
3. **Check network connectivity**: RPC endpoint working
4. **Check permissions**: Private key has sufficient funds

---

## 📞 Get Help Fast

- **Discord**: [discord.gg/tachi-protocol](https://discord.gg/tachi-protocol)
- **GitHub**: [github.com/tachi-protocol/tachi/issues](https://github.com/tachi-protocol/tachi/issues)
- **Email**: support@tachi.ai

**Include when asking for help**:
- Error message (full stack trace)
- Transaction hash (if applicable)  
- Network (Base mainnet/testnet)
- What you were trying to do
- Your environment (SDK version, etc.)

---

## 🔗 Useful Links

- **[Complete FAQ](./FAQ.md)** - Detailed Q&A
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Debug any issue
- **[Integration Examples](./integration-examples.md)** - Copy-paste code
- **[Environment Variables](../packages/gateway-cloudflare/ENVIRONMENT_VARIABLES.md)** - Complete reference

---

**💡 Pro Tip**: Most issues are due to wrong network (use Base, not Ethereum) or missing ETH for gas fees!