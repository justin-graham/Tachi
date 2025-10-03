#!/usr/bin/env node

/**
 * Security Verification Test for Tachi Gateway
 * Tests the security implementations we added
 */

const BASE_URL = 'http://localhost:8788';

async function testSecurityFeature(testName, requestOptions, expectedStatus, expectedError) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    
    const response = await fetch(BASE_URL, requestOptions);
    const text = await response.text();
    
    if (response.status === expectedStatus) {
      console.log(`✅ PASS: Got expected status ${expectedStatus}`);
      if (expectedError && text.includes(expectedError)) {
        console.log(`✅ PASS: Got expected error: ${expectedError}`);
      }
      return true;
    } else {
      console.log(`❌ FAIL: Expected ${expectedStatus}, got ${response.status}`);
      console.log(`Response: ${text}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runSecurityTests() {
  console.log('🔒 Running Tachi Gateway Security Verification Tests');
  console.log('=' .repeat(60));
  
  const tests = [
    // Test 1: Malformed X-402-Payment header should be rejected
    {
      name: 'Malformed X-402-Payment Header Rejection',
      options: {
        method: 'GET',
        headers: {
          'User-Agent': 'GPTBot/1.0',
          'X-402-Payment': 'invalid_format'
        }
      },
      expectedStatus: 400,
      expectedError: 'Invalid X-402-Payment header format'
    },
    
    // Test 2: Valid payment header format (but no actual verification)
    {
      name: 'Valid X-402-Payment Header Format',
      options: {
        method: 'GET',
        headers: {
          'User-Agent': 'GPTBot/1.0',
          'X-402-Payment': '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef,1.50'
        }
      },
      expectedStatus: 402, // Will fail payment verification but header format is valid
      expectedError: null
    },
    
    // Test 3: Missing payment header should require payment
    {
      name: 'Missing Payment Header Requires Payment',
      options: {
        method: 'GET',
        headers: {
          'User-Agent': 'GPTBot/1.0'
        }
      },
      expectedStatus: 402,
      expectedError: null
    },
    
    // Test 4: Rate limiting (make multiple requests quickly)
    {
      name: 'Rate Limiting Protection',
      options: {
        method: 'GET',
        headers: {
          'User-Agent': 'GPTBot/1.0'
        }
      },
      expectedStatus: 429, // After many requests
      expectedError: 'Rate limit'
    },
    
    // Test 5: Non-AI crawler should pass through
    {
      name: 'Non-AI Crawler Pass Through',
      options: {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      expectedStatus: 404, // Will hit origin (which doesn't exist locally)
      expectedError: null
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testSecurityFeature(
      test.name,
      test.options,
      test.expectedStatus,
      test.expectedError
    );
    if (success) passed++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Test rate limiting by making many requests
  console.log(`\n🧪 Testing: Rate Limiting with Burst Requests`);
  let rateLimitHit = false;
  
  for (let i = 0; i < 150; i++) {
    try {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: {
          'User-Agent': 'GPTBot/1.0'
        }
      });
      
      if (response.status === 429) {
        console.log(`✅ PASS: Rate limit triggered after ${i + 1} requests`);
        rateLimitHit = true;
        break;
      }
    } catch (error) {
      // Continue
    }
    
    // Very short delay
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  if (rateLimitHit) {
    passed++;
    total++;
  } else {
    console.log(`❌ FAIL: Rate limiting not triggered after 150 requests`);
    total++;
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`🎯 Security Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All security features working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some security features need attention');
    process.exit(1);
  }
}

// Check if gateway is running
async function checkGatewayHealth() {
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: { 'User-Agent': 'HealthCheck/1.0' }
    });
    console.log(`🟢 Gateway is running (status: ${response.status})`);
    return true;
  } catch (error) {
    console.log(`🔴 Gateway is not running: ${error.message}`);
    console.log('Please start the gateway with: npm run dev or wrangler dev --local');
    return false;
  }
}

// Main execution
if (await checkGatewayHealth()) {
  await runSecurityTests();
} else {
  process.exit(1);
}