#!/usr/bin/env node

const { ethers } = require('ethers');

async function deployMultiSigDirect() {
  console.log('🚀 Direct Multi-Signature Wallet Deployment...\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  require('dotenv').config();
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('👤 Deployer:', wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'ETH\n');

  // Multi-sig constructor parameters
  const signers = [
    wallet.address, // For testnet, use same address
    wallet.address,
    wallet.address
  ];
  const requiredSignatures = 2;
  
  console.log('👥 Signers:', signers);
  console.log('✍️  Required signatures:', requiredSignatures);

  try {
    // Get the contract factory (compile time)
    const contractName = 'TachiMultiSig';
    
    // Read the compiled contract
    const fs = require('fs');
    const path = require('path');
    
    const artifactPath = path.join(__dirname, 'artifacts', 'src', 'TachiMultiSig.sol', 'TachiMultiSig.json');
    
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Contract artifact not found at ${artifactPath}. Run 'npx hardhat compile' first.`);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abi = artifact.abi;
    const bytecode = artifact.bytecode;
    
    console.log('📄 Contract artifact loaded');
    console.log('📏 Bytecode size:', (bytecode.length - 2) / 2, 'bytes');
    
    // Create contract factory
    const ContractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    // Deploy with increased gas limit
    console.log('\n📦 Deploying TachiMultiSig...');
    
    const deployTx = await ContractFactory.deploy(signers, requiredSignatures, {
      gasLimit: 3000000,
      gasPrice: ethers.parseUnits('0.01', 'gwei')
    });
    
    console.log('📝 Deployment transaction:', deployTx.deploymentTransaction()?.hash);
    console.log('⏳ Waiting for deployment...');
    
    const contract = await deployTx.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log('\n✅ Multi-Signature Wallet Deployed Successfully!');
    console.log('📍 Contract Address:', address);
    
    // Verify deployment
    const code = await provider.getCode(address);
    console.log('✅ Contract verified - code length:', (code.length - 2) / 2, 'bytes');
    
    // Test basic functionality
    console.log('\n🧪 Testing basic functionality...');
    
    const requiredSigs = await contract.REQUIRED_SIGNATURES();
    const maxSigners = await contract.MAX_SIGNERS();
    const signerCount = await contract.signerCount();
    
    console.log('✍️  Required signatures:', requiredSigs.toString());
    console.log('👥 Max signers:', maxSigners.toString());
    console.log('📊 Current signer count:', signerCount.toString());
    
    // Check if deployer has signer role
    const SIGNER_ROLE = await contract.SIGNER_ROLE();
    const hasSignerRole = await contract.hasRole(SIGNER_ROLE, wallet.address);
    console.log('🔑 Deployer has SIGNER_ROLE:', hasSignerRole);
    
    const deploymentInfo = {
      network: 'baseSepolia',
      timestamp: new Date().toISOString(),
      contractAddress: address,
      signers: signers,
      requiredSignatures: requiredSignatures,
      transactionHash: deployTx.deploymentTransaction()?.hash,
      deployerAddress: wallet.address
    };
    
    console.log('\n📋 Deployment Summary:');
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('\n❌ Direct deployment failed:', error.message);
    throw error;
  }
}

deployMultiSigDirect()
  .then(result => {
    console.log('\n🎉 Direct deployment completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Deployment failed:', error);
    process.exit(1);
  });
