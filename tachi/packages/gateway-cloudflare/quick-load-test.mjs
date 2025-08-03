#!/usr/bin/env node

/**
 * 🚀 SIMPLE GATEWAY PERFORMANCE TEST
 * 
 * Quick performance test script that can run against local or deployed worker.
 * Sends 50 concurrent requests with AI crawler User-Agents and measures performance.
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

// Configuration
const WORKER_URL = process.argv[2] || 'http://localhost:8787';
const CONCURRENT_REQUESTS = 50;

const AI_CRAWLERS = [
  'GPTBot/1.0 (+https://openai.com/gptbot)',
  'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)',
  'Claude-Web/1.0 (+https://claude.ai/bot)',
  'Mozilla/5.0 (compatible; BingBot/1.0; +http://www.bing.com/bot)',
  'Perplexity/1.0 (+https://perplexity.ai/bot)',
];

async function runQuickLoadTest() {
  console.log('🚀 Quick Gateway Performance Test');
  console.log('==================================');
  console.log(`🎯 Target: ${WORKER_URL}`);
  console.log(`📊 Sending ${CONCURRENT_REQUESTS} concurrent requests...`);
  console.log('');

  const promises = [];
  const startTime = performance.now();

  // Create concurrent requests
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    const userAgent = AI_CRAWLERS[i % AI_CRAWLERS.length];
    const testPath = `/test-content-${i}`;
    
    promises.push(makeRequest(WORKER_URL + testPath, userAgent, i));
  }

  // Wait for all requests to complete
  const results = await Promise.allSettled(promises);
  const endTime = performance.now();
  
  // Analyze results
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  const totalDuration = endTime - startTime;
  
  // Calculate latency statistics
  const latencies = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.latency)
    .sort((a, b) => a - b);
  
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50Latency = latencies[Math.floor(latencies.length * 0.5)];
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
  
  // Get response status distribution
  const statusCounts = {};
  results.filter(r => r.status === 'fulfilled').forEach(r => {
    const status = r.value.status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  console.log('📊 RESULTS:');
  console.log('===========');
  console.log(`✅ Successful: ${successful}/${CONCURRENT_REQUESTS} (${(successful/CONCURRENT_REQUESTS*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed}/${CONCURRENT_REQUESTS} (${(failed/CONCURRENT_REQUESTS*100).toFixed(1)}%)`);
  console.log(`⏱️  Total duration: ${totalDuration.toFixed(2)}ms`);
  console.log(`🚀 Throughput: ${(CONCURRENT_REQUESTS / (totalDuration / 1000)).toFixed(2)} req/sec`);
  console.log('');
  
  console.log('⚡ Latency:');
  console.log(`   Average: ${avgLatency.toFixed(2)}ms`);
  console.log(`   P50 (median): ${p50Latency.toFixed(2)}ms`);
  console.log(`   P95: ${p95Latency.toFixed(2)}ms`);
  console.log('');
  
  console.log('📈 Response Status Distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   HTTP ${status}: ${count} requests`);
  });
  console.log('');
  
  // Performance assessment
  console.log('🎯 Performance Assessment:');
  if (successful >= CONCURRENT_REQUESTS * 0.95 && p95Latency < 2000) {
    console.log('✅ EXCELLENT - Gateway handles concurrent load well');
  } else if (successful >= CONCURRENT_REQUESTS * 0.9 && p95Latency < 3000) {
    console.log('✅ GOOD - Gateway performance is acceptable');
  } else if (successful >= CONCURRENT_REQUESTS * 0.8) {
    console.log('⚠️  FAIR - Some performance issues detected');
  } else {
    console.log('❌ POOR - Significant performance issues');
  }
  
  console.log('');
  
  // Show sample errors if any
  const errors = results.filter(r => r.status === 'rejected');
  if (errors.length > 0) {
    console.log('❌ Sample Errors:');
    errors.slice(0, 3).forEach((error, i) => {
      console.log(`   ${i + 1}. ${error.reason}`);
    });
    console.log('');
  }
}

async function makeRequest(url, userAgent, requestId) {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'X-Request-ID': requestId.toString(),
      },
      timeout: 5000
    });
    
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    return {
      requestId,
      url,
      userAgent,
      status: response.status,
      latency,
      success: true
    };
    
  } catch (error) {
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    throw {
      requestId,
      url,
      userAgent,
      latency,
      error: error.message,
      success: false
    };
  }
}

// Run the test
runQuickLoadTest().catch(console.error);
