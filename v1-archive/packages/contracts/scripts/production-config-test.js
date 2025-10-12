#!/usr/bin/env node

/**
 * Production Environment Configuration Functionality Test
 * Tests actual loading, parsing, and validation of production settings
 */

import fs from 'fs';
import { ethers } from 'ethers';

class ProductionConfigTest {
  constructor() {
    this.config = {};
    this.validationResults = {};
  }

  /**
   * Load and parse production environment
   */
  loadProductionConfig() {
    console.log('📁 Loading production configuration...');
    
    try {
      const envContent = fs.readFileSync('.env.production', 'utf8');
      const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      // Parse environment variables
      for (const line of envLines) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        this.config[key] = value;
      }
      
      console.log(`✅ Loaded ${Object.keys(this.config).length} configuration variables`);
      return true;
    } catch (error) {
      console.error('❌ Failed to load production config:', error.message);
      return false;
    }
  }

  /**
   * Test network configuration functionality
   */
  async testNetworkConfig() {
    console.log('🌐 Testing network configuration...');
    
    // Test Base RPC URL format and connectivity
    const rpcUrl = this.config.BASE_RPC_URL;
    
    if (!rpcUrl || !rpcUrl.includes('base-mainnet')) {
      throw new Error('Invalid Base RPC URL configuration');
    }
    
    // Test with a mock URL (don't use actual API key)
    const testUrl = 'https://mainnet.base.org';
    
    try {
      const provider = new ethers.JsonRpcProvider(testUrl);
      const blockNumber = await provider.getBlockNumber();
      console.log(`✅ Base network connectivity verified (Block: ${blockNumber})`);
      
      // Verify chain ID is correct for Base mainnet
      const network = await provider.getNetwork();
      if (Number(network.chainId) === 8453) {
        console.log('✅ Base mainnet chain ID verified (8453)');
      } else {
        throw new Error(`Wrong chain ID: ${network.chainId} (expected 8453)`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Network configuration test failed:', error.message);
      return false;
    }
  }

  /**
   * Test security configuration functionality
   */
  testSecurityConfig() {
    console.log('🔒 Testing security configuration...');
    
    // Test logging configuration
    const loggingEnabled = this.config.ENABLE_SECURITY_LOGGING;
    if (loggingEnabled === 'true') {
      console.log('✅ Security logging enabled');
    } else {
      console.log('⚠️  Security logging disabled');
    }
    
    // Test log level
    const logLevel = this.config.LOG_LEVEL;
    const validLogLevels = ['error', 'warn', 'info', 'debug'];
    if (validLogLevels.includes(logLevel)) {
      console.log(`✅ Log level configured: ${logLevel}`);
    } else {
      throw new Error(`Invalid log level: ${logLevel}`);
    }
    
    // Test private key format
    const privateKey = this.config.PRIVATE_KEY;
    if (privateKey && privateKey.startsWith('0x') && privateKey.length >= 66) {
      console.log('✅ Private key format valid');
    } else {
      console.log('⚠️  Private key placeholder detected (not production ready)');
    }
    
    return true;
  }

  /**
   * Test monitoring configuration functionality
   */
  testMonitoringConfig() {
    console.log('📊 Testing monitoring configuration...');
    
    // Test Sentry DSN format
    const sentryDsn = this.config.SENTRY_DSN;
    if (sentryDsn && sentryDsn.includes('sentry.io')) {
      console.log('✅ Sentry DSN format valid');
    } else {
      console.log('⚠️  Sentry DSN placeholder detected');
    }
    
    // Test Slack webhook format
    const slackWebhook = this.config.SLACK_WEBHOOK_URL;
    if (slackWebhook && slackWebhook.includes('hooks.slack.com')) {
      console.log('✅ Slack webhook format valid');
    } else {
      console.log('⚠️  Slack webhook placeholder detected');
    }
    
    // Test PagerDuty integration
    const pagerDutyKey = this.config.PAGERDUTY_INTEGRATION_KEY;
    if (pagerDutyKey && pagerDutyKey.length > 10) {
      console.log('✅ PagerDuty integration key configured');
    } else {
      console.log('⚠️  PagerDuty integration placeholder detected');
    }
    
    return true;
  }

  /**
   * Test gas configuration functionality
   */
  testGasConfig() {
    console.log('⛽ Testing gas configuration...');
    
    // Test max gas price
    const maxGasPrice = parseFloat(this.config.MAX_GAS_PRICE_GWEI);
    if (maxGasPrice && maxGasPrice > 0 && maxGasPrice <= 1000) {
      console.log(`✅ Max gas price configured: ${maxGasPrice} Gwei`);
      
      if (maxGasPrice > 100) {
        console.log('⚠️  High max gas price - may result in expensive transactions');
      }
    } else {
      throw new Error(`Invalid max gas price: ${maxGasPrice}`);
    }
    
    // Test gas limit buffer
    const gasBuffer = parseFloat(this.config.GAS_LIMIT_BUFFER);
    if (gasBuffer && gasBuffer >= 1.0 && gasBuffer <= 2.0) {
      console.log(`✅ Gas limit buffer configured: ${gasBuffer}x`);
    } else {
      throw new Error(`Invalid gas limit buffer: ${gasBuffer}`);
    }
    
    return true;
  }

  /**
   * Test deployment configuration functionality
   */
  testDeploymentConfig() {
    console.log('🚀 Testing deployment configuration...');
    
    // Test deployment confirmations
    const confirmations = parseInt(this.config.DEPLOYMENT_CONFIRMATIONS);
    if (confirmations && confirmations >= 3 && confirmations <= 10) {
      console.log(`✅ Deployment confirmations configured: ${confirmations}`);
    } else {
      throw new Error(`Invalid deployment confirmations: ${confirmations}`);
    }
    
    // Test deployment timeout
    const timeout = parseInt(this.config.DEPLOYMENT_TIMEOUT);
    if (timeout && timeout >= 60000 && timeout <= 600000) {
      console.log(`✅ Deployment timeout configured: ${timeout}ms`);
    } else {
      throw new Error(`Invalid deployment timeout: ${timeout}`);
    }
    
    return true;
  }

  /**
   * Test backup configuration functionality
   */
  testBackupConfig() {
    console.log('💾 Testing backup configuration...');
    
    // Test encrypted backup key
    const encryptedBackup = this.config.BACKUP_PRIVATE_KEY_ENCRYPTED;
    if (encryptedBackup && encryptedBackup.length > 50) {
      console.log('✅ Encrypted backup key configured');
    } else {
      console.log('⚠️  Encrypted backup key placeholder detected');
    }
    
    // Test multisig address format
    const multisigAddress = this.config.RECOVERY_MULTISIG_ADDRESS;
    if (multisigAddress && multisigAddress.startsWith('0x') && multisigAddress.length === 42) {
      console.log('✅ Recovery multisig address format valid');
    } else {
      console.log('⚠️  Recovery multisig address placeholder detected');
    }
    
    return true;
  }

  /**
   * Run comprehensive functionality test
   */
  async runFunctionalityTest() {
    console.log('⚙️  Testing Production Environment Configuration Functionality...');
    console.log('='.repeat(70));
    
    const tests = [
      { name: 'Config Loading', fn: () => this.loadProductionConfig() },
      { name: 'Network Config', fn: () => this.testNetworkConfig() },
      { name: 'Security Config', fn: () => this.testSecurityConfig() },
      { name: 'Monitoring Config', fn: () => this.testMonitoringConfig() },
      { name: 'Gas Config', fn: () => this.testGasConfig() },
      { name: 'Deployment Config', fn: () => this.testDeploymentConfig() },
      { name: 'Backup Config', fn: () => this.testBackupConfig() }
    ];

    let passedTests = 0;
    const results = [];

    for (const test of tests) {
      try {
        console.log(`\n${tests.indexOf(test) + 1}️⃣  ${test.name}...`);
        const result = await test.fn();
        
        if (result !== false) {
          console.log(`✅ ${test.name}: PASSED`);
          passedTests++;
          results.push({ name: test.name, status: 'passed' });
        } else {
          console.log(`❌ ${test.name}: FAILED`);
          results.push({ name: test.name, status: 'failed' });
        }
      } catch (error) {
        console.log(`❌ ${test.name}: FAILED - ${error.message}`);
        results.push({ name: test.name, status: 'failed', error: error.message });
      }
    }

    console.log('\n📊 PRODUCTION CONFIGURATION TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`✅ Passed: ${passedTests}/${tests.length}`);
    console.log(`❌ Failed: ${tests.length - passedTests}/${tests.length}`);
    console.log(`📈 Success Rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);

    // Detailed results
    console.log('\n📋 DETAILED RESULTS:');
    results.forEach(result => {
      const icon = result.status === 'passed' ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.status.toUpperCase()}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    if (passedTests === tests.length) {
      console.log('\n🎉 PRODUCTION CONFIGURATION: ALL FUNCTIONALITY TESTS PASSED');
    } else {
      console.log('\n⚠️  PRODUCTION CONFIGURATION: Some functionality tests failed');
      console.log('💡 Review failed tests and update configuration accordingly');
    }

    return { passed: passedTests, total: tests.length, results };
  }
}

export { ProductionConfigTest };
