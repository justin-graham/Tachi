# Tachi Reference Crawler

A complete reference implementation of an AI crawler that integrates with the Tachi Protocol for pay-per-crawl content access.

## Features

- ✅ **Automatic payment processing** using Tachi SDK
- ✅ **Rate limiting and politeness** with configurable delays
- ✅ **Comprehensive error handling** and retry logic
- ✅ **Detailed logging and analytics** with multiple output formats
- ✅ **Configurable content processing** for custom data extraction
- ✅ **Multiple output formats** (JSON, CSV, summary reports)
- ✅ **Session management** with unique session IDs
- ✅ **Balance monitoring** and cost tracking
- ✅ **Concurrent request control** with batch processing

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `BASE_RPC_URL` - Base network RPC endpoint
- `PAYMENT_PROCESSOR_ADDRESS` - PaymentProcessor contract address  
- `CRAWLER_PRIVATE_KEY` - Your crawler's private key

### 3. Run the Demo

```bash
npm run demo
```

### 4. Crawl Real URLs

```bash
npm start https://example.com/api/data https://site.com/content
```

## Usage Examples

### Basic Command Line Usage

```bash
# Single URL
node index.js https://protected-site.com/api/articles

# Multiple URLs
node index.js \
  https://site1.com/data \
  https://site2.com/api/content \
  https://site3.com/research

# With environment configuration
LOG_LEVEL=debug REQUEST_DELAY=3000 node index.js https://example.com
```

### Programmatic Usage

```javascript
import { TachiReferenceCrawler } from './index.js';

const crawler = new TachiReferenceCrawler({
  rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-KEY',
  paymentProcessorAddress: '0x...',
  privateKey: '0x...',
  userAgent: 'MyCrawler/1.0',
  requestDelay: 2000,
  logLevel: 'info'
});

const targets = [
  'https://example.com/api/data',
  {
    url: 'https://example.com/search',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'AI research' })
    }
  }
];

const summary = await crawler.crawl(targets);
console.log(`Crawled ${summary.requests.successful} URLs successfully`);
```

### Custom Content Processing

```javascript
const crawler = new TachiReferenceCrawler({
  // ... configuration
  
  contentProcessor: async (content, result) => {
    // Extract specific data based on content type
    if (result.contentType?.includes('json')) {
      const data = JSON.parse(content);
      
      // Save to database
      await saveToDatabase(data);
      
      // Process for ML training
      await processForTraining(data);
      
      console.log(`Processed JSON data: ${Object.keys(data).length} fields`);
    }
  }
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rpcUrl` | string | required | Base network RPC endpoint |
| `paymentProcessorAddress` | string | required | PaymentProcessor contract address |
| `privateKey` | string | required | Crawler's private key |
| `userAgent` | string | `TachiReferenceCrawler/1.0` | User-Agent string |
| `requestDelay` | number | `2000` | Delay between requests (ms) |
| `maxConcurrent` | number | `3` | Max concurrent requests |
| `timeout` | number | `30000` | Request timeout (ms) |
| `maxRetries` | number | `3` | Max retry attempts |
| `logLevel` | string | `info` | Logging level (error\|warn\|info\|debug) |
| `includeContent` | boolean | `false` | Include content in results |
| `outputDir` | string | `./output` | Output directory |
| `contentProcessor` | function | `null` | Custom content processing function |

## Output Files

The crawler generates several output files in the configured output directory:

### Detailed Results (`crawl-{sessionId}-{timestamp}-detailed.json`)
Complete crawl session data including:
- Metadata (crawler version, config, environment)
- Summary statistics
- Individual request results
- Error analysis

### Summary Report (`crawl-{sessionId}-{timestamp}-summary.json`)
High-level session statistics:
- Request counts and success rates
- Payment information and costs
- Performance metrics
- Error categorization

### CSV Export (`crawl-{sessionId}-{timestamp}-results.csv`)
Spreadsheet-friendly format with columns:
- URL, success status, response details
- Payment information
- Performance metrics
- Error information

### Failed URLs (`crawl-{sessionId}-{timestamp}-failed-urls.txt`)
List of URLs that failed (for easy retry)

## Error Handling

The crawler handles various error scenarios:

- **Payment failures**: Insufficient balance, invalid transactions
- **Network errors**: Timeouts, connection failures  
- **Rate limiting**: 429 responses with backoff
- **Authentication errors**: Invalid payment proofs
- **Content errors**: Invalid responses, parsing failures

Errors are categorized and analyzed in the output for easy debugging.

## Performance Monitoring

The crawler tracks comprehensive metrics:

- **Request statistics**: Total, successful, failed, success rate
- **Payment metrics**: Cost tracking, payment rate analysis
- **Performance data**: Response times, throughput, data transfer
- **Error analysis**: Categorized error counts and patterns

## Best Practices

### 1. Rate Limiting
```javascript
// Be respectful - use appropriate delays
requestDelay: 2000, // 2 seconds between requests
maxConcurrent: 3,   // Max 3 concurrent requests
```

### 2. User Agent
```javascript
// Use descriptive User-Agent with contact info
userAgent: 'MyCompanyCrawler/1.0 (+https://mycompany.com/crawler-info)'
```

### 3. Error Handling
```javascript
// Monitor balance before large crawl sessions
const balance = await crawler.checkBalance();
if (balance < estimatedCost) {
  console.warn('Insufficient balance for planned crawl');
}
```

### 4. Content Processing
```javascript
// Process content efficiently to avoid memory issues
contentProcessor: async (content, result) => {
  // Stream large content to disk instead of keeping in memory
  if (result.contentLength > 10 * 1024 * 1024) { // 10MB
    await streamToFile(content, `content-${result.url.hash}.dat`);
  }
}
```

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure `.env` file exists with required values
   - Check that environment variables are correctly named

2. **"Insufficient USDC balance"**
   - Check your wallet balance on Base network
   - Add USDC to your crawler wallet

3. **"Payment verification failed"**
   - Verify PaymentProcessor contract address is correct
   - Ensure sufficient ETH for gas fees
   - Check Base network connectivity

4. **High failure rates**
   - Reduce `maxConcurrent` setting
   - Increase `requestDelay` to be more polite
   - Check target site's rate limiting policies

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
LOG_LEVEL=debug node index.js https://example.com
```

Debug mode shows:
- Detailed request/response information
- Payment transaction details
- SDK internal logging
- Response headers and metadata

## Integration Examples

### With Data Pipeline

```javascript
const crawler = new TachiReferenceCrawler({
  // ... config
  contentProcessor: async (content, result) => {
    // Send to processing pipeline
    await publishToQueue('content-processing', {
      url: result.url,
      content: content,
      metadata: {
        crawledAt: result.timestamp,
        cost: result.paymentAmount,
        contentType: result.contentType
      }
    });
  }
});
```

### With ML Training Pipeline

```javascript
const crawler = new TachiReferenceCrawler({
  // ... config
  contentProcessor: async (content, result) => {
    if (result.contentType?.includes('json')) {
      const data = JSON.parse(content);
      
      // Prepare for ML training
      const trainingData = {
        text: data.content || data.text || content,
        metadata: {
          source: result.url,
          crawled_at: result.timestamp,
          cost_usd: result.paymentAmount
        }
      };
      
      // Add to training dataset
      await addToTrainingSet(trainingData);
    }
  }
});
```

### With Analytics

```javascript
// Track crawl metrics in your analytics system
const summary = await crawler.crawl(urls);

analytics.track('crawl_session_completed', {
  session_id: summary.session.id,
  urls_crawled: summary.requests.total,
  success_rate: parseFloat(summary.requests.successRate),
  total_cost: summary.payments.totalCost,
  data_transfer_mb: parseFloat(summary.performance.dataTransferMB)
});
```

## Contributing

This reference crawler is open source and contributions are welcome! 

Common improvements:
- Additional output formats
- Integration with popular data tools
- Performance optimizations
- Enhanced error recovery
- Better content type detection

## License

MIT License - see the main Tachi Protocol repository for details.

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/tachi-protocol/tachi/issues)
- **Documentation**: [Full Tachi Protocol docs](https://docs.tachi.ai)
- **Discord**: [Join the community](https://discord.gg/tachi-protocol)

---

This reference crawler demonstrates best practices for integrating with Tachi Protocol. Use it as a starting point for your own AI crawling applications!