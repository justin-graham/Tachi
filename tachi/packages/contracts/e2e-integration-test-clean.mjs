#!/usr/bin/env node

/**
 * 🚀 Tachi Protocol End-to-End Integration Test
 * 
 * This test deploys all contracts to Base Sepolia, configures a Cloudflare Worker,
 * and validates the complete payment workflow with real transactions.
 * 
 * Requirements:
 * - Base Sepolia ETH for gas fees
 * - Base Sepolia USDC for payments
 * - Wrangler CLI configured
 * - Environment variables in .env file
 */

import { ethers } from 'ethers';
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  BASE_SEPOLIA_RPC: 'https://sepolia.base.org',
  USDC_ADDRESS: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  PAYMENT_AMOUNT: '0.01', // 0.01 USDC
  TEST_DOMAIN: 'test-publisher.com',
  WORKER_NAME: 'tachi-e2e-test'
};

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Create one with PRIVATE_KEY and other required variables.');
    process.exit(1);
  }
  
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  
  return envVars;
}

// Deploy smart contracts
async function deployContracts(provider, wallet) {
  console.log('\n📜 Deploying Smart Contracts to Base Sepolia...\n');
  
  const deploymentDir = path.join(__dirname, 'deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const contracts = {};
  
  try {
    // Deploy CrawlNFT
    console.log('🎫 Deploying CrawlNFT...');
    const { stdout: nftOutput } = await execAsync('npx hardhat run scripts/deploy-self-mint.ts --network baseSepolia', {
      cwd: __dirname
    });
    console.log(nftOutput);
    
    // Deploy PaymentProcessor
    console.log('💳 Deploying PaymentProcessor...');
    const { stdout: processorOutput } = await execAsync('npx hardhat run scripts/deploy-payment-processor.ts --network baseSepolia', {
      cwd: __dirname
    });
    console.log(processorOutput);
    
    // Deploy ProofOfCrawlLedger
    console.log('📊 Deploying ProofOfCrawlLedger...');
    const { stdout: ledgerOutput } = await execAsync('npx hardhat run scripts/deploy-ledger.ts --network baseSepolia', {
      cwd: __dirname
    });
    console.log(ledgerOutput);
    
    // Load deployment addresses
    const nftDeployment = JSON.parse(fs.readFileSync(path.join(deploymentDir, 'crawlnft-deployment.json'), 'utf8'));
    const processorDeployment = JSON.parse(fs.readFileSync(path.join(deploymentDir, 'payment-processor-deployment.json'), 'utf8'));
    const ledgerDeployment = JSON.parse(fs.readFileSync(path.join(deploymentDir, 'proof-of-crawl-ledger-deployment.json'), 'utf8'));
    
    contracts.crawlNFT = nftDeployment.address;
    contracts.paymentProcessor = processorDeployment.address;
    contracts.proofOfCrawlLedger = ledgerDeployment.address;
    
    console.log('\n✅ All contracts deployed successfully!');
    console.log(`🎫 CrawlNFT: ${contracts.crawlNFT}`);
    console.log(`💳 PaymentProcessor: ${contracts.paymentProcessor}`);
    console.log(`📊 ProofOfCrawlLedger: ${contracts.proofOfCrawlLedger}`);
    
    return contracts;
    
  } catch (error) {
    console.error('❌ Contract deployment failed:', error.message);
    throw error;
  }
}

// Mint test license
async function mintTestLicense(contracts, walletAddress) {
  console.log('\n🎫 Minting Test Publisher License...\n');
  
  try {
    const { stdout: mintOutput } = await execAsync('npx hardhat run scripts/mint-test-license.ts --network baseSepolia', {
      cwd: __dirname
    });
    console.log(mintOutput);
    
    // Load license info
    const licensePath = path.join(__dirname, 'deployments', 'test-license.json');
    if (fs.existsSync(licensePath)) {
      const licenseInfo = JSON.parse(fs.readFileSync(licensePath, 'utf8'));
      console.log(`✅ License minted with Token ID: ${licenseInfo.tokenId}`);
      return licenseInfo;
    } else {
      throw new Error('License deployment info not found');
    }
    
  } catch (error) {
    console.error('❌ License minting failed:', error.message);
    throw error;
  }
}

// Deploy Cloudflare Worker
async function deployWorker(contracts, licenseInfo, walletAddress) {
  console.log('\n☁️  Deploying Cloudflare Worker...\n');
  
  const workerDir = path.join(__dirname, '..', 'gateway-cloudflare');
  
  // Create wrangler.toml for testing
  const wranglerConfig = `
name = "${CONFIG.WORKER_NAME}"
main = "dist/index.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { 
  BASE_RPC_URL = "${CONFIG.BASE_SEPOLIA_RPC}",
  PAYMENT_PROCESSOR_ADDRESS = "${contracts.paymentProcessor}",
  PROOF_OF_CRAWL_LEDGER_ADDRESS = "${contracts.proofOfCrawlLedger}",
  USDC_ADDRESS = "${CONFIG.USDC_ADDRESS}",
  CRAWL_TOKEN_ID = "${licenseInfo.tokenId}",
  PRICE_USDC = "${CONFIG.PAYMENT_AMOUNT}",
  PUBLISHER_ADDRESS = "${walletAddress}"
}
`;
  
  fs.writeFileSync(path.join(workerDir, 'wrangler-test.toml'), wranglerConfig);
  
  try {
    // Build worker
    console.log('🔨 Building worker...');
    await execAsync('npm run build', { cwd: workerDir });
    
    // Deploy worker
    console.log('🚀 Deploying worker...');
    const { stdout: deployOutput } = await execAsync('npx wrangler deploy --config wrangler-test.toml --env production', {
      cwd: workerDir
    });
    
    console.log(deployOutput);
    
    // Extract worker URL from output
    const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
    const workerUrl = urlMatch ? urlMatch[0] : `https://${CONFIG.WORKER_NAME}.your-subdomain.workers.dev`;
    
    console.log(`✅ Worker deployed to: ${workerUrl}`);
    return workerUrl;
    
  } catch (error) {
    console.error('❌ Worker deployment failed:', error.message);
    throw error;
  }
}

// Test AI crawler detection and payment flow
async function testPaymentFlow(workerUrl, contracts, walletClient, publicClient) {
  console.log('\n🤖 Testing AI Crawler Payment Flow...\n');
  
  try {
    // Test 1: AI crawler should receive 402
    console.log('1️⃣  Testing AI crawler detection...');
    const crawlerResponse = await fetch(`${workerUrl}/test`, {
      headers: {
        'User-Agent': 'GPTBot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (crawlerResponse.status !== 402) {
      throw new Error(`Expected 402, got ${crawlerResponse.status}`);
    }
    
    const paymentInfo = await crawlerResponse.json();
    console.log('✅ AI crawler correctly received 402 Payment Required');
    console.log(`💰 Payment required: ${paymentInfo.amount} USDC to ${paymentInfo.recipient}`);
    
    // Test 2: Send USDC payment
    console.log('\n2️⃣  Sending USDC payment...');
    
    const usdcContract = {
      address: CONFIG.USDC_ADDRESS,
      abi: [
        'function transfer(address to, uint256 amount) external returns (bool)',
        'function balanceOf(address account) external view returns (uint256)',
        'function decimals() external view returns (uint8)'
      ]
    };
    
    // Check USDC balance
    const balance = await publicClient.readContract({
      ...usdcContract,
      functionName: 'balanceOf',
      args: [walletClient.account.address]
    });
    
    const usdcAmount = parseUnits(CONFIG.PAYMENT_AMOUNT, 6);
    console.log(`💳 Current USDC balance: ${formatUnits(balance, 6)} USDC`);
    console.log(`💸 Sending ${CONFIG.PAYMENT_AMOUNT} USDC...`);
    
    if (balance < usdcAmount) {
      throw new Error(`Insufficient USDC balance. Need ${CONFIG.PAYMENT_AMOUNT} USDC, have ${formatUnits(balance, 6)} USDC`);
    }
    
    // Send USDC to PaymentProcessor
    const paymentTx = await walletClient.writeContract({
      ...usdcContract,
      functionName: 'transfer',
      args: [contracts.paymentProcessor, usdcAmount]
    });
    
    console.log(`⏳ Payment transaction sent: ${paymentTx}`);
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: paymentTx });
    console.log(`✅ Payment confirmed in block: ${receipt.blockNumber}`);
    
    // Test 3: Retry with transaction hash
    console.log('\n3️⃣  Retrying request with payment proof...');
    
    const authenticatedResponse = await fetch(`${workerUrl}/test`, {
      headers: {
        'User-Agent': 'GPTBot/1.0',
        'Authorization': `Bearer ${paymentTx}`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (authenticatedResponse.status !== 200) {
      const errorText = await authenticatedResponse.text();
      throw new Error(`Expected 200, got ${authenticatedResponse.status}: ${errorText}`);
    }
    
    const content = await authenticatedResponse.text();
    console.log('✅ Content successfully retrieved after payment!');
    console.log(`📄 Content length: ${content.length} characters`);
    
    // Test 4: Regular user should access without payment
    console.log('\n4️⃣  Testing regular user access...');
    
    const regularResponse = await fetch(`${workerUrl}/test`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (regularResponse.status !== 200) {
      throw new Error(`Regular user should get 200, got ${regularResponse.status}`);
    }
    
    console.log('✅ Regular user can access content without payment');
    
    return {
      paymentTx,
      workerUrl,
      testsPassed: 4
    };
    
  } catch (error) {
    console.error('❌ Payment flow test failed:', error.message);
    throw error;
  }
}

// Cleanup resources
async function cleanup(workerName) {
  console.log('\n🧹 Cleaning up test resources...\n');
  
  try {
    const workerDir = path.join(__dirname, '..', 'gateway-cloudflare');
    
    // Delete test worker
    await execAsync(`npx wrangler delete ${workerName} --force`, { cwd: workerDir });
    console.log('✅ Test worker deleted');
    
    // Remove test config file
    const testConfigPath = path.join(workerDir, 'wrangler-test.toml');
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
      console.log('✅ Test configuration removed');
    }
    
  } catch (error) {
    console.warn('⚠️  Cleanup warning:', error.message);
  }
}

// Main test execution
async function runE2ETest() {
  console.log('🚀 Starting Tachi Protocol End-to-End Integration Test\n');
  console.log('='.repeat(60));
  
  const env = loadEnv();
  
  if (!env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in .env file');
    process.exit(1);
  }
  
  // Setup clients
  const account = privateKeyToAccount(env.PRIVATE_KEY);
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(CONFIG.BASE_SEPOLIA_RPC)
  });
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(CONFIG.BASE_SEPOLIA_RPC)
  });
  
  const provider = new ethers.JsonRpcProvider(CONFIG.BASE_SEPOLIA_RPC);
  const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);
  
  console.log(`👤 Test account: ${wallet.address}`);
  
  // Check initial balances
  const ethBalance = await provider.getBalance(wallet.address);
  console.log(`💰 ETH balance: ${ethers.formatEther(ethBalance)} ETH`);
  
  if (ethBalance < ethers.parseEther('0.01')) {
    console.error('❌ Insufficient ETH for gas fees. Need at least 0.01 ETH.');
    process.exit(1);
  }
  
  let contracts, licenseInfo, workerUrl, testResults;
  
  try {
    // Deploy all contracts
    contracts = await deployContracts(provider, wallet);
    
    // Mint test license
    licenseInfo = await mintTestLicense(contracts, wallet.address);
    
    // Deploy Cloudflare Worker
    workerUrl = await deployWorker(contracts, licenseInfo, wallet.address);
    
    // Wait for deployment to propagate
    console.log('\n⏳ Waiting for worker deployment to propagate...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test payment flow
    testResults = await testPaymentFlow(workerUrl, contracts, walletClient, publicClient);
    
    // Success!
    console.log('\n' + '='.repeat(60));
    console.log('🎉 END-TO-END INTEGRATION TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Results:');
    console.log(`✅ Contracts deployed to Base Sepolia`);
    console.log(`✅ Publisher license minted (Token ID: ${licenseInfo.tokenId})`);
    console.log(`✅ Cloudflare Worker deployed: ${workerUrl}`);
    console.log(`✅ AI crawler payment flow validated`);
    console.log(`✅ Payment transaction: ${testResults.paymentTx}`);
    console.log(`✅ Regular user access confirmed`);
    console.log(`✅ All ${testResults.testsPassed} tests passed`);
    
    console.log('\n🌟 Ready for Production Deployment!');
    console.log('\nNext steps:');
    console.log('1. Review security audit checklist');
    console.log('2. Deploy to Base mainnet');
    console.log('3. Update SDK with mainnet addresses');
    console.log('4. Launch monitoring and analytics');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Always cleanup
    if (workerUrl) {
      await cleanup(CONFIG.WORKER_NAME);
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Test interrupted. Cleaning up...');
  await cleanup(CONFIG.WORKER_NAME);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Test terminated. Cleaning up...');
  await cleanup(CONFIG.WORKER_NAME);
  process.exit(1);
});

// Run the test
runE2ETest().catch(console.error);
