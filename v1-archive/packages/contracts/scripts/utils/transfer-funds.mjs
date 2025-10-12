#!/usr/bin/env node

/**
 * 💸 Transfer Funds Between Test Accounts
 * 
 * This script transfers 0.01 ETH from Publisher to Crawler account
 * to enable E2E testing on Base Sepolia.
 */

import { createWalletClient, createPublicClient, http, parseEther, formatEther, getAddress } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Test account configuration
const PUBLISHER_PRIVATE_KEY = '0xe6c0f79a01e820761dff8c6a14ba4a2722e6ef2bed5650bec0ecaa300b7a42ab';
const CRAWLER_ADDRESS = getAddress('0x56544De43641F06cc5a601eD0B0C7e028727211b'); // New generated address
const TRANSFER_AMOUNT = '0.01'; // ETH to transfer

console.log('💸 Funding Crawler Account for E2E Testing');
console.log('================================================');

async function transferFunds() {
  try {
    // Create accounts and clients
    const publisherAccount = privateKeyToAccount(PUBLISHER_PRIVATE_KEY);
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    });
    
    const walletClient = createWalletClient({
      account: publisherAccount,
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    });

    // Check balances before transfer
    const publisherBalance = await publicClient.getBalance({
      address: publisherAccount.address,
    });
    
    const crawlerBalanceBefore = await publicClient.getBalance({
      address: CRAWLER_ADDRESS,
    });

    console.log(`\n📊 Pre-transfer balances:`);
    console.log(`Publisher (${publisherAccount.address}): ${formatEther(publisherBalance)} ETH`);
    console.log(`Crawler (${CRAWLER_ADDRESS}): ${formatEther(crawlerBalanceBefore)} ETH`);

    // Check if publisher has enough funds
    const transferAmountWei = parseEther(TRANSFER_AMOUNT);
    if (publisherBalance < transferAmountWei) {
      console.error(`\n❌ Publisher account doesn't have enough ETH for transfer`);
      console.error(`Need: ${TRANSFER_AMOUNT} ETH, Have: ${formatEther(publisherBalance)} ETH`);
      process.exit(1);
    }

    console.log(`\n💸 Transferring ${TRANSFER_AMOUNT} ETH from Publisher to Crawler...`);

    // Execute transfer
    const hash = await walletClient.sendTransaction({
      to: CRAWLER_ADDRESS,
      value: transferAmountWei,
    });

    console.log(`📝 Transaction hash: ${hash}`);
    console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/tx/${hash}`);

    // Wait for confirmation
    console.log('\n⏳ Waiting for transaction confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === 'success') {
      console.log('✅ Transaction confirmed!');
      
      // Check final balances
      const publisherBalanceAfter = await publicClient.getBalance({
        address: publisherAccount.address,
      });
      
      const crawlerBalanceAfter = await publicClient.getBalance({
        address: CRAWLER_ADDRESS,
      });

      console.log(`\n📊 Post-transfer balances:`);
      console.log(`Publisher (${publisherAccount.address}): ${formatEther(publisherBalanceAfter)} ETH`);
      console.log(`Crawler (${CRAWLER_ADDRESS}): ${formatEther(crawlerBalanceAfter)} ETH`);
      
      console.log(`\n🎉 Successfully funded crawler account! Now you can run:`);
      console.log(`   node live-e2e-test.mjs`);
      
    } else {
      console.error('❌ Transaction failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Transfer failed:', error);
    process.exit(1);
  }
}

transferFunds();
