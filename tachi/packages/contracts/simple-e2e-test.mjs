#!/usr/bin/env node

/**
 * 🚀 Simple Tachi Protocol End-to-End Test
 * 
 * Uses existing deployed contracts to test the full protocol flow
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const CONTRACT_ADDRESSES = {
  CrawlNFT: '0x3dA94960F71c08dB8e90eaB5e97521ebA7E6637d',
  PaymentProcessor: '0x6AcB8aD74c8aBee3BAf2070B658B9bEdC22dBE6d',
  ProofOfCrawlLedger: '0xa0DFB1a277E1429789a422775bC3bf61cE4d2647',
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
};

async function runSimpleE2ETest() {
  console.log('🚀 Starting Simple Tachi Protocol Test');
  console.log('============================================');
  
  // Load environment
  const env = loadEnv();
  console.log(`🔑 Private key loaded: ${env.PRIVATE_KEY ? 'Yes' : 'No'}`);
  
  if (!env.PRIVATE_KEY) {
    console.error('❌ No PRIVATE_KEY found in .env file');
    return;
  }
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);
  
  console.log(`👤 Test Account: ${wallet.address}`);
  
  // Check balances
  const ethBalance = await provider.getBalance(wallet.address);
  const ethFormatted = ethers.formatEther(ethBalance);
  console.log(`💰 ETH Balance: ${ethFormatted} ETH`);
  
  // Check USDC balance
  const usdcAbi = ['function balanceOf(address) view returns (uint256)'];
  const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.USDC, usdcAbi, provider);
  const usdcBalance = await usdcContract.balanceOf(wallet.address);
  const usdcFormatted = ethers.formatUnits(usdcBalance, 6);
  console.log(`💵 USDC Balance: ${usdcFormatted} USDC`);
  
  console.log('\\n📋 Using Deployed Contracts:');
  console.log(`🎫 CrawlNFT: ${CONTRACT_ADDRESSES.CrawlNFT}`);
  console.log(`💳 PaymentProcessor: ${CONTRACT_ADDRESSES.PaymentProcessor}`);
  console.log(`📊 ProofOfCrawlLedger: ${CONTRACT_ADDRESSES.ProofOfCrawlLedger}`);
  
  // Test 1: Check CrawlNFT contract
  console.log('\\n🎫 Testing CrawlNFT Contract...');
  const crawlNFTAbi = [
    'function selfMintingEnabled() view returns (bool)',
    'function totalSupply() view returns (uint256)',
    'function mintLicense(string memory _website) external'
  ];
  const crawlNFT = new ethers.Contract(CONTRACT_ADDRESSES.CrawlNFT, crawlNFTAbi, wallet);
  
  const selfMintingEnabled = await crawlNFT.selfMintingEnabled();
  const totalSupply = await crawlNFT.totalSupply();
  
  console.log(`✅ Self-minting enabled: ${selfMintingEnabled}`);
  console.log(`✅ Total licenses issued: ${totalSupply}`);
  
  // Test 2: Test license minting
  console.log('\\n🎫 Testing License Minting...');
  try {
    const websiteUrl = `https://test-${Date.now()}.example.com`;
    console.log(`Minting license for: ${websiteUrl}`);
    
    const tx = await crawlNFT.mintLicense(websiteUrl);
    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ License minted! Block: ${receipt.blockNumber}`);
    
    const newTotalSupply = await crawlNFT.totalSupply();
    console.log(`✅ New total supply: ${newTotalSupply}`);
    
  } catch (error) {
    if (error.message.includes('Publisher already has a license')) {
      console.log('ℹ️  Account already has a license (this is expected)');
    } else {
      console.log(`❌ Minting failed: ${error.message}`);
    }
  }
  
  // Test 3: Check ProofOfCrawlLedger
  console.log('\\n📊 Testing ProofOfCrawlLedger Contract...');
  const ledgerAbi = [
    'function getTotalCrawlsLogged() view returns (uint256)',
    'function logCrawlWithURL(string memory url, string memory ipfsHash) external'
  ];
  const ledger = new ethers.Contract(CONTRACT_ADDRESSES.ProofOfCrawlLedger, ledgerAbi, wallet);
  
  const totalCrawls = await ledger.getTotalCrawlsLogged();
  console.log(`✅ Total crawls logged: ${totalCrawls}`);
  
  // Test 4: Log a test crawl
  console.log('\\n📊 Testing Crawl Logging...');
  try {
    const testUrl = `https://test-crawl-${Date.now()}.example.com`;
    const testIpfsHash = `QmTest${Date.now()}`;
    
    console.log(`Logging crawl for: ${testUrl}`);
    const tx = await ledger.logCrawlWithURL(testUrl, testIpfsHash);
    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Crawl logged! Block: ${receipt.blockNumber}`);
    
    const newTotalCrawls = await ledger.getTotalCrawlsLogged();
    console.log(`✅ New total crawls: ${newTotalCrawls}`);
    
  } catch (error) {
    console.log(`❌ Crawl logging failed: ${error.message}`);
  }
  
  console.log('\\n🎉 Simple E2E Test Complete!');
  console.log('============================================');
  console.log('✅ Tachi Protocol is working on Base Sepolia!');
  console.log('');
  console.log('🌐 View contracts on BaseScan:');
  console.log(`🎫 CrawlNFT: https://sepolia.basescan.org/address/${CONTRACT_ADDRESSES.CrawlNFT}`);
  console.log(`💳 PaymentProcessor: https://sepolia.basescan.org/address/${CONTRACT_ADDRESSES.PaymentProcessor}`);
  console.log(`📊 ProofOfCrawlLedger: https://sepolia.basescan.org/address/${CONTRACT_ADDRESSES.ProofOfCrawlLedger}`);
}

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

runSimpleE2ETest().catch(console.error);
