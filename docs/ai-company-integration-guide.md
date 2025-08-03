# AI Company Integration Guide

## Complete Setup Guide for AI Crawlers and Data Companies

This guide shows AI companies how to integrate with Tachi Protocol to access protected content through automated payments.

## Prerequisites

- **Base Network Wallet**: With USDC funds for payments
- **Development Environment**: Node.js 18+ or Python 3.8+
- **Gas Funds**: ETH for transaction fees (~0.01 ETH minimum)
- **API Keys**: For blockchain RPC access (optional, public RPCs available)

## Quick Start

### 1. Wallet Setup

```bash
# Generate a new wallet (if needed)
node -e "
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
"
```

### 2. Fund Your Wallet

**Base Sepolia (Testing)**:
- ETH: Use [Base Sepolia Faucet](https://bridge.base.org/deposit)
- USDC: Use [Circle Faucet](https://faucet.circle.com/)

**Base Mainnet (Production)**:
- ETH: Bridge from Ethereum mainnet
- USDC: Bridge from Ethereum or buy on Base

### 3. Install SDK

```bash
# Python
pip install tachi-sdk

# JavaScript/Node.js
npm install @tachi/sdk-js
```

## Python SDK Integration

### Basic Setup

```python
from tachi_sdk import TachiClient
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize client
client = TachiClient(
    private_key='your-private-key-here',
    network='base-sepolia',  # or 'base-mainnet'
    rpc_url='https://sepolia.base.org'  # optional
)

print(f"Wallet Address: {client.wallet_address}")
print(f"USDC Balance: {client.get_balance()} USDC")
```

### Complete Crawling Example

```python
import asyncio
from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime

@dataclass
class CrawlResult:
    url: str
    success: bool
    content: Optional[str] = None
    content_length: Optional[int] = None
    payment_amount: Optional[float] = None
    transaction_hash: Optional[str] = None
    error: Optional[str] = None
    timestamp: datetime = None

class TachiCrawler:
    def __init__(self, private_key: str, network: str = 'base-sepolia'):
        self.client = TachiClient(private_key=private_key, network=network)
        self.session = requests.Session()
        
    async def crawl_url(self, url: str, max_payment: float = 1.0) -> CrawlResult:
        """
        Crawl a single URL with automatic payment handling
        """
        timestamp = datetime.now()
        
        try:
            logger.info(f"Starting crawl: {url}")
            
            # Initial request
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                # Content is free/already accessible
                return CrawlResult(
                    url=url,
                    success=True,
                    content=response.text,
                    content_length=len(response.text),
                    payment_amount=0.0,
                    timestamp=timestamp
                )
                
            elif response.status_code == 402:
                # Payment required
                return await self._handle_payment_required(
                    url, response, max_payment, timestamp
                )
                
            else:
                return CrawlResult(
                    url=url,
                    success=False,
                    error=f"HTTP {response.status_code}: {response.text}",
                    timestamp=timestamp
                )
                
        except Exception as e:
            logger.error(f"Crawl failed for {url}: {e}")
            return CrawlResult(
                url=url,
                success=False,
                error=str(e),
                timestamp=timestamp
            )
    
    async def _handle_payment_required(
        self, 
        url: str, 
        response: requests.Response, 
        max_payment: float,
        timestamp: datetime
    ) -> CrawlResult:
        """
        Handle 402 Payment Required response
        """
        try:
            # Parse payment details
            payment_data = response.json()
            payment_details = payment_data.get('payment_details', {})
            
            publisher_address = payment_details.get('publisher_address')
            price_usdc = float(payment_details.get('price_usdc', 0))
            
            logger.info(f"Payment required: {price_usdc} USDC to {publisher_address}")
            
            # Check if we're willing to pay this amount
            if price_usdc > max_payment:
                return CrawlResult(
                    url=url,
                    success=False,
                    error=f"Price {price_usdc} USDC exceeds max payment {max_payment}",
                    timestamp=timestamp
                )
            
            # Check our balance
            balance = self.client.get_balance()
            if balance < price_usdc:
                return CrawlResult(
                    url=url,
                    success=False,
                    error=f"Insufficient balance: {balance} < {price_usdc}",
                    timestamp=timestamp
                )
            
            # Process payment
            logger.info("Processing payment...")
            payment_result = self.client.pay(
                publisher_address=publisher_address,
                amount_usdc=str(price_usdc),
                metadata={'url': url, 'timestamp': timestamp.isoformat()}
            )
            
            logger.info(f"Payment successful: {payment_result.transaction_hash}")
            
            # Retry request with payment proof
            headers = {
                'X-Payment-Transaction': payment_result.transaction_hash,
                'X-Payment-Amount': str(price_usdc),
                'X-Payer-Address': self.client.wallet_address
            }
            
            response = self.session.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return CrawlResult(
                    url=url,
                    success=True,
                    content=response.text,
                    content_length=len(response.text),
                    payment_amount=price_usdc,
                    transaction_hash=payment_result.transaction_hash,
                    timestamp=timestamp
                )
            else:
                return CrawlResult(
                    url=url,
                    success=False,
                    error=f"Access denied after payment: HTTP {response.status_code}",
                    payment_amount=price_usdc,
                    transaction_hash=payment_result.transaction_hash,
                    timestamp=timestamp
                )
                
        except Exception as e:
            logger.error(f"Payment processing failed: {e}")
            return CrawlResult(
                url=url,
                success=False,
                error=f"Payment failed: {str(e)}",
                timestamp=timestamp
            )
    
    async def crawl_batch(
        self, 
        urls: list[str], 
        max_payment: float = 1.0,
        max_concurrent: int = 5
    ) -> list[CrawlResult]:
        """
        Crawl multiple URLs concurrently with payment handling
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def crawl_with_semaphore(url):
            async with semaphore:
                return await self.crawl_url(url, max_payment)
        
        # Execute crawls concurrently
        tasks = [crawl_with_semaphore(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                final_results.append(CrawlResult(
                    url=urls[i],
                    success=False,
                    error=str(result),
                    timestamp=datetime.now()
                ))
            else:
                final_results.append(result)
        
        return final_results

# Usage Example
async def main():
    crawler = TachiCrawler(
        private_key='your-private-key-here',
        network='base-sepolia'
    )
    
    # Single URL crawl
    result = await crawler.crawl_url(
        'https://example.com/protected-api/data',
        max_payment=0.50  # Maximum $0.50 per request
    )
    
    print(f"Crawl Result: {result}")
    
    if result.success:
        print(f"Content Length: {result.content_length} characters")
        print(f"Cost: {result.payment_amount} USDC")
        
        # Save content
        with open(f'content_{datetime.now().strftime("%Y%m%d_%H%M%S")}.html', 'w') as f:
            f.write(result.content)
    
    # Batch crawling
    urls_to_crawl = [
        'https://site1.com/api/research',
        'https://site2.com/premium/articles',
        'https://site3.com/data/feed'
    ]
    
    batch_results = await crawler.crawl_batch(
        urls_to_crawl,
        max_payment=1.0,
        max_concurrent=3
    )
    
    # Summary
    successful = sum(1 for r in batch_results if r.success)
    total_cost = sum(r.payment_amount or 0 for r in batch_results)
    
    print(f"\\nBatch Results:")
    print(f"Successful: {successful}/{len(urls_to_crawl)}")
    print(f"Total Cost: {total_cost:.4f} USDC")

if __name__ == "__main__":
    asyncio.run(main())
```

### Advanced Features

```python
# Cost tracking and budgeting
class CrawlBudgetManager:
    def __init__(self, daily_budget: float = 100.0):
        self.daily_budget = daily_budget
        self.daily_spent = 0.0
        self.last_reset = datetime.now().date()
    
    def can_spend(self, amount: float) -> bool:
        self._reset_if_new_day()
        return (self.daily_spent + amount) <= self.daily_budget
    
    def record_spend(self, amount: float):
        self._reset_if_new_day()
        self.daily_spent += amount
    
    def _reset_if_new_day(self):
        today = datetime.now().date()
        if today > self.last_reset:
            self.daily_spent = 0.0
            self.last_reset = today

# Content analysis and filtering
def analyze_content_value(content: str, price: float) -> dict:
    """
    Analyze if content is worth the price
    """
    word_count = len(content.split())
    price_per_word = price / max(word_count, 1)
    
    # Simple quality indicators
    has_data_tables = '<table>' in content or 'data:' in content
    has_unique_insights = any(phrase in content.lower() for phrase in [
        'exclusive', 'breaking', 'analysis', 'research', 'study'
    ])
    
    return {
        'word_count': word_count,
        'price_per_word': price_per_word,
        'estimated_value': 'high' if price_per_word < 0.001 else 'medium' if price_per_word < 0.01 else 'low',
        'has_structured_data': has_data_tables,
        'has_unique_content': has_unique_insights,
        'worth_price': price_per_word < 0.01 and (has_data_tables or has_unique_insights)
    }
```

## JavaScript/Node.js SDK Integration

### Basic Setup

```javascript
import TachiSDK from '@tachi/sdk-js';
import fetch from 'node-fetch';

class TachiCrawler {
    constructor(privateKey, network = 'base-sepolia') {
        this.client = new TachiSDK({
            privateKey,
            network,
            rpcUrl: network === 'base-sepolia' 
                ? 'https://sepolia.base.org' 
                : 'https://mainnet.base.org'
        });
    }
    
    async crawlUrl(url, maxPayment = 1.0) {
        try {
            console.log(`Crawling: ${url}`);
            
            // Initial request
            let response = await fetch(url);
            
            if (response.status === 200) {
                const content = await response.text();
                return {
                    success: true,
                    content,
                    contentLength: content.length,
                    paymentAmount: 0
                };
            }
            
            if (response.status === 402) {
                // Handle payment
                const paymentData = await response.json();
                const { payment_details } = paymentData;
                
                const priceUsdc = parseFloat(payment_details.price_usdc);
                
                if (priceUsdc > maxPayment) {
                    throw new Error(`Price ${priceUsdc} exceeds max payment ${maxPayment}`);
                }
                
                // Check balance
                const balance = await this.client.getBalance();
                if (balance < priceUsdc) {
                    throw new Error(`Insufficient balance: ${balance} < ${priceUsdc}`);
                }
                
                // Process payment
                console.log(`Processing payment: ${priceUsdc} USDC`);
                const paymentResult = await this.client.pay({
                    publisherAddress: payment_details.publisher_address,
                    amountUsdc: payment_details.price_usdc,
                    metadata: { url, timestamp: new Date().toISOString() }
                });
                
                console.log(`Payment successful: ${paymentResult.transactionHash}`);
                
                // Retry with payment
                response = await fetch(url, {
                    headers: {
                        'X-Payment-Transaction': paymentResult.transactionHash,
                        'X-Payment-Amount': payment_details.price_usdc,
                        'X-Payer-Address': this.client.walletAddress
                    }
                });
                
                if (response.status === 200) {
                    const content = await response.text();
                    return {
                        success: true,
                        content,
                        contentLength: content.length,
                        paymentAmount: priceUsdc,
                        transactionHash: paymentResult.transactionHash
                    };
                }
            }
            
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            
        } catch (error) {
            console.error(`Crawl failed for ${url}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async crawlBatch(urls, maxPayment = 1.0, maxConcurrent = 5) {
        const results = [];
        
        // Process in batches to respect concurrency limits
        for (let i = 0; i < urls.length; i += maxConcurrent) {
            const batch = urls.slice(i, i + maxConcurrent);
            const batchPromises = batch.map(url => this.crawlUrl(url, maxPayment));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        
        return results;
    }
}

// Usage example
async function main() {
    const crawler = new TachiCrawler('your-private-key-here');
    
    const urls = [
        'https://example1.com/api/data',
        'https://example2.com/premium/content',
        'https://example3.com/research/papers'
    ];
    
    const results = await crawler.crawlBatch(urls, 0.50, 3);
    
    const successful = results.filter(r => r.success).length;
    const totalCost = results.reduce((sum, r) => sum + (r.paymentAmount || 0), 0);
    
    console.log(`Results: ${successful}/${urls.length} successful`);
    console.log(`Total cost: ${totalCost.toFixed(4)} USDC`);
    
    // Save successful results
    results.forEach((result, index) => {
        if (result.success) {
            const fs = require('fs');
            const filename = `content_${index}_${Date.now()}.html`;
            fs.writeFileSync(filename, result.content);
            console.log(`Saved ${filename} (${result.contentLength} chars)`);
        }
    });
}

// main().catch(console.error);
```

## Error Handling and Retry Logic

### Robust Error Handling

```python
from enum import Enum
import time
import random

class CrawlError(Exception):
    pass

class PaymentError(CrawlError):
    pass

class NetworkError(CrawlError):
    pass

class RateLimitError(CrawlError):
    pass

class RetryStrategy(Enum):
    EXPONENTIAL_BACKOFF = "exponential"
    LINEAR_BACKOFF = "linear"
    FIXED_DELAY = "fixed"

class RobustCrawler(TachiCrawler):
    def __init__(self, private_key: str, network: str = 'base-sepolia'):
        super().__init__(private_key, network)
        self.retry_config = {
            'max_retries': 3,
            'strategy': RetryStrategy.EXPONENTIAL_BACKOFF,
            'base_delay': 1.0,
            'max_delay': 60.0,
            'jitter': True
        }
    
    async def crawl_with_retry(self, url: str, max_payment: float = 1.0) -> CrawlResult:
        """
        Crawl with automatic retry logic
        """
        last_exception = None
        
        for attempt in range(self.retry_config['max_retries'] + 1):
            try:
                if attempt > 0:
                    delay = self._calculate_delay(attempt)
                    logger.info(f"Retrying {url} in {delay:.2f}s (attempt {attempt + 1})")
                    await asyncio.sleep(delay)
                
                return await self.crawl_url(url, max_payment)
                
            except RateLimitError as e:
                logger.warning(f"Rate limited for {url}: {e}")
                last_exception = e
                # Longer delay for rate limits
                await asyncio.sleep(60)
                
            except NetworkError as e:
                logger.warning(f"Network error for {url}: {e}")
                last_exception = e
                
            except PaymentError as e:
                logger.error(f"Payment error for {url}: {e}")
                # Don't retry payment errors
                return CrawlResult(
                    url=url,
                    success=False,
                    error=str(e),
                    timestamp=datetime.now()
                )
                
            except Exception as e:
                logger.error(f"Unexpected error for {url}: {e}")
                last_exception = e
        
        # All retries exhausted
        return CrawlResult(
            url=url,
            success=False,
            error=f"Failed after {self.retry_config['max_retries']} retries: {last_exception}",
            timestamp=datetime.now()
        )
    
    def _calculate_delay(self, attempt: int) -> float:
        """Calculate delay based on retry strategy"""
        strategy = self.retry_config['strategy']
        base_delay = self.retry_config['base_delay']
        max_delay = self.retry_config['max_delay']
        
        if strategy == RetryStrategy.EXPONENTIAL_BACKOFF:
            delay = base_delay * (2 ** (attempt - 1))
        elif strategy == RetryStrategy.LINEAR_BACKOFF:
            delay = base_delay * attempt
        else:  # FIXED_DELAY
            delay = base_delay
        
        delay = min(delay, max_delay)
        
        # Add jitter to prevent thundering herd
        if self.retry_config['jitter']:
            delay += random.uniform(0, delay * 0.1)
        
        return delay
```

## Rate Limiting and Respect

### Respectful Crawling

```python
import asyncio
from collections import defaultdict
from datetime import datetime, timedelta

class RespectfulCrawler(RobustCrawler):
    def __init__(self, private_key: str, network: str = 'base-sepolia'):
        super().__init__(private_key, network)
        self.domain_delays = defaultdict(lambda: 1.0)  # seconds between requests per domain
        self.last_request_time = defaultdict(lambda: datetime.min)
        self.domain_budgets = defaultdict(lambda: 10.0)  # max USDC per domain per day
        self.domain_daily_spend = defaultdict(float)
        self.domain_reset_dates = defaultdict(lambda: datetime.now().date())
    
    async def crawl_respectfully(self, url: str, max_payment: float = 1.0) -> CrawlResult:
        """
        Crawl with domain-specific rate limiting and budget management
        """
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        
        # Check daily budget
        self._reset_daily_budget_if_needed(domain)
        if self.domain_daily_spend[domain] + max_payment > self.domain_budgets[domain]:
            return CrawlResult(
                url=url,
                success=False,
                error=f"Daily budget exceeded for {domain}",
                timestamp=datetime.now()
            )
        
        # Respect rate limits
        time_since_last = datetime.now() - self.last_request_time[domain]
        required_delay = self.domain_delays[domain]
        
        if time_since_last.total_seconds() < required_delay:
            wait_time = required_delay - time_since_last.total_seconds()
            logger.info(f"Rate limiting: waiting {wait_time:.2f}s for {domain}")
            await asyncio.sleep(wait_time)
        
        self.last_request_time[domain] = datetime.now()
        
        # Perform crawl
        result = await self.crawl_with_retry(url, max_payment)
        
        # Update spending tracking
        if result.success and result.payment_amount:
            self.domain_daily_spend[domain] += result.payment_amount
        
        # Adjust rate limits based on response
        await self._adjust_rate_limits(domain, result)
        
        return result
    
    async def _adjust_rate_limits(self, domain: str, result: CrawlResult):
        """
        Dynamically adjust rate limits based on server responses
        """
        if not result.success:
            if "rate limit" in result.error.lower() or "429" in result.error:
                # Increase delay for rate limited domains
                self.domain_delays[domain] = min(
                    self.domain_delays[domain] * 2,
                    30.0  # Max 30 seconds between requests
                )
                logger.info(f"Increased delay for {domain} to {self.domain_delays[domain]}s")
            elif "timeout" in result.error.lower():
                # Slight increase for timeouts
                self.domain_delays[domain] = min(
                    self.domain_delays[domain] * 1.5,
                    30.0
                )
        else:
            # Successful request - can potentially decrease delay
            if self.domain_delays[domain] > 1.0:
                self.domain_delays[domain] = max(
                    self.domain_delays[domain] * 0.9,
                    1.0  # Min 1 second between requests
                )
    
    def _reset_daily_budget_if_needed(self, domain: str):
        """Reset daily spending if it's a new day"""
        today = datetime.now().date()
        if today > self.domain_reset_dates[domain]:
            self.domain_daily_spend[domain] = 0.0
            self.domain_reset_dates[domain] = today
```

## Cost Optimization Strategies

### Smart Payment Decisions

```python
class CostOptimizedCrawler(RespectfulCrawler):
    def __init__(self, private_key: str, network: str = 'base-sepolia'):
        super().__init__(private_key, network)
        self.content_cache = {}  # URL -> (content, expiry_time)
        self.price_history = defaultdict(list)  # domain -> [prices]
        self.content_value_threshold = 0.01  # min dollars per 1000 characters
    
    async def crawl_optimized(self, url: str, max_payment: float = 1.0) -> CrawlResult:
        """
        Crawl with cost optimization strategies
        """
        # Check cache first
        cached_content = self._get_cached_content(url)
        if cached_content:
            logger.info(f"Returning cached content for {url}")
            return CrawlResult(
                url=url,
                success=True,
                content=cached_content,
                content_length=len(cached_content),
                payment_amount=0.0,
                timestamp=datetime.now()
            )
        
        # Get price estimate first
        price_estimate = await self._estimate_price(url)
        if price_estimate and price_estimate > max_payment:
            return CrawlResult(
                url=url,
                success=False,
                error=f"Estimated price {price_estimate} exceeds max payment {max_payment}",
                timestamp=datetime.now()
            )
        
        # Perform crawl
        result = await self.crawl_respectfully(url, max_payment)
        
        # Analyze value and cache if worthwhile
        if result.success:
            self._analyze_and_cache(url, result)
            self._update_price_history(url, result.payment_amount)
        
        return result
    
    def _get_cached_content(self, url: str) -> Optional[str]:
        """Get cached content if still valid"""
        if url in self.content_cache:
            content, expiry = self.content_cache[url]
            if datetime.now() < expiry:
                return content
            else:
                del self.content_cache[url]
        return None
    
    def _analyze_and_cache(self, url: str, result: CrawlResult):
        """Analyze content value and cache if worthwhile"""
        if not result.content or not result.payment_amount:
            return
        
        # Calculate value metrics
        chars_per_dollar = result.content_length / result.payment_amount
        value_score = chars_per_dollar / 1000  # chars per dollar per 1000 chars
        
        # Cache high-value content for longer
        if value_score >= self.content_value_threshold:
            cache_hours = min(24, int(value_score * 12))  # Up to 24 hours
            expiry = datetime.now() + timedelta(hours=cache_hours)
            self.content_cache[url] = (result.content, expiry)
            logger.info(f"Cached {url} for {cache_hours} hours (value score: {value_score:.3f})")
    
    async def _estimate_price(self, url: str) -> Optional[float]:
        """Estimate price based on domain history"""
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        
        prices = self.price_history[domain]
        if prices:
            # Return median price from last 10 requests
            recent_prices = prices[-10:]
            return sorted(recent_prices)[len(recent_prices) // 2]
        
        return None
    
    def _update_price_history(self, url: str, price: Optional[float]):
        """Update price history for domain"""
        if price is None:
            return
        
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        
        self.price_history[domain].append(price)
        
        # Keep only last 50 prices per domain
        if len(self.price_history[domain]) > 50:
            self.price_history[domain] = self.price_history[domain][-50:]
```

## Integration with Popular Frameworks

### Scrapy Integration

```python
import scrapy
from scrapy import Request
from scrapy.http import Response

class TachiSpider(scrapy.Spider):
    name = 'tachi_spider'
    
    def __init__(self, private_key: str, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.crawler = CostOptimizedCrawler(private_key)
        self.max_payment_per_request = 1.0
    
    async def parse(self, response: Response):
        # Extract URLs to crawl
        urls = response.css('a::attr(href)').getall()
        
        for url in urls:
            if self.should_crawl_url(url):
                yield Request(
                    url=url,
                    callback=self.parse_with_payment,
                    meta={'tachi_max_payment': self.max_payment_per_request}
                )
    
    async def parse_with_payment(self, response: Response):
        """Parse response with Tachi payment handling"""
        url = response.url
        max_payment = response.meta.get('tachi_max_payment', 1.0)
        
        # Use Tachi crawler for protected content
        result = await self.crawler.crawl_optimized(url, max_payment)
        
        if result.success:
            # Create new response object with paid content
            paid_response = Response(
                url=url,
                body=result.content.encode('utf-8'),
                encoding='utf-8'
            )
            
            # Extract data from paid content
            yield self.extract_data(paid_response, result)
        else:
            self.logger.warning(f"Failed to access {url}: {result.error}")
    
    def extract_data(self, response: Response, crawl_result: CrawlResult):
        """Extract structured data from the response"""
        return {
            'url': response.url,
            'title': response.css('title::text').get(),
            'content': response.text,
            'payment_amount': crawl_result.payment_amount,
            'timestamp': crawl_result.timestamp.isoformat(),
            'word_count': len(response.text.split())
        }
    
    def should_crawl_url(self, url: str) -> bool:
        """Determine if URL is worth crawling"""
        # Add your logic here
        return any(keyword in url for keyword in [
            '/api/', '/premium/', '/research/', '/data/'
        ])
```

### BeautifulSoup Integration

```python
from bs4 import BeautifulSoup
import requests

class TachiScraper:
    def __init__(self, private_key: str):
        self.crawler = CostOptimizedCrawler(private_key)
    
    async def scrape_with_payment(self, url: str, max_payment: float = 1.0):
        """
        Scrape a URL with automatic payment handling
        """
        result = await self.crawler.crawl_optimized(url, max_payment)
        
        if not result.success:
            raise Exception(f"Failed to access {url}: {result.error}")
        
        soup = BeautifulSoup(result.content, 'html.parser')
        
        return {
            'soup': soup,
            'raw_content': result.content,
            'payment_info': {
                'amount': result.payment_amount,
                'transaction': result.transaction_hash
            },
            'metadata': {
                'url': url,
                'content_length': result.content_length,
                'timestamp': result.timestamp
            }
        }
    
    async def extract_articles(self, base_url: str, max_payment_per_article: float = 0.10):
        """
        Extract multiple articles from a site
        """
        # Get the main page (usually free)
        main_result = await self.crawler.crawl_optimized(base_url, 0.01)
        if not main_result.success:
            return []
        
        soup = BeautifulSoup(main_result.content, 'html.parser')
        
        # Find article links
        article_links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            if any(indicator in href for indicator in ['/article/', '/post/', '/blog/']):
                if not href.startswith('http'):
                    href = urljoin(base_url, href)
                article_links.append(href)
        
        # Scrape each article
        articles = []
        for link in article_links[:10]:  # Limit to prevent excessive costs
            try:
                article_data = await self.scrape_with_payment(link, max_payment_per_article)
                
                # Extract article content
                soup = article_data['soup']
                article = {
                    'url': link,
                    'title': soup.find('h1').get_text(strip=True) if soup.find('h1') else 'No title',
                    'content': soup.get_text(strip=True),
                    'payment_amount': article_data['payment_info']['amount'],
                    'timestamp': article_data['metadata']['timestamp']
                }
                
                articles.append(article)
                
            except Exception as e:
                self.logger.warning(f"Failed to scrape {link}: {e}")
        
        return articles
```

## Monitoring and Analytics

### Performance Tracking

```python
import json
from datetime import datetime, timedelta
from collections import defaultdict

class CrawlAnalytics:
    def __init__(self):
        self.stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'total_cost': 0.0,
            'domains': defaultdict(lambda: {
                'requests': 0,
                'successful': 0,
                'cost': 0.0,
                'avg_price': 0.0
            }),
            'daily_stats': defaultdict(lambda: {
                'requests': 0,
                'cost': 0.0
            })
        }
    
    def record_request(self, result: CrawlResult):
        """Record crawl result for analytics"""
        from urllib.parse import urlparse
        domain = urlparse(result.url).netloc
        today = result.timestamp.date().isoformat()
        
        # Update global stats
        self.stats['total_requests'] += 1
        if result.success:
            self.stats['successful_requests'] += 1
        if result.payment_amount:
            self.stats['total_cost'] += result.payment_amount
        
        # Update domain stats
        domain_stats = self.stats['domains'][domain]
        domain_stats['requests'] += 1
        if result.success:
            domain_stats['successful'] += 1
        if result.payment_amount:
            domain_stats['cost'] += result.payment_amount
            domain_stats['avg_price'] = domain_stats['cost'] / domain_stats['successful']
        
        # Update daily stats
        day_stats = self.stats['daily_stats'][today]
        day_stats['requests'] += 1
        if result.payment_amount:
            day_stats['cost'] += result.payment_amount
    
    def generate_report(self) -> dict:
        """Generate comprehensive analytics report"""
        success_rate = (self.stats['successful_requests'] / max(self.stats['total_requests'], 1)) * 100
        avg_cost_per_request = self.stats['total_cost'] / max(self.stats['successful_requests'], 1)
        
        # Top domains by cost
        top_domains = sorted(
            self.stats['domains'].items(),
            key=lambda x: x[1]['cost'],
            reverse=True
        )[:10]
        
        # Recent daily stats
        recent_days = sorted(
            [(k, v) for k, v in self.stats['daily_stats'].items()],
            key=lambda x: x[0],
            reverse=True
        )[:7]
        
        return {
            'summary': {
                'total_requests': self.stats['total_requests'],
                'success_rate': f"{success_rate:.1f}%",
                'total_cost': f"${self.stats['total_cost']:.4f}",
                'avg_cost_per_request': f"${avg_cost_per_request:.4f}"
            },
            'top_domains': [
                {
                    'domain': domain,
                    'requests': stats['requests'],
                    'success_rate': f"{(stats['successful']/max(stats['requests'],1)*100):.1f}%",
                    'total_cost': f"${stats['cost']:.4f}",
                    'avg_price': f"${stats['avg_price']:.4f}"
                }
                for domain, stats in top_domains
            ],
            'recent_activity': [
                {
                    'date': date,
                    'requests': stats['requests'],
                    'cost': f"${stats['cost']:.4f}"
                }
                for date, stats in recent_days
            ]
        }
    
    def save_report(self, filename: str = None):
        """Save analytics report to file"""
        if not filename:
            filename = f"crawl_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        report = self.generate_report()
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"Report saved to {filename}")
        return filename

# Usage in crawler
class AnalyticsCrawler(CostOptimizedCrawler):
    def __init__(self, private_key: str, network: str = 'base-sepolia'):
        super().__init__(private_key, network)
        self.analytics = CrawlAnalytics()
    
    async def crawl_with_analytics(self, url: str, max_payment: float = 1.0) -> CrawlResult:
        """Crawl with automatic analytics recording"""
        result = await self.crawl_optimized(url, max_payment)
        self.analytics.record_request(result)
        return result
    
    def print_stats(self):
        """Print current statistics"""
        report = self.analytics.generate_report()
        
        print("\\n📊 Crawl Statistics")
        print("=" * 50)
        print(f"Total Requests: {report['summary']['total_requests']}")
        print(f"Success Rate: {report['summary']['success_rate']}")
        print(f"Total Cost: {report['summary']['total_cost']}")
        print(f"Avg Cost/Request: {report['summary']['avg_cost_per_request']}")
        
        if report['top_domains']:
            print("\\n🏆 Top Domains by Cost:")
            for domain_info in report['top_domains'][:5]:
                print(f"  {domain_info['domain']}: {domain_info['total_cost']} ({domain_info['requests']} requests)")
```

## Production Best Practices

### Security and Key Management

```python
import os
from cryptography.fernet import Fernet

class SecureKeyManager:
    def __init__(self, key_file: str = '.tachi_key'):
        self.key_file = key_file
        self._ensure_key_file()
    
    def _ensure_key_file(self):
        """Ensure encrypted key file exists"""
        if not os.path.exists(self.key_file):
            # Generate encryption key
            key = Fernet.generate_key()
            with open(f"{self.key_file}.key", 'wb') as f:
                f.write(key)
            print(f"Generated new encryption key: {self.key_file}.key")
            print("Store this key securely and add to .gitignore")
    
    def store_private_key(self, private_key: str, password: str):
        """Store private key encrypted"""
        with open(f"{self.key_file}.key", 'rb') as f:
            key = f.read()
        
        fernet = Fernet(key)
        encrypted_key = fernet.encrypt(private_key.encode())
        
        with open(self.key_file, 'wb') as f:
            f.write(encrypted_key)
    
    def load_private_key(self, password: str) -> str:
        """Load and decrypt private key"""
        with open(f"{self.key_file}.key", 'rb') as f:
            key = f.read()
        
        fernet = Fernet(key)
        
        with open(self.key_file, 'rb') as f:
            encrypted_key = f.read()
        
        return fernet.decrypt(encrypted_key).decode()

# Environment-based configuration
class CrawlerConfig:
    def __init__(self):
        self.private_key = os.getenv('TACHI_PRIVATE_KEY')
        self.network = os.getenv('TACHI_NETWORK', 'base-sepolia')
        self.max_daily_budget = float(os.getenv('TACHI_DAILY_BUDGET', '100.0'))
        self.max_payment_per_request = float(os.getenv('TACHI_MAX_PAYMENT', '1.0'))
        self.rpc_url = os.getenv('TACHI_RPC_URL')
        
        if not self.private_key:
            raise ValueError("TACHI_PRIVATE_KEY environment variable required")

# Production crawler with all features
class ProductionCrawler(AnalyticsCrawler):
    def __init__(self, config: CrawlerConfig):
        super().__init__(config.private_key, config.network)
        self.config = config
        self.daily_budget = config.max_daily_budget
        self.daily_spent = 0.0
        self.last_budget_reset = datetime.now().date()
    
    async def crawl_production(self, url: str) -> CrawlResult:
        """Production crawl with all safety checks"""
        # Check daily budget
        self._reset_budget_if_needed()
        if self.daily_spent >= self.daily_budget:
            return CrawlResult(
                url=url,
                success=False,
                error="Daily budget exceeded",
                timestamp=datetime.now()
            )
        
        # Determine max payment for this request
        remaining_budget = self.daily_budget - self.daily_spent
        max_payment = min(
            self.config.max_payment_per_request,
            remaining_budget
        )
        
        if max_payment <= 0:
            return CrawlResult(
                url=url,
                success=False,
                error="No budget remaining",
                timestamp=datetime.now()
            )
        
        # Perform crawl
        result = await self.crawl_with_analytics(url, max_payment)
        
        # Update budget tracking
        if result.payment_amount:
            self.daily_spent += result.payment_amount
        
        return result
    
    def _reset_budget_if_needed(self):
        """Reset daily budget if it's a new day"""
        today = datetime.now().date()
        if today > self.last_budget_reset:
            self.daily_spent = 0.0
            self.last_budget_reset = today
            logger.info(f"Reset daily budget: ${self.daily_budget}")
```

## Support and Resources

- **SDK Documentation**: [docs.tachi.network/sdk](https://docs.tachi.network/sdk)
- **API Reference**: [docs.tachi.network/api](https://docs.tachi.network/api)
- **GitHub Repository**: [github.com/justin-graham/Tachi](https://github.com/justin-graham/Tachi)
- **Discord Community**: [discord.gg/tachi](https://discord.gg/tachi)
- **Technical Support**: support@tachi.network

## Next Steps

1. **Start with Testnet**: Use Base Sepolia for testing and development
2. **Implement Gradual Rollout**: Start with small budgets and scale up
3. **Monitor Performance**: Use analytics to optimize costs and success rates
4. **Join Community**: Connect with other AI companies using Tachi
5. **Production Deployment**: Move to Base Mainnet when ready
