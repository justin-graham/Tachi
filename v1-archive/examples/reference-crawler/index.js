#!/usr/bin/env node

/**
 * Tachi Protocol Reference Crawler
 * 
 * This is a complete reference implementation demonstrating how to build
 * an AI crawler that integrates with the Tachi Protocol for pay-per-crawl
 * content access.
 * 
 * Features:
 * - Automatic payment processing
 * - Rate limiting and politeness
 * - Comprehensive error handling
 * - Detailed logging and analytics
 * - Configurable content processing
 * - Multiple output formats
 */

import { createBaseSDK } from '@tachi/sdk-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TachiReferenceCrawler {
    constructor(config = {}) {
        this.config = {
            // Default configuration
            userAgent: 'TachiReferenceCrawler/1.0 (+https://github.com/tachi-protocol/tachi)',
            requestDelay: 2000, // 2 seconds between requests
            maxRetries: 3,
            timeout: 30000,
            outputDir: './output',
            logLevel: 'info',
            includeContent: false,
            maxConcurrent: 3,
            
            // Override with provided config
            ...config
        };
        
        // Initialize SDK
        this.sdk = createBaseSDK({
            rpcUrl: this.config.rpcUrl,
            paymentProcessorAddress: this.config.paymentProcessorAddress,
            ownerPrivateKey: this.config.privateKey,
            userAgent: this.config.userAgent,
            debug: this.config.logLevel === 'debug'
        });
        
        // Initialize state
        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            endTime: null,
            stats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                paidRequests: 0,
                totalCost: 0,
                totalDataTransfer: 0
            },
            results: []
        };
        
        this.log('info', `🚀 Tachi Reference Crawler initialized (Session: ${this.session.id})`);
    }
    
    /**
     * Main crawling method
     */
    async crawl(targets, options = {}) {
        try {
            this.log('info', `Starting crawl session with ${targets.length} targets`);
            
            // Validate configuration
            await this.validateConfig();
            
            // Check initial balance
            await this.checkBalance();
            
            // Ensure output directory exists
            await this.ensureOutputDir();
            
            // Process targets with concurrency control
            const results = await this.procesTargetsWithConcurrency(targets, options);
            
            // Finalize session
            this.session.endTime = Date.now();
            
            // Generate and save results
            const summary = await this.generateSummary();
            await this.saveResults();
            
            this.log('info', '✅ Crawl session completed successfully');
            
            return summary;
            
        } catch (error) {
            this.log('error', `❌ Crawl session failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Process targets with concurrency control
     */
    async procesTargetsWithConcurrency(targets, options) {
        const { concurrent = this.config.maxConcurrent } = options;
        const results = [];
        
        // Process in batches to control concurrency
        for (let i = 0; i < targets.length; i += concurrent) {
            const batch = targets.slice(i, i + concurrent);
            const batchNum = Math.floor(i / concurrent) + 1;
            const totalBatches = Math.ceil(targets.length / concurrent);
            
            this.log('info', `📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} targets)`);
            
            const batchPromises = batch.map(target => this.crawlTarget(target));
            const batchResults = await Promise.allSettled(batchPromises);
            
            results.push(...batchResults);
            
            // Delay between batches (except for the last one)
            if (i + concurrent < targets.length && this.config.requestDelay > 0) {
                this.log('debug', `⏱️  Waiting ${this.config.requestDelay}ms before next batch`);
                await this.sleep(this.config.requestDelay);
            }
        }
        
        return results;
    }
    
    /**
     * Crawl a single target
     */
    async crawlTarget(target) {
        const startTime = Date.now();
        let url, options = {};
        
        // Parse target
        if (typeof target === 'string') {
            url = target;
        } else if (typeof target === 'object' && target.url) {
            url = target.url;
            options = target.options || {};
        } else {
            throw new Error('Invalid target format. Expected string URL or object with url property.');
        }
        
        // Update stats
        this.session.stats.totalRequests++;
        
        try {
            this.log('info', `🔍 Crawling: ${url}`);
            
            const response = await this.sdk.fetchWithTachi(url, options);
            const duration = Date.now() - startTime;
            
            // Log payment if required
            if (response.paymentRequired) {
                this.log('info', `💰 Payment: ${response.paymentAmount} USDC (tx: ${response.transactionHash})`);
                this.session.stats.paidRequests++;
                this.session.stats.totalCost += parseFloat(response.paymentAmount || '0');
            }
            
            // Update stats
            this.session.stats.successfulRequests++;
            this.session.stats.totalDataTransfer += response.content.length;
            
            // Create result object
            const result = {
                url,
                success: true,
                statusCode: response.statusCode,
                contentLength: response.content.length,
                contentType: response.headers['content-type'] || 'unknown',
                paymentRequired: response.paymentRequired,
                paymentAmount: response.paymentAmount,
                transactionHash: response.transactionHash,
                duration,
                timestamp: new Date().toISOString(),
                
                // Include content if configured
                content: this.config.includeContent ? response.content : null,
                
                // Include headers if debug mode
                headers: this.config.logLevel === 'debug' ? response.headers : null
            };
            
            // Store result
            this.session.results.push(result);
            
            // Process content if processor is provided
            if (this.config.contentProcessor) {
                try {
                    await this.config.contentProcessor(response.content, result);
                } catch (error) {
                    this.log('warn', `Content processor failed for ${url}: ${error.message}`);
                }
            }
            
            this.log('info', `✅ Success: ${url} (${duration}ms, ${this.formatBytes(response.content.length)})`);
            
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Update stats
            this.session.stats.failedRequests++;
            
            // Create error result
            const result = {
                url,
                success: false,
                error: error.message,
                errorCode: error.code,
                duration,
                timestamp: new Date().toISOString()
            };
            
            // Store result
            this.session.results.push(result);
            
            this.log('error', `❌ Failed: ${url} - ${error.message} (${duration}ms)`);
            
            return result;
        }
    }
    
    /**
     * Validate configuration
     */
    async validateConfig() {
        const required = ['rpcUrl', 'paymentProcessorAddress', 'privateKey'];
        const missing = required.filter(key => !this.config[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }
        
        this.log('debug', '✅ Configuration validated');
    }
    
    /**
     * Check USDC balance
     */
    async checkBalance() {
        try {
            const balance = await this.sdk.getBalance();
            const balanceNum = parseFloat(balance);
            
            this.log('info', `💰 Current USDC balance: ${balance}`);
            
            if (balanceNum < 0.1) {
                this.log('warn', '⚠️  Low USDC balance detected. Consider topping up before crawling.');
            }
            
            return balanceNum;
            
        } catch (error) {
            this.log('warn', `Failed to check balance: ${error.message}`);
            return 0;
        }
    }
    
    /**
     * Generate session summary
     */
    async generateSummary() {
        const duration = this.session.endTime - this.session.startTime;
        const stats = this.session.stats;
        
        const successful = this.session.results.filter(r => r.success);
        const failed = this.session.results.filter(r => !r.success);
        
        const summary = {
            session: {
                id: this.session.id,
                duration: duration,
                startTime: new Date(this.session.startTime).toISOString(),
                endTime: new Date(this.session.endTime).toISOString(),
                userAgent: this.config.userAgent
            },
            requests: {
                total: stats.totalRequests,
                successful: stats.successfulRequests,
                failed: stats.failedRequests,
                successRate: stats.totalRequests > 0 
                    ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) 
                    : '0.0'
            },
            payments: {
                paidRequests: stats.paidRequests,
                totalCost: stats.totalCost,
                averageCostPerRequest: stats.paidRequests > 0 
                    ? (stats.totalCost / stats.paidRequests).toFixed(6)
                    : '0.000000',
                paymentRate: stats.totalRequests > 0
                    ? ((stats.paidRequests / stats.totalRequests) * 100).toFixed(1)
                    : '0.0'
            },
            performance: {
                requestsPerSecond: duration > 0 ? (stats.totalRequests / (duration / 1000)).toFixed(2) : '0.00',
                averageResponseTime: successful.length > 0 
                    ? (successful.reduce((sum, r) => sum + r.duration, 0) / successful.length).toFixed(0)
                    : '0',
                totalDataTransfer: this.formatBytes(stats.totalDataTransfer),
                dataTransferMB: (stats.totalDataTransfer / 1024 / 1024).toFixed(2)
            },
            errors: this.analyzeErrors(failed)
        };
        
        // Log summary
        this.log('info', '\n📊 Session Summary:');
        this.log('info', `⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
        this.log('info', `📈 Success Rate: ${summary.requests.successRate}%`);
        this.log('info', `💰 Total Cost: ${summary.payments.totalCost.toFixed(6)} USDC`);
        this.log('info', `📊 Data Transfer: ${summary.performance.totalDataTransfer}`);
        this.log('info', `⚡ Avg Response Time: ${summary.performance.averageResponseTime}ms`);
        
        return summary;
    }
    
    /**
     * Analyze errors for common patterns
     */
    analyzeErrors(failed) {
        const errorCounts = {};
        const errorTypes = {};
        
        failed.forEach(result => {
            // Count by error message
            const message = result.error || 'Unknown error';
            errorCounts[message] = (errorCounts[message] || 0) + 1;
            
            // Categorize by error type
            if (result.errorCode) {
                errorTypes[result.errorCode] = (errorTypes[result.errorCode] || 0) + 1;
            } else if (message.includes('timeout')) {
                errorTypes.timeout = (errorTypes.timeout || 0) + 1;
            } else if (message.includes('payment') || message.includes('Payment')) {
                errorTypes.payment = (errorTypes.payment || 0) + 1;
            } else if (message.includes('network') || message.includes('Network')) {
                errorTypes.network = (errorTypes.network || 0) + 1;
            } else {
                errorTypes.other = (errorTypes.other || 0) + 1;
            }
        });
        
        return {
            totalErrors: failed.length,
            errorCounts,
            errorTypes
        };
    }
    
    /**
     * Save results to files
     */
    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const basename = `crawl-${this.session.id}-${timestamp}`;
        
        // Save detailed results
        const detailedResults = {
            metadata: {
                crawlerVersion: '1.0.0',
                sdkVersion: '1.0.0',
                nodeVersion: process.version,
                platform: process.platform,
                sessionId: this.session.id,
                config: {
                    userAgent: this.config.userAgent,
                    requestDelay: this.config.requestDelay,
                    maxConcurrent: this.config.maxConcurrent,
                    includeContent: this.config.includeContent
                }
            },
            summary: await this.generateSummary(),
            results: this.session.results
        };
        
        const detailedFile = path.join(this.config.outputDir, `${basename}-detailed.json`);
        await fs.writeFile(detailedFile, JSON.stringify(detailedResults, null, 2));
        this.log('info', `📄 Detailed results saved to ${detailedFile}`);
        
        // Save summary only
        const summaryFile = path.join(this.config.outputDir, `${basename}-summary.json`);
        await fs.writeFile(summaryFile, JSON.stringify(detailedResults.summary, null, 2));
        this.log('info', `📄 Summary saved to ${summaryFile}`);
        
        // Save CSV for analysis
        await this.saveCsvResults(basename);
        
        // Save failed URLs for retry
        const failed = this.session.results.filter(r => !r.success);
        if (failed.length > 0) {
            const failedUrls = failed.map(r => r.url);
            const failedFile = path.join(this.config.outputDir, `${basename}-failed-urls.txt`);
            await fs.writeFile(failedFile, failedUrls.join('\n'));
            this.log('info', `📄 Failed URLs saved to ${failedFile}`);
        }
    }
    
    /**
     * Save results in CSV format
     */
    async saveCsvResults(basename) {
        const csvHeaders = [
            'url',
            'success',
            'status_code',
            'content_length',
            'content_type',
            'payment_required',
            'payment_amount',
            'duration_ms',
            'timestamp',
            'error'
        ];
        
        const csvRows = this.session.results.map(result => [
            result.url,
            result.success,
            result.statusCode || '',
            result.contentLength || '',
            result.contentType || '',
            result.paymentRequired || false,
            result.paymentAmount || '',
            result.duration,
            result.timestamp,
            result.error || ''
        ]);
        
        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(cell => 
                typeof cell === 'string' && cell.includes(',') 
                    ? `"${cell.replace(/"/g, '""')}"` 
                    : cell
            ).join(','))
        ].join('\n');
        
        const csvFile = path.join(this.config.outputDir, `${basename}-results.csv`);
        await fs.writeFile(csvFile, csvContent);
        this.log('info', `📄 CSV results saved to ${csvFile}`);
    }
    
    /**
     * Utility methods
     */
    
    async ensureOutputDir() {
        try {
            await fs.access(this.config.outputDir);
        } catch {
            await fs.mkdir(this.config.outputDir, { recursive: true });
            this.log('debug', `📁 Created output directory: ${this.config.outputDir}`);
        }
    }
    
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    log(level, message) {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        const configLevel = levels[this.config.logLevel] || 2;
        
        if (levels[level] <= configLevel) {
            const timestamp = new Date().toISOString();
            const prefix = {
                error: '❌',
                warn: '⚠️ ',
                info: 'ℹ️ ',
                debug: '🔍'
            }[level] || 'ℹ️ ';
            
            console.log(`[${timestamp}] ${prefix} ${message}`);
        }
    }
}

/**
 * CLI interface and example usage
 */
export async function main() {
    // Load environment variables if available
    try {
        const dotenv = await import('dotenv');
        dotenv.config();
    } catch {
        // dotenv not available, continue without it
    }
    
    // Configuration from environment variables
    const config = {
        rpcUrl: process.env.BASE_RPC_URL,
        paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS,
        privateKey: process.env.CRAWLER_PRIVATE_KEY,
        userAgent: process.env.USER_AGENT || 'TachiReferenceCrawler/1.0 (+https://github.com/tachi-protocol/tachi)',
        requestDelay: parseInt(process.env.REQUEST_DELAY || '2000'),
        maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '3'),
        logLevel: process.env.LOG_LEVEL || 'info',
        includeContent: process.env.INCLUDE_CONTENT === 'true',
        outputDir: process.env.OUTPUT_DIR || './output',
        
        // Optional content processor
        contentProcessor: async (content, result) => {
            // Example: Extract and log data type
            if (result.contentType?.includes('json')) {
                try {
                    const data = JSON.parse(content);
                    console.log(`📊 JSON data extracted: ${Object.keys(data).length} fields`);
                } catch (e) {
                    console.log(`⚠️  Invalid JSON content at ${result.url}`);
                }
            }
        }
    };
    
    // Validate required configuration
    if (!config.rpcUrl || !config.paymentProcessorAddress || !config.privateKey) {
        console.error('❌ Missing required environment variables:');
        console.error('   BASE_RPC_URL - Base network RPC endpoint');
        console.error('   PAYMENT_PROCESSOR_ADDRESS - PaymentProcessor contract address');
        console.error('   CRAWLER_PRIVATE_KEY - Your crawler\'s private key');
        console.error('\nExample:');
        console.error('   export BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR-KEY"');
        console.error('   export PAYMENT_PROCESSOR_ADDRESS="0x..."');
        console.error('   export CRAWLER_PRIVATE_KEY="0x..."');
        process.exit(1);
    }
    
    // Define crawl targets
    const targets = process.argv.slice(2);
    
    if (targets.length === 0) {
        console.log('🎯 Tachi Reference Crawler');
        console.log('Usage: node index.js <url1> [url2] [url3] ...');
        console.log('');
        console.log('Example:');
        console.log('   node index.js https://example.com/api/data https://site.com/content');
        console.log('');
        console.log('Environment variables:');
        console.log('   BASE_RPC_URL               - Base network RPC endpoint (required)');
        console.log('   PAYMENT_PROCESSOR_ADDRESS  - PaymentProcessor contract address (required)');
        console.log('   CRAWLER_PRIVATE_KEY        - Your crawler\'s private key (required)');
        console.log('   USER_AGENT                 - Custom User-Agent string');
        console.log('   REQUEST_DELAY              - Delay between requests in ms (default: 2000)');
        console.log('   MAX_CONCURRENT             - Max concurrent requests (default: 3)');
        console.log('   LOG_LEVEL                  - Logging level: error|warn|info|debug (default: info)');
        console.log('   INCLUDE_CONTENT            - Include content in results (default: false)');
        console.log('   OUTPUT_DIR                 - Output directory (default: ./output)');
        
        process.exit(0);
    }
    
    try {
        const crawler = new TachiReferenceCrawler(config);
        const summary = await crawler.crawl(targets);
        
        console.log('\n🎉 Crawl completed successfully!');
        console.log(`📊 Results: ${summary.requests.successful}/${summary.requests.total} successful`);
        console.log(`💰 Total cost: ${summary.payments.totalCost.toFixed(6)} USDC`);
        console.log(`📁 Output saved to: ${config.outputDir}`);
        
    } catch (error) {
        console.error(`❌ Crawl failed: ${error.message}`);
        process.exit(1);
    }
}

// Export the class for use as a library
export { TachiReferenceCrawler };

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error(error);
        process.exit(1);
    });
}