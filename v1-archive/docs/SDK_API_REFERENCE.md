# Tachi JavaScript SDK API Reference

The Tachi JavaScript SDK provides AI crawlers with automatic payment processing and seamless integration with the Tachi pay-per-crawl protocol.

## Installation

```bash
npm install @tachi/sdk-js
```

## Quick Start

```javascript
import { TachiSDK, createBaseSDK } from '@tachi/sdk-js';

// Initialize SDK for Base mainnet
const tachi = createBaseSDK({
  rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
  paymentProcessorAddress: '0x...', // Deployed PaymentProcessor contract
  ownerPrivateKey: '0x...', // Your crawler's private key
  userAgent: 'MyCrawler/1.0'
});

// Fetch content with automatic payment handling
const response = await tachi.fetchWithTachi('https://example.com/api/data');
console.log(response.content);
```

---

## Classes

### TachiSDK

Main SDK class for interacting with the Tachi protocol.

#### Constructor

```typescript
new TachiSDK(config: TachiConfig)
```

**Parameters:**
- `config` - SDK configuration object

**Example:**
```javascript
const sdk = new TachiSDK({
  network: 'base',
  rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  paymentProcessorAddress: '0x...',
  ownerPrivateKey: '0x...',
  userAgent: 'MyCrawler/1.0',
  debug: true
});
```

#### Methods

##### `fetchWithTachi(url, options?)`

Fetch content from a protected URL with automatic payment handling.

```typescript
async fetchWithTachi(
  url: string, 
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
): Promise<TachiResponse>
```

**Parameters:**
- `url` - Target URL to fetch
- `options` - HTTP request options (optional)
  - `method` - HTTP method (default: 'GET')
  - `headers` - Additional headers
  - `body` - Request body for POST/PUT requests

**Returns:**
- `Promise<TachiResponse>` - Response with content and metadata

**Example:**
```javascript
// Simple GET request
const response = await sdk.fetchWithTachi('https://example.com/data');

// POST request with custom headers
const response = await sdk.fetchWithTachi('https://example.com/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'search term' })
});

console.log(response.content);
console.log(response.paymentRequired); // false if payment was processed
console.log(response.transactionHash); // payment transaction hash
```

##### `getBalance()`

Get the crawler's USDC balance.

```typescript
async getBalance(): Promise<string>
```

**Returns:**
- `Promise<string>` - USDC balance in human-readable format

**Example:**
```javascript
const balance = await sdk.getBalance();
console.log(`Current USDC balance: ${balance}`);
```

##### `makePayment(recipient, amount)`

Make a direct USDC payment to a recipient.

```typescript
async makePayment(recipient: Address, amount: string): Promise<string>
```

**Parameters:**
- `recipient` - Recipient wallet address
- `amount` - Payment amount in USDC

**Returns:**
- `Promise<string>` - Transaction hash

**Example:**
```javascript
const txHash = await sdk.makePayment(
  '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7',
  '0.005'
);
console.log(`Payment sent: ${txHash}`);
```

##### `registerCrawler(registration)`

Register crawler information (if supported by the target).

```typescript
async registerCrawler(registration: CrawlerRegistration): Promise<void>
```

**Parameters:**
- `registration` - Crawler registration details

**Example:**
```javascript
await sdk.registerCrawler({
  name: 'My Research Crawler',
  contact: 'research@mycompany.com',
  description: 'Academic research crawler for AI training',
  companyName: 'Research Lab Inc.',
  type: 'enterprise'
});
```

---

## Interfaces

### TachiConfig

SDK configuration interface.

```typescript
interface TachiConfig {
  // Network configuration
  network: 'base' | 'base-sepolia';
  rpcUrl: string;
  
  // Smart contract addresses
  usdcAddress: Address;
  paymentProcessorAddress: Address;
  
  // Wallet configuration
  smartAccountAddress?: Address;
  ownerPrivateKey?: Hash;
  
  // Request configuration
  userAgent?: string;
  timeout?: number;
  maxRetries?: number;
  
  // Client preference
  useEthers?: boolean; // Use Ethers.js instead of Viem
  
  // Debug configuration
  debug?: boolean; // Enable debug logging
  
  // API configuration (future use)
  apiUrl?: string;
  apiKey?: string;
}
```

**Properties:**

| Property | Type | Required | Description | Default |
|----------|------|----------|-------------|---------|
| `network` | `'base' \| 'base-sepolia'` | ✅ | Blockchain network | - |
| `rpcUrl` | `string` | ✅ | RPC endpoint URL | - |
| `usdcAddress` | `Address` | ✅ | USDC contract address | - |
| `paymentProcessorAddress` | `Address` | ✅ | PaymentProcessor contract address | - |
| `ownerPrivateKey` | `Hash` | ⚠️ | Crawler's private key for payments | - |
| `userAgent` | `string` | ❌ | Custom User-Agent string | `'TachiSDK/1.0'` |
| `timeout` | `number` | ❌ | Request timeout in milliseconds | `30000` |
| `maxRetries` | `number` | ❌ | Maximum retry attempts | `3` |
| `useEthers` | `boolean` | ❌ | Use Ethers.js instead of Viem | `false` |
| `debug` | `boolean` | ❌ | Enable debug logging | `false` |

### TachiResponse

Response from `fetchWithTachi()` method.

```typescript
interface TachiResponse {
  content: string;              // Response content
  statusCode: number;           // HTTP status code
  headers: Record<string, string>; // Response headers
  paymentRequired: boolean;     // Whether payment was required
  paymentAmount?: string;       // Amount paid (if payment occurred)
  transactionHash?: string;     // Payment transaction hash
}
```

### PaymentInfo

Payment information extracted from 402 responses.

```typescript
interface PaymentInfo {
  amount: string;        // Payment amount in USDC
  currency: string;      // Currency (usually 'USDC')
  network: string;       // Blockchain network
  chainId: number;       // Chain ID
  recipient: Address;    // Payment recipient address
  tokenAddress: Address; // USDC token contract address
  tokenId?: string;      // NFT token ID (if applicable)
}
```

### CrawlerRegistration

Crawler registration information.

```typescript
interface CrawlerRegistration {
  name?: string;         // Crawler name
  contact?: string;      // Contact email
  description?: string;  // Purpose description
  companyName?: string;  // Company/organization name
  type?: 'individual' | 'startup' | 'enterprise'; // Crawler type
}
```

---

## Error Classes

### TachiError

Base error class for all Tachi-related errors.

```typescript
class TachiError extends Error {
  constructor(message: string, public code: string, public details?: any)
}
```

**Properties:**
- `message` - Error message
- `code` - Error code
- `details` - Additional error details

### PaymentError

Error related to payment processing.

```typescript
class PaymentError extends TachiError {
  constructor(message: string, details?: any)
}
```

**Common scenarios:**
- Insufficient USDC balance
- Payment transaction failed
- Invalid payment amount

### NetworkError

Error related to network connectivity.

```typescript
class NetworkError extends TachiError {
  constructor(message: string, details?: any)
}
```

**Common scenarios:**
- RPC endpoint unreachable
- Request timeout
- Invalid response format

---

## Factory Functions

### createBaseSDK()

Create SDK instance for Base mainnet.

```typescript
function createBaseSDK(
  config: Omit<TachiConfig, 'network' | 'usdcAddress'>
): TachiSDK
```

**Example:**
```javascript
const sdk = createBaseSDK({
  rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
  paymentProcessorAddress: '0x...',
  ownerPrivateKey: '0x...'
});
```

### createBaseSepoliaSDK()

Create SDK instance for Base Sepolia testnet.

```typescript
function createBaseSepoliaSDK(
  config: Omit<TachiConfig, 'network' | 'usdcAddress'>
): TachiSDK
```

**Example:**
```javascript
const sdk = createBaseSepoliaSDK({
  rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY',
  paymentProcessorAddress: '0x...',
  ownerPrivateKey: '0x...'
});
```

### createBaseSDKWithEthers()

Create SDK instance using Ethers.js for Base mainnet.

```typescript
function createBaseSDKWithEthers(
  config: Omit<TachiConfig, 'network' | 'usdcAddress' | 'useEthers'>
): TachiSDK
```

### createBaseSepoliaSDKWithEthers()

Create SDK instance using Ethers.js for Base Sepolia testnet.

```typescript
function createBaseSepoliaSDKWithEthers(
  config: Omit<TachiConfig, 'network' | 'usdcAddress' | 'useEthers'>
): TachiSDK
```

---

## Standalone Functions

### fetchWithTachi()

Standalone function for one-off requests without SDK instantiation.

```typescript
async function fetchWithTachi(
  url: string,
  config: TachiConfig,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
): Promise<TachiResponse>
```

**Example:**
```javascript
import { fetchWithTachi } from '@tachi/sdk-js';

const response = await fetchWithTachi(
  'https://example.com/data',
  {
    network: 'base',
    rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    paymentProcessorAddress: '0x...',
    ownerPrivateKey: '0x...'
  }
);
```

---

## Network Configuration

### Base Mainnet

```javascript
const config = {
  network: 'base',
  rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  // ... other config
};
```

### Base Sepolia Testnet

```javascript
const config = {
  network: 'base-sepolia',
  rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY',
  usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  // ... other config
};
```

---

## Usage Examples

### Basic Web Crawling

```javascript
import { createBaseSDK } from '@tachi/sdk-js';

const sdk = createBaseSDK({
  rpcUrl: process.env.BASE_RPC_URL,
  paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS,
  ownerPrivateKey: process.env.CRAWLER_PRIVATE_KEY,
  userAgent: 'ResearchBot/1.0 (+https://research.example.com/bot)',
  debug: true
});

async function crawlSite(urls) {
  for (const url of urls) {
    try {
      const response = await sdk.fetchWithTachi(url);
      
      if (response.paymentRequired) {
        console.log(`Payment made: ${response.transactionHash}`);
        console.log(`Amount: ${response.paymentAmount} USDC`);
      }
      
      // Process the content
      await processContent(response.content);
      
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error.message);
    }
  }
}
```

### API Data Collection

```javascript
async function collectApiData() {
  const endpoints = [
    'https://publisher.com/api/articles',
    'https://publisher.com/api/posts',
    'https://publisher.com/api/research'
  ];
  
  for (const endpoint of endpoints) {
    const response = await sdk.fetchWithTachi(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query: 'machine learning',
        limit: 100
      })
    });
    
    const data = JSON.parse(response.content);
    await storeData(data);
  }
}
```

### Batch Processing with Error Handling

```javascript
import { PaymentError, NetworkError } from '@tachi/sdk-js';

async function batchCrawl(urls) {
  const results = [];
  
  for (const url of urls) {
    try {
      const response = await sdk.fetchWithTachi(url);
      results.push({ url, success: true, content: response.content });
      
    } catch (error) {
      if (error instanceof PaymentError) {
        console.error(`Payment failed for ${url}: ${error.message}`);
        // Check balance and potentially top up
        const balance = await sdk.getBalance();
        console.log(`Current balance: ${balance} USDC`);
        
      } else if (error instanceof NetworkError) {
        console.error(`Network error for ${url}: ${error.message}`);
        // Retry with exponential backoff
        
      } else {
        console.error(`Unexpected error for ${url}:`, error);
      }
      
      results.push({ url, success: false, error: error.message });
    }
  }
  
  return results;
}
```

### Balance Management

```javascript
async function manageBalance() {
  const balance = await sdk.getBalance();
  const minBalance = '10.0'; // Minimum 10 USDC
  
  console.log(`Current balance: ${balance} USDC`);
  
  if (parseFloat(balance) < parseFloat(minBalance)) {
    console.warn('Low balance detected!');
    // Implement your balance top-up logic here
    // This could involve transferring from a main wallet
    // or purchasing USDC through a DEX
  }
}
```

---

## Best Practices

### 1. **Private Key Security**

```javascript
// ✅ Good: Use environment variables
const sdk = createBaseSDK({
  ownerPrivateKey: process.env.CRAWLER_PRIVATE_KEY,
  // ...
});

// ❌ Bad: Hardcode private keys
const sdk = createBaseSDK({
  ownerPrivateKey: '0x1234567890abcdef...', // Never do this!
  // ...
});
```

### 2. **Error Handling**

```javascript
// ✅ Good: Comprehensive error handling
try {
  const response = await sdk.fetchWithTachi(url);
  return response.content;
} catch (error) {
  if (error instanceof PaymentError) {
    // Handle payment-specific errors
    await handlePaymentError(error);
  } else if (error instanceof NetworkError) {
    // Handle network-specific errors
    await handleNetworkError(error);
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
  throw error;
}
```

### 3. **Rate Limiting**

```javascript
// ✅ Good: Implement rate limiting
import pLimit from 'p-limit';

const limit = pLimit(3); // Max 3 concurrent requests

const promises = urls.map(url =>
  limit(() => sdk.fetchWithTachi(url))
);

const results = await Promise.allSettled(promises);
```

### 4. **User Agent Configuration**

```javascript
// ✅ Good: Descriptive and respectful User-Agent
const sdk = createBaseSDK({
  userAgent: 'ResearchBot/1.0 (+https://university.edu/crawler-info)',
  // ...
});

// ❌ Bad: Generic or misleading User-Agent
const sdk = createBaseSDK({
  userAgent: 'Mozilla/5.0...', // Don't impersonate browsers
  // ...
});
```

### 5. **Debug Mode for Development**

```javascript
// Development
const sdk = createBaseSDK({
  debug: process.env.NODE_ENV === 'development',
  // ...
});
```

---

## Troubleshooting

### Common Issues

1. **"Insufficient funds" error**
   - Check USDC balance with `getBalance()`
   - Ensure wallet has enough USDC for payments
   - Verify you're on the correct network

2. **"Payment verification failed"**
   - Check transaction hash format
   - Verify payment amount matches requirement
   - Ensure transaction was confirmed on-chain

3. **Network connection errors**
   - Verify RPC URL is correct and accessible
   - Check if Base network is experiencing issues
   - Try with a different RPC provider

4. **Contract interaction failures**
   - Verify contract addresses are correct
   - Check if contracts are deployed on the target network
   - Ensure private key has sufficient ETH for gas fees

### Debug Information

Enable debug mode to see detailed logs:

```javascript
const sdk = createBaseSDK({
  debug: true,
  // ... other config
});

// Will output detailed logs like:
// [TachiSDK] Fetching: https://example.com/data
// [TachiSDK] Payment required - processing payment...
// [TachiSDK] Payment info: { amount: "0.005", currency: "USDC", ... }
// [TachiSDK] Payment sent: 0x1234567890abcdef...
```

---

## TypeScript Support

The SDK is written in TypeScript and provides full type safety:

```typescript
import { TachiSDK, TachiConfig, TachiResponse } from '@tachi/sdk-js';

const config: TachiConfig = {
  network: 'base',
  rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  paymentProcessorAddress: '0x...',
  ownerPrivateKey: '0x...',
  debug: true
};

const sdk = new TachiSDK(config);

// Full type checking and intellisense support
const response: TachiResponse = await sdk.fetchWithTachi('https://example.com');
```