#!/usr/bin/env node

/**
 * Tachi Reference Crawler Demo
 * 
 * This demo script shows how to use the reference crawler
 * with various configuration options and target types.
 */

import { TachiReferenceCrawler } from './index.js';

async function runDemo() {
    console.log('🎯 Tachi Reference Crawler Demo');
    console.log('================================\n');
    
    // Demo configuration
    const config = {
        // Use environment variables or demo values
        rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/demo',
        paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS || '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7',
        privateKey: process.env.DEMO_PRIVATE_KEY || '0x' + 'a'.repeat(64), // Demo key
        
        userAgent: 'TachiDemoCrawler/1.0 (+https://github.com/tachi-protocol/tachi)',
        requestDelay: 1500, // 1.5 seconds between requests
        maxConcurrent: 2,
        logLevel: 'info',
        includeContent: false,
        outputDir: './demo-output',
        
        // Demo content processor
        contentProcessor: async (content, result) => {
            console.log(`📊 Processed ${result.url}: ${content.length} bytes`);
            
            // Extract metadata based on content type
            if (result.contentType?.includes('json')) {
                try {
                    const data = JSON.parse(content);
                    console.log(`   └── JSON object with ${Object.keys(data).length} fields`);
                } catch (e) {
                    console.log(`   └── Invalid JSON content`);
                }
            } else if (result.contentType?.includes('html')) {
                const titleMatch = content.match(/<title>(.*?)<\/title>/i);
                if (titleMatch) {
                    console.log(`   └── HTML page: "${titleMatch[1]}"`);
                }
            }
        }
    };
    
    console.log('📋 Demo Configuration:');
    console.log(`   RPC URL: ${config.rpcUrl}`);
    console.log(`   Payment Processor: ${config.paymentProcessorAddress}`);
    console.log(`   User Agent: ${config.userAgent}`);
    console.log(`   Request Delay: ${config.requestDelay}ms`);
    console.log(`   Max Concurrent: ${config.maxConcurrent}`);
    console.log('');
    
    // Create crawler instance
    const crawler = new TachiReferenceCrawler(config);
    
    // Define demo targets (mix of different types)
    const targets = [
        // Simple URL strings
        'https://httpbin.org/json',
        'https://httpbin.org/html',
        
        // Object with custom options
        {
            url: 'https://httpbin.org/post',
            options: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    demo: true,
                    crawler: 'tachi-reference',
                    timestamp: new Date().toISOString()
                })
            }
        },
        
        // API endpoint
        'https://httpbin.org/user-agent',
        
        // Test delay endpoint
        'https://httpbin.org/delay/1'
    ];
    
    console.log(`🚀 Starting demo crawl with ${targets.length} targets...\n`);
    
    try {
        // Run the crawl
        const summary = await crawler.crawl(targets);
        
        // Display results
        console.log('\n🎉 Demo completed successfully!');
        console.log('');
        console.log('📊 Final Summary:');
        console.log(`   Session ID: ${summary.session.id}`);
        console.log(`   Duration: ${(summary.session.duration / 1000).toFixed(1)}s`);
        console.log(`   Success Rate: ${summary.requests.successRate}%`);
        console.log(`   Total Cost: ${summary.payments.totalCost.toFixed(6)} USDC`);
        console.log(`   Paid Requests: ${summary.payments.paidRequests}/${summary.requests.total}`);
        console.log(`   Data Transfer: ${summary.performance.totalDataTransfer}`);
        console.log(`   Avg Response Time: ${summary.performance.averageResponseTime}ms`);
        console.log('');
        
        // Show payment breakdown if any payments were made
        if (summary.payments.paidRequests > 0) {
            console.log('💰 Payment Breakdown:');
            console.log(`   Payment Rate: ${summary.payments.paymentRate}% of requests`);
            console.log(`   Average Cost: ${summary.payments.averageCostPerRequest} USDC per paid request`);
            console.log('');
        }
        
        // Show error analysis if any failures
        if (summary.errors.totalErrors > 0) {
            console.log('❌ Error Analysis:');
            console.log(`   Total Errors: ${summary.errors.totalErrors}`);
            console.log('   Error Types:');
            Object.entries(summary.errors.errorTypes).forEach(([type, count]) => {
                console.log(`     ${type}: ${count}`);
            });
            console.log('');
        }
        
        console.log(`📁 Results saved to: ${config.outputDir}/`);
        console.log('');
        console.log('🔍 Next Steps:');
        console.log('   1. Check the output directory for detailed results');
        console.log('   2. Modify the config for your specific use case');
        console.log('   3. Add your own content processing logic');
        console.log('   4. Integrate with your data pipeline');
        
        return summary;
        
    } catch (error) {
        console.error(`❌ Demo failed: ${error.message}`);
        
        if (error.message.includes('Missing required')) {
            console.log('');
            console.log('💡 To run with real payment processing, set these environment variables:');
            console.log('   export BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR-KEY"');
            console.log('   export PAYMENT_PROCESSOR_ADDRESS="0x..."');
            console.log('   export DEMO_PRIVATE_KEY="0x..."');
        }
        
        process.exit(1);
    }
}

// Show usage if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('This demo shows the Tachi Reference Crawler in action.\n');
    
    // Check if this is likely a real environment
    if (process.env.BASE_RPC_URL && process.env.PAYMENT_PROCESSOR_ADDRESS) {
        console.log('🔗 Real environment detected - will use actual payment processing');
    } else {
        console.log('🧪 Demo mode - using test endpoints (no real payments required)');
        console.log('💡 Set BASE_RPC_URL and PAYMENT_PROCESSOR_ADDRESS for real testing');
    }
    
    console.log('');
    
    runDemo().catch(error => {
        console.error('Demo error:', error);
        process.exit(1);
    });
}

export { runDemo };