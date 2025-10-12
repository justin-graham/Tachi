# Integration Examples

This document provides concrete, copy-paste examples to help developers integrate with Tachi Protocol quickly and effectively.

## Table of Contents

1. [Publisher Examples](#publisher-examples)
2. [AI Consumer Examples](#ai-consumer-examples)
3. [Reference Implementations](#reference-implementations)
4. [API Specifications](#api-specifications)
5. [Testing Examples](#testing-examples)

---

## Publisher Examples

### Basic HTML Content Protection

For publishers who want to mark specific content as protected:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Protected Content Example</title>
    <meta charset="utf-8">
    <!-- Tachi Protocol meta tags for AI crawlers -->
    <meta name="tachi-protected" content="true">
    <meta name="tachi-price" content="0.005">
    <meta name="tachi-currency" content="USDC">
</head>
<body>
    <div class="public-content">
        <h1>Free Content</h1>
        <p>This content is freely accessible to all visitors.</p>
    </div>
    
    <!-- Protected content section -->
    <div class="tachi-protected" data-price="0.005" data-currency="USDC">
        <h2>Premium Research Data</h2>
        <p>This content requires payment to access via AI crawlers.</p>
        
        <div class="research-data">
            <script type="application/json" class="tachi-protected-data">
            {
                "research_findings": [
                    {
                        "title": "Advanced ML Techniques",
                        "data": "Detailed research data here..."
                    }
                ]
            }
            </script>
        </div>
    </div>
    
    <!-- Optional: Client-side verification script -->
    <script>
        // Optional client-side verification for debugging
        function verifyTachiProtection() {
            const protectedElements = document.querySelectorAll('.tachi-protected');
            console.log(`Found ${protectedElements.length} protected content sections`);
            
            protectedElements.forEach((element, index) => {
                const price = element.dataset.price;
                const currency = element.dataset.currency;
                console.log(`Section ${index + 1}: ${price} ${currency}`);
            });
        }
        
        // Run verification on page load
        document.addEventListener('DOMContentLoaded', verifyTachiProtection);
    </script>
</body>
</html>
```

### Client-Side Request Verification

For publishers who want to add client-side verification (optional - the Cloudflare Worker handles the real protection):

```javascript
// tachi-verification.js - Optional client-side helper
class TachiVerification {
    constructor(config) {
        this.gatewayUrl = config.gatewayUrl;
        this.publisherAddress = config.publisherAddress;
        this.debug = config.debug || false;
    }
    
    /**
     * Check if current request is from an AI crawler
     */
    isAICrawler(userAgent = navigator.userAgent) {
        const aiCrawlers = [
            /GPTBot/i,
            /ChatGPT/i,
            /Claude/i,
            /BingAI/i,
            /Googlebot/i,
            /Baiduspider/i,
            /YandexBot/i,
            /Perplexity/i,
            /CCBot/i,
            /Meta-ExternalAgent/i
        ];
        
        return aiCrawlers.some(pattern => pattern.test(userAgent));
    }
    
    /**
     * Display payment information for AI crawlers
     */
    showPaymentInfo(price = '0.005', currency = 'USDC') {
        if (!this.isAICrawler()) return;
        
        const paymentDiv = document.createElement('div');
        paymentDiv.id = 'tachi-payment-info';
        paymentDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff6b35;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        paymentDiv.innerHTML = `
            🤖 AI Crawler Detected | Payment Required: ${price} ${currency}
            <a href="${this.gatewayUrl}" style="color: white; text-decoration: underline;">
                Learn More About Tachi Protocol
            </a>
        `;
        
        document.body.insertBefore(paymentDiv, document.body.firstChild);
        
        if (this.debug) {
            console.log('Tachi: AI crawler detected, payment info displayed');
        }
    }
    
    /**
     * Verify payment status (for testing)
     */
    async verifyPayment(transactionHash) {
        try {
            const response = await fetch(`${this.gatewayUrl}/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    txHash: transactionHash,
                    publisher: this.publisherAddress
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Payment verification failed:', error);
            return { verified: false, error: error.message };
        }
    }
}

// Usage example
const tachi = new TachiVerification({
    gatewayUrl: 'https://your-worker.your-domain.workers.dev',
    publisherAddress: '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7',
    debug: true
});

// Show payment info to AI crawlers
tachi.showPaymentInfo('0.005', 'USDC');
```

### WordPress Plugin Example

Basic WordPress integration:

```php
<?php
/**
 * Plugin Name: Tachi Protocol Protection
 * Description: Protect your content with Tachi Protocol pay-per-crawl
 * Version: 1.0.0
 */

class TachiProtection {
    private $gateway_url;
    private $price_per_crawl;
    
    public function __construct() {
        $this->gateway_url = get_option('tachi_gateway_url', '');
        $this->price_per_crawl = get_option('tachi_price_per_crawl', '0.005');
        
        add_action('wp_head', array($this, 'add_meta_tags'));
        add_filter('the_content', array($this, 'protect_content'));
    }
    
    public function add_meta_tags() {
        if ($this->is_protected_post()) {
            echo '<meta name="tachi-protected" content="true">' . "\n";
            echo '<meta name="tachi-price" content="' . esc_attr($this->price_per_crawl) . '">' . "\n";
            echo '<meta name="tachi-currency" content="USDC">' . "\n";
        }
    }
    
    public function protect_content($content) {
        if (!$this->is_protected_post()) {
            return $content;
        }
        
        // Add protection wrapper
        $protected_content = '<div class="tachi-protected" data-price="' . esc_attr($this->price_per_crawl) . '" data-currency="USDC">';
        $protected_content .= $content;
        $protected_content .= '</div>';
        
        return $protected_content;
    }
    
    private function is_protected_post() {
        return get_post_meta(get_the_ID(), 'tachi_protected', true) === 'yes';
    }
}

new TachiProtection();
?>
```

---

## AI Consumer Examples

### Node.js/JavaScript Example

```javascript
// node-crawler-example.js
import { createBaseSDK } from '@tachi/sdk-js';
import fs from 'fs';

class TachiCrawler {
    constructor() {
        this.sdk = createBaseSDK({
            rpcUrl: process.env.BASE_RPC_URL,
            paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS,
            ownerPrivateKey: process.env.CRAWLER_PRIVATE_KEY,
            userAgent: 'TachiExampleCrawler/1.0 (+https://example.com/crawler)',
            debug: true
        });
        
        this.results = [];
        this.totalCost = 0;
    }
    
    /**
     * Crawl a single URL with payment handling
     */
    async crawlUrl(url, options = {}) {
        try {
            console.log(`🔍 Crawling: ${url}`);
            
            const response = await this.sdk.fetchWithTachi(url, options);
            
            if (response.paymentRequired) {
                console.log(`💰 Payment made: ${response.paymentAmount} USDC`);
                console.log(`📋 Transaction: ${response.transactionHash}`);
                this.totalCost += parseFloat(response.paymentAmount || '0');
            }
            
            this.results.push({
                url,
                success: true,
                content: response.content,
                paymentAmount: response.paymentAmount,
                timestamp: new Date().toISOString()
            });
            
            return response.content;
            
        } catch (error) {
            console.error(`❌ Failed to crawl ${url}:`, error.message);
            
            this.results.push({
                url,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            return null;
        }
    }
    
    /**
     * Crawl multiple URLs with rate limiting
     */
    async crawlUrls(urls, options = {}) {
        const { concurrent = 3, delay = 1000 } = options;
        const results = [];
        
        // Process URLs in batches
        for (let i = 0; i < urls.length; i += concurrent) {
            const batch = urls.slice(i, i + concurrent);
            
            console.log(`📦 Processing batch ${Math.floor(i / concurrent) + 1}/${Math.ceil(urls.length / concurrent)}`);
            
            const batchPromises = batch.map(url => this.crawlUrl(url));
            const batchResults = await Promise.allSettled(batchPromises);
            
            results.push(...batchResults);
            
            // Delay between batches to be polite
            if (i + concurrent < urls.length) {
                console.log(`⏱️  Waiting ${delay}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        return results;
    }
    
    /**
     * Check crawler balance
     */
    async checkBalance() {
        try {
            const balance = await this.sdk.getBalance();
            console.log(`💰 Current USDC balance: ${balance}`);
            return parseFloat(balance);
        } catch (error) {
            console.error('Failed to check balance:', error.message);
            return 0;
        }
    }
    
    /**
     * Save crawl results to file
     */
    saveResults(filename = 'crawl-results.json') {
        const summary = {
            totalUrls: this.results.length,
            successful: this.results.filter(r => r.success).length,
            failed: this.results.filter(r => !r.success).length,
            totalCost: this.totalCost,
            results: this.results,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(filename, JSON.stringify(summary, null, 2));
        console.log(`📄 Results saved to ${filename}`);
        
        return summary;
    }
}

// Example usage
async function main() {
    const crawler = new TachiCrawler();
    
    // Check balance before starting
    const initialBalance = await crawler.checkBalance();
    if (initialBalance < 1.0) {
        console.warn('⚠️  Low USDC balance. Consider topping up.');
    }
    
    // URLs to crawl
    const urls = [
        'https://protected-site.com/api/articles',
        'https://research-blog.com/premium-content',
        'https://data-provider.com/datasets/ml-training'
    ];
    
    // Crawl URLs with rate limiting
    await crawler.crawlUrls(urls, {
        concurrent: 2,
        delay: 2000 // 2 second delay between batches
    });
    
    // Save results
    const summary = crawler.saveResults();
    
    console.log('\n📊 Crawl Summary:');
    console.log(`✅ Successful: ${summary.successful}/${summary.totalUrls}`);
    console.log(`❌ Failed: ${summary.failed}/${summary.totalUrls}`);
    console.log(`💰 Total cost: ${summary.totalCost.toFixed(6)} USDC`);
    
    // Check final balance
    await crawler.checkBalance();
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { TachiCrawler };
```

### Python Example

```python
# python-crawler-example.py
import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import List, Dict, Optional

class TachiCrawler:
    """
    Python example crawler for Tachi Protocol
    Note: This uses direct HTTP calls since Python SDK is coming soon
    """
    
    def __init__(self, config: dict):
        self.base_rpc_url = config['base_rpc_url']
        self.payment_processor_address = config['payment_processor_address']
        self.private_key = config['private_key']
        self.user_agent = config.get('user_agent', 'TachiPythonCrawler/1.0')
        self.debug = config.get('debug', False)
        
        self.results = []
        self.total_cost = 0.0
        
    async def crawl_url(self, session: aiohttp.ClientSession, url: str) -> Optional[str]:
        """Crawl a single URL with payment handling"""
        try:
            if self.debug:
                print(f"🔍 Crawling: {url}")
            
            # Step 1: Initial request
            async with session.get(url, headers={'User-Agent': self.user_agent}) as response:
                if response.status == 402:
                    # Payment required
                    payment_info = await response.json()
                    if self.debug:
                        print(f"💰 Payment required: {payment_info}")
                    
                    # Step 2: Process payment (simplified - use your preferred Web3 library)
                    tx_hash = await self._process_payment(payment_info['payment'])
                    
                    # Step 3: Retry with payment proof
                    headers = {
                        'User-Agent': self.user_agent,
                        'Authorization': f'Bearer {tx_hash}'
                    }
                    
                    async with session.get(url, headers=headers) as paid_response:
                        if paid_response.status == 200:
                            content = await paid_response.text()
                            self.results.append({
                                'url': url,
                                'success': True,
                                'content': content,
                                'payment_amount': payment_info['payment']['amount'],
                                'transaction_hash': tx_hash,
                                'timestamp': datetime.now().isoformat()
                            })
                            
                            self.total_cost += float(payment_info['payment']['amount'])
                            return content
                        else:
                            raise Exception(f"Payment verification failed: {paid_response.status}")
                
                elif response.status == 200:
                    # No payment required
                    content = await response.text()
                    self.results.append({
                        'url': url,
                        'success': True,
                        'content': content,
                        'payment_amount': None,
                        'timestamp': datetime.now().isoformat()
                    })
                    return content
                
                else:
                    raise Exception(f"HTTP {response.status}: {response.reason}")
                    
        except Exception as error:
            print(f"❌ Failed to crawl {url}: {error}")
            self.results.append({
                'url': url,
                'success': False,
                'error': str(error),
                'timestamp': datetime.now().isoformat()
            })
            return None
    
    async def _process_payment(self, payment_info: dict) -> str:
        """
        Process USDC payment (simplified example)
        In production, use web3.py or similar library
        """
        # This is a simplified example - implement actual payment logic
        # using your preferred Web3 library (web3.py, etc.)
        
        if self.debug:
            print(f"Processing payment: {payment_info['amount']} {payment_info['currency']}")
        
        # Simulate payment processing
        await asyncio.sleep(1)
        
        # Return mock transaction hash for demo
        # In production, return actual transaction hash from blockchain
        return f"0x{'a' * 64}"  # Mock transaction hash
    
    async def crawl_urls(self, urls: List[str], concurrent: int = 3, delay: float = 1.0) -> List[dict]:
        """Crawl multiple URLs with rate limiting"""
        results = []
        
        async with aiohttp.ClientSession() as session:
            # Process URLs in batches
            for i in range(0, len(urls), concurrent):
                batch = urls[i:i + concurrent]
                batch_num = i // concurrent + 1
                total_batches = (len(urls) + concurrent - 1) // concurrent
                
                print(f"📦 Processing batch {batch_num}/{total_batches}")
                
                # Process batch concurrently
                tasks = [self.crawl_url(session, url) for url in batch]
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                results.extend(batch_results)
                
                # Delay between batches
                if i + concurrent < len(urls):
                    print(f"⏱️  Waiting {delay}s before next batch...")
                    await asyncio.sleep(delay)
        
        return results
    
    def save_results(self, filename: str = 'python-crawl-results.json') -> dict:
        """Save crawl results to file"""
        summary = {
            'total_urls': len(self.results),
            'successful': len([r for r in self.results if r['success']]),
            'failed': len([r for r in self.results if not r['success']]),
            'total_cost': round(self.total_cost, 6),
            'results': self.results,
            'timestamp': datetime.now().isoformat()
        }
        
        with open(filename, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"📄 Results saved to {filename}")
        return summary

# Example usage
async def main():
    config = {
        'base_rpc_url': 'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
        'payment_processor_address': '0x...',  # Your PaymentProcessor address
        'private_key': '0x...',  # Your crawler's private key
        'user_agent': 'TachiPythonExample/1.0 (+https://example.com/crawler)',
        'debug': True
    }
    
    crawler = TachiCrawler(config)
    
    # URLs to crawl
    urls = [
        'https://protected-site.com/api/data',
        'https://research-blog.com/papers',
        'https://news-site.com/premium-articles'
    ]
    
    # Crawl URLs
    print("🚀 Starting crawl session...")
    await crawler.crawl_urls(urls, concurrent=2, delay=2.0)
    
    # Save and display results
    summary = crawler.save_results()
    
    print(f"\n📊 Crawl Summary:")
    print(f"✅ Successful: {summary['successful']}/{summary['total_urls']}")
    print(f"❌ Failed: {summary['failed']}/{summary['total_urls']}")
    print(f"💰 Total cost: {summary['total_cost']} USDC")

if __name__ == "__main__":
    asyncio.run(main())
```

### Go Example

```go
// go-crawler-example.go
package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "log"
    "net/http"
    "strings"
    "time"
)

type PaymentInfo struct {
    Amount       string `json:"amount"`
    Currency     string `json:"currency"`
    Network      string `json:"network"`
    ChainID      int    `json:"chainId"`
    Recipient    string `json:"recipient"`
    TokenAddress string `json:"tokenAddress"`
}

type PaymentResponse struct {
    Error   string      `json:"error"`
    Message string      `json:"message"`
    Payment PaymentInfo `json:"payment"`
}

type CrawlResult struct {
    URL           string    `json:"url"`
    Success       bool      `json:"success"`
    Content       string    `json:"content,omitempty"`
    PaymentAmount string    `json:"payment_amount,omitempty"`
    TxHash        string    `json:"transaction_hash,omitempty"`
    Error         string    `json:"error,omitempty"`
    Timestamp     time.Time `json:"timestamp"`
}

type TachiCrawler struct {
    userAgent     string
    client        *http.Client
    results       []CrawlResult
    totalCost     float64
    debug         bool
}

func NewTachiCrawler(userAgent string, debug bool) *TachiCrawler {
    return &TachiCrawler{
        userAgent: userAgent,
        client: &http.Client{
            Timeout: 30 * time.Second,
        },
        results: make([]CrawlResult, 0),
        debug:   debug,
    }
}

func (tc *TachiCrawler) CrawlURL(url string) (string, error) {
    if tc.debug {
        fmt.Printf("🔍 Crawling: %s\n", url)
    }
    
    // Step 1: Initial request
    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        return "", err
    }
    req.Header.Set("User-Agent", tc.userAgent)
    
    resp, err := tc.client.Do(req)
    if err != nil {
        tc.recordFailure(url, err.Error())
        return "", err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == 402 {
        // Payment required
        body, err := ioutil.ReadAll(resp.Body)
        if err != nil {
            return "", err
        }
        
        var paymentResp PaymentResponse
        if err := json.Unmarshal(body, &paymentResp); err != nil {
            return "", err
        }
        
        if tc.debug {
            fmt.Printf("💰 Payment required: %s %s\n", 
                paymentResp.Payment.Amount, 
                paymentResp.Payment.Currency)
        }
        
        // Step 2: Process payment
        txHash, err := tc.processPayment(paymentResp.Payment)
        if err != nil {
            tc.recordFailure(url, err.Error())
            return "", err
        }
        
        // Step 3: Retry with payment proof
        return tc.retryWithPayment(url, txHash, paymentResp.Payment.Amount)
        
    } else if resp.StatusCode == 200 {
        // No payment required
        body, err := ioutil.ReadAll(resp.Body)
        if err != nil {
            return "", err
        }
        
        content := string(body)
        tc.recordSuccess(url, content, "", "")
        return content, nil
        
    } else {
        err := fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
        tc.recordFailure(url, err.Error())
        return "", err
    }
}

func (tc *TachiCrawler) processPayment(payment PaymentInfo) (string, error) {
    // Simplified payment processing
    // In production, use a proper Web3 library for Go
    if tc.debug {
        fmt.Printf("Processing payment: %s %s\n", payment.Amount, payment.Currency)
    }
    
    // Simulate payment processing delay
    time.Sleep(1 * time.Second)
    
    // Return mock transaction hash for demo
    return "0x" + strings.Repeat("a", 64), nil
}

func (tc *TachiCrawler) retryWithPayment(url, txHash, amount string) (string, error) {
    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        return "", err
    }
    
    req.Header.Set("User-Agent", tc.userAgent)
    req.Header.Set("Authorization", "Bearer "+txHash)
    
    resp, err := tc.client.Do(req)
    if err != nil {
        tc.recordFailure(url, err.Error())
        return "", err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == 200 {
        body, err := ioutil.ReadAll(resp.Body)
        if err != nil {
            return "", err
        }
        
        content := string(body)
        tc.recordSuccess(url, content, amount, txHash)
        
        // Track total cost
        if amount != "" {
            var cost float64
            fmt.Sscanf(amount, "%f", &cost)
            tc.totalCost += cost
        }
        
        return content, nil
    } else {
        err := fmt.Errorf("Payment verification failed: HTTP %d", resp.StatusCode)
        tc.recordFailure(url, err.Error())
        return "", err
    }
}

func (tc *TachiCrawler) recordSuccess(url, content, amount, txHash string) {
    tc.results = append(tc.results, CrawlResult{
        URL:           url,
        Success:       true,
        Content:       content,
        PaymentAmount: amount,
        TxHash:        txHash,
        Timestamp:     time.Now(),
    })
}

func (tc *TachiCrawler) recordFailure(url, errorMsg string) {
    tc.results = append(tc.results, CrawlResult{
        URL:       url,
        Success:   false,
        Error:     errorMsg,
        Timestamp: time.Now(),
    })
}

func (tc *TachiCrawler) SaveResults(filename string) error {
    successful := 0
    failed := 0
    
    for _, result := range tc.results {
        if result.Success {
            successful++
        } else {
            failed++
        }
    }
    
    summary := map[string]interface{}{
        "total_urls":  len(tc.results),
        "successful":  successful,
        "failed":      failed,
        "total_cost":  tc.totalCost,
        "results":     tc.results,
        "timestamp":   time.Now(),
    }
    
    data, err := json.MarshalIndent(summary, "", "  ")
    if err != nil {
        return err
    }
    
    err = ioutil.WriteFile(filename, data, 0644)
    if err != nil {
        return err
    }
    
    fmt.Printf("📄 Results saved to %s\n", filename)
    return nil
}

func main() {
    crawler := NewTachiCrawler("TachiGoExample/1.0 (+https://example.com/crawler)", true)
    
    urls := []string{
        "https://protected-site.com/api/data",
        "https://research-blog.com/papers",
        "https://news-site.com/premium-articles",
    }
    
    fmt.Println("🚀 Starting crawl session...")
    
    for i, url := range urls {
        content, err := crawler.CrawlURL(url)
        if err != nil {
            fmt.Printf("❌ Failed to crawl %s: %v\n", url, err)
        } else {
            fmt.Printf("✅ Successfully crawled %s (%d bytes)\n", url, len(content))
        }
        
        // Be polite - delay between requests
        if i < len(urls)-1 {
            time.Sleep(2 * time.Second)
        }
    }
    
    // Save results
    if err := crawler.SaveResults("go-crawl-results.json"); err != nil {
        log.Printf("Failed to save results: %v", err)
    }
    
    fmt.Printf("\n📊 Crawl Summary:\n")
    
    successful := 0
    failed := 0
    for _, result := range crawler.results {
        if result.Success {
            successful++
        } else {
            failed++
        }
    }
    
    fmt.Printf("✅ Successful: %d/%d\n", successful, len(crawler.results))
    fmt.Printf("❌ Failed: %d/%d\n", failed, len(crawler.results))
    fmt.Printf("💰 Total cost: %.6f USDC\n", crawler.totalCost)
}
```

---

## Reference Implementations

### Complete Reference Crawler (Node.js)

Let me create a complete reference implementation that serves as a template:

```javascript
// reference-crawler/index.js
import { createBaseSDK } from '@tachi/sdk-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ReferenceCrawler {
    constructor(config) {
        this.config = config;
        this.sdk = createBaseSDK({
            rpcUrl: config.rpcUrl,
            paymentProcessorAddress: config.paymentProcessorAddress,
            ownerPrivateKey: config.privateKey,
            userAgent: config.userAgent || 'TachiReferenceCrawler/1.0',
            debug: config.debug || false
        });
        
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalCost: 0,
            startTime: Date.now(),
            endTime: null
        };
        
        this.results = [];
    }
    
    /**
     * Main crawling method with comprehensive error handling
     */
    async crawl(targets) {
        console.log(`🚀 Starting crawl session with ${targets.length} targets`);
        
        // Check initial balance
        const initialBalance = await this.checkBalance();
        if (initialBalance < 0.1) {
            console.warn('⚠️  Low USDC balance detected. Consider topping up.');
        }
        
        // Process targets with rate limiting
        for (const target of targets) {
            await this.crawlTarget(target);
            
            // Be polite - delay between requests
            if (this.config.requestDelay) {
                await this.sleep(this.config.requestDelay);
            }
        }
        
        this.stats.endTime = Date.now();
        const summary = await this.generateSummary();
        
        if (this.config.outputFile) {
            await this.saveResults(this.config.outputFile);
        }
        
        return summary;
    }
    
    async crawlTarget(target) {
        try {
            this.stats.totalRequests++;
            
            const startTime = Date.now();
            
            // Handle different target types
            let url, options = {};
            if (typeof target === 'string') {
                url = target;
            } else {
                url = target.url;
                options = target.options || {};
            }
            
            console.log(`🔍 Crawling: ${url}`);
            
            const response = await this.sdk.fetchWithTachi(url, options);
            const duration = Date.now() - startTime;
            
            if (response.paymentRequired) {
                console.log(`💰 Payment: ${response.paymentAmount} USDC (${response.transactionHash})`);
                this.stats.totalCost += parseFloat(response.paymentAmount || '0');
            }
            
            this.stats.successfulRequests++;
            
            const result = {
                url,
                success: true,
                statusCode: response.statusCode,
                contentLength: response.content.length,
                paymentRequired: response.paymentRequired,
                paymentAmount: response.paymentAmount,
                transactionHash: response.transactionHash,
                duration,
                timestamp: new Date().toISOString(),
                content: this.config.includeContent ? response.content : null
            };
            
            this.results.push(result);
            
            // Process content if processor is provided
            if (this.config.contentProcessor) {
                await this.config.contentProcessor(response.content, result);
            }
            
            console.log(`✅ Success: ${url} (${duration}ms, ${response.content.length} bytes)`);
            
        } catch (error) {
            this.stats.failedRequests++;
            
            const result = {
                url: typeof target === 'string' ? target : target.url,
                success: false,
                error: error.message,
                errorCode: error.code,
                timestamp: new Date().toISOString()
            };
            
            this.results.push(result);
            
            console.error(`❌ Failed: ${result.url} - ${error.message}`);
        }
    }
    
    async checkBalance() {
        try {
            const balance = await this.sdk.getBalance();
            console.log(`💰 USDC Balance: ${balance}`);
            return parseFloat(balance);
        } catch (error) {
            console.error('Failed to check balance:', error.message);
            return 0;
        }
    }
    
    async generateSummary() {
        const duration = this.stats.endTime - this.stats.startTime;
        
        const summary = {
            session: {
                duration: duration,
                requestsPerSecond: this.stats.totalRequests / (duration / 1000),
                userAgent: this.sdk.config.userAgent
            },
            requests: {
                total: this.stats.totalRequests,
                successful: this.stats.successfulRequests,
                failed: this.stats.failedRequests,
                successRate: (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(1)
            },
            costs: {
                totalCost: this.stats.totalCost,
                averageCostPerRequest: this.stats.totalCost / this.stats.successfulRequests || 0,
                paidRequests: this.results.filter(r => r.paymentRequired).length
            },
            performance: {
                averageResponseTime: this.results
                    .filter(r => r.success)
                    .reduce((sum, r) => sum + r.duration, 0) / this.stats.successfulRequests || 0,
                totalDataTransfer: this.results
                    .filter(r => r.success)
                    .reduce((sum, r) => sum + r.contentLength, 0)
            }
        };
        
        console.log('\n📊 Crawl Summary:');
        console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
        console.log(`📈 Success Rate: ${summary.requests.successRate}%`);
        console.log(`💰 Total Cost: ${summary.costs.totalCost.toFixed(6)} USDC`);
        console.log(`⚡ Avg Response Time: ${summary.performance.averageResponseTime.toFixed(0)}ms`);
        console.log(`📊 Data Transfer: ${(summary.performance.totalDataTransfer / 1024 / 1024).toFixed(2)} MB`);
        
        return summary;
    }
    
    async saveResults(filename) {
        const output = {
            metadata: {
                crawlerVersion: '1.0.0',
                timestamp: new Date().toISOString(),
                config: {
                    userAgent: this.sdk.config.userAgent,
                    requestDelay: this.config.requestDelay,
                    debug: this.config.debug
                }
            },
            summary: await this.generateSummary(),
            results: this.results
        };
        
        await fs.writeFile(filename, JSON.stringify(output, null, 2));
        console.log(`📄 Results saved to ${filename}`);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Example usage and configuration
async function main() {
    const config = {
        rpcUrl: process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo',
        paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS,
        privateKey: process.env.CRAWLER_PRIVATE_KEY,
        userAgent: 'TachiReferenceCrawler/1.0 (+https://github.com/tachi-protocol/tachi)',
        debug: process.env.NODE_ENV !== 'production',
        requestDelay: 2000, // 2 seconds between requests
        outputFile: 'crawl-results.json',
        includeContent: false, // Set to true to save content
        
        // Optional content processor
        contentProcessor: async (content, result) => {
            // Example: Extract and save specific data
            if (result.url.includes('/api/')) {
                try {
                    const data = JSON.parse(content);
                    console.log(`📊 Extracted ${Object.keys(data).length} data fields`);
                } catch (e) {
                    // Not JSON content
                }
            }
        }
    };
    
    // Define crawl targets
    const targets = [
        'https://example-protected-site.com/api/articles',
        'https://research-blog.com/papers/latest',
        {
            url: 'https://news-site.com/premium',
            options: {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: 'technology', limit: 100 })
            }
        }
    ];
    
    const crawler = new ReferenceCrawler(config);
    
    try {
        const summary = await crawler.crawl(targets);
        
        console.log('\n🎉 Crawl session completed successfully!');
        console.log(`Check ${config.outputFile} for detailed results.`);
        
        return summary;
        
    } catch (error) {
        console.error('❌ Crawl session failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { ReferenceCrawler };
```

---

## API Specifications

### OpenAPI/Swagger Specification

```yaml
# tachi-protocol-api.yaml
openapi: 3.0.3
info:
  title: Tachi Protocol API
  description: HTTP API specification for the Tachi pay-per-crawl protocol
  version: 1.0.0
  contact:
    name: Tachi Protocol
    url: https://tachi.ai
    email: support@tachi.ai
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://your-worker.your-domain.workers.dev
    description: Cloudflare Worker Gateway
  - url: https://gateway.publisher-site.com
    description: Publisher's Gateway

paths:
  /{path}:
    get:
      summary: Access protected content
      description: |
        Request content from a protected endpoint. Returns content directly for 
        human users, or HTTP 402 for AI crawlers requiring payment.
      parameters:
        - name: path
          in: path
          required: true
          description: Content path to access
          schema:
            type: string
            example: "api/articles"
        - name: User-Agent
          in: header
          required: true
          description: Client user agent (used for AI crawler detection)
          schema:
            type: string
            example: "GPTBot/1.0 (+https://openai.com/gptbot)"
        - name: Authorization
          in: header
          required: false
          description: Payment proof (Bearer token with transaction hash)
          schema:
            type: string
            example: "Bearer 0x1234567890abcdef..."
      responses:
        '200':
          description: Content delivered successfully
          headers:
            X-Tachi-Payment-Verified:
              description: Indicates payment was verified
              schema:
                type: boolean
            X-Tachi-Cost:
              description: Cost of this request in USDC
              schema:
                type: string
                example: "0.005"
          content:
            application/json:
              schema:
                type: object
                description: Requested content (format varies)
            text/html:
              schema:
                type: string
                description: HTML content
            text/plain:
              schema:
                type: string
                description: Plain text content
        '402':
          description: Payment Required
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentRequired'
        '403':
          description: Forbidden (invalid payment or blocked)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '429':
          description: Rate Limited
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /health:
    get:
      summary: Health check endpoint
      description: Check if the gateway is operational
      responses:
        '200':
          description: Gateway is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "healthy"
                  timestamp:
                    type: string
                    format: date-time
                  version:
                    type: string
                    example: "1.0.0"

components:
  schemas:
    PaymentRequired:
      type: object
      required:
        - error
        - message
        - payment
        - instructions
      properties:
        error:
          type: string
          example: "Payment Required"
        message:
          type: string
          example: "Please send 0.005 USDC to PaymentProcessor on Base network"
        payment:
          $ref: '#/components/schemas/PaymentInfo'
        instructions:
          type: array
          items:
            type: string
          example:
            - "1. Send the specified amount of USDC to the PaymentProcessor contract"
            - "2. Wait for transaction confirmation"
            - "3. Retry your request with Authorization: Bearer <transaction_hash>"
    
    PaymentInfo:
      type: object
      required:
        - amount
        - currency
        - network
        - chainId
        - recipient
        - tokenAddress
      properties:
        amount:
          type: string
          description: Payment amount in USDC
          example: "0.005"
        currency:
          type: string
          description: Payment currency
          example: "USDC"
        network:
          type: string
          description: Blockchain network
          example: "Base"
        chainId:
          type: integer
          description: Blockchain chain ID
          example: 8453
        recipient:
          type: string
          description: PaymentProcessor contract address
          example: "0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7"
        tokenAddress:
          type: string
          description: USDC token contract address
          example: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        tokenId:
          type: string
          description: Publisher's CrawlNFT token ID
          example: "1"
    
    Error:
      type: object
      required:
        - error
        - message
      properties:
        error:
          type: string
          example: "Forbidden"
        message:
          type: string
          example: "Invalid payment or insufficient amount"
        code:
          type: string
          example: "PAYMENT_INVALID"
        details:
          type: object
          description: Additional error details
```

### Postman Collection

```json
{
  "info": {
    "name": "Tachi Protocol API",
    "description": "Collection for testing Tachi Protocol pay-per-crawl endpoints",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "version": "1.0.0"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{transaction_hash}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "gateway_url",
      "value": "https://your-worker.your-domain.workers.dev",
      "type": "string"
    },
    {
      "key": "transaction_hash",
      "value": "0x1234567890abcdef...",
      "type": "string"
    },
    {
      "key": "ai_user_agent",
      "value": "GPTBot/1.0 (+https://openai.com/gptbot)",
      "type": "string"
    },
    {
      "key": "human_user_agent",
      "value": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Test AI Crawler Detection",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "User-Agent",
            "value": "{{ai_user_agent}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{gateway_url}}/api/test",
          "host": ["{{gateway_url}}"],
          "path": ["api", "test"]
        },
        "description": "Test request as AI crawler - should return 402 Payment Required"
      },
      "response": []
    },
    {
      "name": "Test Human User Access",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "User-Agent",
            "value": "{{human_user_agent}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{gateway_url}}/api/test",
          "host": ["{{gateway_url}}"],
          "path": ["api", "test"]
        },
        "description": "Test request as human user - should return content normally"
      },
      "response": []
    },
    {
      "name": "Request with Payment Proof",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "User-Agent",
            "value": "{{ai_user_agent}}",
            "type": "text"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{transaction_hash}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{gateway_url}}/api/protected-content",
          "host": ["{{gateway_url}}"],
          "path": ["api", "protected-content"]
        },
        "description": "Request with payment proof - should return content after verification"
      },
      "response": []
    },
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{gateway_url}}/health",
          "host": ["{{gateway_url}}"],
          "path": ["health"]
        },
        "description": "Check gateway health status"
      },
      "response": []
    },
    {
      "name": "POST Request with Data",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "User-Agent",
            "value": "{{ai_user_agent}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{transaction_hash}}",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"query\": \"machine learning\",\n  \"limit\": 100,\n  \"format\": \"json\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{gateway_url}}/api/search",
          "host": ["{{gateway_url}}"],
          "path": ["api", "search"]
        },
        "description": "POST request with JSON data and payment proof"
      },
      "response": []
    }
  ],
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "type": "text/javascript",
        "exec": [
          "// Set dynamic variables",
          "pm.environment.set('timestamp', new Date().toISOString());"
        ]
      }
    },
    {
      "listen": "test",
      "script": {
        "type": "text/javascript",
        "exec": [
          "// Common test assertions",
          "pm.test('Response time is acceptable', function () {",
          "    pm.expect(pm.response.responseTime).to.be.below(5000);",
          "});",
          "",
          "pm.test('Response format is valid', function () {",
          "    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');",
          "});",
          "",
          "// Check for 402 Payment Required responses",
          "if (pm.response.code === 402) {",
          "    pm.test('Payment info is provided', function () {",
          "        const response = pm.response.json();",
          "        pm.expect(response).to.have.property('payment');",
          "        pm.expect(response.payment).to.have.property('amount');",
          "        pm.expect(response.payment).to.have.property('recipient');",
          "    });",
          "}"
        ]
      }
    }
  ]
}
```

---

## Testing Examples

### End-to-End Integration Test

```javascript
// test/integration.test.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ReferenceCrawler } from '../reference-crawler/index.js';

describe('Tachi Protocol Integration Tests', () => {
    let crawler;
    let testServerUrl;
    
    beforeAll(async () => {
        // Setup test environment
        testServerUrl = process.env.TEST_GATEWAY_URL || 'http://localhost:8787';
        
        crawler = new ReferenceCrawler({
            rpcUrl: process.env.BASE_SEPOLIA_RPC_URL,
            paymentProcessorAddress: process.env.TEST_PAYMENT_PROCESSOR_ADDRESS,
            privateKey: process.env.TEST_PRIVATE_KEY,
            userAgent: 'TachiIntegrationTest/1.0',
            debug: true,
            requestDelay: 1000
        });
        
        // Check test environment
        const balance = await crawler.checkBalance();
        if (balance < 0.1) {
            throw new Error('Insufficient test USDC balance for integration tests');
        }
    });
    
    describe('AI Crawler Detection', () => {
        it('should require payment for AI crawler user agents', async () => {
            const targets = [
                `${testServerUrl}/api/test-content`
            ];
            
            const summary = await crawler.crawl(targets);
            
            expect(summary.requests.total).toBe(1);
            expect(summary.requests.successful).toBe(1);
            expect(summary.costs.totalCost).toBeGreaterThan(0);
        });
        
        it('should handle multiple concurrent requests', async () => {
            const targets = Array(5).fill().map((_, i) => 
                `${testServerUrl}/api/test-content-${i}`
            );
            
            const summary = await crawler.crawl(targets);
            
            expect(summary.requests.total).toBe(5);
            expect(summary.requests.successRate).toBe('100.0');
        });
    });
    
    describe('Payment Processing', () => {
        it('should verify payment amounts correctly', async () => {
            const results = await crawler.crawl([
                `${testServerUrl}/api/expensive-content` // Should cost more
            ]);
            
            const result = crawler.results[crawler.results.length - 1];
            expect(result.paymentRequired).toBe(true);
            expect(parseFloat(result.paymentAmount)).toBeGreaterThan(0.001);
        });
        
        it('should handle payment failures gracefully', async () => {
            // Test with insufficient balance scenario
            const results = await crawler.crawl([
                `${testServerUrl}/api/very-expensive-content`
            ]);
            
            // Should either succeed with payment or fail gracefully
            const result = crawler.results[crawler.results.length - 1];
            expect(result).toHaveProperty('success');
        });
    });
    
    describe('Content Processing', () => {
        it('should preserve content integrity', async () => {
            const results = await crawler.crawl([
                `${testServerUrl}/api/json-data`
            ]);
            
            const result = crawler.results[crawler.results.length - 1];
            expect(result.success).toBe(true);
            expect(result.contentLength).toBeGreaterThan(0);
            
            // Verify JSON content is valid
            if (result.content) {
                expect(() => JSON.parse(result.content)).not.toThrow();
            }
        });
    });
    
    afterAll(async () => {
        // Generate test report
        if (crawler.results.length > 0) {
            await crawler.saveResults('integration-test-results.json');
            console.log('✅ Integration test results saved');
        }
    });
});
```

### Load Testing Script

```javascript
// test/load-test.js
import { performance } from 'perf_hooks';

class LoadTester {
    constructor(config) {
        this.config = config;
        this.results = [];
    }
    
    async runLoadTest() {
        console.log(`🚀 Starting load test: ${this.config.concurrent} concurrent requests`);
        
        const startTime = performance.now();
        
        const promises = Array(this.config.concurrent).fill().map(async (_, index) => {
            const requestStartTime = performance.now();
            
            try {
                const response = await fetch(this.config.targetUrl, {
                    headers: {
                        'User-Agent': `LoadTestCrawler-${index}/1.0`
                    }
                });
                
                const duration = performance.now() - requestStartTime;
                
                return {
                    index,
                    success: true,
                    status: response.status,
                    duration,
                    size: parseInt(response.headers.get('content-length') || '0')
                };
                
            } catch (error) {
                const duration = performance.now() - requestStartTime;
                
                return {
                    index,
                    success: false,
                    error: error.message,
                    duration
                };
            }
        });
        
        const results = await Promise.allSettled(promises);
        const totalDuration = performance.now() - startTime;
        
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;
        
        const successfulResults = results
            .filter(r => r.status === 'fulfilled' && r.value.success)
            .map(r => r.value);
        
        const avgResponseTime = successfulResults.length > 0 
            ? successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length
            : 0;
        
        const throughput = this.config.concurrent / (totalDuration / 1000);
        
        console.log(`📊 Load Test Results:`);
        console.log(`✅ Successful: ${successful}/${this.config.concurrent}`);
        console.log(`❌ Failed: ${failed}/${this.config.concurrent}`);
        console.log(`⏱️  Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`🚀 Throughput: ${throughput.toFixed(2)} req/sec`);
        
        return {
            concurrent: this.config.concurrent,
            successful,
            failed,
            avgResponseTime,
            throughput,
            totalDuration
        };
    }
}

// Run load test
const tester = new LoadTester({
    targetUrl: process.env.TEST_GATEWAY_URL || 'http://localhost:8787',
    concurrent: 50
});

tester.runLoadTest().catch(console.error);
```

This comprehensive integration examples documentation provides developers with everything they need to integrate with Tachi Protocol, including concrete code examples, API specifications, reference implementations, and testing frameworks.