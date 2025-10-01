# Tachi Protocol - Frequently Asked Questions

This document answers common questions from publishers, AI companies, and developers integrating with Tachi Protocol. If you don't find your question here, please check our [troubleshooting guide](./TROUBLESHOOTING.md) or reach out on [Discord](https://discord.gg/tachi-protocol).

## Table of Contents

- [General Questions](#general-questions)
- [For Publishers](#for-publishers)
- [For AI Companies & Crawlers](#for-ai-companies--crawlers)
- [Payment & USDC Questions](#payment--usdc-questions)
- [Technical Integration](#technical-integration)
- [Network & Gas Fees](#network--gas-fees)
- [Security & Privacy](#security--privacy)
- [Troubleshooting](#troubleshooting)

---

## General Questions

### What is Tachi Protocol?

Tachi Protocol is a pay-per-crawl system that allows AI companies to fairly compensate content publishers for accessing their data. Publishers set prices for their content, and AI crawlers pay these fees automatically through blockchain transactions before accessing protected content.

### Which blockchain does Tachi use?

Tachi Protocol runs on **Base Network** (Coinbase's Layer 2), which offers:
- Low transaction fees (typically $0.01-0.05)
- Fast confirmation times (~2 seconds)
- Full Ethereum compatibility
- USDC as the payment currency

### Do I need to understand blockchain to use Tachi?

Not necessarily! Our SDKs and tools handle most blockchain complexity automatically. However, you will need:
- A crypto wallet (like MetaMask)
- Some ETH for gas fees (usually $1-5 worth)
- USDC for payments (if you're an AI company)

### Is Tachi Protocol open source?

Yes! The entire protocol is open source under MIT license. You can view and contribute to the code on [GitHub](https://github.com/tachi-protocol/tachi).

---

## For Publishers

### How do I get started as a publisher?

1. **Set up Base network** in your wallet (see [setup guide](#how-do-i-add-base-network-to-metamask))
2. **Get a small amount of ETH** on Base for gas fees (~$2-5 worth)
3. **Contact us** to mint your publisher license (CrawlNFT)
4. **Deploy the Cloudflare Worker** to protect your content
5. **Set your content pricing** in the worker configuration

### How do I mint a CrawlNFT license?

Currently, CrawlNFT licenses are minted by the Tachi team during the beta phase. Contact us with:
- Your content domain(s)
- Desired pricing structure
- Publisher wallet address
- Brief description of your content

We'll mint your license NFT and provide deployment instructions.

### Can I change my content pricing later?

**Yes!** You can update your pricing anytime by:

1. **Cloudflare Worker**: Update the `PRICE_USDC` environment variable
2. **API Integration**: Call the pricing update endpoint
3. **Smart Contract**: Pricing is not stored on-chain, so changes are immediate

**Example**: Change from $0.10 to $0.25 per request:
```bash
wrangler secret put PRICE_USDC # Enter: 0.25
```

### What types of content can I protect?

Tachi works with any web-accessible content:
- **APIs**: REST endpoints, GraphQL, etc.
- **Web pages**: Articles, documentation, data feeds
- **Files**: PDFs, datasets, media files
- **Dynamic content**: Search results, personalized data

### How do I protect specific pages vs. my entire site?

You have several options:

**Option 1: Subdomain Protection**
```
api.yoursite.com  → Protected with Tachi
www.yoursite.com  → Public access
```

**Option 2: Path-Based Protection**
```javascript
// In your Cloudflare Worker
if (request.url.includes('/api/') || request.url.includes('/premium/')) {
  // Apply Tachi protection
} else {
  // Allow public access
}
```

**Option 3: Header-Based Detection**
```javascript
// Only protect requests from AI crawlers
if (isAICrawler(userAgent)) {
  // Require payment
}
```

### What happens if a crawler doesn't pay?

The Cloudflare Worker will return an **HTTP 402 Payment Required** response with:
- Payment instructions
- Required amount in USDC
- Payment processor contract address
- Your wallet address for verification

No content is served until valid payment is received.

### How quickly do I receive payments?

**Immediately!** Payments go directly to your wallet address through the smart contract. There are no:
- Processing delays
- Intermediary accounts
- Withdrawal waiting periods

You can see payments in your wallet within ~2 seconds of the transaction.

### What fees does Tachi charge?

Currently, Tachi charges a **2.5% protocol fee** on all payments. For example:
- Crawler pays: $1.00
- Publisher receives: $0.975
- Protocol fee: $0.025

This fee covers:
- Smart contract operations
- Infrastructure maintenance
- Protocol development

---

## For AI Companies & Crawlers

### What if my crawler doesn't have enough USDC?

Your crawler will receive a **402 Payment Required** error. To resolve:

1. **Add USDC to your wallet**:
   ```bash
   # Buy USDC on Base network through:
   # - Coinbase (direct to Base)
   # - Bridge from Ethereum mainnet
   # - DEX swap (ETH → USDC on Base)
   ```

2. **Check your balance**:
   ```javascript
   const balance = await sdk.getUSDCBalance();
   console.log(`USDC Balance: ${balance.formatted}`);
   ```

3. **Budget for crawling**:
   ```javascript
   // Estimate costs before crawling
   const urlCount = 1000;
   const avgPrice = 0.50; // $0.50 per URL
   const estimatedCost = urlCount * avgPrice;
   console.log(`Budget needed: $${estimatedCost} USDC`);
   ```

### How do I set up my crawler with the Tachi SDK?

**Step 1: Install the SDK**
```bash
npm install @tachi/sdk-js
```

**Step 2: Configure with environment variables**
```bash
# .env file
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR-KEY
CRAWLER_PRIVATE_KEY=0x1234567890abcdef...
PAYMENT_PROCESSOR_ADDRESS=0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

**Step 3: Basic usage**
```javascript
import { createBaseSDK } from '@tachi/sdk-js';

const sdk = createBaseSDK({
  rpcUrl: process.env.BASE_RPC_URL,
  ownerPrivateKey: process.env.CRAWLER_PRIVATE_KEY,
  paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS
});

// Crawl with automatic payment
const result = await sdk.fetchWithTachi('https://protected-api.com/data');
console.log(result.content);
```

### How do I handle different content pricing?

Each publisher sets their own prices. The SDK handles this automatically:

```javascript
// The SDK will:
// 1. Make initial request
// 2. Receive 402 with price info
// 3. Process payment automatically
// 4. Retry request with payment proof
// 5. Return content

const result = await sdk.fetchWithTachi(url);
if (result.paymentRequired) {
  console.log(`Paid ${result.paymentAmount} USDC for content`);
}
```

### Can I batch multiple requests?

Yes! For efficiency, you can:

**Option 1: Sequential with rate limiting**
```javascript
const urls = ['url1', 'url2', 'url3'];
const results = [];

for (const url of urls) {
  const result = await sdk.fetchWithTachi(url);
  results.push(result);
  
  // Be polite - add delay between requests
  await new Promise(resolve => setTimeout(resolve, 2000));
}
```

**Option 2: Concurrent with limits**
```javascript
import pLimit from 'p-limit';

const limit = pLimit(3); // Max 3 concurrent requests
const promises = urls.map(url => 
  limit(() => sdk.fetchWithTachi(url))
);

const results = await Promise.all(promises);
```

### What if a payment transaction fails or gets stuck?

**If payment fails**:
1. Check your USDC balance
2. Ensure sufficient ETH for gas fees
3. Verify network connectivity
4. Retry the request (SDK handles automatically)

**If transaction is stuck**:
```javascript
// Check transaction status
const receipt = await publicClient.getTransactionReceipt({
  hash: txHash
});

if (!receipt) {
  console.log('Transaction still pending...');
  // Wait or try with higher gas price
}
```

**SDK error handling**:
```javascript
try {
  const result = await sdk.fetchWithTachi(url);
} catch (error) {
  if (error instanceof PaymentError) {
    console.log('Payment failed:', error.details);
    // Handle payment issues
  } else if (error instanceof NetworkError) {
    console.log('Network error:', error.message);
    // Handle connectivity issues
  }
}
```

---

## Payment & USDC Questions

### How do I get USDC on Base network?

**Option 1: Buy directly on Base** (Recommended)
- Use Coinbase → Send to Base network
- Use Rainbow Wallet with Base integration
- Use official Base bridge

**Option 2: Bridge from Ethereum**
```
1. Go to bridge.base.org
2. Connect your wallet
3. Bridge USDC from Ethereum to Base
4. Wait ~10 minutes for confirmation
```

**Option 3: Swap on Base**
```
1. Bridge ETH to Base
2. Use Uniswap or other DEX on Base
3. Swap ETH → USDC
```

### What's the minimum payment amount?

There's no protocol minimum, but consider:
- **Gas costs**: ~$0.01-0.05 per transaction
- **Publisher minimums**: Publishers may set minimums
- **Practical minimums**: Payments under $0.10 may not be economical

### How do I track my crawler's spending?

**Option 1: SDK built-in tracking**
```javascript
const balance = await sdk.getUSDCBalance();
console.log(`Remaining balance: ${balance.formatted} USDC`);
```

**Option 2: Blockchain explorer**
- Visit [BaseScan](https://basescan.org)
- Enter your wallet address
- View all USDC transactions

**Option 3: Custom analytics**
```javascript
let totalSpent = 0;

const result = await sdk.fetchWithTachi(url);
if (result.paymentRequired) {
  totalSpent += parseFloat(result.paymentAmount);
  console.log(`Total spent today: $${totalSpent.toFixed(2)}`);
}
```

---

## Technical Integration

### How do I add Base network to MetaMask?

**Automatic Addition** (Recommended):
1. Visit [chainlist.org](https://chainlist.org)
2. Search for "Base"
3. Click "Add to MetaMask"

**Manual Addition**:
1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Enter Base network details:
   ```
   Network Name: Base
   New RPC URL: https://mainnet.base.org
   Chain ID: 8453
   Currency Symbol: ETH
   Block Explorer: https://basescan.org
   ```

### What RPC endpoint should I use?

**For production** (Choose one):
```
https://mainnet.base.org                    # Official Base RPC
https://base-mainnet.g.alchemy.com/v2/KEY  # Alchemy (recommended)
https://base-mainnet.infura.io/v3/KEY      # Infura
```

**For testing**:
```
https://sepolia.base.org                    # Base Sepolia testnet
```

**Performance tips**:
- Use Alchemy or Infura for better reliability
- Keep your API key secure
- Consider rate limits for high-volume usage

### How do I handle errors in production?

**Implement comprehensive error handling**:
```javascript
import { TachiError, PaymentError, NetworkError } from '@tachi/sdk-js';

async function safeCrawl(url) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await sdk.fetchWithTachi(url);
    } catch (error) {
      attempt++;
      
      if (error instanceof PaymentError) {
        console.error(`Payment failed: ${error.message}`);
        // Check balance, add funds, etc.
        break; // Don't retry payment errors
      } else if (error instanceof NetworkError) {
        console.log(`Network error, retrying... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      } else {
        console.error(`Unexpected error: ${error.message}`);
        break;
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts`);
}
```

### Can I use Tachi with languages other than JavaScript?

**Currently supported**:
- JavaScript/TypeScript (official SDK)
- Any language that can make HTTP requests

**For other languages**, you can implement the protocol directly:
```python
# Python example
import requests

def crawl_with_payment(url, payment_tx_hash):
    # Step 1: Try request
    response = requests.get(url)
    
    if response.status_code == 402:
        # Step 2: Process payment (use web3.py)
        # Implementation needed
        pass
    
    # Step 3: Retry with payment proof
    headers = {'Authorization': f'Bearer {payment_tx_hash}'}
    return requests.get(url, headers=headers)
```

**We're planning SDKs for**:
- Python (Q2 2024)
- Go (Q3 2024)
- Rust (Q4 2024)

---

## Network & Gas Fees

### Why does my transaction say "insufficient funds for gas"?

You need **ETH on Base network** to pay for gas fees, even when paying with USDC.

**Solution**:
1. **Get ETH on Base**:
   ```
   - Bridge ETH from Ethereum mainnet
   - Buy ETH directly on Coinbase → send to Base
   - Bridge from other networks
   ```

2. **Minimum ETH needed**:
   ```
   ~$2-5 worth of ETH should cover hundreds of transactions
   ```

3. **Check your ETH balance**:
   ```javascript
   // In MetaMask or your wallet
   // Make sure you're on Base network
   // Check ETH balance (not USDC)
   ```

### How much do transactions cost on Base?

**Typical costs** (as of 2024):
- Simple USDC transfer: $0.01-0.02
- PaymentProcessor transaction: $0.02-0.05
- NFT minting: $0.05-0.10

**Gas optimization tips**:
- Batch multiple operations when possible
- Use recommended gas prices
- Avoid peak network times

### What happens if Base network is congested?

**Base network typically has**:
- ~2 second block times
- Very low congestion
- Predictable gas prices

**If congestion occurs**:
- Increase gas price slightly
- Wait for network to clear
- Use Tachi's built-in retry logic

---

## Security & Privacy

### How secure are my private keys with Tachi?

**Tachi never sees your private keys**. They stay:
- In your local environment variables
- In your wallet (MetaMask, etc.)
- In your application's secure storage

**Best practices**:
```bash
# Use environment variables
export CRAWLER_PRIVATE_KEY="0x..."

# Never commit keys to git
echo "*.env" >> .gitignore

# Use hardware wallets for large amounts
# Rotate keys periodically
```

### Can publishers see what I'm crawling?

**On-chain**: Publishers can see:
- That a payment was made
- The amount paid
- Your wallet address
- Timestamp of access

**Off-chain**: Publishers cannot see:
- Specific URLs accessed (unless logged)
- Request content or parameters
- Your internal use of the data

### How is payment verification secure?

**Tachi uses multiple security layers**:

1. **Blockchain verification**: All payments verified on Base network
2. **Replay protection**: Transaction hashes can't be reused
3. **Amount verification**: Exact payment amounts verified
4. **Publisher verification**: Payments must go to correct publisher
5. **Time limits**: Payment proofs expire to prevent abuse

### What data does Tachi collect?

**Minimal data collection**:
- Payment transactions (public on blockchain)
- Error logs (for debugging, no personal info)
- Usage analytics (aggregated, anonymized)

**We never collect**:
- Content you crawl
- Private keys or sensitive data
- Personal information beyond wallet addresses

---

## Troubleshooting

### My Cloudflare Worker deployment failed

**Common causes and solutions**:

**1. Environment variables missing**:
```bash
# Check all required variables are set
wrangler secret list

# Set missing variables
wrangler secret put PRIVATE_KEY
wrangler secret put BASE_RPC_URL
```

**2. Invalid contract addresses**:
```bash
# Verify addresses on BaseScan
# Ensure they're checksummed properly
PAYMENT_PROCESSOR_ADDRESS=0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7
```

**3. Wrangler configuration errors**:
```toml
# Check wrangler.toml format
name = "tachi-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "USED_TX_HASHES"
id = "your-kv-namespace-id"
```

### CrawlNFT minting failed

**Check these common issues**:

**1. Insufficient ETH for gas**:
```
Error: "insufficient funds for intrinsic transaction cost"
Solution: Add ETH to your wallet on Base network
```

**2. Already have a license**:
```
Error: "PublisherAlreadyHasLicense"
Solution: Check if you already have a CrawlNFT license
```

**3. Invalid parameters**:
```javascript
// Ensure all parameters are valid
await crawlNFT.mintLicense(
  "0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7", // Valid address
  "https://example.com/terms.json"                // Valid URI
);
```

### Payments are failing

**Debug payment issues**:

**1. Check USDC balance**:
```javascript
const balance = await sdk.getUSDCBalance();
console.log(`USDC: ${balance.formatted}`);
```

**2. Check ETH for gas**:
```javascript
const ethBalance = await publicClient.getBalance({
  address: walletAddress
});
console.log(`ETH: ${formatEther(ethBalance)}`);
```

**3. Verify contract approval**:
```javascript
const allowance = await usdcContract.read.allowance([
  walletAddress,
  paymentProcessorAddress
]);
console.log(`Approved USDC: ${formatUnits(allowance, 6)}`);
```

**4. Check network connectivity**:
```javascript
const latestBlock = await publicClient.getBlockNumber();
console.log(`Connected to Base: ${latestBlock}`);
```

### Content is still showing 402 errors after payment

**Verify payment was processed**:

**1. Check transaction status**:
```javascript
const receipt = await publicClient.getTransactionReceipt({
  hash: paymentTxHash
});

if (receipt.status === 'success') {
  console.log('Payment confirmed');
} else {
  console.log('Payment failed');
}
```

**2. Check payment amount**:
```javascript
// Ensure you paid enough
const requiredAmount = parseUnits(priceUSDC, 6);
const paidAmount = /* extract from transaction logs */;

if (paidAmount >= requiredAmount) {
  console.log('Paid sufficient amount');
}
```

**3. Check authorization header**:
```javascript
// Ensure correct format
const headers = {
  'Authorization': `Bearer ${transactionHash}`
};
```

### High gas fees or slow transactions

**Optimize your transactions**:

**1. Use appropriate gas settings**:
```javascript
// Let the SDK handle gas estimation
const result = await sdk.fetchWithTachi(url);

// Or customize gas settings
const customConfig = {
  ...config,
  gasPrice: parseGwei('0.1'), // Lower gas price
  gasLimit: 100000n          // Custom gas limit
};
```

**2. Batch operations when possible**:
```javascript
// Instead of individual requests
const promises = urls.map(url => sdk.fetchWithTachi(url));
const results = await Promise.all(promises);
```

**3. Use Base's low-cost benefits**:
- Base typically has very low fees
- If fees are high, check if you're on the right network
- Ensure you're not accidentally on Ethereum mainnet

### Getting help

**If you're still stuck**:

1. **Check our docs**: [docs.tachi.ai](https://docs.tachi.ai)
2. **Search GitHub issues**: [github.com/tachi-protocol/tachi/issues](https://github.com/tachi-protocol/tachi/issues)
3. **Join Discord**: [discord.gg/tachi-protocol](https://discord.gg/tachi-protocol)
4. **Email support**: support@tachi.ai

**When reporting issues, include**:
- Error messages (full stack traces)
- Transaction hashes (if applicable)
- Network you're using (Base mainnet/testnet)
- SDK version and configuration
- Steps to reproduce the issue

---

## Beta Program

### How do I join the Tachi Protocol beta?

**For Publishers**:
1. Apply at [tachi.ai/beta](https://tachi.ai/beta)
2. Provide content domain and pricing preferences
3. We'll mint your CrawlNFT license
4. Get deployment support and documentation

**For AI Companies**:
1. Request access to beta program
2. Get testnet USDC for initial testing
3. Access to dedicated support channel
4. Early access to new features

### What's included in the beta?

**For everyone**:
- Full protocol access on Base mainnet
- Complete SDK and documentation
- Discord community support
- Regular feature updates

**Beta limitations**:
- Manual CrawlNFT minting (automated later)
- Limited to Base network initially
- Some features still in development

### When will Tachi be fully launched?

**Current timeline** (subject to change):
- **Q1 2024**: Closed beta with select partners
- **Q2 2024**: Open beta with public access
- **Q3 2024**: Full mainnet launch
- **Q4 2024**: Additional network support

Stay updated on our [Discord](https://discord.gg/tachi-protocol) for the latest news!