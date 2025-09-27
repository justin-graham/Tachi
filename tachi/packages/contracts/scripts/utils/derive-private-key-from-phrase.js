#!/usr/bin/env node

const { ethers } = require('ethers');

// Your seed phrase (the one you provided earlier)
const seedPhrase = "your seed phrase here"; // Replace with your actual phrase

async function derivePrivateKey() {
  try {
    console.log('🔐 Deriving private key from seed phrase...');
    console.log('');
    
    // Create wallet from mnemonic
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    
    console.log('📍 Derived Address:', wallet.address);
    console.log('🔑 Private Key:', wallet.privateKey);
    console.log('');
    
    // Verify this matches your expected address
    const expectedAddress = '0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d';
    
    if (wallet.address.toLowerCase() === expectedAddress.toLowerCase()) {
      console.log('✅ SUCCESS! This matches your funded wallet address');
      console.log('');
      console.log('💡 Next steps:');
      console.log('1. Copy the private key above');
      console.log('2. Update your .env file PRIVATE_KEY with this value');
      console.log('3. Run: node preflight-check.mjs');
    } else {
      console.log('⚠️  Address mismatch!');
      console.log('Expected:', expectedAddress);
      console.log('Derived: ', wallet.address);
      console.log('');
      console.log('This might be because:');
      console.log('- Different derivation path needed');
      console.log('- Different account index in your wallet');
      console.log('- Seed phrase might be for a different wallet');
    }
    
  } catch (error) {
    console.error('❌ Error deriving private key:', error.message);
    console.log('');
    console.log('Make sure your seed phrase is correct and properly formatted.');
  }
}

derivePrivateKey();
