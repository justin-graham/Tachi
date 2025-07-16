#!/usr/bin/env node

// Test script to verify the gateway returns 402 for requests without payment
import { GatewayCore } from '@tachi/gateway-core';

async function testGateway() {
  const gateway = new GatewayCore('https://eth-mainnet.g.alchemy.com/v2/demo');
  
  console.log('Testing gateway without payment token...');
  
  // Test request without payment token
  const request = {
    url: 'https://httpbin.org/get',
    method: 'GET',
    headers: {}
  };
  
  const result = await gateway.handleRequest(request);
  
  console.log('Response:', result);
  console.log('Status Code:', result.statusCode);
  console.log('Success:', result.success);
  console.log('Error:', result.error);
  
  if (result.statusCode === 402) {
    console.log('✅ Gateway correctly returns 402 Payment Required!');
  } else {
    console.log('❌ Gateway should return 402 but returned:', result.statusCode);
  }
}

testGateway().catch(console.error);
