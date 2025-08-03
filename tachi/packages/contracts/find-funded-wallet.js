#!/usr/bin/env node

const { ethers } = require('ethers');

async function findFundedWallet() {
  const mnemonic = 'basic engine dash possible slab oval soon silk galaxy doctor client you';
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  console.log('🔍 Searching for your funded wallet (0.141 ETH)...');
  console.log('');
  
  // Extended derivation paths that Coinbase Wallet might use
  const derivationPaths = [
    // Standard Ethereum paths
    { path: "44'/60'/0'/0/0", name: "Standard Account 0" },
    { path: "44'/60'/0'/0/1", name: "Standard Account 1" },
    { path: "44'/60'/0'/0/2", name: "Standard Account 2" },
    { path: "44'/60'/0'/0/3", name: "Standard Account 3" },
    { path: "44'/60'/0'/0/4", name: "Standard Account 4" },
    { path: "44'/60'/0'/0/5", name: "Standard Account 5" },
    
    // Alternative formats
    { path: "44'/60'/0'/1/0", name: "Alternative Format 1" },
    { path: "44'/60'/1'/0/0", name: "Ledger Style" },
    { path: "44'/60'/0'/0", name: "No Account Index" },
    
    // Coinbase specific paths (some wallets use these)
    { path: "44'/60'/0'/0/0", name: "Coinbase Standard" },
    { path: "44'/60'/1'/0/0", name: "Coinbase Alternative" },
    
    // Extended range for multiple accounts
    { path: "44'/60'/0'/0/6", name: "Account 6" },
    { path: "44'/60'/0'/0/7", name: "Account 7" },
    { path: "44'/60'/0'/0/8", name: "Account 8" },
    { path: "44'/60'/0'/0/9", name: "Account 9" },
    { path: "44'/60'/0'/0/10", name: "Account 10" },
  ];
  
  try {
    const masterNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    
    for (const { path, name } of derivationPaths) {
      try {
        const wallet = masterNode.derivePath(path);
        
        // Check balance
        const ethBalance = await provider.getBalance(wallet.address);
        const ethFormatted = ethers.formatEther(ethBalance);
        
        console.log(`🔍 ${name} (m/${path})`);
        console.log(`   Address: ${wallet.address}`);
        console.log(`   Balance: ${ethFormatted} ETH`);
        
        // Check if this is close to your target (0.141 ETH)
        const balance = parseFloat(ethFormatted);
        if (balance > 0.13 && balance < 0.15) {
          console.log('   🎯 POTENTIAL MATCH! Close to 0.141 ETH');
        }
        
        if (balance >= 0.1) {
          console.log('   ✅ FOUND FUNDED WALLET!');
          console.log('   🔑 Private Key:', wallet.privateKey);
          console.log('');
          console.log('   📝 Update your .env file with:');
          console.log(`   PRIVATE_KEY=${wallet.privateKey}`);
          console.log('');
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Error with path ${path}:`, error.message);
      }
    }
    
    console.log('🔍 Search complete. If no funded wallet found, the funds might be:');
    console.log('   1. On a different recovery phrase');
    console.log('   2. Using a non-standard derivation path');
    console.log('   3. Imported directly (not derived from seed)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findFundedWallet();
