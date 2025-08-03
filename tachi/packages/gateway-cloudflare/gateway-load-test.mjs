#!/usr/bin/env node

/**
 * 🚀 TACHI GATEWAY PERFORMANCE & LOAD TESTING SUITE
 * 
 * This script performs comprehensive performance testing of the Cloudflare Worker gateway:
 * 
 * 1. Concurrent AI crawler simulation (50+ parallel requests)
 * 2. Response time analysis and latency measurement
 * 3. On-chain verification performance testing
 * 4. RPC rate limiting and bottleneck identification
 * 5. Caching optimization validation
 * 6. Production-level traffic simulation
 * 
 * Usage:
 *   node gateway-load-test.mjs [worker-url]
 * 
 * Example:
 *   node gateway-load-test.mjs https://tachi-gateway.worker.dev
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test Configuration
const CONFIG = {
  // Target URLs
  WORKER_URL: process.argv[2] || 'https://tachi-gateway.example.com',
  FALLBACK_LOCAL_URL: 'http://localhost:8787',
  
  // Load Testing Parameters
  CONCURRENT_REQUESTS: 50,
  TOTAL_REQUESTS: 200,
  WARMUP_REQUESTS: 10,
  TEST_DURATION_MS: 30000, // 30 seconds
  
  // Performance Thresholds
  MAX_ACCEPTABLE_LATENCY_MS: 2000,
  MAX_ACCEPTABLE_P95_LATENCY_MS: 3000,
  MIN_ACCEPTABLE_THROUGHPUT_RPS: 10,
  MAX_ACCEPTABLE_ERROR_RATE: 0.05, // 5%
  
  // Test Scenarios
  AI_CRAWLERS: [
    'GPTBot/1.0 (+https://openai.com/gptbot)',
    'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)',
    'Claude-Web/1.0 (+https://claude.ai/bot)',
    'Mozilla/5.0 (compatible; BingBot/1.0; +http://www.bing.com/bot)',
    'Perplexity/1.0 (+https://perplexity.ai/bot)',
    'Mozilla/5.0 (compatible; Google-Extended/1.0)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'TachiBot/1.0 (+https://tachi.ai/bot)',
  ],
  
  // Test Content
  TEST_URLS: [
    '/api/content/article/tech-news-2024',
    '/blog/ai-developments-2024',
    '/research/machine-learning-trends',
    '/content/financial-analysis',
    '/data/market-reports',
  ]
};

class GatewayLoadTester {
  constructor() {
    this.results = {
      requests: [],
      summary: {},
      errors: [],
      startTime: null,
      endTime: null
    };
    
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      http402Responses: 0,
      http200Responses: 0,
      averageLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      throughput: 0,
      errorRate: 0
    };
  }

  async runComprehensiveLoadTest() {
    console.log('🚀 TACHI GATEWAY PERFORMANCE & LOAD TESTING');
    console.log('============================================');
    console.log(`🎯 Target: ${CONFIG.WORKER_URL}`);
    console.log(`📊 Test Plan: ${CONFIG.CONCURRENT_REQUESTS} concurrent, ${CONFIG.TOTAL_REQUESTS} total requests`);
    console.log(`⏱️  Duration: ${CONFIG.TEST_DURATION_MS / 1000} seconds`);
    console.log('');

    try {
      // 1. Gateway Availability Check
      await this.checkGatewayAvailability();
      
      // 2. Warmup Phase
      await this.warmupPhase();
      
      // 3. Concurrent Load Testing
      await this.concurrentLoadTest();
      
      // 4. On-Chain Verification Performance
      await this.onChainVerificationTest();
      
      // 5. RPC Rate Limiting Test
      await this.rpcRateLimitingTest();
      
      // 6. Caching Performance Test
      await this.cachingPerformanceTest();
      
      // 7. Sustained Load Test
      await this.sustainedLoadTest();
      
      // 8. Analysis and Reporting
      this.analyzeResults();
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Load test failed:', error.message);
      this.results.errors.push({
        type: 'CRITICAL_ERROR',
        message: error.message,
        timestamp: Date.now()
      });
    }
  }

  async checkGatewayAvailability() {
    console.log('🔍 1. Gateway Availability Check');
    console.log('--------------------------------');
    
    const testUrl = CONFIG.WORKER_URL;
    const startTime = performance.now();
    
    try {
      const response = await fetch(testUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TachiLoadTester/1.0)',
        },
        timeout: 10000
      });
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      console.log(`✅ Gateway responding: ${response.status}`);
      console.log(`⚡ Initial latency: ${latency.toFixed(2)}ms`);
      console.log('');
      
      if (response.status >= 500) {
        throw new Error(`Gateway returning server errors: ${response.status}`);
      }
      
    } catch (error) {
      console.log('⚠️  Primary URL unavailable, testing fallback...');
      
      if (CONFIG.WORKER_URL !== CONFIG.FALLBACK_LOCAL_URL) {
        CONFIG.WORKER_URL = CONFIG.FALLBACK_LOCAL_URL;
        console.log(`🔄 Switched to: ${CONFIG.WORKER_URL}`);
        await this.checkGatewayAvailability();
      } else {
        throw new Error(`Gateway unavailable: ${error.message}`);
      }
    }
  }

  async warmupPhase() {
    console.log('🔥 2. Warmup Phase');
    console.log('------------------');
    
    const warmupPromises = [];
    
    for (let i = 0; i < CONFIG.WARMUP_REQUESTS; i++) {
      const userAgent = CONFIG.AI_CRAWLERS[i % CONFIG.AI_CRAWLERS.length];
      const testUrl = CONFIG.TEST_URLS[i % CONFIG.TEST_URLS.length];
      
      warmupPromises.push(this.makeSingleRequest(testUrl, userAgent, 'warmup'));
    }
    
    const warmupResults = await Promise.allSettled(warmupPromises);
    const successfulWarmups = warmupResults.filter(r => r.status === 'fulfilled').length;
    
    console.log(`✅ Warmup completed: ${successfulWarmups}/${CONFIG.WARMUP_REQUESTS} successful`);
    console.log('');
  }

  async concurrentLoadTest() {
    console.log('⚡ 3. Concurrent Load Testing');
    console.log('-----------------------------');
    console.log(`🎯 Sending ${CONFIG.CONCURRENT_REQUESTS} concurrent requests...`);
    
    this.results.startTime = performance.now();
    
    const concurrentPromises = [];
    
    for (let i = 0; i < CONFIG.CONCURRENT_REQUESTS; i++) {
      const userAgent = CONFIG.AI_CRAWLERS[i % CONFIG.AI_CRAWLERS.length];
      const testUrl = CONFIG.TEST_URLS[i % CONFIG.TEST_URLS.length];
      
      concurrentPromises.push(
        this.makeSingleRequest(testUrl, userAgent, 'concurrent')
      );
    }
    
    console.log('📡 Requests in flight...');
    const results = await Promise.allSettled(concurrentPromises);
    
    this.results.endTime = performance.now();
    const totalDuration = this.results.endTime - this.results.startTime;
    
    // Process results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Completed: ${successful} successful, ${failed} failed`);
    console.log(`⏱️  Total duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`🚀 Throughput: ${(CONFIG.CONCURRENT_REQUESTS / (totalDuration / 1000)).toFixed(2)} req/sec`);
    console.log('');
  }

  async onChainVerificationTest() {
    console.log('⛓️  4. On-Chain Verification Performance');
    console.log('----------------------------------------');
    
    // Test the added latency of on-chain verification
    const testCases = [
      {
        name: 'First request (cold start + verification)',
        headers: { 'User-Agent': CONFIG.AI_CRAWLERS[0] }
      },
      {
        name: 'With payment tx (verification required)',
        headers: { 
          'User-Agent': CONFIG.AI_CRAWLERS[0],
          'X-Payment-Tx': '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        }
      },
      {
        name: 'Repeat request (potential caching)',
        headers: { 'User-Agent': CONFIG.AI_CRAWLERS[0] }
      }
    ];
    
    for (const testCase of testCases) {
      const startTime = performance.now();
      
      try {
        const response = await fetch(CONFIG.WORKER_URL + '/test-content', {
          headers: testCase.headers,
          timeout: 15000
        });
        
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        console.log(`📊 ${testCase.name}:`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Latency: ${latency.toFixed(2)}ms`);
        
        if (latency > CONFIG.MAX_ACCEPTABLE_LATENCY_MS) {
          console.log(`   ⚠️  High latency detected!`);
        }
        
      } catch (error) {
        console.log(`❌ ${testCase.name}: ${error.message}`);
      }
    }
    
    console.log('');
  }

  async rpcRateLimitingTest() {
    console.log('🌐 5. RPC Rate Limiting Analysis');
    console.log('--------------------------------');
    
    // Test rapid-fire requests to identify RPC bottlenecks
    const rpcTestRequests = 20;
    const rpcPromises = [];
    
    console.log(`🔥 Sending ${rpcTestRequests} rapid requests to test RPC limits...`);
    
    for (let i = 0; i < rpcTestRequests; i++) {
      rpcPromises.push(
        this.makeSingleRequest('/test-rpc-heavy', CONFIG.AI_CRAWLERS[0], 'rpc-test')
      );
    }
    
    const rpcStartTime = performance.now();
    const rpcResults = await Promise.allSettled(rpcPromises);
    const rpcEndTime = performance.now();
    
    const rpcSuccessful = rpcResults.filter(r => r.status === 'fulfilled').length;
    const rpcFailed = rpcResults.filter(r => r.status === 'rejected').length;
    
    console.log(`📊 RPC Test Results:`);
    console.log(`   Successful: ${rpcSuccessful}/${rpcTestRequests}`);
    console.log(`   Failed: ${rpcFailed}/${rpcTestRequests}`);
    console.log(`   Duration: ${(rpcEndTime - rpcStartTime).toFixed(2)}ms`);
    console.log(`   Rate: ${(rpcTestRequests / ((rpcEndTime - rpcStartTime) / 1000)).toFixed(2)} req/sec`);
    
    if (rpcFailed > rpcTestRequests * 0.1) {
      console.log('⚠️  High RPC failure rate detected - possible rate limiting');
    }
    
    console.log('');
  }

  async cachingPerformanceTest() {
    console.log('💾 6. Caching Performance Analysis');
    console.log('----------------------------------');
    
    const testUrl = '/test-cacheable-content';
    const userAgent = CONFIG.AI_CRAWLERS[0];
    
    // First request (cache miss)
    console.log('📡 First request (cache miss expected)...');
    const firstStartTime = performance.now();
    await this.makeSingleRequest(testUrl, userAgent, 'cache-test-1');
    const firstEndTime = performance.now();
    const firstRequestTime = firstEndTime - firstStartTime;
    
    // Wait briefly for cache to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Second request (cache hit expected)
    console.log('📡 Second request (cache hit expected)...');
    const secondStartTime = performance.now();
    await this.makeSingleRequest(testUrl, userAgent, 'cache-test-2');
    const secondEndTime = performance.now();
    const secondRequestTime = secondEndTime - secondStartTime;
    
    console.log(`📊 Caching Analysis:`);
    console.log(`   First request: ${firstRequestTime.toFixed(2)}ms`);
    console.log(`   Second request: ${secondRequestTime.toFixed(2)}ms`);
    
    if (secondRequestTime < firstRequestTime * 0.8) {
      console.log(`✅ Caching appears effective (${((1 - secondRequestTime/firstRequestTime) * 100).toFixed(1)}% improvement)`);
    } else {
      console.log(`⚠️  Caching may not be working optimally`);
    }
    
    console.log('');
  }

  async sustainedLoadTest() {
    console.log('⏰ 7. Sustained Load Testing');
    console.log('----------------------------');
    console.log(`🎯 Running sustained load for ${CONFIG.TEST_DURATION_MS / 1000} seconds...`);
    
    const sustainedStartTime = performance.now();
    const sustainedRequests = [];
    
    // Run requests continuously for the test duration
    while (performance.now() - sustainedStartTime < CONFIG.TEST_DURATION_MS) {
      const batchPromises = [];
      
      // Send a batch of concurrent requests
      for (let i = 0; i < 10; i++) {
        const userAgent = CONFIG.AI_CRAWLERS[Math.floor(Math.random() * CONFIG.AI_CRAWLERS.length)];
        const testUrl = CONFIG.TEST_URLS[Math.floor(Math.random() * CONFIG.TEST_URLS.length)];
        
        batchPromises.push(
          this.makeSingleRequest(testUrl, userAgent, 'sustained')
        );
      }
      
      const batchResults = await Promise.allSettled(batchPromises);
      sustainedRequests.push(...batchResults);
      
      // Brief pause between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const sustainedEndTime = performance.now();
    const sustainedDuration = sustainedEndTime - sustainedStartTime;
    
    const sustainedSuccessful = sustainedRequests.filter(r => r.status === 'fulfilled').length;
    const sustainedFailed = sustainedRequests.filter(r => r.status === 'rejected').length;
    
    console.log(`📊 Sustained Load Results:`);
    console.log(`   Duration: ${(sustainedDuration / 1000).toFixed(2)} seconds`);
    console.log(`   Total requests: ${sustainedRequests.length}`);
    console.log(`   Successful: ${sustainedSuccessful}`);
    console.log(`   Failed: ${sustainedFailed}`);
    console.log(`   Average throughput: ${(sustainedRequests.length / (sustainedDuration / 1000)).toFixed(2)} req/sec`);
    console.log(`   Error rate: ${(sustainedFailed / sustainedRequests.length * 100).toFixed(2)}%`);
    console.log('');
  }

  async makeSingleRequest(path, userAgent, testType) {
    const startTime = performance.now();
    const url = CONFIG.WORKER_URL + path;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'X-Test-Type': testType,
        },
        timeout: 5000
      });
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      const result = {
        url,
        userAgent,
        testType,
        status: response.status,
        latency,
        timestamp: Date.now(),
        success: response.status < 500
      };
      
      this.results.requests.push(result);
      this.updateMetrics(result);
      
      return result;
      
    } catch (error) {
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      const result = {
        url,
        userAgent,
        testType,
        status: 0,
        latency,
        timestamp: Date.now(),
        success: false,
        error: error.message
      };
      
      this.results.requests.push(result);
      this.results.errors.push({
        type: 'REQUEST_ERROR',
        message: error.message,
        url,
        timestamp: Date.now()
      });
      
      this.updateMetrics(result);
      
      throw error;
    }
  }

  updateMetrics(result) {
    this.metrics.totalRequests++;
    
    if (result.success) {
      this.metrics.successfulRequests++;
      
      if (result.status === 402) {
        this.metrics.http402Responses++;
      } else if (result.status === 200) {
        this.metrics.http200Responses++;
      }
    } else {
      this.metrics.failedRequests++;
      
      if (result.error && result.error.includes('timeout')) {
        this.metrics.timeouts++;
      }
    }
  }

  analyzeResults() {
    console.log('📊 8. Performance Analysis');
    console.log('---------------------------');
    
    if (this.results.requests.length === 0) {
      console.log('❌ No requests to analyze');
      return;
    }
    
    // Calculate latency statistics
    const latencies = this.results.requests
      .filter(r => r.success)
      .map(r => r.latency)
      .sort((a, b) => a - b);
    
    if (latencies.length > 0) {
      this.metrics.averageLatency = latencies.reduce((a, b) => a + b) / latencies.length;
      this.metrics.p50Latency = latencies[Math.floor(latencies.length * 0.5)];
      this.metrics.p95Latency = latencies[Math.floor(latencies.length * 0.95)];
      this.metrics.p99Latency = latencies[Math.floor(latencies.length * 0.99)];
    }
    
    // Calculate throughput
    if (this.results.startTime && this.results.endTime) {
      const durationSeconds = (this.results.endTime - this.results.startTime) / 1000;
      this.metrics.throughput = this.metrics.totalRequests / durationSeconds;
    }
    
    // Calculate error rate
    this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
    
    console.log('📈 Performance Metrics:');
    console.log(`   Total Requests: ${this.metrics.totalRequests}`);
    console.log(`   Successful: ${this.metrics.successfulRequests} (${((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${this.metrics.failedRequests} (${(this.metrics.errorRate * 100).toFixed(1)}%)`);
    console.log(`   HTTP 402 (Payment Required): ${this.metrics.http402Responses}`);
    console.log(`   HTTP 200 (Success): ${this.metrics.http200Responses}`);
    console.log(`   Timeouts: ${this.metrics.timeouts}`);
    console.log('');
    
    console.log('⚡ Latency Analysis:');
    console.log(`   Average: ${this.metrics.averageLatency.toFixed(2)}ms`);
    console.log(`   P50 (Median): ${this.metrics.p50Latency.toFixed(2)}ms`);
    console.log(`   P95: ${this.metrics.p95Latency.toFixed(2)}ms`);
    console.log(`   P99: ${this.metrics.p99Latency.toFixed(2)}ms`);
    console.log('');
    
    console.log('🚀 Throughput:');
    console.log(`   Requests per second: ${this.metrics.throughput.toFixed(2)} req/sec`);
    console.log('');
  }

  generateReport() {
    console.log('📋 9. Performance Report & Recommendations');
    console.log('==========================================');
    
    const issues = [];
    const optimizations = [];
    
    // Analyze performance against thresholds
    if (this.metrics.p95Latency > CONFIG.MAX_ACCEPTABLE_P95_LATENCY_MS) {
      issues.push(`High P95 latency: ${this.metrics.p95Latency.toFixed(2)}ms > ${CONFIG.MAX_ACCEPTABLE_P95_LATENCY_MS}ms threshold`);
      optimizations.push('Consider implementing request caching');
      optimizations.push('Optimize on-chain verification logic');
    }
    
    if (this.metrics.throughput < CONFIG.MIN_ACCEPTABLE_THROUGHPUT_RPS) {
      issues.push(`Low throughput: ${this.metrics.throughput.toFixed(2)} < ${CONFIG.MIN_ACCEPTABLE_THROUGHPUT_RPS} req/sec threshold`);
      optimizations.push('Review worker computational complexity');
      optimizations.push('Consider connection pooling for RPC calls');
    }
    
    if (this.metrics.errorRate > CONFIG.MAX_ACCEPTABLE_ERROR_RATE) {
      issues.push(`High error rate: ${(this.metrics.errorRate * 100).toFixed(1)}% > ${(CONFIG.MAX_ACCEPTABLE_ERROR_RATE * 100).toFixed(1)}% threshold`);
      optimizations.push('Implement better error handling and retries');
      optimizations.push('Add circuit breakers for external dependencies');
    }
    
    // Report findings
    if (issues.length === 0) {
      console.log('✅ PERFORMANCE TEST: PASSED');
      console.log('All metrics are within acceptable thresholds!');
      console.log('');
      console.log('🎯 Gateway is ready for production-level traffic.');
      
    } else {
      console.log('⚠️  PERFORMANCE TEST: ISSUES DETECTED');
      console.log('');
      console.log('🔴 Issues Found:');
      issues.forEach(issue => console.log(`   • ${issue}`));
      console.log('');
      
      console.log('💡 Recommended Optimizations:');
      optimizations.forEach(opt => console.log(`   • ${opt}`));
      console.log('');
    }
    
    // Save detailed report
    this.saveDetailedReport();
    
    console.log('💾 Detailed results saved to: gateway-load-test-results.json');
    console.log('');
    
    console.log('🎯 PRODUCTION READINESS ASSESSMENT:');
    if (issues.length === 0) {
      console.log('✅ READY - Gateway can handle production-level AI crawler traffic');
    } else if (issues.length <= 2) {
      console.log('⚠️  CONDITIONAL - Address identified issues before full production');
    } else {
      console.log('❌ NOT READY - Significant optimization needed before production');
    }
  }

  saveDetailedReport() {
    const report = {
      testConfig: CONFIG,
      metrics: this.metrics,
      results: this.results,
      timestamp: new Date().toISOString(),
      testDurationMs: this.results.endTime - this.results.startTime
    };
    
    const filename = path.join(__dirname, 'gateway-load-test-results.json');
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  }
}

// Run the load test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new GatewayLoadTester();
  tester.runComprehensiveLoadTest().catch(console.error);
}

export { GatewayLoadTester };
