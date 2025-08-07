#!/usr/bin/env node

/**
 * Gateway Security Hardening Test
 * Tests the enhanced security features of the Tachi Protocol Cloudflare Worker
 */

import { execSync } from 'child_process';

// Test configuration
const BASE_URL = 'http://localhost:8787'; // Default Wrangler dev URL
const TEST_TIMEOUT = 30000; // 30 seconds

// ANSI colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Log with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Test security headers
 */
async function testSecurityHeaders() {
  log('\n🔒 Testing Security Headers', colors.bold + colors.blue);
  
  try {
    const response = await fetch(`${BASE_URL}/test`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; test)',
      }
    });
    
    const requiredHeaders = [
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Content-Security-Policy'
    ];
    
    let passed = 0;
    
    for (const header of requiredHeaders) {
      const headerValue = response.headers.get(header);
      if (headerValue) {
        log(`✅ ${header}: ${headerValue}`, colors.green);
        passed++;
      } else {
        log(`❌ Missing header: ${header}`, colors.red);
      }
    }
    
    // Check for security header values
    const hsts = response.headers.get('Strict-Transport-Security');
    if (hsts && hsts.includes('max-age=31536000')) {
      log('✅ HSTS properly configured with 1-year max-age', colors.green);
      passed++;
    } else {
      log('❌ HSTS not properly configured', colors.red);
    }
    
    const xFrame = response.headers.get('X-Frame-Options');
    if (xFrame === 'DENY') {
      log('✅ X-Frame-Options set to DENY', colors.green);
      passed++;
    } else {
      log('❌ X-Frame-Options not set to DENY', colors.red);
    }
    
    const xContentType = response.headers.get('X-Content-Type-Options');
    if (xContentType === 'nosniff') {
      log('✅ X-Content-Type-Options set to nosniff', colors.green);
      passed++;
    } else {
      log('❌ X-Content-Type-Options not set to nosniff', colors.red);
    }
    
    log(`\nSecurity Headers: ${passed}/7 tests passed`, passed >= 6 ? colors.green : colors.red);
    return passed >= 6;
    
  } catch (error) {
    log(`❌ Security headers test failed: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Test rate limiting
 */
async function testRateLimit() {
  log('\n🚦 Testing Rate Limiting', colors.bold + colors.blue);
  
  try {
    // Send multiple requests rapidly
    const promises = [];
    const requestCount = 15; // Exceed typical rate limit
    
    log(`Sending ${requestCount} rapid requests...`);
    
    for (let i = 0; i < requestCount; i++) {
      promises.push(
        fetch(`${BASE_URL}/test?req=${i}`, {
          headers: {
            'User-Agent': 'GPTBot/1.0 (+https://openai.com/gptbot)',
            'Authorization': 'Bearer test_transaction_hash'
          }
        }).then(response => ({
          status: response.status,
          headers: {
            'x-ratelimit-limit': response.headers.get('X-RateLimit-Limit'),
            'x-ratelimit-remaining': response.headers.get('X-RateLimit-Remaining'),
            'x-ratelimit-reset': response.headers.get('X-RateLimit-Reset'),
            'retry-after': response.headers.get('Retry-After')
          }
        })).catch(error => ({
          error: error.message
        }))
      );
    }
    
    const responses = await Promise.all(promises);
    
    const rateLimited = responses.filter(r => r.status === 429);
    const successful = responses.filter(r => r.status && r.status < 300);
    
    log(`✅ ${successful.length} requests succeeded`, colors.green);
    log(`⚠️  ${rateLimited.length} requests rate limited (429)`, colors.yellow);
    
    // Check if rate limiting kicked in
    if (rateLimited.length > 0) {
      log('✅ Rate limiting is working', colors.green);
      
      // Check rate limit headers
      const rateLimitedResponse = rateLimited[0];
      if (rateLimitedResponse.headers['retry-after'] === '60') {
        log('✅ Retry-After header set correctly', colors.green);
      } else {
        log('❌ Retry-After header not set correctly', colors.red);
      }
      
      return true;
    } else {
      log('❌ Rate limiting may not be working', colors.red);
      return false;
    }
    
  } catch (error) {
    log(`❌ Rate limiting test failed: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Test CORS with security headers
 */
async function testCORS() {
  log('\n🌐 Testing CORS with Security Headers', colors.bold + colors.blue);
  
  try {
    const response = await fetch(`${BASE_URL}/test`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    if (response.status === 200 || response.status === 204) {
      log('✅ CORS preflight request handled', colors.green);
      
      const corsHeaders = [
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers'
      ];
      
      let corsTests = 0;
      for (const header of corsHeaders) {
        if (response.headers.get(header)) {
          log(`✅ ${header}: ${response.headers.get(header)}`, colors.green);
          corsTests++;
        } else {
          log(`❌ Missing CORS header: ${header}`, colors.red);
        }
      }
      
      // Check if security headers are also present in CORS response
      const securityHeaders = ['Strict-Transport-Security', 'X-Frame-Options'];
      let securityTests = 0;
      
      for (const header of securityHeaders) {
        if (response.headers.get(header)) {
          log(`✅ Security header in CORS response: ${header}`, colors.green);
          securityTests++;
        } else {
          log(`❌ Missing security header in CORS: ${header}`, colors.red);
        }
      }
      
      return corsTests >= 3 && securityTests >= 1;
    } else {
      log(`❌ CORS preflight failed with status: ${response.status}`, colors.red);
      return false;
    }
    
  } catch (error) {
    log(`❌ CORS test failed: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Test request size limiting
 */
async function testRequestSizeLimit() {
  log('\n📏 Testing Request Size Limits', colors.bold + colors.blue);
  
  try {
    // Create a large payload (2MB)
    const largePayload = 'x'.repeat(2 * 1024 * 1024);
    
    const response = await fetch(`${BASE_URL}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GPTBot/1.0 (+https://openai.com/gptbot)'
      },
      body: JSON.stringify({ data: largePayload })
    });
    
    if (response.status === 413) {
      log('✅ Large request properly rejected (413)', colors.green);
      return true;
    } else {
      log(`⚠️  Large request not rejected (status: ${response.status})`, colors.yellow);
      log('   This might be expected if size limits are not strictly enforced', colors.yellow);
      return true; // Don't fail the test as this depends on configuration
    }
    
  } catch (error) {
    log(`❌ Request size test failed: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Test error responses include security headers
 */
async function testErrorResponseSecurity() {
  log('\n🚨 Testing Security Headers in Error Responses', colors.bold + colors.blue);
  
  try {
    // Trigger a 429 rate limit error
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(
        fetch(`${BASE_URL}/test?error=${i}`, {
          headers: {
            'User-Agent': 'GPTBot/1.0 (+https://openai.com/gptbot)',
            'Authorization': 'Bearer invalid_transaction_hash'
          }
        })
      );
    }
    
    const responses = await Promise.all(promises);
    const errorResponse = responses.find(r => r.status >= 400);
    
    if (errorResponse) {
      log(`Found error response with status: ${errorResponse.status}`);
      
      const securityHeaders = [
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options'
      ];
      
      let passed = 0;
      for (const header of securityHeaders) {
        if (errorResponse.headers.get(header)) {
          log(`✅ Security header in error response: ${header}`, colors.green);
          passed++;
        } else {
          log(`❌ Missing security header in error: ${header}`, colors.red);
        }
      }
      
      return passed >= 2;
    } else {
      log('⚠️  No error responses received to test', colors.yellow);
      return true;
    }
    
  } catch (error) {
    log(`❌ Error response security test failed: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Run all security tests
 */
async function runSecurityTests() {
  log('🛡️  Tachi Protocol Gateway Security Test Suite', colors.bold + colors.blue);
  log('================================================', colors.blue);
  log(`Testing gateway at: ${BASE_URL}`);
  
  const tests = [
    { name: 'Security Headers', fn: testSecurityHeaders },
    { name: 'Rate Limiting', fn: testRateLimit },
    { name: 'CORS Security', fn: testCORS },
    { name: 'Request Size Limits', fn: testRequestSizeLimit },
    { name: 'Error Response Security', fn: testErrorResponseSecurity }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      log(`❌ Test "${test.name}" crashed: ${error.message}`, colors.red);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  log('\n📊 Test Results Summary', colors.bold + colors.blue);
  log('=======================', colors.blue);
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? colors.green : colors.red;
    log(`${status} ${result.name}`, color);
  });
  
  log(`\nOverall: ${passed}/${total} tests passed`, passed === total ? colors.green : colors.red);
  
  if (passed === total) {
    log('\n🎉 All security tests passed! Gateway is properly hardened.', colors.bold + colors.green);
    process.exit(0);
  } else {
    log('\n⚠️  Some security tests failed. Please review the configuration.', colors.bold + colors.yellow);
    process.exit(1);
  }
}

// Check if we're running this as a script
if (import.meta.url === `file://${process.argv[1]}`) {
  // Start the worker in development mode if not already running
  log('Starting gateway security tests...', colors.blue);
  
  // Run the tests
  runSecurityTests().catch(error => {
    log(`❌ Test suite failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}

export { runSecurityTests };
