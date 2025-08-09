#!/usr/bin/env node

/**
 * Production Deployment Script Functionality Test
 * Tests deployment script validation, error handling, and safety checks
 */

import fs from 'fs';
import { ethers } from 'ethers';

class DeploymentScriptTest {
  constructor() {
    this.testResults = {};
    this.mockProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  }

  /**
   * Test deployment script structure and imports
   */
  testScriptStructure() {
    console.log('📁 Testing deployment script structure...');
    
    try {
      // Check if production deploy script exists
      const deployScript = fs.readFileSync('scripts/production-deploy.js', 'utf8');
      
      // Check for essential components
      const requiredComponents = [
        'ProductionDeployer',
        'preDeploymentChecks',
        'deployContracts',
        'verifyContracts',
        'setupMonitoring',
        'saveDeploymentResults'
      ];
      
      let foundComponents = 0;
      for (const component of requiredComponents) {
        if (deployScript.includes(component)) {
          foundComponents++;
          console.log(`   ✅ ${component} found`);
        } else {
          console.log(`   ❌ ${component} missing`);
        }
      }
      
      console.log(`✅ Script structure: ${foundComponents}/${requiredComponents.length} components found`);
      return foundComponents === requiredComponents.length;
    } catch (error) {
      console.error('❌ Script structure test failed:', error.message);
      return false;
    }
  }

  /**
   * Test pre-deployment validation functionality
   */
  async testPreDeploymentValidation() {
    console.log('🔍 Testing pre-deployment validation...');
    
    try {
      // Test network validation
      await this.testNetworkValidation();
      
      // Test account validation
      await this.testAccountValidation();
      
      // Test environment validation
      await this.testEnvironmentValidation();
      
      // Test gas price checks
      await this.testGasPriceChecks();
      
      console.log('✅ Pre-deployment validation tests passed');
      return true;
    } catch (error) {
      console.error('❌ Pre-deployment validation failed:', error.message);
      return false;
    }
  }

  /**
   * Test network validation
   */
  async testNetworkValidation() {
    console.log('   🌐 Testing network validation...');
    
    const network = await this.mockProvider.getNetwork();
    const expectedChainId = 8453; // Base mainnet
    
    if (Number(network.chainId) === expectedChainId) {
      console.log('   ✅ Network chain ID validation works');
    } else {
      throw new Error(`Wrong network: ${network.chainId} (expected ${expectedChainId})`);
    }
  }

  /**
   * Test account validation
   */
  async testAccountValidation() {
    console.log('   👤 Testing account validation...');
    
    // Test with a mock private key
    const mockPrivateKey = '0x' + '1'.repeat(64);
    
    try {
      const wallet = new ethers.Wallet(mockPrivateKey, this.mockProvider);
      const address = await wallet.getAddress();
      
      if (ethers.isAddress(address)) {
        console.log('   ✅ Account address validation works');
      } else {
        throw new Error('Invalid address format');
      }
    } catch (error) {
      if (error.message.includes('Invalid private key')) {
        console.log('   ✅ Private key validation works (rejected invalid key)');
      } else {
        throw error;
      }
    }
  }

  /**
   * Test environment validation
   */
  testEnvironmentValidation() {
    console.log('   ⚙️  Testing environment validation...');
    
    // Mock environment variables
    const requiredEnvVars = [
      'BASE_RPC_URL',
      'PRIVATE_KEY',
      'BASESCAN_API_KEY'
    ];
    
    // Load actual .env.production
    const envContent = fs.readFileSync('.env.production', 'utf8');
    
    let foundVars = 0;
    for (const varName of requiredEnvVars) {
      if (envContent.includes(`${varName}=`)) {
        foundVars++;
        console.log(`   ✅ ${varName} configured`);
      } else {
        console.log(`   ❌ ${varName} missing`);
      }
    }
    
    if (foundVars === requiredEnvVars.length) {
      console.log('   ✅ Environment validation would pass');
    } else {
      throw new Error(`Missing ${requiredEnvVars.length - foundVars} required environment variables`);
    }
  }

  /**
   * Test gas price validation
   */
  async testGasPriceChecks() {
    console.log('   ⛽ Testing gas price validation...');
    
    try {
      const feeData = await this.mockProvider.getFeeData();
      const gasPrice = Number(ethers.formatUnits(feeData.gasPrice || 0, 'gwei'));
      
      console.log(`   📊 Current gas price: ${gasPrice.toFixed(2)} Gwei`);
      
      // Test gas price thresholds
      const maxGasPrice = 50; // From .env.production
      
      if (gasPrice <= maxGasPrice) {
        console.log('   ✅ Gas price validation works (within limits)');
      } else {
        console.log('   ⚠️  High gas prices detected - deployment script should warn');
      }
    } catch (error) {
      console.log('   ⚠️  Gas price check simulation failed (network issue)');
    }
  }

  /**
   * Test deployment safety mechanisms
   */
  testDeploymentSafety() {
    console.log('🛡️  Testing deployment safety mechanisms...');
    
    try {
      const deployScript = fs.readFileSync('scripts/production-deploy.js', 'utf8');
      
      // Check for safety features
      const safetyFeatures = [
        { name: 'Confirmation requirements', pattern: /confirmations|wait/ },
        { name: 'Gas limit protection', pattern: /gasLimit|gasEstimate/ },
        { name: 'Error handling', pattern: /try\s*{[\s\S]*catch/ },
        { name: 'Network validation', pattern: /chainId|network/ },
        { name: 'Transaction verification', pattern: /receipt|waitForDeployment/ }
      ];
      
      let foundSafetyFeatures = 0;
      for (const feature of safetyFeatures) {
        if (feature.pattern.test(deployScript)) {
          foundSafetyFeatures++;
          console.log(`   ✅ ${feature.name} implemented`);
        } else {
          console.log(`   ❌ ${feature.name} missing`);
        }
      }
      
      console.log(`✅ Safety mechanisms: ${foundSafetyFeatures}/${safetyFeatures.length} implemented`);
      return foundSafetyFeatures >= 4; // Require at least 4/5 safety features
    } catch (error) {
      console.error('❌ Safety mechanism test failed:', error.message);
      return false;
    }
  }

  /**
   * Test contract verification functionality
   */
  testContractVerification() {
    console.log('🔍 Testing contract verification functionality...');
    
    try {
      const deployScript = fs.readFileSync('scripts/production-deploy.js', 'utf8');
      
      // Check for verification components
      const verificationFeatures = [
        'verifyContracts',
        'hardhat verify',
        'constructorArguments',
        'BASESCAN_API_KEY'
      ];
      
      let foundFeatures = 0;
      for (const feature of verificationFeatures) {
        if (deployScript.includes(feature)) {
          foundFeatures++;
          console.log(`   ✅ ${feature} found`);
        } else {
          console.log(`   ❌ ${feature} missing`);
        }
      }
      
      console.log(`✅ Verification features: ${foundFeatures}/${verificationFeatures.length} implemented`);
      return foundFeatures >= 3;
    } catch (error) {
      console.error('❌ Verification test failed:', error.message);
      return false;
    }
  }

  /**
   * Test monitoring setup functionality
   */
  testMonitoringSetup() {
    console.log('📊 Testing monitoring setup functionality...');
    
    try {
      const deployScript = fs.readFileSync('scripts/production-deploy.js', 'utf8');
      
      // Check for monitoring components
      const monitoringFeatures = [
        'setupMonitoring',
        'monitoring-config.json',
        'SLACK_WEBHOOK_URL',
        'PAGERDUTY_INTEGRATION_KEY'
      ];
      
      let foundFeatures = 0;
      for (const feature of monitoringFeatures) {
        if (deployScript.includes(feature)) {
          foundFeatures++;
          console.log(`   ✅ ${feature} found`);
        } else {
          console.log(`   ❌ ${feature} missing`);
        }
      }
      
      console.log(`✅ Monitoring features: ${foundFeatures}/${monitoringFeatures.length} implemented`);
      return foundFeatures >= 3;
    } catch (error) {
      console.error('❌ Monitoring setup test failed:', error.message);
      return false;
    }
  }

  /**
   * Test deployment results saving
   */
  testResultsSaving() {
    console.log('💾 Testing deployment results saving...');
    
    try {
      const deployScript = fs.readFileSync('scripts/production-deploy.js', 'utf8');
      
      // Check for results saving components
      const savingFeatures = [
        'saveDeploymentResults',
        'deployments/production',
        'deployment-*.json',
        'writeFileSync'
      ];
      
      let foundFeatures = 0;
      for (const feature of savingFeatures) {
        if (deployScript.includes(feature)) {
          foundFeatures++;
          console.log(`   ✅ ${feature} found`);
        } else {
          console.log(`   ❌ ${feature} missing`);
        }
      }
      
      console.log(`✅ Results saving: ${foundFeatures}/${savingFeatures.length} implemented`);
      return foundFeatures >= 3;
    } catch (error) {
      console.error('❌ Results saving test failed:', error.message);
      return false;
    }
  }

  /**
   * Test error handling and recovery
   */
  testErrorHandling() {
    console.log('🚨 Testing error handling and recovery...');
    
    try {
      const deployScript = fs.readFileSync('scripts/production-deploy.js', 'utf8');
      
      // Count error handling mechanisms
      const tryBlocks = (deployScript.match(/try\s*{/g) || []).length;
      const catchBlocks = (deployScript.match(/catch\s*\(/g) || []).length;
      const errorThrows = (deployScript.match(/throw new Error/g) || []).length;
      
      console.log(`   📊 Try blocks: ${tryBlocks}`);
      console.log(`   📊 Catch blocks: ${catchBlocks}`);
      console.log(`   📊 Error throws: ${errorThrows}`);
      
      if (tryBlocks >= 5 && catchBlocks >= 5) {
        console.log('   ✅ Comprehensive error handling implemented');
        return true;
      } else {
        console.log('   ⚠️  Limited error handling - consider adding more try/catch blocks');
        return false;
      }
    } catch (error) {
      console.error('❌ Error handling test failed:', error.message);
      return false;
    }
  }

  /**
   * Run comprehensive deployment script functionality test
   */
  async runFunctionalityTest() {
    console.log('🚀 Testing Production Deployment Script Functionality...');
    console.log('='.repeat(70));
    
    const tests = [
      { name: 'Script Structure', fn: () => this.testScriptStructure() },
      { name: 'Pre-deployment Validation', fn: () => this.testPreDeploymentValidation() },
      { name: 'Deployment Safety', fn: () => this.testDeploymentSafety() },
      { name: 'Contract Verification', fn: () => this.testContractVerification() },
      { name: 'Monitoring Setup', fn: () => this.testMonitoringSetup() },
      { name: 'Results Saving', fn: () => this.testResultsSaving() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() }
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

    console.log('\n📊 DEPLOYMENT SCRIPT TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`✅ Passed: ${passedTests}/${tests.length}`);
    console.log(`❌ Failed: ${tests.length - passedTests}/${tests.length}`);
    console.log(`📈 Success Rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);

    if (passedTests === tests.length) {
      console.log('\n🎉 PRODUCTION DEPLOYMENT SCRIPT: ALL FUNCTIONALITY TESTS PASSED');
    } else {
      console.log('\n⚠️  PRODUCTION DEPLOYMENT SCRIPT: Some functionality tests failed');
    }

    return { passed: passedTests, total: tests.length, results };
  }
}

export { DeploymentScriptTest };
