#!/usr/bin/env node

/**
 * Tachi SDK Demo Script
 * Demonstrates how to use the Tachi Pay-Per-Crawl SDK
 */

import { TachiSDK } from './dist/index.js';

async function demo() {
  console.log('🚀 Tachi SDK Demo Starting...\n');

  // Initialize SDK with demo configuration
  const sdk = new TachiSDK({
    // API configuration
    apiUrl: 'http://localhost:3001',
    
    // Network configuration (for crypto payments)
    network: 'base-sepolia',
    rpcUrl: 'https://sepolia.base.org',
    
    // Payment configuration
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    paymentProcessorAddress: '0x1234567890123456789012345678901234567890',
    
    // Request configuration
    userAgent: 'TachiSDK-Demo/1.0',
    timeout: 10000,
  });

  try {
    // Step 1: Check API health
    console.log('1. Checking API health...');
    const health = await sdk.checkHealth();
    console.log('✅ API Status:', health.status);
    console.log('   Service:', health.service);
    console.log('   Version:', health.version);
    console.log();

    // Step 2: Register as a crawler
    console.log('2. Registering crawler...');
    const registration = await sdk.registerCrawler({
      name: 'Demo AI Crawler',
      contact: 'demo@crawler.com',
      description: 'A demo crawler for testing the Tachi API',
      companyName: 'Demo AI Company',
      type: 'startup',
    });
    
    console.log('✅ Crawler registered!');
    console.log('   Crawler ID:', registration.crawler.id);
    console.log('   API Key:', registration.apiKey);
    console.log('   Credits:', registration.crawler.credits);
    console.log();

    // Step 3: Authenticate with the API key
    console.log('3. Authenticating with API key...');
    const auth = await sdk.authenticate(registration.apiKey);
    console.log('✅ Authentication successful!');
    console.log('   Token received:', auth.token.substring(0, 20) + '...');
    console.log();

    // Step 4: Get publishers directory
    console.log('4. Fetching publishers directory...');
    const publishers = await sdk.getPublishersDirectory();
    console.log('✅ Publishers found:', publishers.total);
    publishers.publishers.forEach((pub, index) => {
      console.log(`   ${index + 1}. ${pub.name} (${pub.domain}) - $${pub.pricePerRequest}/request`);
    });
    console.log();

    // Step 5: Get pricing for a specific domain
    if (publishers.publishers.length > 0) {
      const firstPublisher = publishers.publishers[0];
      console.log(`5. Getting pricing for ${firstPublisher.domain}...`);
      const pricing = await sdk.getContentPricing(firstPublisher.domain);
      console.log('✅ Pricing info:');
      console.log('   Base price:', pricing.basePrice);
      console.log('   Currency:', pricing.currency);
      console.log();
    }

    // Step 6: Fetch content with authentication
    console.log('6. Fetching content...');
    const content = await sdk.fetchContent('example.com', 'article/123', auth.token);
    console.log('✅ Content retrieved!');
    console.log('   URL:', content.url);
    console.log('   Content length:', content.content.length, 'characters');
    console.log('   Charged:', content.billing.charged);
    console.log('   Credits remaining:', content.billing.remainingCredits);
    console.log();

    // Step 7: Batch request example
    console.log('7. Performing batch request...');
    const batchRequests = [
      { domain: 'example.com', path: 'article/123' },
      { domain: 'example.com', path: 'article/456' },
    ];
    
    const batchResults = await sdk.batchRequest(batchRequests, auth.token);
    console.log('✅ Batch request completed!');
    console.log('   Results:', batchResults.results.length);
    console.log('   Total cost:', batchResults.totalCost);
    console.log();

    console.log('🎉 Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
demo().catch(console.error);
