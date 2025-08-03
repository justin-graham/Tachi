# Tachi SDK API Reference

## JavaScript SDK (@tachi/sdk-js)

### Installation

```bash
npm install @tachi/sdk-js
```

### Basic Usage

```javascript
import TachiSDK from '@tachi/sdk-js';

const client = new TachiSDK({
  privateKey: 'your-private-key',
  network: 'base-sepolia', // or 'base-mainnet'
  rpcUrl: 'https://sepolia.base.org' // optional
});
```

### Constructor Options

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `privateKey` | string | Yes | - | Wallet private key for signing transactions |
| `network` | string | No | 'base-sepolia' | Network to connect to ('base-sepolia' or 'base-mainnet') |
| `rpcUrl` | string | No | Auto-detected | Custom RPC endpoint URL |
| `gasPrice` | string | No | 'auto' | Gas price in Gwei or 'auto' for automatic |
| `timeout` | number | No | 30000 | Request timeout in milliseconds |

### Methods

#### `crawl(url, options)`

Crawl a URL with automatic payment handling.

**Parameters:**
- `url` (string): Target URL to crawl
- `options` (object, optional):
  - `maxPayment` (number): Maximum USDC to pay (default: 1.0)
  - `timeout` (number): Request timeout in ms (default: 30000)
  - `headers` (object): Additional HTTP headers
  - `retries` (number): Number of retry attempts (default: 3)

**Returns:** Promise<CrawlResult>

```javascript
const result = await client.crawl('https://example.com/api/data', {
  maxPayment: 0.50,
  timeout: 45000,
  headers: { 'User-Agent': 'TachiBot/1.0' }
});

console.log(result.content);
console.log(`Cost: $${result.paymentAmount}`);
```

#### `pay(paymentDetails)`

Process a manual payment to a publisher.

**Parameters:**
- `paymentDetails` (object):
  - `publisherAddress` (string): Publisher's wallet address
  - `amountUsdc` (string): Payment amount in USDC
  - `metadata` (object, optional): Additional payment metadata

**Returns:** Promise<PaymentResult>

```javascript
const payment = await client.pay({
  publisherAddress: '0x742d35Cc6230009C96A7B4f8c5e60c1f5ddBf1F3',
  amountUsdc: '0.01',
  metadata: { url: 'https://example.com/content' }
});

console.log(`Transaction: ${payment.transactionHash}`);
```

#### `getBalance()`

Get current USDC balance.

**Returns:** Promise<number>

```javascript
const balance = await client.getBalance();
console.log(`Balance: ${balance} USDC`);
```

#### `estimateGas(operation)`

Estimate gas costs for an operation.

**Parameters:**
- `operation` (object):
  - `type` ('payment' | 'mint' | 'approval')
  - `amount` (string, optional): Payment amount for payment operations
  - `to` (string, optional): Recipient address

**Returns:** Promise<GasEstimate>

```javascript
const estimate = await client.estimateGas({
  type: 'payment',
  amount: '0.01',
  to: '0x742d35Cc6230009C96A7B4f8c5e60c1f5ddBf1F3'
});

console.log(`Estimated gas: ${estimate.gasLimit}`);
console.log(`Gas cost: ${estimate.gasCostEth} ETH`);
```

#### `validatePayment(transactionHash)`

Validate a payment transaction.

**Parameters:**
- `transactionHash` (string): Transaction hash to validate

**Returns:** Promise<PaymentValidation>

```javascript
const validation = await client.validatePayment('0x...');
console.log(`Valid: ${validation.isValid}`);
console.log(`Amount: ${validation.amount} USDC`);
```

#### `getPaymentHistory(limit)`

Get payment history for the wallet.

**Parameters:**
- `limit` (number, optional): Maximum number of payments to return (default: 50)

**Returns:** Promise<PaymentHistory[]>

```javascript
const history = await client.getPaymentHistory(10);
history.forEach(payment => {
  console.log(`${payment.timestamp}: ${payment.amount} USDC to ${payment.publisher}`);
});
```

### Response Types

#### CrawlResult

```typescript
interface CrawlResult {
  success: boolean;
  content?: string;
  contentLength?: number;
  paymentAmount?: number;
  transactionHash?: string;
  error?: string;
  timestamp: Date;
  metadata?: object;
}
```

#### PaymentResult

```typescript
interface PaymentResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: number;
  amount: string;
  publisher: string;
  timestamp: Date;
}
```

#### GasEstimate

```typescript
interface GasEstimate {
  gasLimit: number;
  gasPrice: string;
  gasCostEth: string;
  gasCostUsd?: string;
}
```

### Error Handling

```javascript
import { PaymentRequiredError, InsufficientFundsError, NetworkError } from '@tachi/sdk-js';

try {
  const result = await client.crawl(url);
} catch (error) {
  if (error instanceof PaymentRequiredError) {
    console.log('Payment required:', error.paymentDetails);
  } else if (error instanceof InsufficientFundsError) {
    console.log('Insufficient USDC balance');
  } else if (error instanceof NetworkError) {
    console.log('Network connection failed');
  }
}
```

---

## Python SDK (tachi-sdk)

### Installation

```bash
pip install tachi-sdk
```

### Basic Usage

```python
from tachi_sdk import TachiClient

client = TachiClient(
    private_key='your-private-key',
    network='base-sepolia',  # or 'base-mainnet'
    rpc_url='https://sepolia.base.org'  # optional
)
```

### Constructor Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `private_key` | str | Yes | - | Wallet private key for signing transactions |
| `network` | str | No | 'base-sepolia' | Network to connect to ('base-sepolia' or 'base-mainnet') |
| `rpc_url` | str | No | Auto-detected | Custom RPC endpoint URL |
| `gas_price` | str | No | 'auto' | Gas price in Gwei or 'auto' for automatic |
| `timeout` | int | No | 30 | Request timeout in seconds |

### Methods

#### `crawl(url, **kwargs)`

Crawl a URL with automatic payment handling.

**Parameters:**
- `url` (str): Target URL to crawl
- `max_payment` (float): Maximum USDC to pay (default: 1.0)
- `timeout` (int): Request timeout in seconds (default: 30)
- `headers` (dict): Additional HTTP headers
- `retries` (int): Number of retry attempts (default: 3)
- `verify_payment` (bool): Verify payment on-chain (default: True)

**Returns:** CrawlResult

```python
result = client.crawl(
    'https://example.com/api/data',
    max_payment=0.50,
    timeout=45,
    headers={'User-Agent': 'TachiBot/1.0'}
)

print(result.content)
print(f"Cost: ${result.payment_amount}")
```

#### `pay(publisher_address, amount_usdc, **kwargs)`

Process a manual payment to a publisher.

**Parameters:**
- `publisher_address` (str): Publisher's wallet address
- `amount_usdc` (str): Payment amount in USDC
- `metadata` (dict): Additional payment metadata (optional)
- `gas_limit` (int): Custom gas limit (optional)

**Returns:** PaymentResult

```python
payment = client.pay(
    publisher_address='0x742d35Cc6230009C96A7B4f8c5e60c1f5ddBf1F3',
    amount_usdc='0.01',
    metadata={'url': 'https://example.com/content'}
)

print(f"Transaction: {payment.transaction_hash}")
```

#### `get_balance()`

Get current USDC balance.

**Returns:** float

```python
balance = client.get_balance()
print(f"Balance: {balance} USDC")
```

#### `estimate_gas(operation_type, **kwargs)`

Estimate gas costs for an operation.

**Parameters:**
- `operation_type` (str): 'payment', 'mint', or 'approval'
- `amount` (str): Payment amount for payment operations (optional)
- `to` (str): Recipient address (optional)

**Returns:** GasEstimate

```python
estimate = client.estimate_gas(
    'payment',
    amount='0.01',
    to='0x742d35Cc6230009C96A7B4f8c5e60c1f5ddBf1F3'
)

print(f"Estimated gas: {estimate.gas_limit}")
print(f"Gas cost: {estimate.gas_cost_eth} ETH")
```

#### `validate_payment(transaction_hash)`

Validate a payment transaction.

**Parameters:**
- `transaction_hash` (str): Transaction hash to validate

**Returns:** PaymentValidation

```python
validation = client.validate_payment('0x...')
print(f"Valid: {validation.is_valid}")
print(f"Amount: {validation.amount} USDC")
```

#### `get_payment_history(limit=50)`

Get payment history for the wallet.

**Parameters:**
- `limit` (int): Maximum number of payments to return (default: 50)

**Returns:** List[PaymentHistory]

```python
history = client.get_payment_history(10)
for payment in history:
    print(f"{payment.timestamp}: {payment.amount} USDC to {payment.publisher}")
```

#### `log_crawl(url, content_hash, success=True, **kwargs)`

Log crawl activity on-chain (optional).

**Parameters:**
- `url` (str): Crawled URL
- `content_hash` (str): Content hash (SHA-256)
- `success` (bool): Whether crawl was successful
- `ipfs_hash` (str): IPFS hash if content was stored (optional)

**Returns:** LogResult

```python
log_result = client.log_crawl(
    url='https://example.com/api/data',
    content_hash='sha256:abc123...',
    success=True
)

print(f"Logged crawl: {log_result.transaction_hash}")
```

### Data Classes

#### CrawlResult

```python
@dataclass
class CrawlResult:
    url: str
    success: bool
    content: Optional[str] = None
    content_length: Optional[int] = None
    payment_amount: Optional[float] = None
    transaction_hash: Optional[str] = None
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Optional[dict] = None
```

#### PaymentResult

```python
@dataclass
class PaymentResult:
    transaction_hash: str
    block_number: int
    gas_used: int
    amount: str
    publisher: str
    timestamp: datetime
    content_hash: Optional[str] = None
```

#### GasEstimate

```python
@dataclass
class GasEstimate:
    gas_limit: int
    gas_price: str
    gas_cost_eth: str
    gas_cost_usd: Optional[str] = None
```

### Exception Handling

```python
from tachi_sdk import (
    PaymentRequiredError,
    InsufficientFundsError,
    NetworkError,
    ValidationError
)

try:
    result = client.crawl(url)
except PaymentRequiredError as e:
    print(f'Payment required: {e.payment_details}')
except InsufficientFundsError as e:
    print(f'Insufficient USDC balance: {e.required} required, {e.available} available')
except NetworkError as e:
    print(f'Network error: {e.message}')
except ValidationError as e:
    print(f'Validation failed: {e.message}')
```

### Async Support

```python
import asyncio
from tachi_sdk import AsyncTachiClient

async def main():
    client = AsyncTachiClient(
        private_key='your-private-key',
        network='base-sepolia'
    )
    
    # Async crawl
    result = await client.crawl('https://example.com/api/data')
    print(result.content)
    
    # Async batch processing
    urls = ['url1', 'url2', 'url3']
    results = await client.crawl_batch(urls, max_concurrent=3)
    
    # Process results
    for result in results:
        if result.success:
            print(f"Success: {result.url}")
        else:
            print(f"Failed: {result.url} - {result.error}")

asyncio.run(main())
```

## Advanced Features

### Batch Processing

#### JavaScript

```javascript
// Batch crawling with concurrency control
const urls = ['url1', 'url2', 'url3'];
const results = await client.crawlBatch(urls, {
  maxPayment: 0.50,
  maxConcurrent: 3,
  stopOnError: false
});

console.log(`Processed ${results.length} URLs`);
```

#### Python

```python
# Async batch processing
async def crawl_batch(urls, max_concurrent=5):
    async with TachiClient(private_key) as client:
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def crawl_with_semaphore(url):
            async with semaphore:
                return await client.crawl(url)
        
        tasks = [crawl_with_semaphore(url) for url in urls]
        return await asyncio.gather(*tasks)

results = await crawl_batch(['url1', 'url2', 'url3'])
```

### Custom Payment Strategies

#### JavaScript

```javascript
// Custom payment strategy
client.setPaymentStrategy({
  maxDailyBudget: 100.0,
  priceThresholds: {
    'api.expensive-site.com': 2.0,
    'cheap-content.com': 0.01
  },
  blacklist: ['blocked-site.com'],
  retryOnFailure: true
});
```

#### Python

```python
# Payment strategy configuration
strategy = PaymentStrategy(
    max_daily_budget=100.0,
    price_thresholds={
        'api.expensive-site.com': 2.0,
        'cheap-content.com': 0.01
    },
    blacklist=['blocked-site.com'],
    retry_on_failure=True
)

client.set_payment_strategy(strategy)
```

### Caching and Optimization

#### JavaScript

```javascript
// Enable content caching
client.enableCaching({
  ttl: 3600,  // 1 hour
  maxSize: 100,  // 100 items
  strategy: 'lru'  // least recently used
});

// Check cache before crawling
const cached = client.getCachedContent(url);
if (cached && !cached.isExpired()) {
  return cached.content;
}
```

#### Python

```python
# Configure caching
client.configure_cache(
    ttl=3600,  # 1 hour
    max_size=100,
    strategy='lru'
)

# Manual cache management
client.clear_cache()
cache_stats = client.get_cache_stats()
print(f"Cache hit rate: {cache_stats.hit_rate:.2%}")
```

## Configuration Reference

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TACHI_PRIVATE_KEY` | Wallet private key | Required |
| `TACHI_NETWORK` | Network ('base-sepolia' or 'base-mainnet') | 'base-sepolia' |
| `TACHI_RPC_URL` | Custom RPC endpoint | Auto-detected |
| `TACHI_MAX_PAYMENT` | Maximum payment per request (USDC) | 1.0 |
| `TACHI_DAILY_BUDGET` | Daily spending limit (USDC) | 100.0 |
| `TACHI_TIMEOUT` | Request timeout (seconds) | 30 |
| `TACHI_RETRIES` | Number of retries | 3 |
| `TACHI_LOG_LEVEL` | Log level (DEBUG, INFO, WARNING, ERROR) | INFO |

### Configuration File

#### JavaScript (tachi.config.js)

```javascript
module.exports = {
  network: 'base-sepolia',
  payment: {
    maxPerRequest: 1.0,
    dailyBudget: 100.0,
    timeout: 30000
  },
  crawling: {
    userAgent: 'TachiBot/1.0',
    retries: 3,
    respectRobots: true
  },
  caching: {
    enabled: true,
    ttl: 3600,
    maxSize: 100
  }
};
```

#### Python (tachi.yaml)

```yaml
network: base-sepolia
payment:
  max_per_request: 1.0
  daily_budget: 100.0
  timeout: 30
crawling:
  user_agent: "TachiBot/1.0"
  retries: 3
  respect_robots: true
caching:
  enabled: true
  ttl: 3600
  max_size: 100
```

## Testing and Development

### Mock Mode

#### JavaScript

```javascript
// Enable mock mode for testing
const client = new TachiSDK({
  privateKey: 'test-key',
  network: 'mock',
  mockResponses: {
    'https://example.com': {
      status: 402,
      paymentRequired: true,
      price: '0.01'
    }
  }
});
```

#### Python

```python
# Mock client for testing
from tachi_sdk.testing import MockTachiClient

client = MockTachiClient(
    mock_responses={
        'https://example.com': {
            'status': 402,
            'payment_required': True,
            'price': '0.01'
        }
    }
)
```

### Integration Testing

```javascript
// Test suite example
describe('Tachi Integration', () => {
  let client;
  
  beforeEach(() => {
    client = new TachiSDK({
      privateKey: process.env.TEST_PRIVATE_KEY,
      network: 'base-sepolia'
    });
  });
  
  test('should handle payment required', async () => {
    const result = await client.crawl('https://test-site.com/protected');
    expect(result.success).toBe(true);
    expect(result.paymentAmount).toBeGreaterThan(0);
  });
});
```

## Performance Guidelines

### Best Practices

1. **Connection Pooling**: Reuse client instances
2. **Batch Processing**: Group multiple requests
3. **Caching**: Enable content caching for repeated access
4. **Rate Limiting**: Respect server limits
5. **Error Handling**: Implement proper retry logic
6. **Monitoring**: Track costs and success rates

### Performance Tuning

```javascript
// Optimize for high-throughput crawling
const client = new TachiSDK({
  privateKey: 'your-key',
  network: 'base-mainnet',
  connectionPool: {
    maxConnections: 10,
    keepAlive: true
  },
  cache: {
    enabled: true,
    strategy: 'lru',
    maxSize: 1000
  },
  retries: {
    maxAttempts: 3,
    backoff: 'exponential',
    jitter: true
  }
});
```

## Support and Resources

- **Documentation**: [docs.tachi.network](https://docs.tachi.network)
- **API Reference**: [docs.tachi.network/api](https://docs.tachi.network/api)
- **GitHub**: [github.com/justin-graham/Tachi](https://github.com/justin-graham/Tachi)
- **npm Package**: [@tachi/sdk-js](https://www.npmjs.com/package/@tachi/sdk-js)
- **PyPI Package**: [tachi-sdk](https://pypi.org/project/tachi-sdk/)
- **Discord**: [discord.gg/tachi](https://discord.gg/tachi)
- **Email**: sdk-support@tachi.network
