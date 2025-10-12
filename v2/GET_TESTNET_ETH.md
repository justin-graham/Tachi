# Getting Base Sepolia Testnet ETH

Your wallet address: `0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d`

## Option 1: Coinbase Faucet (Recommended - Most Reliable)

1. Go to: **https://portal.cdp.coinbase.com/products/faucet**
2. Sign in with your Coinbase account (or create one - it's free)
3. Select "Base Sepolia" from the network dropdown
4. Enter your wallet address: `0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d`
5. Click "Request Funds"
6. You'll receive 0.1 testnet ETH instantly

**This is the official Coinbase/Base faucet and the most reliable.**

---

## Option 2: Alchemy Faucet

1. Go to: **https://www.alchemy.com/faucets/base-sepolia**
2. Sign up for a free Alchemy account
3. Enter your wallet address
4. Complete verification (may require social account)
5. Receive 0.5 testnet ETH per day

---

## Option 3: Base Bridge from Sepolia ETH

If you already have Sepolia ETH:

1. Go to: **https://bridge.base.org/deposit**
2. Connect your wallet
3. Switch to Sepolia network
4. Bridge ETH to Base Sepolia
5. Takes ~1 minute to arrive

Get Sepolia ETH from:
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

---

## Option 4: QuickNode Faucet

1. Go to: **https://faucet.quicknode.com/base/sepolia**
2. Create a free QuickNode account
3. Enter your wallet address
4. Complete verification
5. Receive testnet ETH

---

## After Getting Funds

Once you have testnet ETH, verify your balance:

```bash
cast balance 0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d --rpc-url https://sepolia.base.org
```

Then retry the deployment:

```bash
cd /Users/justin/Tachi/v2/contracts
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
```

---

## How Much Do You Need?

- **Contract deployment:** ~0.005 ETH (for all 3 contracts)
- **Contract verification:** Free
- **Testing transactions:** ~0.001 ETH per transaction

**Recommendation:** Get at least 0.1 ETH to have plenty for deployment + testing.

---

## Troubleshooting

**If faucets say "Already claimed today":**
- Try a different faucet from the list above
- Wait 24 hours and try again
- Ask in Base Discord: https://discord.gg/buildonbase

**If you need more later:**
- Most faucets have daily limits
- You can claim again after 24 hours
- For heavy testing, use multiple faucets

---

**Need help?** Drop your wallet address in Base Discord and the community often helps with testnet funds!
