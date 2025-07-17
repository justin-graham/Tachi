#!/usr/bin/env node

/**
 * Test script for Tachi Cloudflare Gateway
 * 
 * This script tests the gateway functionality locally or against a deployed worker.
 * It simulates various crawler scenarios and payment flows.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:8787';

async function testCrawlerDetection() {
  console.log('🤖 Testing AI Crawler Detection...');
  
  const crawlers = [
    'GPTBot/1.0 (+https://openai.com/gptbot)',
    'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)',
    'Claude-Web/1.0 (+https://claude.ai/bot)',
    'BingAI/1.0 (+https://www.bing.com/bot)',
    'Perplexity/1.0 (+https://perplexity.ai/bot)',
  ];

  for (const userAgent of crawlers) {
    try {
      const response = await fetch(BASE_URL, {
        headers: {
          'User-Agent': userAgent,
        },
      });

      if (response.status === 402) {
        console.log(`✅ ${userAgent.split('/')[0]} detected - Payment required`);
        
        // Check payment headers
        const headers = {
          price: response.headers.get('x402-price'),
          currency: response.headers.get('x402-currency'),
          network: response.headers.get('x402-network'),
          recipient: response.headers.get('x402-recipient'),
        };
        
        console.log(`   Payment info:`, headers);
        
        // Check response body
        const body = await response.json();
        console.log(`   Amount: ${body.payment.amount} ${body.payment.currency}`);
      } else {
        console.log(`❌ ${userAgent.split('/')[0]} not detected (status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${userAgent.split('/')[0]}: ${error.message}`);
    }
  }
}

async function testHumanUser() {
  console.log('\n👤 Testing Human User Pass-through...');
  
  try {
    const response = await fetch(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (response.status !== 402) {
      console.log('✅ Human user passed through correctly');
    } else {
      console.log('❌ Human user incorrectly blocked');
    }
  } catch (error) {
    console.log(`❌ Error testing human user: ${error.message}`);
  }
}

async function testPaymentVerification() {
  console.log('\n💳 Testing Payment Verification...');
  
  // Test with invalid transaction hash
  try {
    const response = await fetch(BASE_URL, {
      headers: {
        'User-Agent': 'GPTBot/1.0',
        'Authorization': 'Bearer 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
    });

    if (response.status === 402) {
      const body = await response.json();
      console.log('✅ Invalid transaction hash rejected');
      console.log(`   Error: ${body.error}`);
      console.log(`   Message: ${body.message}`);
    } else {
      console.log('❌ Invalid transaction hash accepted');
    }
  } catch (error) {
    console.log(`❌ Error testing payment verification: ${error.message}`);
  }

  // Test with malformed authorization header
  try {
    const response = await fetch(BASE_URL, {
      headers: {
        'User-Agent': 'GPTBot/1.0',
        'Authorization': 'InvalidFormat',
      },
    });

    if (response.status === 400) {
      console.log('✅ Malformed authorization header rejected');
    } else {
      console.log('❌ Malformed authorization header accepted');
    }
  } catch (error) {
    console.log(`❌ Error testing malformed auth: ${error.message}`);
  }
}

async function testCORS() {
  console.log('\n🌐 Testing CORS Headers...');
  
  // Test preflight request
  try {
    const response = await fetch(BASE_URL, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    });

    if (response.status === 200 || response.status === 204) {
      console.log('✅ CORS preflight handled correctly');
      console.log(`   Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
      console.log(`   Allow-Methods: ${response.headers.get('Access-Control-Allow-Methods')}`);
      console.log(`   Allow-Headers: ${response.headers.get('Access-Control-Allow-Headers')}`);
    } else {
      console.log('❌ CORS preflight failed');
    }
  } catch (error) {
    console.log(`❌ Error testing CORS: ${error.message}`);
  }
}

async function testResponseFormat() {
  console.log('\n📄 Testing Response Format...');
  
  try {
    const response = await fetch(BASE_URL, {
      headers: {
        'User-Agent': 'GPTBot/1.0',
      },
    });

    if (response.status === 402) {
      const body = await response.json();
      
      // Check required fields
      const required = ['error', 'message', 'payment', 'instructions'];
      const missing = required.filter(field => !body[field]);
      
      if (missing.length === 0) {
        console.log('✅ Response format is correct');
      } else {
        console.log(`❌ Missing required fields: ${missing.join(', ')}`);
      }
      
      // Check payment object structure
      const paymentRequired = ['amount', 'currency', 'network', 'chainId', 'recipient', 'tokenAddress'];
      const paymentMissing = paymentRequired.filter(field => !body.payment[field]);
      
      if (paymentMissing.length === 0) {
        console.log('✅ Payment object structure is correct');
      } else {
        console.log(`❌ Missing payment fields: ${paymentMissing.join(', ')}`);
      }
    } else {
      console.log('❌ Expected 402 response not received');
    }
  } catch (error) {
    console.log(`❌ Error testing response format: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Tachi Gateway Tests...');
  console.log(`📍 Testing URL: ${BASE_URL}`);
  console.log('━'.repeat(60));

  await testCrawlerDetection();
  await testHumanUser();
  await testPaymentVerification();
  await testCORS();
  await testResponseFormat();

  console.log('\n━'.repeat(60));
  console.log('✨ Tests completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Deploy to staging: wrangler deploy --env staging');
  console.log('2. Test with real payments on testnet');
  console.log('3. Deploy to production: wrangler deploy --env production');
  console.log('4. Configure domain routes in Cloudflare Dashboard');
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  testCrawlerDetection,
  testHumanUser,
  testPaymentVerification,
  testCORS,
  testResponseFormat,
};
