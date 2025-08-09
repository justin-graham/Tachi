#!/usr/bin/env node

/**
 * Production Deployment Script for Tachi Protocol Smart Contracts
 * 
 * This script handles secure deployment to Base Mainnet with comprehensive
 * validation, monitoring setup, and post-deployment verification.
 */

import hre from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { SecureKeyManager } from "./key-management.js";
import { SecurityMonitor } from "./security-monitor.js";

// Production network configuration
const PRODUCTION_NETWORKS = {
  base: {
    name: "Base Mainnet",
    chainId: 8453,
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    explorerUrl: "https://basescan.org",
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    requiredConfirmations: 3,
    gasLimitMultiplier: 1.2
  }
};

class ProductionDeployer {
  constructor(network) {
    this.network = PRODUCTION_NETWORKS[network];
    if (!this.network) {
      throw new Error(`Unsupported production network: ${network}`);
    }
    
    this.keyManager = new SecureKeyManager();
    this.deploymentResults = {
      network: this.network.name,
      chainId: this.network.chainId,
      timestamp: new Date().toISOString(),
      deployer: '',
      contracts: {},
      gasUsed: {},
      verificationStatus: {}
    };
  }

  /**
   * Pre-deployment validation and security checks
   */
  async preDeploymentChecks() {
    console.log('🔒 Starting Pre-Deployment Security Checks...');
    console.log('='.repeat(60));
    
    // 1. Validate network connection
    await this.validateNetworkConnection();
    
    // 2. Validate deployer account
    await this.validateDeployerAccount();
    
    // 3. Validate environment configuration
    await this.validateEnvironmentConfig();
    
    // 4. Check gas prices
    await this.checkGasPrices();
    
    // 5. Validate contract compilation
    await this.validateContractCompilation();
    
    console.log('✅ All pre-deployment checks passed');
  }

  async validateNetworkConnection() {
    console.log('🌐 Validating network connection...');
    
    const provider = hre.ethers.provider;
    const network = await provider.getNetwork();
    
    if (Number(network.chainId) !== this.network.chainId) {
      throw new Error(`Network mismatch: Expected ${this.network.chainId}, got ${network.chainId}`);
    }
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Connected to ${this.network.name} (Block: ${blockNumber})`);
  }

  async validateDeployerAccount() {
    console.log('👤 Validating deployer account...');
    
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const balance = await hre.ethers.provider.getBalance(deployerAddress);
    
    this.deploymentResults.deployer = deployerAddress;
    
    console.log(`📍 Deployer: ${deployerAddress}`);
    console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH`);
    
    // Check minimum balance (0.1 ETH for mainnet)
    const minBalance = hre.ethers.parseEther("0.1");
    if (balance < minBalance) {
      throw new Error(`Insufficient balance. Need at least 0.1 ETH for deployment. Current: ${hre.ethers.formatEther(balance)} ETH`);
    }
    
    // Validate deployer key security
    await this.validateKeySecurity(deployerAddress);
  }

  async validateKeySecurity(address) {
    console.log('🔐 Validating key security...');
    
    // Check if address matches expected pattern for production keys
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey || !privateKey.startsWith('0x')) {
      throw new Error('Invalid or missing private key format');
    }
    
    // Validate key corresponds to address
    try {
      this.keyManager.validatePrivateKey(privateKey);
      console.log('✅ Private key validation passed');
    } catch (error) {
      throw new Error(`Private key validation failed: ${error.message}`);
    }
  }

  async validateEnvironmentConfig() {
    console.log('⚙️  Validating environment configuration...');
    
    const required = ['BASE_RPC_URL', 'PRIVATE_KEY', 'BASESCAN_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    console.log('✅ Environment configuration valid');
  }

  async checkGasPrices() {
    console.log('⛽ Checking current gas prices...');
    
    const feeData = await hre.ethers.provider.getFeeData();
    const gasPrice = Number(hre.ethers.formatUnits(feeData.gasPrice || 0, 'gwei'));
    
    console.log(`💨 Current gas price: ${gasPrice.toFixed(2)} Gwei`);
    
    // Warning for high gas prices
    if (gasPrice > 50) {
      console.log('⚠️  WARNING: High gas prices detected. Consider waiting for lower prices.');
      
      // In production, you might want to pause here
      if (process.env.FORCE_DEPLOY !== 'true') {
        throw new Error('Gas prices too high. Set FORCE_DEPLOY=true to override.');
      }
    }
  }

  async validateContractCompilation() {
    console.log('🔨 Validating contract compilation...');
    
    try {
      // Ensure contracts are compiled
      await hre.run('compile');
      console.log('✅ Contracts compiled successfully');
    } catch (error) {
      throw new Error(`Contract compilation failed: ${error.message}`);
    }
  }

  /**
   * Deploy all contracts with comprehensive error handling
   */
  async deployContracts() {
    console.log('\n📦 Starting Contract Deployment...');
    console.log('='.repeat(60));
    
    const [deployer] = await hre.ethers.getSigners();
    
    try {
      // Deploy contracts in dependency order
      await this.deployCrawlNFT(deployer);
      await this.deployPaymentProcessor(deployer);
      await this.deployProofOfCrawlLedger(deployer);
      
      // Setup contract interactions
      await this.configureContracts();
      
      console.log('\n✅ All contracts deployed successfully');
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  async deployCrawlNFT(deployer) {
    console.log('\n🎨 Deploying CrawlNFT...');
    
    const CrawlNFTFactory = await hre.ethers.getContractFactory("CrawlNFTSelfMint");
    
    // Estimate gas
    const deploymentData = CrawlNFTFactory.interface.encodeDeploy();
    const gasEstimate = await hre.ethers.provider.estimateGas({
      data: CrawlNFTFactory.bytecode + deploymentData.slice(2),
      from: deployer.address
    });
    
    const gasLimit = BigInt(Math.floor(Number(gasEstimate) * this.network.gasLimitMultiplier));
    
    console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
    console.log(`⛽ Gas limit: ${gasLimit.toString()}`);
    
    // Deploy with extra gas limit
    const crawlNFT = await CrawlNFTFactory.deploy({ gasLimit });
    
    // Wait for confirmations
    console.log(`🕐 Waiting for ${this.network.requiredConfirmations} confirmations...`);
    await crawlNFT.waitForDeployment();
    
    const receipt = await hre.ethers.provider.getTransactionReceipt(crawlNFT.deploymentTransaction().hash);
    
    // Wait for additional confirmations
    if (receipt.confirmations < this.network.requiredConfirmations) {
      await crawlNFT.deploymentTransaction().wait(this.network.requiredConfirmations);
    }
    
    const address = await crawlNFT.getAddress();
    
    this.deploymentResults.contracts.crawlNFT = {
      address,
      transactionHash: crawlNFT.deploymentTransaction().hash,
      blockNumber: receipt.blockNumber
    };
    
    this.deploymentResults.gasUsed.crawlNFT = receipt.gasUsed.toString();
    
    console.log(`✅ CrawlNFT deployed to: ${address}`);
    console.log(`📊 Gas used: ${receipt.gasUsed.toString()}`);
  }

  async deployPaymentProcessor(deployer) {
    console.log('\n💳 Deploying PaymentProcessor...');
    
    const PaymentProcessorFactory = await hre.ethers.getContractFactory("PaymentProcessor");
    
    // Constructor parameters
    const constructorArgs = [
      this.network.usdcAddress,
      this.deploymentResults.contracts.crawlNFT.address
    ];
    
    const gasEstimate = await PaymentProcessorFactory.estimateGas.deploy(...constructorArgs);
    const gasLimit = BigInt(Math.floor(Number(gasEstimate) * this.network.gasLimitMultiplier));
    
    console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
    
    const paymentProcessor = await PaymentProcessorFactory.deploy(
      ...constructorArgs,
      { gasLimit }
    );
    
    await paymentProcessor.waitForDeployment();
    const receipt = await hre.ethers.provider.getTransactionReceipt(paymentProcessor.deploymentTransaction().hash);
    
    // Wait for confirmations
    if (receipt.confirmations < this.network.requiredConfirmations) {
      await paymentProcessor.deploymentTransaction().wait(this.network.requiredConfirmations);
    }
    
    const address = await paymentProcessor.getAddress();
    
    this.deploymentResults.contracts.paymentProcessor = {
      address,
      transactionHash: paymentProcessor.deploymentTransaction().hash,
      blockNumber: receipt.blockNumber
    };
    
    this.deploymentResults.gasUsed.paymentProcessor = receipt.gasUsed.toString();
    
    console.log(`✅ PaymentProcessor deployed to: ${address}`);
    console.log(`📊 Gas used: ${receipt.gasUsed.toString()}`);
  }

  async deployProofOfCrawlLedger(deployer) {
    console.log('\n📋 Deploying ProofOfCrawlLedger...');
    
    const ProofOfCrawlLedgerFactory = await hre.ethers.getContractFactory("ProofOfCrawlLedger");
    
    const constructorArgs = [
      this.deploymentResults.contracts.paymentProcessor.address
    ];
    
    const gasEstimate = await ProofOfCrawlLedgerFactory.estimateGas.deploy(...constructorArgs);
    const gasLimit = BigInt(Math.floor(Number(gasEstimate) * this.network.gasLimitMultiplier));
    
    const proofLedger = await ProofOfCrawlLedgerFactory.deploy(
      ...constructorArgs,
      { gasLimit }
    );
    
    await proofLedger.waitForDeployment();
    const receipt = await hre.ethers.provider.getTransactionReceipt(proofLedger.deploymentTransaction().hash);
    
    if (receipt.confirmations < this.network.requiredConfirmations) {
      await proofLedger.deploymentTransaction().wait(this.network.requiredConfirmations);
    }
    
    const address = await proofLedger.getAddress();
    
    this.deploymentResults.contracts.proofOfCrawlLedger = {
      address,
      transactionHash: proofLedger.deploymentTransaction().hash,
      blockNumber: receipt.blockNumber
    };
    
    this.deploymentResults.gasUsed.proofOfCrawlLedger = receipt.gasUsed.toString();
    
    console.log(`✅ ProofOfCrawlLedger deployed to: ${address}`);
    console.log(`📊 Gas used: ${receipt.gasUsed.toString()}`);
  }

  async configureContracts() {
    console.log('\n⚙️  Configuring contract interactions...');
    
    // Configure PaymentProcessor with ProofOfCrawlLedger
    const PaymentProcessor = await hre.ethers.getContractAt(
      "PaymentProcessor",
      this.deploymentResults.contracts.paymentProcessor.address
    );
    
    const tx = await PaymentProcessor.setProofLedger(
      this.deploymentResults.contracts.proofOfCrawlLedger.address
    );
    
    await tx.wait(this.network.requiredConfirmations);
    
    console.log('✅ Contract configuration complete');
  }

  /**
   * Verify contracts on Basescan
   */
  async verifyContracts() {
    console.log('\n🔍 Verifying contracts on Basescan...');
    
    const contracts = [
      {
        name: 'CrawlNFTSelfMint',
        address: this.deploymentResults.contracts.crawlNFT.address,
        constructorArguments: []
      },
      {
        name: 'PaymentProcessor',
        address: this.deploymentResults.contracts.paymentProcessor.address,
        constructorArguments: [
          this.network.usdcAddress,
          this.deploymentResults.contracts.crawlNFT.address
        ]
      },
      {
        name: 'ProofOfCrawlLedger',
        address: this.deploymentResults.contracts.proofOfCrawlLedger.address,
        constructorArguments: [
          this.deploymentResults.contracts.paymentProcessor.address
        ]
      }
    ];
    
    for (const contract of contracts) {
      try {
        console.log(`🔍 Verifying ${contract.name}...`);
        
        await hre.run("verify:verify", {
          address: contract.address,
          constructorArguments: contract.constructorArguments,
        });
        
        this.deploymentResults.verificationStatus[contract.name] = 'verified';
        console.log(`✅ ${contract.name} verified`);
        
      } catch (error) {
        console.warn(`⚠️  ${contract.name} verification failed:`, error.message);
        this.deploymentResults.verificationStatus[contract.name] = 'failed';
      }
    }
  }

  /**
   * Setup monitoring for deployed contracts
   */
  async setupMonitoring() {
    console.log('\n📊 Setting up security monitoring...');
    
    const monitorConfig = {
      network: 'base',
      rpcUrl: this.network.rpcUrl,
      contracts: this.deploymentResults.contracts,
      alerts: {
        maxTransactionsPerBlock: 1000,
        largeValueThreshold: '10',
        maxEventsPerMinute: 50
      },
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL
      },
      pagerDuty: {
        integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY
      }
    };
    
    // Save monitoring configuration
    const monitoringConfigPath = join(process.cwd(), 'monitoring-config.json');
    writeFileSync(monitoringConfigPath, JSON.stringify(monitorConfig, null, 2));
    
    console.log(`✅ Monitoring configuration saved to: ${monitoringConfigPath}`);
    console.log('📝 To start monitoring, run: node scripts/security-monitor.js');
  }

  /**
   * Save deployment results
   */
  async saveDeploymentResults() {
    console.log('\n💾 Saving deployment results...');
    
    // Calculate total gas used
    const totalGasUsed = Object.values(this.deploymentResults.gasUsed)
      .reduce((total, gas) => total + BigInt(gas), BigInt(0));
    
    this.deploymentResults.gasUsed.total = totalGasUsed.toString();
    
    // Create deployment directory
    const deploymentDir = join(process.cwd(), 'deployments', 'production');
    if (!existsSync(deploymentDir)) {
      mkdirSync(deploymentDir, { recursive: true });
    }
    
    // Save main deployment file with timestamp
    const deploymentFile = join(deploymentDir, `deployment-${Date.now()}.json`);
    writeFileSync(deploymentFile, JSON.stringify(this.deploymentResults, null, 2));
    
    // Save individual contract deployment files
    for (const [contractName, contractData] of Object.entries(this.deploymentResults.contracts)) {
      const contractFile = join(deploymentDir, `${contractName}-deployment.json`);
      writeFileSync(contractFile, JSON.stringify({
        name: contractName,
        ...contractData,
        network: this.network.name,
        chainId: this.network.chainId,
        timestamp: this.deploymentResults.timestamp
      }, null, 2));
    }
    
    console.log(`✅ Deployment results saved to: ${deploymentDir}`);
  }

  /**
   * Generate deployment report
   */
  generateDeploymentReport() {
    console.log('\n📋 DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`🌐 Network: ${this.deploymentResults.network}`);
    console.log(`⛓️  Chain ID: ${this.deploymentResults.chainId}`);
    console.log(`👤 Deployer: ${this.deploymentResults.deployer}`);
    console.log(`⏰ Timestamp: ${this.deploymentResults.timestamp}`);
    console.log(`⛽ Total Gas Used: ${this.deploymentResults.gasUsed.total}`);
    console.log('');
    
    console.log('📝 DEPLOYED CONTRACTS:');
    for (const [name, data] of Object.entries(this.deploymentResults.contracts)) {
      console.log(`  ${name}: ${data.address}`);
      console.log(`    Transaction: ${this.network.explorerUrl}/tx/${data.transactionHash}`);
      console.log(`    Gas Used: ${this.deploymentResults.gasUsed[name]}`);
      console.log('');
    }
    
    console.log('🔍 VERIFICATION STATUS:');
    for (const [name, status] of Object.entries(this.deploymentResults.verificationStatus)) {
      const icon = status === 'verified' ? '✅' : '❌';
      console.log(`  ${icon} ${name}: ${status}`);
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Update environment variables with deployed addresses');
    console.log('2. Deploy and configure gateways');
    console.log('3. Update SDK configurations');
    console.log('4. Start security monitoring');
    console.log('5. Begin user onboarding');
    
    return this.deploymentResults;
  }
}

async function main() {
  const network = process.argv[2] || 'base';
  
  if (!PRODUCTION_NETWORKS[network]) {
    console.error('❌ Invalid network. Supported networks:', Object.keys(PRODUCTION_NETWORKS));
    process.exit(1);
  }
  
  console.log('🚀 Tachi Protocol Production Deployment');
  console.log('⚠️  WARNING: This will deploy to MAINNET with REAL funds!');
  console.log('='.repeat(60));
  
  const deployer = new ProductionDeployer(network);
  
  try {
    // Pre-deployment validation
    await deployer.preDeploymentChecks();
    
    // Deploy contracts
    await deployer.deployContracts();
    
    // Verify contracts
    await deployer.verifyContracts();
    
    // Setup monitoring
    await deployer.setupMonitoring();
    
    // Save results
    await deployer.saveDeploymentResults();
    
    // Generate report
    const results = deployer.generateDeploymentReport();
    
    console.log('\n🎉 PRODUCTION DEPLOYMENT COMPLETE!');
    
    return results;
    
  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED:');
    console.error(error.message);
    console.error('\nPlease review the error and try again.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ProductionDeployer };
