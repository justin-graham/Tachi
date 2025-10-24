/**
 * Real USDC Test Script for Base Mainnet
 *
 * This script tests the complete payment flow with actual USDC on Base Mainnet.
 * Cost: ~$0.10 in USDC + gas fees (~$0.01)
 *
 * Prerequisites:
 * 1. Wallet with USDC on Base Mainnet
 * 2. Private key set in environment
 * 3. Gateway deployed and accessible
 *
 * Usage:
 *   PRIVATE_KEY=0x... GATEWAY_URL=https://... npx tsx tests/mainnet/real-usdc-test.ts
 */

import {createWalletClient, createPublicClient, http, parseUnits, formatUnits} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {base} from 'viem/chains';

// Contract addresses on Base Mainnet
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const PAYMENT_PROCESSOR_ADDRESS = '0xf00976864d9dD3c0AE788f44f38bB84022B61a04';
const PUBLISHER_ADDRESS = '0xEE785221C4389E21c3473f8dC2E16ea373B70d0D'; // Example publisher

// Test configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'https://tachi-gateway.jgrahamsport16.workers.dev';
const TEST_CONTENT_PATH = '/article/ai-training';
const PAYMENT_AMOUNT = '0.01'; // $0.01 USDC

async function main() {
  console.log('🧪 Tachi Protocol - Real USDC Test\n');
  console.log('⚠️  This test will spend real USDC on Base Mainnet\n');

  // Check for private key
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY environment variable required');
    console.log('\nUsage:');
    console.log('  PRIVATE_KEY=0x... npx tsx tests/mainnet/real-usdc-test.ts\n');
    process.exit(1);
  }

  // Setup clients
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({
    chain: base,
    transport: http()
  });
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http()
  });

  console.log(`📍 Wallet: ${account.address}`);
  console.log(`🌐 Gateway: ${GATEWAY_URL}`);
  console.log(`📄 Content: ${TEST_CONTENT_PATH}\n`);

  // Step 1: Check USDC balance
  console.log('Step 1: Checking USDC balance...');
  const usdcAbi = [
    {
      inputs: [{name: 'account', type: 'address'}],
      name: 'balanceOf',
      outputs: [{name: '', type: 'uint256'}],
      stateMutability: 'view',
      type: 'function'
    }
  ];

  const balance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: 'balanceOf',
    args: [account.address]
  });

  const balanceUsdc = formatUnits(balance as bigint, 6);
  console.log(`✅ Balance: ${balanceUsdc} USDC\n`);

  if (parseFloat(balanceUsdc) < 0.02) {
    console.error('❌ Insufficient USDC balance (need at least 0.02 USDC)');
    process.exit(1);
  }

  // Step 2: Request content without payment
  console.log('Step 2: Requesting content without payment (should get 402)...');
  const response1 = await fetch(`${GATEWAY_URL}${TEST_CONTENT_PATH}`);
  console.log(`   Status: ${response1.status}`);

  if (response1.status !== 402) {
    console.error('❌ Expected 402 Payment Required');
    process.exit(1);
  }

  const paymentInfo = await response1.json();
  console.log(`   Price: ${paymentInfo.payment.amount} USDC`);
  console.log(`   Recipient: ${paymentInfo.payment.recipient}`);
  console.log('✅ 402 Payment Required response received\n');

  // Step 3: Approve USDC spending
  console.log('Step 3: Approving USDC spending...');
  const approveAbi = [
    {
      inputs: [
        {name: 'spender', type: 'address'},
        {name: 'amount', type: 'uint256'}
      ],
      name: 'approve',
      outputs: [{name: '', type: 'bool'}],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ];

  const approveTx = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: approveAbi,
    functionName: 'approve',
    args: [PAYMENT_PROCESSOR_ADDRESS, parseUnits(PAYMENT_AMOUNT, 6)]
  });

  console.log(`   Tx: ${approveTx}`);
  await publicClient.waitForTransactionReceipt({hash: approveTx});
  console.log('✅ USDC approved\n');

  // Step 4: Send payment
  console.log('Step 4: Sending payment via PaymentProcessor...');
  const paymentAbi = [
    {
      inputs: [
        {name: 'publisher', type: 'address'},
        {name: 'amount', type: 'uint256'}
      ],
      name: 'payPublisher',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ];

  const paymentTx = await walletClient.writeContract({
    address: PAYMENT_PROCESSOR_ADDRESS,
    abi: paymentAbi,
    functionName: 'payPublisher',
    args: [PUBLISHER_ADDRESS, parseUnits(PAYMENT_AMOUNT, 6)]
  });

  console.log(`   Tx: ${paymentTx}`);
  const receipt = await publicClient.waitForTransactionReceipt({hash: paymentTx});

  if (receipt.status !== 'success') {
    console.error('❌ Payment transaction failed');
    process.exit(1);
  }

  console.log(`✅ Payment sent: ${PAYMENT_AMOUNT} USDC`);
  console.log(`   Explorer: https://basescan.org/tx/${paymentTx}\n`);

  // Step 5: Request content with payment proof
  console.log('Step 5: Requesting content with payment proof...');
  const response2 = await fetch(`${GATEWAY_URL}${TEST_CONTENT_PATH}`, {
    headers: {
      Authorization: `Bearer ${paymentTx}`
    }
  });

  console.log(`   Status: ${response2.status}`);

  if (response2.status !== 200) {
    console.error('❌ Expected 200 OK with content');
    const errorData = await response2.json();
    console.error('   Error:', errorData);
    process.exit(1);
  }

  const content = await response2.json();
  console.log('✅ Content received!');
  console.log(`   Title: ${content.content?.title || 'N/A'}`);
  console.log(`   Verified: ${content.payment?.verified || false}\n`);

  // Summary
  console.log('🎉 Test Complete!\n');
  console.log('Summary:');
  console.log(`  ✅ Gateway returned 402 without payment`);
  console.log(`  ✅ Payment transaction succeeded`);
  console.log(`  ✅ Gateway verified payment and returned content`);
  console.log(`  💰 Cost: ${PAYMENT_AMOUNT} USDC + gas\n`);
}

main().catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
