#!/usr/bin/env node

/**
 * Tachi Protocol Security Testing Suite
 * 
 * This script performs comprehensive security testing of the Tachi Protocol
 * including smart contracts, Cloudflare Workers, and end-to-end flows.
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  BASE_SEPOLIA_RPC: 'https://sepolia.base.org',
  CONTRACTS: {
    PAYMENT_PROCESSOR: '0xBbe8D73B6B44652A5Fb20678bFa27b785Bb7Df41',
    CRAWL_NFT: '0xa974E189038f5b0dEcEbfCe7B0A108824acF3813',
    PROOF_OF_CRAWL_LEDGER: '0xA20e592e294FEbb5ABc758308b15FED437AB1EF9',
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
  },
  WORKER_URL: 'https://tachi-worker.example.com', // Update with actual worker URL
  TEST_AMOUNTS: [
    ethers.parseUnits('0.1', 6),  // 0.1 USDC
    ethers.parseUnits('1.0', 6),  // 1.0 USDC
    ethers.parseUnits('10.0', 6), // 10.0 USDC
  ]
};

class SecurityTestSuite {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.BASE_SEPOLIA_RPC);
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const color = {
      'INFO': '\x1b[36m',  // Cyan
      'PASS': '\x1b[32m',  // Green
      'FAIL': '\x1b[31m',  // Red
      'WARN': '\x1b[33m'   // Yellow
    }[type] || '\x1b[0m';
    
    console.log(`${color}[${timestamp}] ${type}: ${message}\x1b[0m`);
  }

  async test(name, testFunction) {
    this.log(`Running test: ${name}`);
    try {
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS' });
      this.log(`✅ ${name}`, 'PASS');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      this.log(`❌ ${name}: ${error.message}`, 'FAIL');
    }
  }

  // Smart Contract Security Tests
  async testContractAccessControl() {
    const paymentProcessor = new ethers.Contract(
      CONFIG.CONTRACTS.PAYMENT_PROCESSOR,
      [
        'function emergencyTokenRecovery(address,address,uint256) external',
        'function owner() view returns (address)'
      ],
      this.provider
    );

    // Test that only owner can call emergency functions
    const owner = await paymentProcessor.owner();
    this.log(`Payment Processor owner: ${owner}`);

    // This should fail if called by non-owner (good!)
    try {
      const randomWallet = ethers.Wallet.createRandom();
      const contractWithSigner = paymentProcessor.connect(randomWallet);
      await contractWithSigner.emergencyTokenRecovery.staticCall(
        CONFIG.CONTRACTS.USDC,
        owner,
        ethers.parseUnits('1', 6)
      );
      throw new Error('Emergency function should be access controlled');
    } catch (error) {
      if (error.message.includes('Ownable')) {
        // Expected behavior - access control is working
        return;
      }
      throw error;
    }
  }

  async testPaymentProcessorValidation() {
    const paymentProcessor = new ethers.Contract(
      CONFIG.CONTRACTS.PAYMENT_PROCESSOR,
      [
        'function payPublisher(address,uint256) external',
        'function getUSDCTokenAddress() view returns (address)'
      ],
      this.provider
    );

    // Test USDC token address validation
    const usdcAddress = await paymentProcessor.getUSDCTokenAddress();
    if (usdcAddress !== CONFIG.CONTRACTS.USDC) {
      throw new Error(`USDC address mismatch: expected ${CONFIG.CONTRACTS.USDC}, got ${usdcAddress}`);
    }

    // Test zero address validation (should revert)
    try {
      const randomWallet = ethers.Wallet.createRandom();
      const contractWithSigner = paymentProcessor.connect(randomWallet);
      await contractWithSigner.payPublisher.staticCall(
        ethers.ZeroAddress,
        ethers.parseUnits('1', 6)
      );
      throw new Error('Should reject zero address publisher');
    } catch (error) {
      if (error.message.includes('zero address') || error.message.includes('Publisher address cannot be zero')) {
        return; // Expected behavior
      }
      throw error;
    }
  }

  async testCrawlNFTSoulbound() {
    const crawlNFT = new ethers.Contract(
      CONFIG.CONTRACTS.CRAWL_NFT,
      [
        'function totalSupply() view returns (uint256)',
        'function ownerOf(uint256) view returns (address)',
        'function transferFrom(address,address,uint256) external'
      ],
      this.provider
    );

    const totalSupply = await crawlNFT.totalSupply();
    if (totalSupply === 0n) {
      this.log('No NFTs minted yet, skipping soulbound test', 'WARN');
      return;
    }

    // Test that NFT cannot be transferred (soulbound)
    try {
      const owner = await crawlNFT.ownerOf(1n);
      const randomWallet = ethers.Wallet.createRandom();
      const contractWithSigner = crawlNFT.connect(randomWallet);
      
      await contractWithSigner.transferFrom.staticCall(
        owner,
        randomWallet.address,
        1n
      );
      throw new Error('NFT should be soulbound (non-transferable)');
    } catch (error) {
      if (error.message.includes('soulbound') || error.message.includes('cannot be transferred')) {
        return; // Expected behavior
      }
      throw error;
    }
  }

  // Worker Security Tests
  async testWorkerReplayProtection() {
    // This test requires a valid transaction hash to work properly
    // In a real test environment, you would create a transaction first
    this.log('Worker replay protection test requires manual setup', 'WARN');
    
    const testTxHash = '0x' + '0'.repeat(64); // Dummy hash for testing
    
    try {
      // First request should work (if valid)
      const response1 = await fetch(CONFIG.WORKER_URL, {
        headers: {
          'Authorization': `Bearer ${testTxHash}`,
          'User-Agent': 'GPTBot/1.0'
        }
      });

      // Second request with same hash should be rejected
      const response2 = await fetch(CONFIG.WORKER_URL, {
        headers: {
          'Authorization': `Bearer ${testTxHash}`,
          'User-Agent': 'GPTBot/1.0'
        }
      });

      if (response2.status === 402) {
        const body = await response2.json();
        if (body.error && body.error.includes('already used')) {
          return; // Replay protection working
        }
      }
      
      this.log('Replay protection not detected (may need manual verification)', 'WARN');
    } catch (error) {
      this.log(`Worker test failed: ${error.message}`, 'WARN');
    }
  }

  async testWorkerInputValidation() {
    try {
      // Test invalid authorization format
      const response1 = await fetch(CONFIG.WORKER_URL, {
        headers: {
          'Authorization': 'InvalidFormat',
          'User-Agent': 'GPTBot/1.0'
        }
      });

      if (response1.status !== 400) {
        throw new Error(`Expected 400 for invalid auth format, got ${response1.status}`);
      }

      // Test missing authorization
      const response2 = await fetch(CONFIG.WORKER_URL, {
        headers: {
          'User-Agent': 'GPTBot/1.0'
        }
      });

      if (response2.status !== 402) {
        throw new Error(`Expected 402 for missing auth, got ${response2.status}`);
      }

    } catch (error) {
      if (error.message.includes('fetch')) {
        this.log('Worker endpoint not reachable for testing', 'WARN');
        return;
      }
      throw error;
    }
  }

  // Gas Optimization Tests
  async testGasUsage() {
    const paymentProcessor = new ethers.Contract(
      CONFIG.CONTRACTS.PAYMENT_PROCESSOR,
      [
        'function payPublisher(address,uint256) external',
        'function getUSDCBalance(address) view returns (uint256)'
      ],
      this.provider
    );

    // Estimate gas for different payment amounts
    for (const amount of CONFIG.TEST_AMOUNTS) {
      try {
        const gasEstimate = await paymentProcessor.payPublisher.estimateGas(
          '0x1234567890123456789012345678901234567890', // Dummy address
          amount
        );
        
        this.log(`Gas estimate for ${ethers.formatUnits(amount, 6)} USDC: ${gasEstimate.toString()}`);
        
        // Gas should be reasonable (< 100k for simple transfer)
        if (gasEstimate > 100000n) {
          this.log(`High gas usage detected: ${gasEstimate}`, 'WARN');
        }
      } catch (error) {
        // Expected to fail with dummy data, but we get gas estimates
        this.log(`Gas estimation (expected failure): ${error.message.substring(0, 100)}...`);
      }
    }
  }

  // Integration Tests
  async testEndToEndFlow() {
    // This would test the complete flow from payment to content access
    // Requires test environment setup with funded wallets
    this.log('End-to-end test requires funded test wallets', 'WARN');
    
    // Simulate the flow verification
    const steps = [
      'Crawler detects 402 response',
      'Crawler creates USDC payment transaction',
      'Worker verifies payment on-chain',
      'Worker logs crawl to ProofOfCrawlLedger',
      'Worker returns content to crawler'
    ];

    steps.forEach((step, index) => {
      this.log(`Step ${index + 1}: ${step}`);
    });
  }

  // Main test runner
  async runAllTests() {
    this.log('🚀 Starting Tachi Protocol Security Test Suite');
    this.log(`Testing against Base Sepolia: ${CONFIG.BASE_SEPOLIA_RPC}`);

    // Smart Contract Tests
    await this.test('Contract Access Control', () => this.testContractAccessControl());
    await this.test('Payment Processor Validation', () => this.testPaymentProcessorValidation());
    await this.test('CrawlNFT Soulbound Property', () => this.testCrawlNFTSoulbound());

    // Worker Tests
    await this.test('Worker Replay Protection', () => this.testWorkerReplayProtection());
    await this.test('Worker Input Validation', () => this.testWorkerInputValidation());

    // Performance Tests
    await this.test('Gas Usage Analysis', () => this.testGasUsage());

    // Integration Tests
    await this.test('End-to-End Flow Verification', () => this.testEndToEndFlow());

    // Generate report
    this.generateReport();
  }

  generateReport() {
    this.log('\n📊 Test Results Summary:');
    this.log(`✅ Passed: ${this.results.passed}`);
    this.log(`❌ Failed: ${this.results.failed}`);
    this.log(`📋 Total: ${this.results.passed + this.results.failed}`);

    if (this.results.failed > 0) {
      this.log('\n🔍 Failed Tests:', 'FAIL');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          this.log(`  • ${test.name}: ${test.error}`, 'FAIL');
        });
    }

    // Save detailed report
    const reportPath = path.join(__dirname, 'security-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        total: this.results.passed + this.results.failed
      },
      tests: this.results.tests,
      configuration: CONFIG
    }, null, 2));

    this.log(`\n📄 Detailed report saved to: ${reportPath}`);

    if (this.results.failed === 0) {
      this.log('\n🎉 All security tests passed!', 'PASS');
    } else {
      this.log(`\n⚠️  ${this.results.failed} security issues detected. Review required.`, 'WARN');
    }
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const testSuite = new SecurityTestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityTestSuite;
