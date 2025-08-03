# Integration Examples

## Complete Code Examples for Tachi Protocol Integration

This document provides comprehensive, production-ready examples for integrating with Tachi Protocol from both publisher and AI company perspectives.

## Table of Contents

- [Python SDK Examples](#python-sdk-examples)
- [JavaScript SDK Examples](#javascript-sdk-examples)  
- [Publisher Integration Examples](#publisher-integration-examples)
- [Advanced Use Cases](#advanced-use-cases)
- [Production Patterns](#production-patterns)

---

## Python SDK Examples

### Using the Tachi Python SDK - Example

Here's a comprehensive example showing an AI crawler catching a 402 error, paying via the SDK, and then retrieving the content successfully:

```python
import asyncio
import logging
import requests
from datetime import datetime
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from tachi_sdk import TachiClient, PaymentRequiredError, InsufficientFundsError

# Configure logging for better debugging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class CrawlResult:
    """Result of a crawl operation"""
    url: str
    success: bool
    content: Optional[str] = None
    content_length: Optional[int] = None
    payment_amount: Optional[float] = None
    transaction_hash: Optional[str] = None
    error: Optional[str] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class IntelligentCrawler:
    """
    AI Crawler with intelligent payment handling and content retrieval
    """
    
    def __init__(self, private_key: str, network: str = 'base-sepolia'):
        """
        Initialize the crawler with Tachi SDK
        
        Args:
            private_key: Wallet private key for payments
            network: 'base-sepolia' for testing, 'base-mainnet' for production
        """
        self.client = TachiClient(
            private_key=private_key,
            network=network,
            rpc_url='https://sepolia.base.org' if network == 'base-sepolia' else 'https://mainnet.base.org'
        )
        self.session = requests.Session()
        
        # Configure session for better performance
        self.session.headers.update({
            'User-Agent': 'TachiBot/1.0 (AI Content Crawler)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        })
        
        logger.info(f"🤖 Crawler initialized for wallet: {self.client.wallet_address}")
        logger.info(f"💰 Current USDC balance: {self.client.get_balance()} USDC")
    
    async def crawl_with_payment_handling(
        self, 
        url: str, 
        max_payment: float = 1.0,
        timeout: int = 30
    ) -> CrawlResult:
        """
        Crawl a URL with automatic 402 error handling and payment processing
        
        This is the core example showing the complete flow:
        1. Attempt to access content
        2. Catch 402 Payment Required error
        3. Process payment via Tachi SDK
        4. Retry request with payment proof
        5. Return content successfully
        
        Args:
            url: Target URL to crawl
            max_payment: Maximum USDC willing to pay
            timeout: Request timeout in seconds
            
        Returns:
            CrawlResult with success status and content or error details
        """
        logger.info(f"🎯 Starting crawl: {url}")
        
        try:
            # Step 1: Initial content request
            logger.info("📡 Attempting initial content access...")
            response = self.session.get(url, timeout=timeout)
            
            # Step 2: Check response status
            if response.status_code == 200:
                # Content is freely accessible
                logger.info("✅ Content accessible without payment")
                return CrawlResult(
                    url=url,
                    success=True,
                    content=response.text,
                    content_length=len(response.text),
                    payment_amount=0.0
                )
            
            elif response.status_code == 402:
                # Payment Required - This is where the magic happens!
                logger.info("💳 Payment required - processing payment...")
                return await self._handle_payment_required(
                    url, response, max_payment, timeout
                )
            
            else:
                # Other HTTP error
                error_msg = f"HTTP {response.status_code}: {response.text[:200]}"
                logger.error(f"❌ Unexpected response: {error_msg}")
                return CrawlResult(
                    url=url,
                    success=False,
                    error=error_msg
                )
        
        except requests.RequestException as e:
            logger.error(f"🌐 Network error for {url}: {e}")
            return CrawlResult(
                url=url,
                success=False,
                error=f"Network error: {str(e)}"
            )
        
        except Exception as e:
            logger.error(f"💥 Unexpected error for {url}: {e}")
            return CrawlResult(
                url=url,
                success=False,
                error=f"Unexpected error: {str(e)}"
            )
    
    async def _handle_payment_required(
        self,
        url: str,
        response: requests.Response,
        max_payment: float,
        timeout: int
    ) -> CrawlResult:
        """
        Handle 402 Payment Required response
        
        This demonstrates the complete payment flow:
        1. Parse payment details from 402 response
        2. Validate payment amount against budget
        3. Check wallet balance
        4. Process payment using Tachi SDK
        5. Retry original request with payment proof
        6. Return content or payment error
        """
        try:
            # Step 1: Parse payment details from 402 response
            logger.info("📋 Parsing payment details from 402 response...")
            payment_data = response.json()
            payment_details = payment_data.get('payment_details', {})
            
            publisher_address = payment_details.get('publisher_address')
            price_usdc = float(payment_details.get('price_usdc', 0))
            payment_processor = payment_details.get('payment_processor')
            chain_id = payment_details.get('chain_id')
            
            logger.info(f"💰 Payment required: {price_usdc} USDC")
            logger.info(f"📍 Publisher: {publisher_address}")
            logger.info(f"🏭 Payment processor: {payment_processor}")
            logger.info(f"⛓️  Chain ID: {chain_id}")
            
            # Step 2: Validate payment amount against our budget
            if price_usdc > max_payment:
                error_msg = f"Price {price_usdc} USDC exceeds maximum budget {max_payment} USDC"
                logger.warning(f"💸 {error_msg}")
                return CrawlResult(
                    url=url,
                    success=False,
                    error=error_msg
                )
            
            # Step 3: Check our wallet balance
            logger.info("🏦 Checking wallet balance...")
            current_balance = self.client.get_balance()
            logger.info(f"💰 Current balance: {current_balance} USDC")
            
            if current_balance < price_usdc:
                error_msg = f"Insufficient USDC balance: {current_balance} < {price_usdc}"
                logger.error(f"💸 {error_msg}")
                return CrawlResult(
                    url=url,
                    success=False,
                    error=error_msg
                )
            
            # Step 4: Process payment using Tachi SDK
            logger.info("🔄 Processing payment through Tachi SDK...")
            payment_result = self.client.pay(
                publisher_address=publisher_address,
                amount_usdc=str(price_usdc),
                metadata={
                    'url': url,
                    'timestamp': datetime.now().isoformat(),
                    'crawler_id': 'intelligent_crawler_v1.0'
                }
            )
            
            logger.info(f"✅ Payment successful!")
            logger.info(f"📝 Transaction hash: {payment_result.transaction_hash}")
            logger.info(f"🧾 Block number: {payment_result.block_number}")
            logger.info(f"⛽ Gas used: {payment_result.gas_used}")
            
            # Step 5: Retry original request with payment proof
            logger.info("🔄 Retrying request with payment proof...")
            headers = {
                'X-Payment-Transaction': payment_result.transaction_hash,
                'X-Payment-Amount': str(price_usdc),
                'X-Payer-Address': self.client.wallet_address,
                'X-Payment-Timestamp': datetime.now().isoformat()
            }
            
            # Add our session headers
            headers.update(self.session.headers)
            
            # Make the authenticated request
            authenticated_response = self.session.get(
                url, 
                headers=headers, 
                timeout=timeout
            )
            
            # Step 6: Process the authenticated response
            if authenticated_response.status_code == 200:
                logger.info("🎉 Content successfully retrieved after payment!")
                content = authenticated_response.text
                
                # Log successful access
                logger.info(f"📄 Content length: {len(content)} characters")
                logger.info(f"💲 Total cost: {price_usdc} USDC")
                
                # Optional: Log the crawl activity on-chain
                try:
                    log_result = self.client.log_crawl(
                        url=url,
                        content_hash=f"sha256:{hash(content)}",
                        success=True
                    )
                    logger.info(f"📝 Crawl logged on-chain: {log_result.transaction_hash}")
                except Exception as log_error:
                    logger.warning(f"⚠️  Failed to log crawl on-chain: {log_error}")
                
                return CrawlResult(
                    url=url,
                    success=True,
                    content=content,
                    content_length=len(content),
                    payment_amount=price_usdc,
                    transaction_hash=payment_result.transaction_hash
                )
            
            else:
                # Payment was processed but access still denied
                error_msg = f"Access denied after payment: HTTP {authenticated_response.status_code}"
                logger.error(f"❌ {error_msg}")
                logger.error(f"Response: {authenticated_response.text[:200]}")
                
                return CrawlResult(
                    url=url,
                    success=False,
                    error=error_msg,
                    payment_amount=price_usdc,
                    transaction_hash=payment_result.transaction_hash
                )
        
        except PaymentRequiredError as e:
            logger.error(f"💳 Payment processing failed: {e}")
            return CrawlResult(
                url=url,
                success=False,
                error=f"Payment processing failed: {str(e)}"
            )
        
        except InsufficientFundsError as e:
            logger.error(f"💸 Insufficient funds: {e}")
            return CrawlResult(
                url=url,
                success=False,
                error=f"Insufficient funds: {str(e)}"
            )
        
        except Exception as e:
            logger.error(f"💥 Payment handling error: {e}")
            return CrawlResult(
                url=url,
                success=False,
                error=f"Payment handling error: {str(e)}"
            )
    
    async def batch_crawl_with_budget_management(
        self,
        urls: List[str],
        total_budget: float = 10.0,
        max_payment_per_url: float = 1.0,
        max_concurrent: int = 3
    ) -> List[CrawlResult]:
        """
        Crawl multiple URLs with intelligent budget management
        
        This example shows advanced budget management across multiple crawls
        """
        logger.info(f"🚀 Starting batch crawl of {len(urls)} URLs")
        logger.info(f"💰 Total budget: {total_budget} USDC")
        logger.info(f"🎯 Max per URL: {max_payment_per_url} USDC")
        
        results = []
        total_spent = 0.0
        
        # Use semaphore to limit concurrent requests
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def crawl_with_budget_check(url: str) -> CrawlResult:
            nonlocal total_spent
            
            async with semaphore:
                # Check if we have budget remaining
                remaining_budget = total_budget - total_spent
                if remaining_budget <= 0:
                    return CrawlResult(
                        url=url,
                        success=False,
                        error="Total budget exhausted"
                    )
                
                # Adjust max payment based on remaining budget
                max_payment = min(max_payment_per_url, remaining_budget)
                
                # Perform the crawl
                result = await self.crawl_with_payment_handling(url, max_payment)
                
                # Update spent amount
                if result.payment_amount:
                    total_spent += result.payment_amount
                    logger.info(f"💰 Spent: {result.payment_amount} USDC, Total: {total_spent}/{total_budget} USDC")
                
                return result
        
        # Execute crawls with controlled concurrency
        tasks = [crawl_with_budget_check(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions that occurred
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                final_results.append(CrawlResult(
                    url=urls[i],
                    success=False,
                    error=f"Exception: {str(result)}"
                ))
            else:
                final_results.append(result)
        
        # Print summary
        successful = sum(1 for r in final_results if r.success)
        total_cost = sum(r.payment_amount or 0 for r in final_results)
        
        logger.info(f"📊 Batch crawl summary:")
        logger.info(f"✅ Successful: {successful}/{len(urls)}")
        logger.info(f"💰 Total cost: {total_cost:.4f} USDC")
        logger.info(f"📊 Average cost per success: {total_cost/max(successful, 1):.4f} USDC")
        
        return final_results

# Example usage demonstrating the complete flow
async def main():
    """
    Main example showing complete AI crawler integration with Tachi Protocol
    """
    # Initialize crawler with your wallet private key
    crawler = IntelligentCrawler(
        private_key='your-private-key-here',  # Replace with your actual private key
        network='base-sepolia'  # Use 'base-mainnet' for production
    )
    
    print("🤖 Tachi Protocol AI Crawler Example")
    print("=" * 50)
    
    # Example 1: Single URL crawl with payment handling
    print("\n📖 Example 1: Single URL Crawl")
    print("-" * 30)
    
    target_url = 'https://example-publisher.com/premium-api/research-data'
    
    print(f"🎯 Target URL: {target_url}")
    print("📡 Attempting to crawl...")
    
    result = await crawler.crawl_with_payment_handling(
        url=target_url,
        max_payment=0.50,  # Willing to pay up to $0.50
        timeout=30
    )
    
    if result.success:
        print(f"✅ SUCCESS! Content retrieved successfully")
        print(f"📄 Content length: {result.content_length} characters")
        print(f"💰 Cost: ${result.payment_amount:.4f} USDC")
        print(f"🧾 Transaction: {result.transaction_hash}")
        
        # Save content to file
        filename = f"crawled_content_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(result.content)
        print(f"💾 Content saved to: {filename}")
        
    else:
        print(f"❌ FAILED: {result.error}")
    
    # Example 2: Batch crawling with budget management
    print("\n📚 Example 2: Batch Crawl with Budget Management")
    print("-" * 50)
    
    urls_to_crawl = [
        'https://site1.com/api/market-data',
        'https://site2.com/premium/research-reports',
        'https://site3.com/exclusive/industry-analysis',
        'https://site4.com/data/economic-indicators',
        'https://site5.com/premium/financial-news'
    ]
    
    print(f"🎯 Crawling {len(urls_to_crawl)} URLs with budget management")
    
    batch_results = await crawler.batch_crawl_with_budget_management(
        urls=urls_to_crawl,
        total_budget=5.0,  # Total budget of $5.00
        max_payment_per_url=1.0,  # Max $1.00 per URL
        max_concurrent=2  # 2 concurrent requests
    )
    
    # Analyze results
    successful_crawls = [r for r in batch_results if r.success]
    failed_crawls = [r for r in batch_results if not r.success]
    total_spent = sum(r.payment_amount or 0 for r in batch_results)
    
    print(f"\n📊 Batch Results Summary:")
    print(f"✅ Successful crawls: {len(successful_crawls)}")
    print(f"❌ Failed crawls: {len(failed_crawls)}")
    print(f"💰 Total spent: ${total_spent:.4f} USDC")
    
    if successful_crawls:
        avg_cost = total_spent / len(successful_crawls)
        total_content = sum(r.content_length or 0 for r in successful_crawls)
        print(f"📊 Average cost per success: ${avg_cost:.4f}")
        print(f"📄 Total content retrieved: {total_content:,} characters")
        
        # Save successful content
        for i, result in enumerate(successful_crawls):
            filename = f"batch_content_{i+1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(f"<!-- URL: {result.url} -->\n")
                f.write(f"<!-- Cost: ${result.payment_amount:.4f} USDC -->\n")
                f.write(f"<!-- Transaction: {result.transaction_hash} -->\n\n")
                f.write(result.content)
            print(f"💾 Saved: {filename}")
    
    if failed_crawls:
        print(f"\n❌ Failed crawls:")
        for result in failed_crawls:
            print(f"  • {result.url}: {result.error}")
    
    # Example 3: Real-time cost tracking
    print("\n💰 Example 3: Cost Tracking and Analytics")
    print("-" * 40)
    
    # Check final balance
    final_balance = crawler.client.get_balance()
    print(f"💰 Final USDC balance: {final_balance:.4f} USDC")
    
    # Calculate session statistics
    all_results = [result] + batch_results
    session_cost = sum(r.payment_amount or 0 for r in all_results if r.success)
    session_successes = sum(1 for r in all_results if r.success)
    
    print(f"📊 Session Statistics:")
    print(f"  • Total requests: {len(all_results)}")
    print(f"  • Successful: {session_successes}")
    print(f"  • Total cost: ${session_cost:.4f} USDC")
    print(f"  • Success rate: {session_successes/len(all_results)*100:.1f}%")
    
    if session_successes > 0:
        avg_cost_per_success = session_cost / session_successes
        print(f"  • Average cost per success: ${avg_cost_per_success:.4f} USDC")

# Advanced example: Production-ready crawler with error handling and retry logic
class ProductionCrawler(IntelligentCrawler):
    """
    Production-ready crawler with advanced features:
    - Intelligent retry logic
    - Rate limiting
    - Content caching
    - Performance monitoring
    """
    
    def __init__(self, private_key: str, network: str = 'base-sepolia'):
        super().__init__(private_key, network)
        self.retry_config = {
            'max_retries': 3,
            'base_delay': 1.0,
            'backoff_multiplier': 2.0,
            'max_delay': 30.0
        }
        self.content_cache = {}  # Simple in-memory cache
        self.rate_limiter = {}  # Domain-based rate limiting
    
    async def crawl_with_retries(
        self,
        url: str,
        max_payment: float = 1.0
    ) -> CrawlResult:
        """Crawl with intelligent retry logic for network failures"""
        
        for attempt in range(self.retry_config['max_retries'] + 1):
            try:
                result = await self.crawl_with_payment_handling(url, max_payment)
                
                # If successful or payment-related error (don't retry), return
                if result.success or 'payment' in result.error.lower():
                    return result
                
                # For network errors, retry with exponential backoff
                if attempt < self.retry_config['max_retries']:
                    delay = min(
                        self.retry_config['base_delay'] * (self.retry_config['backoff_multiplier'] ** attempt),
                        self.retry_config['max_delay']
                    )
                    logger.info(f"🔄 Retrying {url} in {delay:.1f}s (attempt {attempt + 2})")
                    await asyncio.sleep(delay)
                
            except Exception as e:
                if attempt == self.retry_config['max_retries']:
                    return CrawlResult(
                        url=url,
                        success=False,
                        error=f"Failed after {self.retry_config['max_retries']} retries: {str(e)}"
                    )
                continue
        
        return result

# Run the example
if __name__ == "__main__":
    # Note: In practice, use environment variables for sensitive data
    # private_key = os.getenv('TACHI_PRIVATE_KEY')
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️  Crawling interrupted by user")
    except Exception as e:
        print(f"\n💥 Fatal error: {e}")
        logger.exception("Fatal error occurred")
```

### Simple Python SDK Example

For a more straightforward example:

```python
from tachi_sdk import TachiClient
import requests

def simple_crawl_example():
    """Simple example of catching 402 error and paying via SDK"""
    
    # Initialize client
    client = TachiClient(
        private_key='your-private-key',
        network='base-sepolia'
    )
    
    url = 'https://example.com/protected-content'
    
    try:
        # Attempt to access content
        response = requests.get(url)
        
        if response.status_code == 402:
            # Payment required - extract details
            payment_data = response.json()
            details = payment_data['payment_details']
            
            print(f"💳 Payment required: {details['price_usdc']} USDC")
            
            # Process payment
            payment = client.pay(
                publisher_address=details['publisher_address'],
                amount_usdc=details['price_usdc']
            )
            
            print(f"✅ Payment successful: {payment.transaction_hash}")
            
            # Retry with payment proof
            headers = {
                'X-Payment-Transaction': payment.transaction_hash,
                'X-Payment-Amount': details['price_usdc'],
                'X-Payer-Address': client.wallet_address
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                print("🎉 Content retrieved successfully!")
                return response.text
        
        elif response.status_code == 200:
            print("✅ Content freely accessible")
            return response.text
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Run simple example
content = simple_crawl_example()
if content:
    print(f"Content length: {len(content)} characters")
```

---

## JavaScript SDK Examples

### Complete JavaScript Integration

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
        
        console.log(`🤖 Crawler initialized for wallet: ${this.client.walletAddress}`);
    }
    
    async crawlWithPayment(url, maxPayment = 1.0) {
        console.log(`🎯 Crawling: ${url}`);
        
        try {
            // Initial request
            let response = await fetch(url);
            
            if (response.status === 200) {
                const content = await response.text();
                console.log('✅ Content accessible without payment');
                return {
                    success: true,
                    content,
                    contentLength: content.length,
                    paymentAmount: 0
                };
            }
            
            if (response.status === 402) {
                console.log('💳 Payment required - processing...');
                
                // Parse payment details
                const paymentData = await response.json();
                const { payment_details } = paymentData;
                
                const priceUsdc = parseFloat(payment_details.price_usdc);
                console.log(`💰 Price: ${priceUsdc} USDC`);
                
                // Check budget
                if (priceUsdc > maxPayment) {
                    throw new Error(`Price ${priceUsdc} exceeds max payment ${maxPayment}`);
                }
                
                // Check balance
                const balance = await this.client.getBalance();
                if (balance < priceUsdc) {
                    throw new Error(`Insufficient balance: ${balance} < ${priceUsdc}`);
                }
                
                // Process payment
                const paymentResult = await this.client.pay({
                    publisherAddress: payment_details.publisher_address,
                    amountUsdc: payment_details.price_usdc,
                    metadata: { url, timestamp: new Date().toISOString() }
                });
                
                console.log(`✅ Payment successful: ${paymentResult.transactionHash}`);
                
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
                    console.log('🎉 Content retrieved after payment!');
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
            console.error(`❌ Crawl failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async batchCrawl(urls, maxPayment = 1.0, maxConcurrent = 3) {
        console.log(`🚀 Batch crawling ${urls.length} URLs`);
        
        const results = [];
        
        // Process in batches to respect concurrency
        for (let i = 0; i < urls.length; i += maxConcurrent) {
            const batch = urls.slice(i, i + maxConcurrent);
            const batchPromises = batch.map(url => this.crawlWithPayment(url, maxPayment));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        
        return results;
    }
}

// Example usage
async function javascriptExample() {
    const crawler = new TachiCrawler('your-private-key-here');
    
    // Single URL
    const result = await crawler.crawlWithPayment(
        'https://example.com/api/data',
        0.50 // Max $0.50
    );
    
    if (result.success) {
        console.log(`Content: ${result.content.substring(0, 100)}...`);
        console.log(`Cost: $${result.paymentAmount}`);
    }
    
    // Batch crawling
    const urls = [
        'https://site1.com/api/data',
        'https://site2.com/premium/content',
        'https://site3.com/research/papers'
    ];
    
    const batchResults = await crawler.batchCrawl(urls, 1.0, 2);
    
    const successful = batchResults.filter(r => r.success).length;
    const totalCost = batchResults.reduce((sum, r) => sum + (r.paymentAmount || 0), 0);
    
    console.log(`Batch results: ${successful}/${urls.length} successful`);
    console.log(`Total cost: $${totalCost.toFixed(4)}`);
}

// Run example
javascriptExample().catch(console.error);
```

---

## Publisher Integration Examples

### Basic Cloudflare Worker

```javascript
// Basic Tachi protection worker
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Configuration
        const PUBLISHER_WALLET = '0xYOUR_WALLET_ADDRESS';
        const CRAWL_PRICE = '0.01';
        const PROTECTED_PATHS = ['/api', '/premium'];
        
        // Check if protection needed
        const needsPayment = PROTECTED_PATHS.some(path => 
            url.pathname.startsWith(path)
        );
        
        if (!needsPayment) {
            return fetch(request);
        }
        
        // Check for payment headers
        const paymentTx = request.headers.get('X-Payment-Transaction');
        const paymentAmount = request.headers.get('X-Payment-Amount');
        const payerAddress = request.headers.get('X-Payer-Address');
        
        if (paymentTx && paymentAmount && payerAddress) {
            // Verify payment (simplified)
            const isValid = await verifyPayment(paymentTx, PUBLISHER_WALLET);
            
            if (isValid) {
                return fetch(request);
            }
        }
        
        // Return payment required
        return new Response(JSON.stringify({
            error: 'Payment required',
            payment_details: {
                publisher_address: PUBLISHER_WALLET,
                price_usdc: CRAWL_PRICE,
                payment_processor: '0xBbe8D73B6B44652A5Fb20678bFa27b785Bb7Df41',
                chain_id: 84532,
                currency: 'USDC'
            }
        }), {
            status: 402,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

async function verifyPayment(txHash, expectedPublisher) {
    try {
        const response = await fetch('https://sepolia.base.org', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionByHash',
                params: [txHash],
                id: 1
            })
        });
        
        const result = await response.json();
        return result.result && 
               result.result.to?.toLowerCase() === expectedPublisher.toLowerCase();
    } catch (error) {
        return false;
    }
}
```

### Advanced Publisher Integration

```javascript
// Advanced publisher integration with dynamic pricing
class TachiPublisher {
    constructor(config) {
        this.config = {
            publisherWallet: config.publisherWallet,
            basePrice: config.basePrice || '0.01',
            protectedPaths: config.protectedPaths || ['/api'],
            dynamicPricing: config.dynamicPricing || false,
            rateLimit: config.rateLimit || { requests: 100, window: 3600000 }
        };
        
        this.rateLimiter = new Map();
        this.analytics = {
            totalRequests: 0,
            paidRequests: 0,
            revenue: 0
        };
    }
    
    async handleRequest(request) {
        const url = new URL(request.url);
        
        // Check if path needs protection
        const needsPayment = this.config.protectedPaths.some(path =>
            url.pathname.startsWith(path)
        );
        
        if (!needsPayment) {
            return fetch(request);
        }
        
        this.analytics.totalRequests++;
        
        // Rate limiting
        if (!this.checkRateLimit(request)) {
            return new Response('Rate limit exceeded', { status: 429 });
        }
        
        // Check for payment
        const paymentHeaders = this.extractPaymentHeaders(request);
        
        if (paymentHeaders) {
            const isValid = await this.verifyPayment(paymentHeaders);
            
            if (isValid) {
                this.analytics.paidRequests++;
                this.analytics.revenue += parseFloat(paymentHeaders.amount);
                
                // Grant access
                return this.grantAccess(request);
            }
        }
        
        // Return payment required with dynamic pricing
        const price = this.calculatePrice(request, url);
        
        return this.returnPaymentRequired(price);
    }
    
    calculatePrice(request, url) {
        if (!this.config.dynamicPricing) {
            return this.config.basePrice;
        }
        
        let basePrice = parseFloat(this.config.basePrice);
        
        // Content-based pricing
        if (url.pathname.includes('/premium')) {
            basePrice *= 2;
        }
        if (url.pathname.includes('/exclusive')) {
            basePrice *= 5;
        }
        
        // User-agent based pricing (AI crawler detection)
        const userAgent = request.headers.get('User-Agent')?.toLowerCase() || '';
        const aiCrawlers = {
            'openai': 2.0,
            'anthropic': 2.0,
            'google': 1.5,
            'microsoft': 1.5
        };
        
        for (const [crawler, multiplier] of Object.entries(aiCrawlers)) {
            if (userAgent.includes(crawler)) {
                basePrice *= multiplier;
                break;
            }
        }
        
        return basePrice.toFixed(6);
    }
    
    checkRateLimit(request) {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const now = Date.now();
        const windowStart = now - this.config.rateLimit.window;
        
        if (!this.rateLimiter.has(ip)) {
            this.rateLimiter.set(ip, []);
        }
        
        const requests = this.rateLimiter.get(ip)
            .filter(time => time > windowStart);
        
        if (requests.length >= this.config.rateLimit.requests) {
            return false;
        }
        
        requests.push(now);
        this.rateLimiter.set(ip, requests);
        return true;
    }
    
    // Additional methods...
}
```

---

## Advanced Use Cases

### Multi-Site Crawler with Budget Management

```python
import asyncio
from dataclasses import dataclass
from typing import Dict, List
from collections import defaultdict

@dataclass
class CrawlTarget:
    url: str
    max_payment: float
    priority: int  # 1 = highest priority
    category: str

class BudgetManagedCrawler:
    def __init__(self, private_key: str, daily_budget: float = 100.0):
        self.client = TachiClient(private_key=private_key)
        self.daily_budget = daily_budget
        self.spent_today = 0.0
        self.domain_budgets = defaultdict(lambda: 10.0)  # Per-domain budget
        self.domain_spent = defaultdict(float)
    
    async def intelligent_crawl_session(self, targets: List[CrawlTarget]):
        """
        Crawl multiple targets with intelligent budget allocation
        """
        # Sort by priority and potential value
        sorted_targets = sorted(targets, key=lambda t: t.priority)
        
        results = []
        
        for target in sorted_targets:
            # Check budget constraints
            if not self.can_afford(target):
                results.append(CrawlResult(
                    url=target.url,
                    success=False,
                    error="Budget constraint"
                ))
                continue
            
            # Perform crawl
            result = await self.crawl_with_payment_handling(
                target.url, 
                target.max_payment
            )
            
            # Update budgets
            if result.payment_amount:
                self.update_budgets(target, result.payment_amount)
            
            results.append(result)
            
            # Early termination if budget exhausted
            if self.spent_today >= self.daily_budget:
                break
        
        return results
    
    def can_afford(self, target: CrawlTarget) -> bool:
        domain = extract_domain(target.url)
        
        return (
            self.spent_today + target.max_payment <= self.daily_budget and
            self.domain_spent[domain] + target.max_payment <= self.domain_budgets[domain]
        )
    
    def update_budgets(self, target: CrawlTarget, amount: float):
        domain = extract_domain(target.url)
        self.spent_today += amount
        self.domain_spent[domain] += amount

# Usage example
async def budget_management_example():
    crawler = BudgetManagedCrawler(
        private_key='your-key',
        daily_budget=50.0
    )
    
    targets = [
        CrawlTarget('https://premium-news.com/api/breaking', 2.0, 1, 'news'),
        CrawlTarget('https://market-data.com/api/stocks', 1.0, 2, 'finance'),
        CrawlTarget('https://research-hub.com/papers', 5.0, 1, 'research'),
        # ... more targets
    ]
    
    results = await crawler.intelligent_crawl_session(targets)
    
    # Analyze results by category
    by_category = defaultdict(list)
    for result in results:
        for target in targets:
            if target.url == result.url:
                by_category[target.category].append(result)
                break
    
    for category, cat_results in by_category.items():
        successful = sum(1 for r in cat_results if r.success)
        cost = sum(r.payment_amount or 0 for r in cat_results)
        print(f"{category}: {successful}/{len(cat_results)} successful, ${cost:.2f}")
```

### Content Analysis and Quality Assessment

```python
class ContentAnalyzer:
    """Analyze crawled content to determine value and quality"""
    
    @staticmethod
    def analyze_content_value(content: str, price: float) -> Dict[str, Any]:
        """
        Analyze if content justifies the price paid
        """
        word_count = len(content.split())
        unique_words = len(set(content.lower().split()))
        price_per_word = price / max(word_count, 1)
        
        # Quality indicators
        has_structured_data = any(indicator in content for indicator in [
            '<table>', '<json>', 'data:', '{', '['
        ])
        
        has_unique_insights = any(phrase in content.lower() for phrase in [
            'exclusive', 'breaking', 'analysis', 'research', 'study',
            'first', 'unprecedented', 'novel', 'discovery'
        ])
        
        # Calculate value score
        value_score = 0
        if price_per_word < 0.001:
            value_score += 3
        elif price_per_word < 0.01:
            value_score += 2
        else:
            value_score += 1
        
        if has_structured_data:
            value_score += 2
        if has_unique_insights:
            value_score += 2
        if unique_words / word_count > 0.7:  # High vocabulary diversity
            value_score += 1
        
        return {
            'word_count': word_count,
            'unique_words': unique_words,
            'price_per_word': price_per_word,
            'has_structured_data': has_structured_data,
            'has_unique_insights': has_unique_insights,
            'value_score': value_score,  # 0-8 scale
            'worth_price': value_score >= 5,
            'quality_rating': 'high' if value_score >= 6 else 'medium' if value_score >= 3 else 'low'
        }

# Integration with crawler
class AnalyticsCrawler(IntelligentCrawler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.content_analyzer = ContentAnalyzer()
        self.value_history = []
    
    async def crawl_with_analysis(self, url: str, max_payment: float = 1.0):
        result = await self.crawl_with_payment_handling(url, max_payment)
        
        if result.success and result.content:
            analysis = self.content_analyzer.analyze_content_value(
                result.content, 
                result.payment_amount or 0
            )
            
            # Store analysis
            self.value_history.append({
                'url': url,
                'analysis': analysis,
                'timestamp': result.timestamp
            })
            
            # Log value assessment
            logger.info(f"Content analysis for {url}:")
            logger.info(f"  Quality: {analysis['quality_rating']}")
            logger.info(f"  Value score: {analysis['value_score']}/8")
            logger.info(f"  Worth price: {analysis['worth_price']}")
            
        return result
```

---

## Production Patterns

### Error Recovery and Resilience

```python
import asyncio
from enum import Enum
from dataclasses import dataclass
from typing import Optional, Callable, List

class ErrorType(Enum):
    NETWORK = "network"
    PAYMENT = "payment"
    RATE_LIMIT = "rate_limit"
    AUTHENTICATION = "authentication"
    UNKNOWN = "unknown"

@dataclass
class RetryConfig:
    max_retries: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    backoff_multiplier: float = 2.0
    jitter: bool = True

class ResilientCrawler(IntelligentCrawler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.retry_config = RetryConfig()
        self.circuit_breaker_thresholds = {
            'failure_rate': 0.5,  # 50% failure rate
            'min_requests': 10,
            'window_seconds': 300  # 5 minutes
        }
        self.domain_stats = defaultdict(lambda: {
            'requests': 0,
            'failures': 0,
            'last_reset': datetime.now()
        })
    
    def classify_error(self, error: str) -> ErrorType:
        """Classify error type for appropriate retry strategy"""
        error_lower = error.lower()
        
        if any(term in error_lower for term in ['network', 'connection', 'timeout']):
            return ErrorType.NETWORK
        elif any(term in error_lower for term in ['payment', 'insufficient', 'balance']):
            return ErrorType.PAYMENT
        elif 'rate limit' in error_lower or '429' in error_lower:
            return ErrorType.RATE_LIMIT
        elif any(term in error_lower for term in ['auth', 'forbidden', '401', '403']):
            return ErrorType.AUTHENTICATION
        else:
            return ErrorType.UNKNOWN
    
    async def crawl_with_resilience(
        self, 
        url: str, 
        max_payment: float = 1.0
    ) -> CrawlResult:
        """
        Crawl with comprehensive error handling and retry logic
        """
        domain = extract_domain(url)
        
        # Check circuit breaker
        if self.is_circuit_breaker_open(domain):
            return CrawlResult(
                url=url,
                success=False,
                error="Circuit breaker open - domain temporarily blocked"
            )
        
        last_error = None
        
        for attempt in range(self.retry_config.max_retries + 1):
            try:
                result = await self.crawl_with_payment_handling(url, max_payment)
                
                # Update stats
                self.update_domain_stats(domain, success=result.success)
                
                return result
                
            except Exception as e:
                last_error = str(e)
                error_type = self.classify_error(last_error)
                
                # Don't retry payment errors
                if error_type == ErrorType.PAYMENT:
                    self.update_domain_stats(domain, success=False)
                    return CrawlResult(
                        url=url,
                        success=False,
                        error=last_error
                    )
                
                # Calculate retry delay based on error type
                if attempt < self.retry_config.max_retries:
                    delay = self.calculate_retry_delay(attempt, error_type)
                    logger.info(f"🔄 Retrying {url} in {delay:.1f}s (attempt {attempt + 2}, error: {error_type.value})")
                    await asyncio.sleep(delay)
        
        # All retries exhausted
        self.update_domain_stats(domain, success=False)
        return CrawlResult(
            url=url,
            success=False,
            error=f"Failed after {self.retry_config.max_retries} retries: {last_error}"
        )
    
    def calculate_retry_delay(self, attempt: int, error_type: ErrorType) -> float:
        """Calculate retry delay based on attempt and error type"""
        base_delay = self.retry_config.base_delay
        
        # Different delays for different error types
        multipliers = {
            ErrorType.NETWORK: 1.0,
            ErrorType.RATE_LIMIT: 3.0,  # Longer delay for rate limits
            ErrorType.AUTHENTICATION: 0.5,  # Shorter delay for auth errors
            ErrorType.UNKNOWN: 1.0
        }
        
        delay = base_delay * multipliers.get(error_type, 1.0) * (
            self.retry_config.backoff_multiplier ** attempt
        )
        
        delay = min(delay, self.retry_config.max_delay)
        
        # Add jitter to prevent thundering herd
        if self.retry_config.jitter:
            import random
            delay += random.uniform(0, delay * 0.1)
        
        return delay
    
    def is_circuit_breaker_open(self, domain: str) -> bool:
        """Check if circuit breaker is open for a domain"""
        stats = self.domain_stats[domain]
        
        # Reset stats if window expired
        if (datetime.now() - stats['last_reset']).seconds > self.circuit_breaker_thresholds['window_seconds']:
            stats['requests'] = 0
            stats['failures'] = 0
            stats['last_reset'] = datetime.now()
        
        # Check if we have enough data and failure rate is too high
        if stats['requests'] >= self.circuit_breaker_thresholds['min_requests']:
            failure_rate = stats['failures'] / stats['requests']
            return failure_rate >= self.circuit_breaker_thresholds['failure_rate']
        
        return False
    
    def update_domain_stats(self, domain: str, success: bool):
        """Update domain statistics for circuit breaker"""
        stats = self.domain_stats[domain]
        stats['requests'] += 1
        if not success:
            stats['failures'] += 1

def extract_domain(url: str) -> str:
    """Extract domain from URL"""
    from urllib.parse import urlparse
    return urlparse(url).netloc
```

### Monitoring and Observability

```python
import json
from datetime import datetime, timedelta
from dataclasses import asdict

class CrawlMonitor:
    """Comprehensive monitoring and observability for crawl operations"""
    
    def __init__(self):
        self.metrics = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'total_cost': 0.0,
            'domains': defaultdict(lambda: {
                'requests': 0,
                'successes': 0,
                'cost': 0.0,
                'avg_response_time': 0.0,
                'last_access': None
            }),
            'error_types': defaultdict(int),
            'hourly_stats': defaultdict(lambda: {
                'requests': 0,
                'cost': 0.0
            })
        }
        self.start_time = datetime.now()
    
    def record_crawl(self, result: CrawlResult, response_time: float = 0.0):
        """Record crawl result for monitoring"""
        domain = extract_domain(result.url)
        hour_key = result.timestamp.strftime('%Y-%m-%d-%H')
        
        # Update global metrics
        self.metrics['total_requests'] += 1
        if result.success:
            self.metrics['successful_requests'] += 1
        else:
            self.metrics['failed_requests'] += 1
            self.metrics['error_types'][result.error or 'unknown'] += 1
        
        if result.payment_amount:
            self.metrics['total_cost'] += result.payment_amount
        
        # Update domain metrics
        domain_stats = self.metrics['domains'][domain]
        domain_stats['requests'] += 1
        if result.success:
            domain_stats['successes'] += 1
        if result.payment_amount:
            domain_stats['cost'] += result.payment_amount
        
        # Update response time (exponential moving average)
        if domain_stats['avg_response_time'] == 0:
            domain_stats['avg_response_time'] = response_time
        else:
            domain_stats['avg_response_time'] = (
                0.9 * domain_stats['avg_response_time'] + 0.1 * response_time
            )
        
        domain_stats['last_access'] = result.timestamp.isoformat()
        
        # Update hourly stats
        hourly = self.metrics['hourly_stats'][hour_key]
        hourly['requests'] += 1
        if result.payment_amount:
            hourly['cost'] += result.payment_amount
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive monitoring report"""
        runtime = datetime.now() - self.start_time
        success_rate = (
            self.metrics['successful_requests'] / max(self.metrics['total_requests'], 1)
        ) * 100
        
        # Top domains by activity
        top_domains = sorted(
            self.metrics['domains'].items(),
            key=lambda x: x[1]['requests'],
            reverse=True
        )[:10]
        
        # Recent hourly trends
        recent_hours = sorted(
            self.metrics['hourly_stats'].items(),
            reverse=True
        )[:24]  # Last 24 hours
        
        return {
            'summary': {
                'runtime_hours': runtime.total_seconds() / 3600,
                'total_requests': self.metrics['total_requests'],
                'success_rate_percent': success_rate,
                'total_cost_usd': self.metrics['total_cost'],
                'avg_cost_per_request': self.metrics['total_cost'] / max(self.metrics['total_requests'], 1),
                'requests_per_hour': self.metrics['total_requests'] / max(runtime.total_seconds() / 3600, 1)
            },
            'top_domains': [
                {
                    'domain': domain,
                    'requests': stats['requests'],
                    'success_rate': (stats['successes'] / max(stats['requests'], 1)) * 100,
                    'total_cost': stats['cost'],
                    'avg_response_time': stats['avg_response_time'],
                    'last_access': stats['last_access']
                }
                for domain, stats in top_domains
            ],
            'error_analysis': dict(self.metrics['error_types']),
            'hourly_trends': [
                {
                    'hour': hour,
                    'requests': stats['requests'],
                    'cost': stats['cost']
                }
                for hour, stats in recent_hours
            ]
        }
    
    def save_report(self, filename: Optional[str] = None):
        """Save monitoring report to file"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'crawl_monitor_report_{timestamp}.json'
        
        report = self.generate_report()
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        return filename

# Integration with monitored crawler
class MonitoredCrawler(ResilientCrawler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.monitor = CrawlMonitor()
    
    async def crawl_with_monitoring(self, url: str, max_payment: float = 1.0):
        start_time = datetime.now()
        
        result = await self.crawl_with_resilience(url, max_payment)
        
        response_time = (datetime.now() - start_time).total_seconds()
        self.monitor.record_crawl(result, response_time)
        
        return result
    
    def print_stats(self):
        """Print current statistics"""
        report = self.monitor.generate_report()
        
        print("\n📊 Crawl Monitor Report")
        print("=" * 50)
        print(f"Runtime: {report['summary']['runtime_hours']:.1f} hours")
        print(f"Total Requests: {report['summary']['total_requests']}")
        print(f"Success Rate: {report['summary']['success_rate_percent']:.1f}%")
        print(f"Total Cost: ${report['summary']['total_cost_usd']:.4f}")
        print(f"Avg Cost/Request: ${report['summary']['avg_cost_per_request']:.4f}")
        print(f"Requests/Hour: {report['summary']['requests_per_hour']:.1f}")
        
        if report['top_domains']:
            print(f"\n🏆 Top Domains:")
            for domain_info in report['top_domains'][:5]:
                print(f"  {domain_info['domain']}: {domain_info['requests']} requests, ${domain_info['total_cost']:.4f}")
        
        if report['error_analysis']:
            print(f"\n❌ Common Errors:")
            for error, count in sorted(report['error_analysis'].items(), key=lambda x: x[1], reverse=True)[:3]:
                print(f"  {error}: {count} occurrences")
```

This comprehensive documentation provides complete, production-ready examples for integrating with Tachi Protocol. The Python SDK example demonstrates the complete flow of catching 402 errors, processing payments, and retrieving content, along with advanced patterns for budget management, error handling, and monitoring.

The examples progress from simple use cases to complex production scenarios, giving developers everything they need to successfully integrate with Tachi Protocol regardless of their specific requirements or technical sophistication level.
