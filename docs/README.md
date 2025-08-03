# Tachi Protocol Documentation

## 🌐 Pay-Per-Crawl Web Infrastructure

Tachi Protocol enables website publishers to monetize their content through a decentralized pay-per-crawl system. AI companies and crawlers can access protected content by making micro-payments in USDC on the Base network.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Publisher Integration](#publisher-integration)
- [AI Company Integration](#ai-company-integration)
- [SDK Documentation](#sdk-documentation)
- [Smart Contract Reference](#smart-contract-reference)
- [API Reference](#api-reference)
- [Deployment Guides](#deployment-guides)
- [Examples](#examples)

## Overview

### How It Works

1. **Publishers** deploy a Cloudflare Worker that protects their content
2. **AI Crawlers** attempt to access protected content and receive a `402 Payment Required` response
3. **Payment Flow** occurs via USDC on Base network using smart contracts
4. **Content Access** is granted after successful payment verification

### Network Information

- **Blockchain**: Base Sepolia (Testnet) / Base Mainnet (Production)
- **Payment Token**: USDC
- **Smart Contracts**:
  - CrawlNFT: `0xa974E189038f5b0dEcEbfCe7B0A108824acF3813`
  - PaymentProcessor: `0xBbe8D73B6B44652A5Fb20678bFa27b785Bb7Df41`
  - ProofOfCrawlLedger: `0xA20e592e294FEbb5ABc758308b15FED437AB1EF9`

## Quick Start

### Prerequisites

**For Publishers:**
- Cloudflare account with Workers enabled
- Base network wallet (MetaMask or Coinbase Wallet)
- Minimal ETH for gas fees (~0.01 ETH)

**For AI Companies:**
- Base network wallet with USDC funds
- Node.js/Python development environment
- API keys for blockchain interaction

### Installation

```bash
# Install JavaScript SDK
npm install @tachi/sdk-js

# Install Python SDK
pip install tachi-sdk
```

## Publisher Integration

### Step 1: Get Your License

Visit the [Tachi Dashboard](https://dashboard.tachi.network) and mint your publisher license NFT.

### Step 2: Deploy Cloudflare Worker

1. **Generate Worker Code** from the dashboard
2. **Configure Environment Variables**:
   ```bash
   PUBLISHER_WALLET=0x...
   CRAWL_PRICE_USDC=0.01
   CRAWL_NFT_CONTRACT=0xa974E189038f5b0dEcEbfCe7B0A108824acF3813
   PAYMENT_PROCESSOR=0xBbe8D73B6B44652A5Fb20678bFa27b785Bb7Df41
   ```

3. **Deploy to Cloudflare**:
   ```bash
   npx wrangler deploy
   ```

### Step 3: Configure Pricing

Set your crawl pricing through the dashboard or directly in the worker:

```javascript
// In your Cloudflare Worker
const CRAWL_PRICE = "0.01"; // USDC per request
const PROTECTED_PATHS = ["/api", "/content"];
```

## AI Company Integration

### Step 1: Wallet Setup

1. Create a Base network wallet
2. Fund with USDC for payments
3. Fund with ETH for gas fees

### Step 2: Install SDK

```bash
# Python
pip install tachi-sdk

# JavaScript
npm install @tachi/sdk-js
```

### Step 3: Basic Implementation

See [SDK Examples](#sdk-examples) below for detailed code samples.

## SDK Documentation

### JavaScript SDK

#### Installation
```bash
npm install @tachi/sdk-js
```

#### Basic Usage
```javascript
import TachiSDK from '@tachi/sdk-js';

const client = new TachiSDK({
  privateKey: 'your-private-key',
  network: 'base-sepolia'
});

// Crawl a protected URL
const result = await client.crawl('https://example.com/protected');
console.log(result.content);
```

#### Methods

- `crawl(url, options)` - Attempt to crawl a URL with automatic payment handling
- `pay(paymentDetails)` - Manual payment processing
- `getBalance()` - Check USDC balance
- `estimateGas()` - Estimate transaction costs

### Python SDK

#### Installation
```bash
pip install tachi-sdk
```

#### Basic Usage
```python
from tachi_sdk import TachiClient

client = TachiClient(
    private_key='your-private-key',
    network='base-sepolia'
)

# Crawl a protected URL
result = client.crawl('https://example.com/protected')
print(result.content)
```

#### Methods

- `crawl(url, **kwargs)` - Crawl with automatic payment
- `pay(payment_details)` - Manual payment processing  
- `get_balance()` - Check USDC balance
- `estimate_gas()` - Estimate transaction costs

## Smart Contract Reference

### CrawlNFT Contract

**Address**: `0xa974E189038f5b0dEcEbfCe7B0A108824acF3813`

**Key Functions**:
- `mintMyLicense(termsURI)` - Mint a publisher license
- `balanceOf(address)` - Check license ownership
- `selfMintingEnabled()` - Check if self-minting is active

### PaymentProcessor Contract

**Address**: `0xBbe8D73B6B44652A5Fb20678bFa27b785Bb7Df41`

**Key Functions**:
- `payPublisher(address publisher, uint256 amount)` - Process payment
- `getPaymentHistory(address)` - View payment history

### ProofOfCrawlLedger Contract

**Address**: `0xA20e592e294FEbb5ABc758308b15FED437AB1EF9`

**Key Functions**:
- `logCrawlWithURL(string url, string ipfsHash)` - Log crawl activity
- `getTotalCrawlsLogged()` - Get total crawl count

## API Reference

### HTTP Response Codes

- `200 OK` - Content accessible (payment verified)
- `402 Payment Required` - Payment needed to access content
- `403 Forbidden` - Access denied (insufficient payment/invalid license)
- `429 Too Many Requests` - Rate limit exceeded

### Payment Required Response Format

```json
{
  "error": "Payment required",
  "payment_details": {
    "publisher_address": "0x...",
    "price_usdc": "0.01",
    "payment_processor": "0x...",
    "chain_id": 84532,
    "currency": "USDC"
  },
  "content_hash": "sha256:...",
  "timestamp": 1704067200
}
```

## Examples

### Using the Python SDK - Complete Example

Here's a comprehensive example showing how an AI crawler handles 402 errors, makes payments, and retrieves content:

```python
import requests
from tachi_sdk import TachiClient, PaymentRequiredError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    # Initialize Tachi SDK client
    client = TachiClient(
        private_key='your-private-key-here',
        network='base-sepolia',  # or 'base-mainnet' for production
        rpc_url='https://sepolia.base.org'  # optional, uses default if not provided
    )
    
    # Target URL to crawl
    target_url = 'https://example-publisher.com/protected-content'
    
    try:
        # Attempt initial crawl
        logger.info(f"Attempting to crawl: {target_url}")
        response = requests.get(target_url)
        
        # Check if payment is required
        if response.status_code == 402:
            logger.info("Payment required - processing payment...")
            
            # Parse payment details from response
            payment_details = response.json()['payment_details']
            logger.info(f"Price: {payment_details['price_usdc']} USDC")
            logger.info(f"Publisher: {payment_details['publisher_address']}")
            
            # Check our USDC balance
            balance = client.get_balance()
            required_amount = float(payment_details['price_usdc'])
            
            if balance < required_amount:
                raise Exception(f"Insufficient USDC balance. Have: {balance}, Need: {required_amount}")
            
            # Process payment using SDK
            payment_result = client.pay(
                publisher_address=payment_details['publisher_address'],
                amount_usdc=payment_details['price_usdc'],
                content_hash=payment_details.get('content_hash'),
                metadata={'url': target_url}
            )
            
            logger.info(f"Payment successful! Transaction: {payment_result.transaction_hash}")
            
            # Retry the request with payment proof
            headers = {
                'X-Payment-Transaction': payment_result.transaction_hash,
                'X-Payment-Amount': payment_details['price_usdc'],
                'X-Payer-Address': client.wallet_address
            }
            
            response = requests.get(target_url, headers=headers)
            
        # Process successful response
        if response.status_code == 200:
            logger.info("Content successfully retrieved!")
            content = response.text
            
            # Save or process the content
            with open('crawled_content.html', 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"Content saved to crawled_content.html ({len(content)} chars)")
            
            # Optional: Log the crawl activity on-chain
            if hasattr(client, 'log_crawl'):
                client.log_crawl(
                    url=target_url,
                    content_hash=payment_result.content_hash,
                    success=True
                )
            
            return content
            
        else:
            logger.error(f"Unexpected response code: {response.status_code}")
            logger.error(f"Response: {response.text}")
            
    except PaymentRequiredError as e:
        logger.error(f"Payment processing failed: {e}")
    except requests.RequestException as e:
        logger.error(f"Network error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        
    return None

# Advanced example with automatic retries and batch processing
def crawl_multiple_urls(urls, max_retries=3):
    """
    Crawl multiple URLs with automatic payment handling and retries
    """
    client = TachiClient(
        private_key='your-private-key-here',
        network='base-sepolia'
    )
    
    results = []
    
    for url in urls:
        for attempt in range(max_retries):
            try:
                logger.info(f"Crawling {url} (attempt {attempt + 1}/{max_retries})")
                
                # Use the SDK's built-in crawl method with automatic payment
                result = client.crawl(
                    url=url,
                    max_payment_usdc=1.0,  # Maximum we're willing to pay
                    timeout=30,
                    verify_payment=True
                )
                
                results.append({
                    'url': url,
                    'success': True,
                    'content_length': len(result.content),
                    'payment_amount': result.payment_amount,
                    'transaction_hash': result.transaction_hash
                })
                
                logger.info(f"Successfully crawled {url}")
                break
                
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed for {url}: {e}")
                if attempt == max_retries - 1:
                    results.append({
                        'url': url,
                        'success': False,
                        'error': str(e)
                    })
    
    return results

if __name__ == "__main__":
    # Single URL example
    content = main()
    
    # Batch processing example
    urls_to_crawl = [
        'https://site1.com/api/data',
        'https://site2.com/premium-content',
        'https://site3.com/research-papers'
    ]
    
    batch_results = crawl_multiple_urls(urls_to_crawl)
    
    # Print summary
    successful = sum(1 for r in batch_results if r['success'])
    total_cost = sum(r.get('payment_amount', 0) for r in batch_results if r['success'])
    
    print(f"\\nBatch Crawl Summary:")
    print(f"Successful: {successful}/{len(urls_to_crawl)}")
    print(f"Total Cost: {total_cost} USDC")
```

### JavaScript SDK Example

```javascript
import TachiSDK from '@tachi/sdk-js';
import fetch from 'node-fetch';

async function crawlWithPayment(url) {
    const client = new TachiSDK({
        privateKey: 'your-private-key',
        network: 'base-sepolia'
    });
    
    try {
        // Try initial request
        let response = await fetch(url);
        
        if (response.status === 402) {
            console.log('Payment required, processing...');
            
            const paymentDetails = await response.json();
            
            // Process payment
            const paymentResult = await client.pay({
                publisherAddress: paymentDetails.payment_details.publisher_address,
                amountUsdc: paymentDetails.payment_details.price_usdc
            });
            
            console.log(`Payment successful: ${paymentResult.transactionHash}`);
            
            // Retry with payment proof
            response = await fetch(url, {
                headers: {
                    'X-Payment-Transaction': paymentResult.transactionHash,
                    'X-Payment-Amount': paymentDetails.payment_details.price_usdc,
                    'X-Payer-Address': client.walletAddress
                }
            });
        }
        
        if (response.ok) {
            const content = await response.text();
            console.log('Content retrieved successfully');
            return content;
        }
        
    } catch (error) {
        console.error('Crawl failed:', error);
    }
}
```

## Deployment Guides

### Cloudflare Worker Deployment

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Configure wrangler.toml**:
   ```toml
   name = "tachi-protection"
   main = "src/index.js"
   compatibility_date = "2024-01-01"
   
   [env.production.vars]
   PUBLISHER_WALLET = "0x..."
   CRAWL_PRICE_USDC = "0.01"
   ```

3. **Deploy**:
   ```bash
   wrangler deploy --env production
   ```

### Dashboard Setup

The Tachi Dashboard provides a user-friendly interface for:
- Minting publisher licenses
- Generating Cloudflare Worker code
- Monitoring crawl activity and earnings
- Managing pricing settings

Access at: `https://dashboard.tachi.network`

## Support

- **Documentation**: [docs.tachi.network](https://docs.tachi.network)
- **GitHub**: [github.com/justin-graham/Tachi](https://github.com/justin-graham/Tachi)
- **Discord**: [discord.gg/tachi](https://discord.gg/tachi)
- **Email**: support@tachi.network

## License

MIT License - see LICENSE file for details.
