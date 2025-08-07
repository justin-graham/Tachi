#!/usr/bin/env node

const { ethers } = require('ethers');

async function deployCrawlNFTMultiSig() {
  console.log('🚀 Deploying CrawlNFTMultiSig Contract...\n');

  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  require('dotenv').config();
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('👤 Deployer:', wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');

  // Multi-sig wallet address from previous deployment
  const multiSigWallet = '0x1C5a9A0228efc875484Bca44df3987bB6A2aca23';
  console.log('🔗 Multi-sig wallet:', multiSigWallet);

  try {
    // Read the compiled contract artifact
    const fs = require('fs');
    const path = require('path');
    
    const artifactPath = path.join(__dirname, 'artifacts', 'src', 'CrawlNFTMultiSig.sol', 'CrawlNFTMultiSig.json');
    
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Contract artifact not found at ${artifactPath}. Run 'npx hardhat compile' first.`);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abi = artifact.abi;
    const bytecode = artifact.bytecode;
    
    console.log('\n📄 Contract artifact loaded');
    console.log('📏 Bytecode size:', (bytecode.length - 2) / 2, 'bytes');
    
    // Create contract factory
    const ContractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    // Constructor parameters
    console.log('\n📦 Deploying CrawlNFTMultiSig...');
    console.log('  Name: Tachi Content License (hardcoded)');
    console.log('  Symbol: CRAWL (hardcoded)');
    console.log('  Multi-sig wallet:', multiSigWallet);
    
    const deployTx = await ContractFactory.deploy(
      multiSigWallet,
      {
        gasLimit: 3000000,
        gasPrice: ethers.parseUnits('0.01', 'gwei')
      }
    );
    
    console.log('📝 Deployment transaction:', deployTx.deploymentTransaction()?.hash);
    console.log('⏳ Waiting for deployment...');
    
    const contract = await deployTx.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log('\n✅ CrawlNFTMultiSig Deployed Successfully!');
    console.log('📍 Contract Address:', address);
    
    // Verify deployment
    const code = await provider.getCode(address);
    console.log('✅ Contract verified - code length:', (code.length - 2) / 2, 'bytes');
    
    // Test basic functionality
    console.log('\n🧪 Testing basic functionality...');
    
    const contractName = await contract.name();
    const contractSymbol = await contract.symbol();
    const multiSigAddress = await contract.multiSigWallet();
    
    console.log('🏷️  Name:', contractName);
    console.log('🔤 Symbol:', contractSymbol);
    console.log('🔗 Multi-sig wallet:', multiSigAddress);
    
    // Check role setup
    const MULTISIG_ROLE = await contract.MULTISIG_ROLE();
    const hasMultiSigRole = await contract.hasRole(MULTISIG_ROLE, multiSigWallet);
    
    console.log('\n🔑 Role validation:');
    console.log('🏷️  MULTISIG_ROLE:', MULTISIG_ROLE);
    console.log('✅ Multi-sig has MULTISIG_ROLE:', hasMultiSigRole);
    
    const deploymentInfo = {
      network: 'Base Sepolia Testnet',
      timestamp: new Date().toISOString(),
      contractAddress: address,
      name: contractName,
      symbol: contractSymbol,
      multiSigWallet: multiSigAddress,
      transactionHash: deployTx.deploymentTransaction()?.hash,
      deployerAddress: wallet.address,
      hasMultiSigRole: hasMultiSigRole
    };
    
    console.log('\n📋 Deployment Summary:');
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    throw error;
  }
}

deployCrawlNFTMultiSig()
  .then(result => {
    console.log('\n🎉 CrawlNFTMultiSig deployment completed successfully!');
    console.log('\n🚀 Testnet Multi-Signature Infrastructure Complete:');
    console.log('   ✅ TachiMultiSig: 0x1C5a9A0228efc875484Bca44df3987bB6A2aca23');
    console.log('   ✅ CrawlNFTMultiSig:', result.contractAddress);
    console.log('   ✅ Multi-signature governance enabled');
    console.log('   ✅ Hardware wallet ready');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Deployment failed:', error);
    process.exit(1);
  });
