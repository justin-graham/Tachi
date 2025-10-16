#!/usr/bin/env node

/**
 * Batch log crawl events from Supabase to ProofOfCrawl contract
 * Run this periodically to ensure immutable on-chain audit trail
 */

import 'dotenv/config';
import {createWalletClient, createPublicClient, http, parseAbi} from 'viem';
import {base} from 'viem/chains';
import {privateKeyToAccount} from 'viem/accounts';
import {createClient} from '@supabase/supabase-js';

const PROOF_OF_CRAWL_ABI = parseAbi([
  'function logCrawl(uint256 tokenId, address crawler, string calldata url) external',
  'function logPayment(address crawler, address publisher, uint256 amount, string calldata txHash) external'
]);

async function main() {
  console.log('🔄 Batch logging crawl events to ProofOfCrawl contract...\n');

  // Initialize clients
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const account = privateKeyToAccount(`0x${process.env.ADMIN_PRIVATE_KEY}`);
  const publicClient = createPublicClient({chain: base, transport: http()});
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http()
  });

  // Fetch unlogged crawl events from Supabase
  const {data: crawls, error} = await supabase
    .from('crawl_logs')
    .select('*')
    .is('onchain_logged', null)
    .limit(10); // Batch in groups of 10

  if (error) {
    console.error('❌ Failed to fetch crawl logs:', error);
    return;
  }

  if (!crawls || crawls.length === 0) {
    console.log('✅ No new crawl events to log on-chain.');
    return;
  }

  console.log(`📦 Found ${crawls.length} events to log on-chain\n`);

  // Log each crawl on-chain
  for (const crawl of crawls) {
    try {
      console.log(`Logging crawl: ${crawl.path} by ${crawl.crawler_address.slice(0, 10)}...`);

      // Log crawl to ProofOfCrawl contract
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_PROOF_OF_CRAWL_ADDRESS,
        abi: PROOF_OF_CRAWL_ABI,
        functionName: 'logCrawl',
        args: [
          BigInt(1), // tokenId - you may want to fetch this from CrawlNFT
          crawl.crawler_address,
          crawl.path
        ],
        account,
        chain: base
      });

      await publicClient.waitForTransactionReceipt({hash});
      console.log(`  ✅ Logged on-chain: ${hash}\n`);

      // Mark as logged in Supabase
      await supabase
        .from('crawl_logs')
        .update({onchain_logged: true, onchain_tx: hash})
        .eq('id', crawl.id);
    } catch (error) {
      console.error(`  ❌ Failed to log crawl ${crawl.id}:`, error.message);
    }
  }

  // Also batch log payments
  const {data: payments} = await supabase
    .from('payments')
    .select('*')
    .is('onchain_logged', null)
    .limit(10);

  if (payments && payments.length > 0) {
    console.log(`\n💰 Found ${payments.length} payments to log on-chain\n`);

    for (const payment of payments) {
      try {
        console.log(`Logging payment: ${payment.amount} USDC from ${payment.crawler_address.slice(0, 10)}...`);

        const amountWei = Math.floor(parseFloat(payment.amount) * 1e6);
        const hash = await walletClient.writeContract({
          address: process.env.NEXT_PUBLIC_PROOF_OF_CRAWL_ADDRESS,
          abi: PROOF_OF_CRAWL_ABI,
          functionName: 'logPayment',
          args: [
            payment.crawler_address,
            payment.publisher_address,
            BigInt(amountWei),
            payment.tx_hash
          ],
          account,
          chain: base
        });

        await publicClient.waitForTransactionReceipt({hash});
        console.log(`  ✅ Logged on-chain: ${hash}\n`);

        await supabase
          .from('payments')
          .update({onchain_logged: true, onchain_tx: hash})
          .eq('id', payment.id);
      } catch (error) {
        console.error(`  ❌ Failed to log payment ${payment.id}:`, error.message);
      }
    }
  }

  console.log('\n✅ Batch logging complete!');
  console.log('💡 Run this script periodically (e.g., via cron) to keep on-chain logs up to date.\n');
}

main().catch(console.error);
