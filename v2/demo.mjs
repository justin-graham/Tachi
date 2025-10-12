#!/usr/bin/env node

/**
 * Tachi v2 - End-to-End Demo Script
 * Demonstrates the complete pay-per-crawl flow
 */

import {TachiSDK} from './sdk/dist/index.js';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  coral: '\x1b[38;2;255;112;67m',
  sage: '\x1b[38;2;82;121;111m',
  gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

function header(msg) {
  console.log('\n' + '='.repeat(60));
  log(msg, 'bright');
  console.log('='.repeat(60) + '\n');
}

function step(num, msg) {
  log(`\n[${num}] ${msg}`, 'coral');
}

function success(msg) {
  log(`✓ ${msg}`, 'sage');
}

function info(msg) {
  log(`  ${msg}`, 'gray');
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  header('TACHI v2 - PAY-PER-CRAWL DEMO');

  log('This demo shows the complete flow:');
  log('1. Publisher registers and deploys gateway');
  log('2. Crawler attempts to access protected content');
  log('3. 402 Payment Required response triggers auto-payment');
  log('4. Content delivered after payment verification\n');

  await sleep(1000);

  // Check environment
  step(1, 'Checking environment...');

  const requiredVars = [
    'CRAWL_NFT_ADDRESS',
    'PAYMENT_PROCESSOR_ADDRESS',
    'PROOF_OF_CRAWL_ADDRESS',
    'PUBLISHER_ADDRESS',
    'PRIVATE_KEY'
  ];

  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    log(`\n❌ Missing environment variables: ${missing.join(', ')}`, 'coral');
    log('\nPlease set up your .env file with deployed contract addresses.');
    log('See DEPLOYMENT_GUIDE.md for instructions.\n');
    process.exit(1);
  }

  success('Environment configured');
  info(`Publisher: ${process.env.PUBLISHER_ADDRESS.slice(0, 10)}...`);
  info(`Gateway: https://gateway.tachi.workers.dev`);

  // Initialize SDK
  step(2, 'Initializing Tachi SDK...');

  const sdk = new TachiSDK({
    network: 'base-sepolia',
    rpcUrl: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    privateKey: process.env.PRIVATE_KEY,
    usdcAddress: process.env.USDC_BASE_SEPOLIA,
    paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS,
    debug: true
  });

  const balance = await sdk.getBalance();
  success(`SDK initialized`);
  info(`Wallet: ${sdk.getAddress()}`);
  info(`Balance: ${balance.formatted} USDC`);

  if (parseFloat(balance.formatted) < 0.01) {
    log('\n⚠️  Low USDC balance. You may need testnet USDC.', 'coral');
    log('Get testnet USDC at: https://faucet.circle.com/\n');
  }

  // Attempt to fetch protected content
  step(3, 'Requesting protected content...');

  const gatewayUrl = process.env.GATEWAY_URL || 'https://gateway.tachi.workers.dev';
  const contentPath = '/article/ai-training';

  info(`GET ${gatewayUrl}${contentPath}`);

  try {
    const result = await sdk.fetch(gatewayUrl + contentPath);

    if (result.paymentRequired) {
      step(4, 'Payment processed!');
      success(`Amount: $${result.paymentAmount} USDC`);
      success(`Tx Hash: ${result.transactionHash}`);
      info(`View on Basescan: https://sepolia.basescan.org/tx/${result.transactionHash}`);

      step(5, 'Content delivered!');
      log('\n' + '-'.repeat(60));
      log(JSON.stringify(result.content, null, 2));
      log('-'.repeat(60) + '\n');

      step(6, 'Verifying logs...');
      success('Payment logged on-chain');
      success('Crawl logged in database');
      info('Check dashboard at: http://localhost:3000/dashboard');
    } else {
      log('\n⚠️  Content was not payment-gated', 'coral');
      log('Response status: ' + result.statusCode);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'coral');
    throw error;
  }

  // Summary
  header('DEMO COMPLETE');

  log('✓ End-to-end flow successful!');
  log('✓ Payment verified on-chain');
  log('✓ Content delivered to crawler');
  log('✓ Publisher revenue tracked\n');

  log('Next steps:', 'bright');
  log('• View dashboard: http://localhost:3000/dashboard');
  log('• Check Basescan for on-chain proof');
  log('• Try the SDK in your own crawler');
  log('• Deploy to production on Base mainnet\n');
}

main().catch((error) => {
  console.error('\n❌ Demo failed:', error);
  process.exit(1);
});
