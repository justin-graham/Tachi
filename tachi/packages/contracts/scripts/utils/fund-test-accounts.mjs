#!/usr/bin/env node

/**
 * 🏦 Base Sepolia Test Account Funding Script
 * 
 * This script helps fund test accounts with Base Sepolia ETH for E2E testing.
 * It provides instructions and utilities for getting testnet funds.
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

// Configuration
const CONFIG = {
  BASE_SEPOLIA_RPC: 'https://sepolia.base.org',
  REQUIRED_BALANCE: '0.01', // Minimum ETH needed per account
};

// Test accounts that need funding
const TEST_ACCOUNTS = [
  {
    name: 'Publisher',
    address: '0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d',
    purpose: 'Deploy contracts and mint NFT licenses'
  },
  {
    name: 'Crawler',  
    address: '0x742E1F1F1A7bf939e5e3EdC0A8E3f3A2f8Ce53D1',
    purpose: 'Make payments and access crawled content'
  }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Initialize Base Sepolia client
function initializeClient() {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(CONFIG.BASE_SEPOLIA_RPC)
  });
}

// Check account balances
async function checkAccountBalances() {
  log('💰 Checking Base Sepolia Test Account Balances', colors.bold + colors.blue);
  log('================================================', colors.blue);
  
  const client = initializeClient();
  const results = [];
  
  for (const account of TEST_ACCOUNTS) {
    try {
      const balance = await client.getBalance({
        address: account.address
      });
      
      const ethBalance = formatUnits(balance, 18);
      const isEnough = parseFloat(ethBalance) >= parseFloat(CONFIG.REQUIRED_BALANCE);
      
      log(`\n${account.name} Account:`, colors.bold);
      log(`  📍 Address: ${account.address}`, colors.cyan);
      log(`  💰 Balance: ${ethBalance} ETH`, isEnough ? colors.green : colors.red);
      log(`  📋 Purpose: ${account.purpose}`, colors.cyan);
      log(`  ✅ Status: ${isEnough ? 'FUNDED' : 'NEEDS FUNDING'}`, isEnough ? colors.green : colors.red);
      
      results.push({
        ...account,
        balance: ethBalance,
        isEnough
      });
      
    } catch (error) {
      log(`❌ Error checking ${account.name}: ${error.message}`, colors.red);
      results.push({
        ...account,
        balance: '0',
        isEnough: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Provide funding instructions
function provideFundingInstructions(results) {
  log('\n🚰 Base Sepolia Testnet Funding Instructions', colors.bold + colors.yellow);
  log('=============================================', colors.yellow);
  
  const unfundedAccounts = results.filter(r => !r.isEnough);
  
  if (unfundedAccounts.length === 0) {
    log('\n🎉 All accounts are sufficiently funded!', colors.green);
    log('You can proceed with the E2E test.', colors.green);
    return true;
  }
  
  log(`\n⚠️  ${unfundedAccounts.length} account(s) need funding:`, colors.yellow);
  
  unfundedAccounts.forEach(account => {
    const needed = parseFloat(CONFIG.REQUIRED_BALANCE) - parseFloat(account.balance);
    log(`\n📍 ${account.name}: ${account.address}`, colors.cyan);
    log(`   💰 Current: ${account.balance} ETH`, colors.red);
    log(`   📈 Needed: ${needed.toFixed(6)} ETH`, colors.yellow);
  });
  
  log('\n💡 Funding Options:', colors.bold + colors.blue);
  
  log('\n1️⃣  Base Sepolia Bridge (Recommended)', colors.green);
  log('   🔗 https://bridge.base.org/deposit', colors.cyan);
  log('   • Connect wallet with mainnet ETH', colors.cyan);
  log('   • Bridge ETH to Base Sepolia', colors.cyan);
  log('   • Fastest and most reliable method', colors.cyan);
  
  log('\n2️⃣  Base Sepolia Faucet', colors.green);  
  log('   🔗 https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet', colors.cyan);
  log('   • Free but limited amounts', colors.cyan);
  log('   • May have daily limits', colors.cyan);
  log('   • Good for small amounts', colors.cyan);
  
  log('\n3️⃣  Third-Party Faucets', colors.green);
  log('   🔗 https://www.alchemy.com/faucets/base-sepolia', colors.cyan);
  log('   🔗 https://sepoliafaucet.com (for Sepolia ETH, then bridge)', colors.cyan);
  log('   • Multiple options available', colors.cyan);
  log('   • May require social verification', colors.cyan);
  
  log('\n4️⃣  Community Requests', colors.green);
  log('   💬 Base Discord: https://discord.gg/buildonbase', colors.cyan);
  log('   💬 Base Telegram: Request from community', colors.cyan);
  log('   • Ask for testnet funding help', colors.cyan);
  log('   • Community is usually helpful', colors.cyan);
  
  log('\n🔄 After funding, run this script again to verify:', colors.bold + colors.blue);
  log('   node fund-test-accounts.mjs', colors.cyan);
  
  return false;
}

// Generate funding transactions (for those who have ETH to distribute)
function generateFundingScript(results) {
  log('\n💳 Funding Script Generation', colors.bold + colors.blue);
  log('============================', colors.blue);
  
  const unfundedAccounts = results.filter(r => !r.isEnough);
  
  if (unfundedAccounts.length === 0) {
    return;
  }
  
  log('\n📝 If you have Base Sepolia ETH to distribute, use these commands:', colors.cyan);
  log('(Replace YOUR_PRIVATE_KEY with your funded account private key)', colors.yellow);
  
  unfundedAccounts.forEach(account => {
    const needed = parseFloat(CONFIG.REQUIRED_BALANCE) - parseFloat(account.balance);
    const sendAmount = Math.ceil(needed * 1000000) / 1000000; // Round up to 6 decimals
    
    log(`\n# Fund ${account.name} Account:`, colors.cyan);
    log(`cast send ${account.address} \\`, colors.green);
    log(`  --value ${sendAmount}ether \\`, colors.green);
    log(`  --rpc-url ${CONFIG.BASE_SEPOLIA_RPC} \\`, colors.green);
    log(`  --private-key YOUR_PRIVATE_KEY`, colors.green);
  });
  
  log('\n📋 Or use this Node.js script template:', colors.cyan);
  log(`
import { createWalletClient, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const FUNDER_PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE';
const account = privateKeyToAccount(FUNDER_PRIVATE_KEY);

const client = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http('${CONFIG.BASE_SEPOLIA_RPC}')
});

// Fund accounts
${unfundedAccounts.map(account => {
  const needed = parseFloat(CONFIG.REQUIRED_BALANCE) - parseFloat(account.balance);
  const sendAmount = Math.ceil(needed * 1000000) / 1000000;
  return `
await client.sendTransaction({
  to: '${account.address}',
  value: parseEther('${sendAmount}')
});
console.log('✅ Funded ${account.name}: ${account.address}');`;
}).join('')}
`, colors.green);
}

// Main execution
async function main() {
  log('🏦 Base Sepolia Test Account Funding Utility', colors.bold + colors.blue);
  log('============================================', colors.blue);
  log(`📍 Network: Base Sepolia (Chain ID: ${baseSepolia.id})`, colors.cyan);
  log(`🌐 RPC: ${CONFIG.BASE_SEPOLIA_RPC}`, colors.cyan);
  log(`💰 Required per account: ${CONFIG.REQUIRED_BALANCE} ETH`, colors.cyan);
  
  try {
    const results = await checkAccountBalances();
    const allFunded = provideFundingInstructions(results);
    
    if (!allFunded) {
      generateFundingScript(results);
    }
    
    log('\n' + '='.repeat(50), colors.blue);
    if (allFunded) {
      log('🎯 Ready to proceed with E2E testing!', colors.bold + colors.green);
      log('Run: cd /Users/justin/Tachi/tachi/packages/contracts && node live-e2e-test.mjs', colors.cyan);
    } else {
      log('⏳ Fund accounts first, then run E2E test', colors.yellow);
    }
    
  } catch (error) {
    log(`❌ Funding check failed: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;
