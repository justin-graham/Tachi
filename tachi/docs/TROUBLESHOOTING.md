# Tachi Protocol - Troubleshooting Guide

This guide helps you diagnose and fix common issues when setting up and using Tachi Protocol. For general questions, see our [FAQ](./FAQ.md).

## Table of Contents

- [Setup Issues](#setup-issues)
- [Deployment Problems](#deployment-problems)
- [Payment & Transaction Issues](#payment--transaction-issues)
- [Network & Connectivity](#network--connectivity)
- [SDK & Integration Issues](#sdk--integration-issues)
- [Performance Problems](#performance-problems)
- [Error Reference](#error-reference)

---

## Setup Issues

### 🔧 MetaMask Setup Problems

**Problem**: Can't add Base network to MetaMask
```
Error: "Unable to add custom network"
```

**Solution**:
```javascript
// Method 1: Use Chainlist (Easiest)
1. Go to chainlist.org
2. Search "Base"
3. Click "Add to MetaMask"

// Method 2: Manual addition
Network Name: Base
RPC URL: https://mainnet.base.org
Chain ID: 8453
Currency: ETH
Explorer: https://basescan.org
```

**Problem**: MetaMask shows wrong network after adding
```
Shows "Ethereum Mainnet" instead of "Base"
```

**Solution**:
```javascript
// Check network details match exactly
// Clear MetaMask cache:
1. Settings → Advanced → Reset Account
2. Re-import using seed phrase
3. Re-add Base network
```

---

### 💰 Getting ETH and USDC on Base

**Problem**: No ETH for gas fees
```
Error: "insufficient funds for intrinsic transaction cost"
```

**Solutions**:
```bash
# Option 1: Bridge from Ethereum
1. Go to bridge.base.org
2. Connect wallet
3. Bridge ETH (minimum $5 recommended)

# Option 2: Buy on Coinbase
1. Buy ETH on Coinbase
2. Send to your wallet on Base network
3. Verify network is "Base" not "Ethereum"

# Option 3: Use faucet (testnet only)
1. Go to coinbase.com/faucets/base-ethereum-goerli-faucet
2. Enter wallet address
3. Claim testnet ETH
```

**Problem**: Can't get USDC on Base
```
Only have USDC on Ethereum mainnet
```

**Solutions**:
```bash
# Option 1: Bridge USDC
1. Go to bridge.base.org
2. Select USDC token
3. Bridge from Ethereum to Base

# Option 2: Swap on Base
1. Bridge ETH to Base first
2. Use Uniswap on Base
3. Swap ETH → USDC

# Option 3: Buy directly
1. Use Coinbase → send to Base
2. Use Rainbow wallet with Base
```

**Verification commands**:
```javascript
// Check ETH balance
const ethBalance = await publicClient.getBalance({
  address: '0xYourAddress'
});
console.log(`ETH: ${formatEther(ethBalance)}`);

// Check USDC balance
const usdcBalance = await publicClient.readContract({
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  abi: usdcAbi,
  functionName: 'balanceOf',
  args: ['0xYourAddress']
});
console.log(`USDC: ${formatUnits(usdcBalance, 6)}`);
```

---

## Deployment Problems

### 🔴 Cloudflare Worker Deployment Failures

**Problem**: Wrangler deployment fails
```
Error: "Failed to publish your Function"
```

**Debug steps**:
```bash
# 1. Check Wrangler version
wrangler --version
# Update if needed: npm install -g wrangler

# 2. Verify authentication
wrangler auth list
# Login if needed: wrangler auth login

# 3. Validate configuration
wrangler validate

# 4. Check environment variables
wrangler secret list
```

**Problem**: Environment variables not set
```
Error: "Missing required environment variables"
```

**Solution**:
```bash
# Set all required variables
wrangler secret put BASE_RPC_URL
wrangler secret put PAYMENT_PROCESSOR_ADDRESS
wrangler secret put PROOF_OF_CRAWL_LEDGER_ADDRESS
wrangler secret put USDC_ADDRESS
wrangler secret put PRIVATE_KEY
wrangler secret put CRAWL_TOKEN_ID
wrangler secret put PRICE_USDC
wrangler secret put PUBLISHER_ADDRESS

# Verify they're set
wrangler secret list
```

**Problem**: KV namespace binding errors
```
Error: "KV namespace 'USED_TX_HASHES' not found"
```

**Solution**:
```bash
# 1. Create KV namespace
wrangler kv:namespace create "USED_TX_HASHES"

# 2. Add to wrangler.toml
[[kv_namespaces]]
binding = "USED_TX_HASHES"
id = "your-namespace-id-from-step-1"

# 3. Deploy again
wrangler publish
```

**Problem**: Rate limiting binding errors
```
Error: "Rate limiting not available"
```

**Solution**:
```toml
# Add to wrangler.toml
[[rate_limiting]]
binding = "RATE_LIMITER"

# Note: Rate limiting requires paid Cloudflare plan
# For free plans, it will fall back to KV-based limiting
```

---

### 🎯 Smart Contract Deployment Issues

**Problem**: Contract deployment fails
```
Error: "Contract creation failed"
```

**Debug checklist**:
```bash
# 1. Check network connection
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://mainnet.base.org

# 2. Verify wallet has ETH
# Need ~$5-10 worth for contract deployment

# 3. Check Base network configuration
Chain ID: 8453
RPC: https://mainnet.base.org

# 4. Verify contract addresses
# Use Base testnet first for testing
```

**Problem**: NFT minting fails
```
Error: "PublisherAlreadyHasLicense()"
```

**Solutions**:
```javascript
// Check if license already exists
const hasLicense = await crawlNFT.hasLicense(publisherAddress);
if (hasLicense) {
  console.log('Publisher already has a license');
  const tokenId = await crawlNFT.getPublisherTokenId(publisherAddress);
  console.log(`Token ID: ${tokenId}`);
}

// If you need a new license, use a different address
// Or burn the existing license first (owner only)
```

**Problem**: Payment processor initialization fails
```
Error: "ZeroAddress()"
```

**Solution**:
```javascript
// Ensure all addresses are valid and checksummed
const config = {
  usdcToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',     // Base USDC
  crawlNFTContract: '0xYourCrawlNFTAddress',
  baseCrawlFee: parseUnits('0.10', 6),                           // 0.10 USDC
  protocolFeePercent: 250,                                       // 2.5%
  feeRecipient: '0xYourFeeRecipientAddress'
};

// Verify addresses on BaseScan before deployment
```

---

## Payment & Transaction Issues

### 💳 Payment Failures

**Problem**: "Insufficient USDC balance"
```
Error: PaymentError: Insufficient USDC balance
Required: 1.50, Available: 0.75
```

**Solution**:
```javascript
// 1. Check actual balance
const balance = await sdk.getUSDCBalance();
console.log(`USDC: ${balance.formatted}`);

// 2. Add USDC to wallet (see setup section above)

// 3. Verify you're on correct network
const chainId = await publicClient.getChainId();
console.log(`Chain ID: ${chainId}`); // Should be 8453 for Base
```

**Problem**: "Insufficient allowance"
```
Error: PaymentError: Insufficient allowance for PaymentProcessor
```

**Solution**:
```javascript
// The SDK should handle this automatically, but you can check manually:
const allowance = await publicClient.readContract({
  address: usdcAddress,
  abi: usdcAbi,
  functionName: 'allowance',
  args: [walletAddress, paymentProcessorAddress]
});

console.log(`Allowance: ${formatUnits(allowance, 6)} USDC`);

// If allowance is insufficient, the SDK will approve automatically
// If this fails, check if you have ETH for gas
```

**Problem**: Transaction stuck or pending
```
Transaction hash: 0x123... but no confirmation after 5 minutes
```

**Solution**:
```javascript
// 1. Check transaction status
const receipt = await publicClient.getTransactionReceipt({
  hash: '0x123...'
});

if (!receipt) {
  console.log('Transaction still pending');
  
  // 2. Check if transaction exists
  const tx = await publicClient.getTransaction({
    hash: '0x123...'
  });
  
  if (!tx) {
    console.log('Transaction not found - may have been dropped');
    // Retry with higher gas price
  }
}

// 3. Speed up transaction (MetaMask)
// Click "Speed Up" in MetaMask
// Or replace with higher gas price transaction
```

---

### ⛽ Gas Fee Issues

**Problem**: Gas price too high
```
Error: "Gas price exceeds maximum"
```

**Solution**:
```javascript
// Base typically has very low gas fees
// If fees are high, check network:

// 1. Verify you're on Base, not Ethereum
const chainId = await publicClient.getChainId();
console.log(`Chain: ${chainId === 8453 ? 'Base' : 'Other'}`);

// 2. Check current gas price
const gasPrice = await publicClient.getGasPrice();
console.log(`Gas price: ${formatGwei(gasPrice)} gwei`);

// 3. Use lower gas price if possible
const customGasPrice = parseGwei('0.01'); // Very low for Base
```

**Problem**: "Out of gas" errors
```
Error: "Transaction ran out of gas"
```

**Solution**:
```javascript
// Increase gas limit for complex transactions
const gasEstimate = await publicClient.estimateGas({
  account: walletAddress,
  to: paymentProcessorAddress,
  data: encodedFunctionData
});

// Add 20% buffer
const gasLimit = gasEstimate * 120n / 100n;

// Use in transaction
const hash = await walletClient.writeContract({
  // ... other params
  gas: gasLimit
});
```

---

## Network & Connectivity

### 🌐 RPC Connection Issues

**Problem**: RPC endpoint not responding
```
Error: "Failed to fetch from RPC endpoint"
```

**Solutions**:
```javascript
// 1. Test RPC connectivity
const testRPC = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });
    const data = await response.json();
    console.log(`Block number: ${parseInt(data.result, 16)}`);
    return true;
  } catch (error) {
    console.error(`RPC test failed: ${error.message}`);
    return false;
  }
};

// Test multiple endpoints
const endpoints = [
  'https://mainnet.base.org',
  'https://base-mainnet.g.alchemy.com/v2/YOUR-KEY',
  'https://base-mainnet.infura.io/v3/YOUR-KEY'
];

for (const endpoint of endpoints) {
  console.log(`Testing ${endpoint}...`);
  await testRPC(endpoint);
}
```

**Problem**: Rate limit exceeded
```
Error: "Too many requests"
```

**Solutions**:
```javascript
// 1. Implement rate limiting
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent requests

const results = await Promise.all(
  urls.map(url => limit(() => sdk.fetchWithTachi(url)))
);

// 2. Add delays between requests
for (const url of urls) {
  const result = await sdk.fetchWithTachi(url);
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// 3. Use premium RPC endpoints
// Alchemy, Infura, QuickNode have higher rate limits
```

---

### 🔌 SDK Connection Problems

**Problem**: SDK initialization fails
```
Error: "Failed to initialize wallet client"
```

**Debug steps**:
```javascript
// 1. Verify private key format
const privateKey = process.env.CRAWLER_PRIVATE_KEY;
console.log(`Key length: ${privateKey?.length}`); // Should be 66 (0x + 64 chars)
console.log(`Starts with 0x: ${privateKey?.startsWith('0x')}`);

// 2. Test account derivation
import { privateKeyToAccount } from 'viem/accounts';

try {
  const account = privateKeyToAccount(privateKey);
  console.log(`Account address: ${account.address}`);
} catch (error) {
  console.error('Invalid private key:', error.message);
}

// 3. Test RPC connection
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL)
});

const blockNumber = await publicClient.getBlockNumber();
console.log(`Latest block: ${blockNumber}`);
```

**Problem**: Contract interaction fails
```
Error: "Contract function reverted"
```

**Debug contract calls**:
```javascript
// 1. Verify contract address
const code = await publicClient.getBytecode({
  address: contractAddress
});

if (!code || code === '0x') {
  console.error('No contract at address:', contractAddress);
}

// 2. Test read functions first
try {
  const result = await publicClient.readContract({
    address: paymentProcessorAddress,
    abi: paymentProcessorAbi,
    functionName: 'getUSDCTokenAddress'
  });
  console.log('Contract is working, USDC address:', result);
} catch (error) {
  console.error('Contract read failed:', error.message);
}

// 3. Check function exists
const contractAbi = parseAbi([
  'function payPublisher(address publisher, uint256 amount) external'
]);
// Ensure your ABI matches the deployed contract
```

---

## SDK & Integration Issues

### 📚 SDK Usage Problems

**Problem**: Import errors
```
Error: "Cannot find module '@tachi/sdk-js'"
```

**Solution**:
```bash
# 1. Install SDK
npm install @tachi/sdk-js

# 2. Check package.json
{
  "dependencies": {
    "@tachi/sdk-js": "^1.0.0"
  }
}

# 3. Clear cache if needed
rm -rf node_modules package-lock.json
npm install

# 4. Verify module exists
ls node_modules/@tachi/sdk-js
```

**Problem**: TypeScript compilation errors
```
Error: "Cannot find type definitions"
```

**Solution**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**Problem**: SDK configuration errors
```
Error: "Invalid configuration"
```

**Debug configuration**:
```javascript
// Validate all required fields
const config = {
  network: 'base',                                    // Required
  rpcUrl: process.env.BASE_RPC_URL,                  // Required
  ownerPrivateKey: process.env.CRAWLER_PRIVATE_KEY,  // Required
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS
};

// Check each field
Object.entries(config).forEach(([key, value]) => {
  if (!value) {
    console.error(`Missing config: ${key}`);
  } else {
    console.log(`✓ ${key}: ${value.slice(0, 20)}...`);
  }
});

const sdk = new TachiSDK(config);
```

---

### 🔄 Content Fetching Issues

**Problem**: Still getting 402 after payment
```
Paid successfully but content request returns 402
```

**Debug steps**:
```javascript
// 1. Verify transaction was successful
const receipt = await publicClient.getTransactionReceipt({
  hash: paymentTxHash
});

console.log('Transaction status:', receipt.status);
console.log('Gas used:', receipt.gasUsed.toString());

// 2. Check payment amount in logs
const paymentLogs = receipt.logs.filter(log => 
  log.address.toLowerCase() === usdcAddress.toLowerCase()
);

paymentLogs.forEach(log => {
  try {
    const decoded = decodeEventLog({
      abi: usdcAbi,
      data: log.data,
      topics: log.topics
    });
    console.log('Payment event:', decoded);
  } catch (e) {
    // Skip non-payment logs
  }
});

// 3. Verify authorization header format
const authHeader = `Bearer ${paymentTxHash}`;
console.log('Auth header:', authHeader);

// Should be: "Bearer 0x1234567890abcdef..."
```

**Problem**: Content request timeout
```
Error: "Request timeout after 30 seconds"
```

**Solution**:
```javascript
// Increase timeout for slow endpoints
const sdk = new TachiSDK({
  // ... other config
  timeout: 60000,  // 60 seconds
  maxRetries: 5    // More retries
});

// Or handle timeouts gracefully
try {
  const result = await sdk.fetchWithTachi(url);
} catch (error) {
  if (error.message.includes('timeout')) {
    console.log('Request timed out, retrying...');
    // Implement retry logic
  }
}
```

---

## Performance Problems

### 🐌 Slow Response Times

**Problem**: Payments take too long
```
Payment processing takes 30+ seconds
```

**Optimization strategies**:
```javascript
// 1. Use faster RPC endpoints
const config = {
  rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-KEY', // Faster than public
  // ... other config
};

// 2. Implement caching for repeated requests
const cache = new Map();

const cachedFetch = async (url) => {
  if (cache.has(url)) {
    console.log('Cache hit for:', url);
    return cache.get(url);
  }
  
  const result = await sdk.fetchWithTachi(url);
  cache.set(url, result);
  return result;
};

// 3. Use connection pooling
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 10
});
```

**Problem**: High gas costs
```
Each transaction costs $0.50+ in gas
```

**Debug high gas usage**:
```javascript
// 1. Check if you're on the right network
const chainId = await publicClient.getChainId();
if (chainId !== 8453) {
  console.error('Wrong network! Base chain ID is 8453');
}

// 2. Compare gas prices
const gasPrice = await publicClient.getGasPrice();
console.log(`Gas price: ${formatGwei(gasPrice)} gwei`);
// Base typically: 0.001-0.01 gwei
// Ethereum: 20-50+ gwei

// 3. Optimize gas usage
const optimizedGasPrice = parseGwei('0.001'); // Very low for Base
```

---

### 📊 Rate Limiting Issues

**Problem**: Too many requests rejected
```
Error: "Rate limit exceeded: 100 requests per minute"
```

**Solutions**:
```javascript
// 1. Implement proper rate limiting
class RateLimiter {
  constructor(requestsPerMinute = 50) {
    this.requests = [];
    this.limit = requestsPerMinute;
  }
  
  async waitIfNeeded() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove old requests
    this.requests = this.requests.filter(time => time > oneMinuteAgo);
    
    if (this.requests.length >= this.limit) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = oldestRequest + 60000 - now;
      console.log(`Rate limited, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitIfNeeded();
    }
    
    this.requests.push(now);
  }
}

const limiter = new RateLimiter(50); // 50 requests per minute

// Use before each request
await limiter.waitIfNeeded();
const result = await sdk.fetchWithTachi(url);

// 2. Batch requests efficiently
const batchSize = 10;
const batches = [];

for (let i = 0; i < urls.length; i += batchSize) {
  batches.push(urls.slice(i, i + batchSize));
}

for (const batch of batches) {
  const promises = batch.map(url => sdk.fetchWithTachi(url));
  const results = await Promise.all(promises);
  
  // Wait between batches
  await new Promise(resolve => setTimeout(resolve, 5000));
}
```

---

## Error Reference

### Common Error Codes and Solutions

**HTTP 400 - Bad Request**
```javascript
// Usually invalid request parameters
{
  "error": "URL is required",
  "statusCode": 400
}

// Solution: Check request format
const request = {
  url: 'https://example.com',  // Must be valid URL
  method: 'GET',               // Valid HTTP method
  // ... other params
};
```

**HTTP 402 - Payment Required**
```javascript
// Payment needed or invalid
{
  "error": "Payment Required",
  "message": "Please send 1.50 USDC to PaymentProcessor",
  "payment": {
    "amount": "1.50",
    "currency": "USDC",
    "recipient": "0x742d35Cc..."
  }
}

// Solution: Process payment through SDK
const result = await sdk.fetchWithTachi(url);
// SDK handles 402 responses automatically
```

**HTTP 403 - Forbidden**
```javascript
// Publisher license issues
{
  "error": "Publisher license required",
  "statusCode": 403
}

// Solution: Verify publisher has CrawlNFT license
const hasLicense = await crawlNFT.hasLicense(publisherAddress);
```

**HTTP 429 - Rate Limited**
```javascript
// Too many requests
{
  "error": "Rate limit exceeded",
  "statusCode": 429
}

// Solution: Implement rate limiting (see above)
```

**HTTP 500 - Internal Server Error**
```javascript
// Server-side issues
{
  "error": "Internal server error",
  "statusCode": 500
}

// Solution: Check server logs, retry with backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.statusCode === 500 && i < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
        continue;
      }
      throw error;
    }
  }
};
```

---

### Blockchain Error Messages

**"Insufficient funds for gas"**
```
Need ETH on Base network for gas fees
Solution: Bridge ETH to Base or buy ETH on Coinbase → send to Base
```

**"Execution reverted"**
```
Smart contract function failed
Common causes:
- Insufficient USDC balance
- Insufficient allowance
- Invalid parameters
- Contract is paused
```

**"Transaction underpriced"**
```
Gas price too low
Solution: Increase gas price or let SDK handle automatically
```

**"Nonce too low"**
```
Transaction nonce conflict
Solution: Reset MetaMask account or wait for pending transactions
```

**"Transaction already imported"**
```
Duplicate transaction
Solution: Wait for original transaction to complete or cancel it
```

---

## Getting Additional Help

### Before Asking for Help

**Gather debugging information**:
```bash
# 1. Environment details
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "SDK version: $(npm list @tachi/sdk-js --depth=0)"

# 2. Network status
curl -s "https://mainnet.base.org" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq .

# 3. Transaction details (if applicable)
# Include transaction hash and wallet address
```

**Create minimal reproduction**:
```javascript
// Simplest possible code that reproduces the issue
import { createBaseSDK } from '@tachi/sdk-js';

const sdk = createBaseSDK({
  rpcUrl: 'https://mainnet.base.org',
  ownerPrivateKey: '0x...',
  paymentProcessorAddress: '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7'
});

// The exact code that fails
const result = await sdk.fetchWithTachi('https://example.com');
```

### Support Channels

**1. Documentation**
- [FAQ](./FAQ.md) - Common questions
- [API Reference](./API.md) - Complete API docs
- [Examples](../examples/) - Working code examples

**2. Community Support**
- [Discord](https://discord.gg/tachi-protocol) - Real-time chat
- [GitHub Issues](https://github.com/tachi-protocol/tachi/issues) - Bug reports
- [Forum](https://forum.tachi.ai) - Discussions

**3. Direct Support**
- Email: support@tachi.ai
- Beta support: beta@tachi.ai

**When reporting issues, include**:
- Full error message and stack trace
- Transaction hashes (if relevant)
- Wallet addresses (no private keys!)
- Network being used (Base mainnet/testnet)
- SDK version and configuration
- Steps to reproduce the issue
- Expected vs actual behavior

---

**Need immediate help?** Join our [Discord](https://discord.gg/tachi-protocol) for real-time support from the team and community!