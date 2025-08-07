#!/usr/bin/env node

const { ethers } = require('ethers');

async function testFactory() {
  console.log('🔍 Testing Factory Contract...\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  require('dotenv').config();
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('👤 Wallet:', wallet.address);
  
  const factoryAddress = '0x92ce0fF405F6e80661E7D0746D9CD73A2E869557';
  
  // More complete factory ABI based on our contract
  const factoryAbi = [
    'function owner() view returns (address)',
    'function deployTestnetMultiSig(address[] calldata signers, bytes32 salt) external returns (address)',
    'function deployProductionMultiSig(address[] calldata signers, bytes32 salt) external returns (address)',
    'function getTestnetConfig() public pure returns (tuple(uint256 requiredSignatures, uint256 maxSigners, string description))',
    'function getProductionConfig() public pure returns (tuple(uint256 requiredSignatures, uint256 maxSigners, string description))',
    'function deployedMultiSigs(uint256) view returns (address)',
    'function getDeployedMultiSigs() view returns (address[])'
  ];
  
  const factory = new ethers.Contract(factoryAddress, factoryAbi, wallet);
  
  try {
    // Check owner
    const owner = await factory.owner();
    console.log('🏭 Factory owner:', owner);
    console.log('🔑 Is wallet owner:', owner.toLowerCase() === wallet.address.toLowerCase());
    
    // Check testnet config
    const testnetConfig = await factory.getTestnetConfig();
    console.log('\n📋 Testnet Config:');
    console.log('  Required signatures:', testnetConfig.requiredSignatures.toString());
    console.log('  Max signers:', testnetConfig.maxSigners.toString());
    console.log('  Description:', testnetConfig.description);
    
    // Check deployed multisigs
    try {
      const deployed = await factory.getDeployedMultiSigs();
      console.log('\n📦 Deployed MultiSigs:', deployed.length);
      deployed.forEach((addr, i) => {
        console.log(`  ${i + 1}: ${addr}`);
      });
    } catch (error) {
      console.log('\n📦 Could not get deployed multisigs:', error.message);
    }
    
    // Check code at factory address
    const code = await provider.getCode(factoryAddress);
    console.log('\n🔍 Factory code length:', (code.length - 2) / 2, 'bytes');
    
    console.log('\n✅ Factory contract is accessible and working');
    
  } catch (error) {
    console.error('\n❌ Factory test failed:', error.message);
    throw error;
  }
}

testFactory()
  .then(() => {
    console.log('\n🎉 Factory test completed!');
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
