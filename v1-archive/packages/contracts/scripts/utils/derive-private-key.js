#!/usr/bin/env node

/**
 * 🔐 Private Key Derivation Tool
 * 
 * This script helps you derive the private key from your recovery phrase
 * for the account that has Base Sepolia ETH.
 * 
 * ⚠️  SECURITY WARNING: Only run this on your local machine!
 */

const { ethers } = require('ethers');

function derivePrivateKey() {
  console.log('🔐 Private Key Derivation Tool\n');
  console.log('This will help you find the private key for your Base Sepolia account.\n');
  
  // Get recovery phrase from user input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Enter your 12 or 24-word recovery phrase: ', (mnemonic) => {
    if (!mnemonic.trim()) {
      console.log('❌ No recovery phrase provided');
      rl.close();
      return;
    }
    
    try {
      console.log('\n🔍 Checking accounts derived from your recovery phrase...\n');
      
      // Check multiple derivation paths (Coinbase Wallet typically uses m/44'/60'/0'/0/x)
      for (let i = 0; i < 10; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const wallet = ethers.Wallet.fromPhrase(mnemonic.trim(), path);
        
        console.log(`Account ${i}: ${wallet.address}`);
        console.log(`  Derivation path: ${path}`);
        console.log(`  Private key: ${wallet.privateKey}`);
        console.log('');
        
        // Check if this matches the address from your screenshot
        // You'll need to identify which one has the ETH balance
      }
      
      console.log('📝 Instructions:');
      console.log('1. Find the account address that matches your Coinbase Wallet');
      console.log('2. Copy the corresponding private key');
      console.log('3. Update your .env file with that private key');
      console.log('4. Delete this output for security');
      
    } catch (error) {
      console.error('❌ Error deriving keys:', error.message);
      console.log('Make sure your recovery phrase is correct (12 or 24 words)');
    }
    
    rl.close();
  });
}

derivePrivateKey();
