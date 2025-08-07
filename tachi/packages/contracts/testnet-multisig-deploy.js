#!/usr/bin/env node

const { ethers } = require('ethers');

async function deployMultiSig() {
  console.log('🚀 Deploying Testnet Multi-Signature Wallet...\n');

  // Setup provider
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  // Setup wallet
  require('dotenv').config();
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not found in .env file');
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log('👤 Deployer:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'ETH\n');

  // Factory address from recent deployment
  const factoryAddress = '0x92ce0fF405F6e80661E7D0746D9CD73A2E869557';
  
  // Factory ABI - simplified for our needs
  const factoryAbi = [
    'function deployTestnetMultiSig(address[] calldata signers, bytes32 salt) external returns (address)',
    'function predictMultiSigAddress(address[] calldata signers, uint256 requiredSignatures, bytes32 salt) external view returns (address)',
    'function owner() view returns (address)'
  ];
  
  const factory = new ethers.Contract(factoryAddress, factoryAbi, wallet);
  
  // Check if we're the owner
  try {
    const owner = await factory.owner();
    console.log('🏭 Factory Owner:', owner);
    console.log('🔑 Is Deployer Owner:', owner.toLowerCase() === wallet.address.toLowerCase());
  } catch (error) {
    console.log('⚠️  Could not check factory owner:', error.message);
  }

  // Setup signers for testnet (2-of-3)
  const signers = [
    wallet.address, // Use deployer address
    wallet.address, // For testing - same address
    wallet.address  // For testing - same address
  ];
  
  console.log('\n👥 Testnet Signers:');
  signers.forEach((signer, i) => {
    console.log(`  Signer ${i + 1}: ${signer}`);
  });
  
  // Generate salt for deterministic deployment
  const salt = ethers.randomBytes(32);
  console.log('\n🧂 Salt:', ethers.hexlify(salt));
  
  try {
    // Predict address
    console.log('\n🔮 Predicting deployment address...');
    const predictedAddress = await factory.predictMultiSigAddress(signers, 2, salt);
    console.log('📍 Predicted Address:', predictedAddress);
    
    // Deploy multi-sig
    console.log('\n📦 Deploying multi-signature wallet...');
    
    // Increase gas limit and price for Base Sepolia
    const txOptions = {
      gasLimit: 3000000,
      gasPrice: ethers.parseUnits('0.01', 'gwei') // Higher gas price
    };
    
    const tx = await factory.deployTestnetMultiSig(signers, salt, txOptions);
    console.log('📝 Transaction submitted:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    
    console.log('\n✅ Multi-Signature Wallet Deployed Successfully!');
    console.log('📍 Address:', predictedAddress);
    console.log('⛽ Gas Used:', receipt.gasUsed.toString());
    console.log('💸 Gas Price:', ethers.formatUnits(receipt.gasPrice || 0, 'gwei'), 'gwei');
    console.log('🧾 Transaction Hash:', receipt.hash);
    console.log('🔗 Block Number:', receipt.blockNumber);
    
    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    const code = await provider.getCode(predictedAddress);
    if (code === '0x') {
      console.log('❌ Deployment verification failed - no code at address');
    } else {
      console.log('✅ Deployment verified - contract code found');
      console.log('📏 Contract size:', (code.length - 2) / 2, 'bytes');
    }
    
    // Save deployment info
    const deploymentInfo = {
      network: 'baseSepolia',
      timestamp: new Date().toISOString(),
      factory: factoryAddress,
      multiSig: predictedAddress,
      signers: signers,
      requiredSignatures: 2,
      salt: ethers.hexlify(salt),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
    
    console.log('\n📋 Deployment Summary:');
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    
    if (error.message.includes('nonce too low') || error.message.includes('replacement transaction underpriced')) {
      console.log('\n💡 Tip: Wait a few minutes and try again, or increase gas price');
    }
    
    throw error;
  }
}

// Run deployment
deployMultiSig()
  .then(result => {
    console.log('\n🎉 Testnet deployment completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Deployment failed:', error);
    process.exit(1);
  });
