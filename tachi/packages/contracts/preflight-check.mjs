#!/usr/bin/env node

/**
 * 🔍 Tachi Protocol Pre-Flight Checklist
 * 
 * This script verifies that all prerequisites are met before running
 * the end-to-end integration test on Base Sepolia.
 */

import { ethers } from 'ethers';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  BASE_SEPOLIA_RPC: 'https://sepolia.base.org',
  USDC_ADDRESS: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  MIN_ETH_BALANCE: '0.1', // Minimum ETH for gas fees
  MIN_USDC_BALANCE: '1.0', // Minimum USDC for payments
};

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return null;
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

async function checkPrerequisites() {
  console.log('🔍 Tachi Protocol Pre-Flight Checklist\n');
  console.log('='.repeat(50));
  
  const checklist = [];
  let allPassed = true;
  
  // 1. Check .env file
  console.log('\n1️⃣  Environment Configuration');
  const env = loadEnv();
  
  if (!env) {
    console.log('❌ .env file not found');
    console.log('   Create .env file with required variables');
    checklist.push({ check: '.env file exists', status: 'FAIL', required: true });
    allPassed = false;
  } else {
    console.log('✅ .env file found');
    checklist.push({ check: '.env file exists', status: 'PASS', required: true });
    
    // Check PRIVATE_KEY
    if (!env.PRIVATE_KEY) {
      console.log('❌ PRIVATE_KEY not found in .env');
      checklist.push({ check: 'PRIVATE_KEY configured', status: 'FAIL', required: true });
      allPassed = false;
    } else if (!env.PRIVATE_KEY.startsWith('0x') || env.PRIVATE_KEY.length !== 66) {
      console.log('❌ PRIVATE_KEY format invalid (should be 0x + 64 hex chars)');
      checklist.push({ check: 'PRIVATE_KEY valid format', status: 'FAIL', required: true });
      allPassed = false;
    } else {
      console.log('✅ PRIVATE_KEY configured');
      checklist.push({ check: 'PRIVATE_KEY configured', status: 'PASS', required: true });
    }
    
    // Check optional RPC URL
    if (env.BASE_SEPOLIA_RPC_URL) {
      console.log('✅ Custom Base Sepolia RPC configured');
      checklist.push({ check: 'Custom RPC URL', status: 'PASS', required: false });
    } else {
      console.log('ℹ️  Using default Base Sepolia RPC');
      checklist.push({ check: 'Custom RPC URL', status: 'DEFAULT', required: false });
    }
  }
  
  if (!env || !env.PRIVATE_KEY) {
    console.log('\n⚠️  Cannot proceed without valid environment configuration');
    return false;
  }
  
  // 2. Check account balances
  console.log('\n2️⃣  Account Balances');
  
  try {
    const account = privateKeyToAccount(env.PRIVATE_KEY);
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(env.BASE_SEPOLIA_RPC_URL || CONFIG.BASE_SEPOLIA_RPC)
    });
    
    const provider = new ethers.JsonRpcProvider(env.BASE_SEPOLIA_RPC_URL || CONFIG.BASE_SEPOLIA_RPC);
    const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);
    
    console.log(`👤 Account: ${wallet.address}`);
    
    // Check ETH balance
    const ethBalance = await provider.getBalance(wallet.address);
    const ethBalanceFormatted = ethers.formatEther(ethBalance);
    console.log(`💰 ETH Balance: ${ethBalanceFormatted} ETH`);
    
    if (parseFloat(ethBalanceFormatted) >= parseFloat(CONFIG.MIN_ETH_BALANCE)) {
      console.log(`✅ Sufficient ETH for gas fees (>= ${CONFIG.MIN_ETH_BALANCE} ETH)`);
      checklist.push({ check: 'Sufficient ETH balance', status: 'PASS', required: true });
    } else {
      console.log(`❌ Insufficient ETH balance (need >= ${CONFIG.MIN_ETH_BALANCE} ETH)`);
      console.log('   Get Base Sepolia ETH from: https://bridge.base.org/deposit');
      checklist.push({ check: 'Sufficient ETH balance', status: 'FAIL', required: true });
      allPassed = false;
    }
    
    // Check USDC balance using ethers.js (more reliable)
    const usdcAbi = ['function balanceOf(address account) external view returns (uint256)'];
    const usdcContract = new ethers.Contract(CONFIG.USDC_ADDRESS, usdcAbi, provider);
    const usdcBalance = await usdcContract.balanceOf(wallet.address);
    const usdcBalanceFormatted = ethers.formatUnits(usdcBalance, 6);
    console.log(`💵 USDC Balance: ${usdcBalanceFormatted} USDC`);
    
    if (parseFloat(usdcBalanceFormatted) >= parseFloat(CONFIG.MIN_USDC_BALANCE)) {
      console.log(`✅ Sufficient USDC for payments (>= ${CONFIG.MIN_USDC_BALANCE} USDC)`);
      checklist.push({ check: 'Sufficient USDC balance', status: 'PASS', required: true });
    } else {
      console.log(`❌ Insufficient USDC balance (need >= ${CONFIG.MIN_USDC_BALANCE} USDC)`);
      console.log('   Get Base Sepolia USDC from Aave V3 faucet or bridge from mainnet');
      checklist.push({ check: 'Sufficient USDC balance', status: 'FAIL', required: true });
      allPassed = false;
    }
    
  } catch (error) {
    console.log(`❌ Failed to check balances: ${error.message}`);
    checklist.push({ check: 'Account balance check', status: 'FAIL', required: true });
    allPassed = false;
  }
  
  // 3. Check Node.js dependencies
  console.log('\n3️⃣  Node.js Dependencies');
  
  try {
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
      console.log('✅ package.json found');
      checklist.push({ check: 'package.json exists', status: 'PASS', required: true });
      
      // Check if dependencies are installed
      const nodeModulesPath = path.join(__dirname, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        console.log('✅ node_modules directory exists');
        checklist.push({ check: 'Dependencies installed', status: 'PASS', required: true });
      } else {
        console.log('❌ node_modules not found');
        console.log('   Run: npm install or pnpm install');
        checklist.push({ check: 'Dependencies installed', status: 'FAIL', required: true });
        allPassed = false;
      }
    } else {
      console.log('❌ package.json not found');
      checklist.push({ check: 'package.json exists', status: 'FAIL', required: true });
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error checking dependencies: ${error.message}`);
    checklist.push({ check: 'Dependency check', status: 'FAIL', required: true });
    allPassed = false;
  }
  
  // 4. Check Hardhat configuration
  console.log('\n4️⃣  Hardhat Configuration');
  
  try {
    const hardhatConfigPath = path.join(__dirname, 'hardhat.config.ts');
    if (fs.existsSync(hardhatConfigPath)) {
      console.log('✅ hardhat.config.ts found');
      checklist.push({ check: 'Hardhat config exists', status: 'PASS', required: true });
      
      // Check if baseSepolia network is configured
      const configContent = fs.readFileSync(hardhatConfigPath, 'utf8');
      if (configContent.includes('baseSepolia')) {
        console.log('✅ Base Sepolia network configured');
        checklist.push({ check: 'Base Sepolia network configured', status: 'PASS', required: true });
      } else {
        console.log('❌ Base Sepolia network not configured');
        checklist.push({ check: 'Base Sepolia network configured', status: 'FAIL', required: true });
        allPassed = false;
      }
    } else {
      console.log('❌ hardhat.config.ts not found');
      checklist.push({ check: 'Hardhat config exists', status: 'FAIL', required: true });
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ Error checking Hardhat config: ${error.message}`);
    checklist.push({ check: 'Hardhat config check', status: 'FAIL', required: true });
    allPassed = false;
  }
  
  // 5. Check Wrangler CLI
  console.log('\n5️⃣  Cloudflare Wrangler CLI');
  
  try {
    const { stdout } = await execAsync('npx wrangler --version', { 
      cwd: path.join(__dirname, '..', 'gateway-cloudflare'),
      timeout: 10000 
    });
    
    if (stdout.includes('wrangler')) {
      console.log(`✅ Wrangler CLI available: ${stdout.trim()}`);
      checklist.push({ check: 'Wrangler CLI available', status: 'PASS', required: true });
      
      // Check if logged in
      try {
        const { stdout: whoamiOutput } = await execAsync('npx wrangler whoami', { 
          cwd: path.join(__dirname, '..', 'gateway-cloudflare'),
          timeout: 10000 
        });
        
        if (whoamiOutput.includes('@')) {
          console.log('✅ Wrangler authenticated');
          checklist.push({ check: 'Wrangler authenticated', status: 'PASS', required: true });
        } else {
          console.log('❌ Wrangler not authenticated');
          console.log('   Run: npx wrangler login');
          checklist.push({ check: 'Wrangler authenticated', status: 'FAIL', required: true });
          allPassed = false;
        }
      } catch (authError) {
        console.log('❌ Wrangler authentication check failed');
        console.log('   Run: npx wrangler login');
        checklist.push({ check: 'Wrangler authenticated', status: 'FAIL', required: true });
        allPassed = false;
      }
    }
  } catch (error) {
    console.log('❌ Wrangler CLI not available');
    console.log('   Ensure you have @cloudflare/wrangler installed');
    checklist.push({ check: 'Wrangler CLI available', status: 'FAIL', required: true });
    allPassed = false;
  }
  
  // 6. Check deployment scripts
  console.log('\n6️⃣  Deployment Scripts');
  
  const scripts = [
    'scripts/deploy-self-mint.ts',
    'scripts/deploy-payment-processor.ts', 
    'scripts/deploy-ledger.ts',
    'scripts/mint-test-license.ts'
  ];
  
  scripts.forEach(script => {
    const scriptPath = path.join(__dirname, script);
    if (fs.existsSync(scriptPath)) {
      console.log(`✅ ${script} found`);
      checklist.push({ check: `${script} exists`, status: 'PASS', required: true });
    } else {
      console.log(`❌ ${script} not found`);
      checklist.push({ check: `${script} exists`, status: 'FAIL', required: true });
      allPassed = false;
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Pre-Flight Checklist Summary\n');
  
  const passed = checklist.filter(item => item.status === 'PASS').length;
  const failed = checklist.filter(item => item.status === 'FAIL' && item.required).length;
  const total = checklist.filter(item => item.required).length;
  
  checklist.forEach(item => {
    const icon = item.status === 'PASS' ? '✅' : 
                 item.status === 'FAIL' ? '❌' : 'ℹ️ ';
    const required = item.required ? '' : ' (optional)';
    console.log(`${icon} ${item.check}${required}`);
  });
  
  console.log(`\n📈 Progress: ${passed}/${total} required checks passed`);
  
  if (allPassed) {
    console.log('\n🎉 All prerequisites met! Ready to run integration test.');
    console.log('\nTo run the full integration test:');
    console.log('   node e2e-integration-test-clean.mjs');
    console.log('\nTo deploy manually step by step:');
    console.log('   Follow the BASE_SEPOLIA_DEPLOYMENT_GUIDE.md');
  } else {
    console.log('\n⚠️  Prerequisites not met. Please address the failing checks above.');
    console.log('\nCommon solutions:');
    console.log('1. Create .env file with PRIVATE_KEY');
    console.log('2. Get Base Sepolia ETH from https://bridge.base.org/deposit');
    console.log('3. Get Base Sepolia USDC from Aave V3 faucet');
    console.log('4. Run npm install to install dependencies');
    console.log('5. Run npx wrangler login for Cloudflare authentication');
  }
  
  return allPassed;
}

// Run the check
checkPrerequisites()
  .then(result => {
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Pre-flight check failed:', error);
    process.exit(1);
  });
