#!/usr/bin/env node

/**
 * Production Environment Configuration Test
 */

import fs from 'fs';

console.log('⚙️  Testing Production Environment Configuration...');

// Test environment variable loading
const requiredVars = [
  'NODE_ENV',
  'NETWORK', 
  'BASE_RPC_URL',
  'BASESCAN_API_KEY',
  'PRIVATE_KEY',
  'ENABLE_SECURITY_LOGGING',
  'LOG_LEVEL',
  'SENTRY_DSN',
  'SLACK_WEBHOOK_URL',
  'PAGERDUTY_INTEGRATION_KEY',
  'MAX_GAS_PRICE_GWEI',
  'GAS_LIMIT_BUFFER',
  'DEPLOYMENT_CONFIRMATIONS',
  'DEPLOYMENT_TIMEOUT'
];

try {
  console.log('\n1️⃣  Testing environment variable structure...');
  
  // Load the production environment file
  const envContent = fs.readFileSync('.env.production', 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log('✅ Production environment file loaded');
  console.log('   Total configuration lines:', envLines.length);
  
  // Check for required variables
  console.log('\n2️⃣  Testing required variables...');
  let foundVars = 0;
  let missingVars = [];
  
  for (const varName of requiredVars) {
    const found = envLines.some(line => line.startsWith(varName + '='));
    if (found) {
      foundVars++;
      console.log('   ✅', varName);
    } else {
      missingVars.push(varName);
      console.log('   ❌', varName, '(missing)');
    }
  }
  
  console.log('\n3️⃣  Testing configuration format...');
  
  // Test specific configurations
  const networkLine = envLines.find(line => line.startsWith('NETWORK='));
  if (networkLine && networkLine.includes('base')) {
    console.log('✅ Network configuration: Base mainnet');
  } else {
    console.log('❌ Network configuration: Invalid or missing');
  }
  
  const rpcLine = envLines.find(line => line.startsWith('BASE_RPC_URL='));
  if (rpcLine && rpcLine.includes('base-mainnet')) {
    console.log('✅ RPC configuration: Base mainnet RPC');
  } else {
    console.log('❌ RPC configuration: Invalid or missing');
  }
  
  const confirmationsLine = envLines.find(line => line.startsWith('DEPLOYMENT_CONFIRMATIONS='));
  if (confirmationsLine && parseInt(confirmationsLine.split('=')[1]) >= 3) {
    console.log('✅ Deployment confirmations: Sufficient for production');
  } else {
    console.log('❌ Deployment confirmations: Too low for production');
  }
  
  const gasBufferLine = envLines.find(line => line.startsWith('GAS_LIMIT_BUFFER='));
  if (gasBufferLine && parseFloat(gasBufferLine.split('=')[1]) >= 1.2) {
    console.log('✅ Gas limit buffer: Safe for production');
  } else {
    console.log('❌ Gas limit buffer: Too low for production');
  }
  
  console.log('\n4️⃣  Testing security configuration...');
  
  const securityLoggingLine = envLines.find(line => line.startsWith('ENABLE_SECURITY_LOGGING='));
  if (securityLoggingLine && securityLoggingLine.includes('true')) {
    console.log('✅ Security logging: Enabled');
  } else {
    console.log('❌ Security logging: Disabled or missing');
  }
  
  const logLevelLine = envLines.find(line => line.startsWith('LOG_LEVEL='));
  if (logLevelLine && (logLevelLine.includes('warn') || logLevelLine.includes('error'))) {
    console.log('✅ Log level: Production appropriate');
  } else {
    console.log('❌ Log level: Too verbose for production');
  }
  
  console.log('\n📊 ENVIRONMENT TEST RESULTS:');
  console.log('   Found variables:', foundVars + '/' + requiredVars.length);
  console.log('   Coverage:', Math.round((foundVars / requiredVars.length) * 100) + '%');
  
  if (missingVars.length > 0) {
    console.log('   Missing variables:', missingVars.join(', '));
  }
  
  if (foundVars === requiredVars.length) {
    console.log('\n🎉 Production Environment Configuration: ALL TESTS PASSED');
  } else {
    console.log('\n⚠️  Production Environment Configuration: Some variables missing');
  }
  
} catch (error) {
  console.error('❌ Environment Configuration Test Failed:', error.message);
  process.exit(1);
}
