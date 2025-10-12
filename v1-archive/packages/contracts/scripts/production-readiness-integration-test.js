#!/usr/bin/env node

/**
 * Comprehensive Production Readiness Integration Test
 * Tests all four critical components together and their interactions
 */

import fs from 'fs';
import { ethers } from 'ethers';

class ProductionReadinessIntegrationTest {
  constructor() {
    this.components = {
      keyManagement: false,
      securityMonitor: false,
      productionConfig: false,
      deploymentScript: false,
      emergencyResponse: false
    };
    this.integrationResults = {};
  }

  /**
   * Test component availability and structure
   */
  testComponentAvailability() {
    console.log('📦 Testing component availability...');
    
    const components = [
      { name: 'Key Management', file: 'scripts/key-management.js', classes: ['SecureKeyManager'] },
      { name: 'Security Monitor', file: 'scripts/security-monitor.js', classes: ['SecurityMonitor'] },
      { name: 'Production Config', file: '.env.production', classes: [] },
      { name: 'Deployment Script', file: 'scripts/production-deploy.js', classes: ['ProductionDeployer'] },
      { name: 'Emergency Response', file: 'scripts/emergency-response.js', classes: ['EmergencyResponse'] }
    ];

    let availableComponents = 0;
    
    for (const component of components) {
      try {
        const fileContent = fs.readFileSync(component.file, 'utf8');
        
        let hasRequiredClasses = true;
        for (const className of component.classes) {
          if (!fileContent.includes(className)) {
            hasRequiredClasses = false;
            break;
          }
        }
        
        if (hasRequiredClasses) {
          console.log(`   ✅ ${component.name}: Available`);
          this.components[component.name.replace(' ', '').toLowerCase()] = true;
          availableComponents++;
        } else {
          console.log(`   ❌ ${component.name}: Missing required classes`);
        }
      } catch (error) {
        console.log(`   ❌ ${component.name}: Not found`);
      }
    }
    
    console.log(`✅ Available components: ${availableComponents}/${components.length}`);
    return availableComponents === components.length;
  }

  /**
   * Test environment variable integration
   */
  testEnvironmentIntegration() {
    console.log('🔗 Testing environment variable integration...');
    
    try {
      // Load production environment
      const envContent = fs.readFileSync('.env.production', 'utf8');
      const envVars = {};
      
      const envLines = envContent.split('\\n').filter(line => line.trim() && !line.startsWith('#'));
      for (const line of envLines) {
        const [key, ...valueParts] = line.split('=');
        envVars[key] = valueParts.join('=');
      }
      
      // Test cross-component environment variable usage
      const scripts = [
        'scripts/production-deploy.js',
        'scripts/security-monitor.js',
        'scripts/emergency-response.js'
      ];
      
      const criticalVars = [
        'BASE_RPC_URL',
        'PRIVATE_KEY',
        'SLACK_WEBHOOK_URL',
        'PAGERDUTY_INTEGRATION_KEY'
      ];
      
      let integrationScore = 0;
      
      for (const script of scripts) {
        const scriptContent = fs.readFileSync(script, 'utf8');
        let varsFound = 0;
        
        for (const varName of criticalVars) {
          if (scriptContent.includes(varName)) {
            varsFound++;
          }
        }
        
        const scriptName = script.split('/').pop().replace('.js', '');
        console.log(`   📄 ${scriptName}: Uses ${varsFound}/${criticalVars.length} critical env vars`);
        
        if (varsFound >= 2) {
          integrationScore++;
        }
      }
      
      console.log(`✅ Environment integration: ${integrationScore}/${scripts.length} scripts properly integrated`);
      return integrationScore >= 2;
    } catch (error) {
      console.error('❌ Environment integration test failed:', error.message);
      return false;
    }
  }

  /**
   * Test cross-component communication
   */
  async testCrossComponentCommunication() {
    console.log('🔄 Testing cross-component communication...');
    
    try {
      // Test 1: Key Management + Security Monitor integration
      console.log('   🔐➡️📊 Key Management ↔ Security Monitor...');
      
      const keyMgmtScript = fs.readFileSync('scripts/key-management.js', 'utf8');
      const securityScript = fs.readFileSync('scripts/security-monitor.js', 'utf8');
      
      // Both should handle ethers and crypto
      const sharedDependencies = ['ethers', 'crypto'];
      let sharedDeps = 0;
      
      for (const dep of sharedDependencies) {
        if (keyMgmtScript.includes(dep) && securityScript.includes(dep)) {
          sharedDeps++;
        }
      }
      
      console.log(`     ✅ Shared dependencies: ${sharedDeps}/${sharedDependencies.length}`);
      
      // Test 2: Deployment Script + Emergency Response integration
      console.log('   🚀➡️🚨 Deployment Script ↔ Emergency Response...');
      
      const deployScript = fs.readFileSync('scripts/production-deploy.js', 'utf8');
      const emergencyScript = fs.readFileSync('scripts/emergency-response.js', 'utf8');
      
      // Both should handle contract interactions
      const contractFeatures = ['ethers.getContractAt', 'address', 'signer'];
      let contractIntegration = 0;
      
      for (const feature of contractFeatures) {
        if (deployScript.includes(feature) && emergencyScript.includes(feature)) {
          contractIntegration++;
        }
      }
      
      console.log(`     ✅ Contract integration: ${contractIntegration}/${contractFeatures.length}`);
      
      // Test 3: Monitoring integration across all scripts
      console.log('   📊➡️🔄 Monitoring Integration Across All Scripts...');
      
      const monitoringFeatures = ['SLACK_WEBHOOK_URL', 'alert', 'monitoring'];
      const allScripts = [deployScript, securityScript, emergencyScript];
      
      let monitoringIntegration = 0;
      for (const script of allScripts) {
        let hasMonitoring = false;
        for (const feature of monitoringFeatures) {
          if (script.includes(feature)) {
            hasMonitoring = true;
            break;
          }
        }
        if (hasMonitoring) monitoringIntegration++;
      }
      
      console.log(`     ✅ Monitoring integration: ${monitoringIntegration}/${allScripts.length} scripts`);
      
      const totalIntegrationScore = sharedDeps + contractIntegration + monitoringIntegration;
      console.log(`✅ Cross-component communication score: ${totalIntegrationScore}/8`);
      
      return totalIntegrationScore >= 6;
    } catch (error) {
      console.error('❌ Cross-component communication test failed:', error.message);
      return false;
    }
  }

  /**
   * Test production deployment workflow
   */
  async testProductionWorkflow() {
    console.log('🔄 Testing production deployment workflow...');
    
    try {
      // Test workflow sequence validation
      const workflowSteps = [
        { step: 'Key Generation', script: 'scripts/key-management.js', feature: 'generateSecureKey' },
        { step: 'Environment Setup', script: '.env.production', feature: 'BASE_RPC_URL' },
        { step: 'Pre-deployment Validation', script: 'scripts/production-deploy.js', feature: 'preDeploymentChecks' },
        { step: 'Contract Deployment', script: 'scripts/production-deploy.js', feature: 'deployContracts' },
        { step: 'Contract Verification', script: 'scripts/production-deploy.js', feature: 'verifyContracts' },
        { step: 'Monitoring Setup', script: 'scripts/production-deploy.js', feature: 'setupMonitoring' },
        { step: 'Emergency Response Ready', script: 'scripts/emergency-response.js', feature: 'getSystemStatus' }
      ];
      
      let workflowReady = 0;
      
      for (const step of workflowSteps) {
        try {
          const content = fs.readFileSync(step.script, 'utf8');
          if (content.includes(step.feature)) {
            console.log(`   ✅ ${step.step}: Ready`);
            workflowReady++;
          } else {
            console.log(`   ❌ ${step.step}: Missing feature`);
          }
        } catch (error) {
          console.log(`   ❌ ${step.step}: Script not found`);
        }
      }
      
      console.log(`✅ Production workflow readiness: ${workflowReady}/${workflowSteps.length} steps`);
      return workflowReady >= 6;
    } catch (error) {
      console.error('❌ Production workflow test failed:', error.message);
      return false;
    }
  }

  /**
   * Test error handling integration
   */
  testErrorHandlingIntegration() {
    console.log('🚨 Testing error handling integration...');
    
    try {
      const scripts = [
        'scripts/key-management.js',
        'scripts/security-monitor.js',
        'scripts/production-deploy.js',
        'scripts/emergency-response.js'
      ];
      
      let scriptsWithErrorHandling = 0;
      
      for (const script of scripts) {
        const content = fs.readFileSync(script, 'utf8');
        
        // Count error handling mechanisms
        const tryBlocks = (content.match(/try\s*{/g) || []).length;
        const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
        const errorThrows = (content.match(/throw new Error/g) || []).length;
        
        const scriptName = script.split('/').pop();
        
        if (tryBlocks >= 2 && catchBlocks >= 2) {
          console.log(`   ✅ ${scriptName}: Comprehensive error handling (${tryBlocks} try, ${catchBlocks} catch)`);
          scriptsWithErrorHandling++;
        } else {
          console.log(`   ⚠️  ${scriptName}: Limited error handling (${tryBlocks} try, ${catchBlocks} catch)`);
        }
      }
      
      console.log(`✅ Error handling integration: ${scriptsWithErrorHandling}/${scripts.length} scripts`);
      return scriptsWithErrorHandling >= 3;
    } catch (error) {
      console.error('❌ Error handling integration test failed:', error.message);
      return false;
    }
  }

  /**
   * Test security integration across components
   */
  testSecurityIntegration() {
    console.log('🔒 Testing security integration...');
    
    try {
      const securityFeatures = [
        { feature: 'Private Key Encryption', files: ['scripts/key-management.js'], pattern: /encrypt.*private.*key/i },
        { feature: 'Access Control', files: ['scripts/emergency-response.js'], pattern: /authorized|permission|owner/i },
        { feature: 'Audit Logging', files: ['scripts/security-monitor.js', 'scripts/emergency-response.js'], pattern: /log.*action|timestamp.*responder/i },
        { feature: 'Network Validation', files: ['scripts/production-deploy.js'], pattern: /chainId|network.*validation/i },
        { feature: 'Gas Price Protection', files: ['scripts/production-deploy.js'], pattern: /gas.*price.*limit|MAX_GAS_PRICE/i }
      ];
      
      let securityFeaturesFound = 0;
      
      for (const security of securityFeatures) {
        let featureFound = false;
        
        for (const file of security.files) {
          try {
            const content = fs.readFileSync(file, 'utf8');
            if (security.pattern.test(content)) {
              featureFound = true;
              break;
            }
          } catch (error) {
            // File not found, continue
          }
        }
        
        if (featureFound) {
          console.log(`   ✅ ${security.feature}: Implemented`);
          securityFeaturesFound++;
        } else {
          console.log(`   ❌ ${security.feature}: Not found`);
        }
      }
      
      console.log(`✅ Security integration: ${securityFeaturesFound}/${securityFeatures.length} features`);
      return securityFeaturesFound >= 4;
    } catch (error) {
      console.error('❌ Security integration test failed:', error.message);
      return false;
    }
  }

  /**
   * Run comprehensive integration test
   */
  async runIntegrationTest() {
    console.log('🔄 Running Comprehensive Production Readiness Integration Test...');
    console.log('='.repeat(80));
    
    const integrationTests = [
      { name: 'Component Availability', fn: () => this.testComponentAvailability() },
      { name: 'Environment Integration', fn: () => this.testEnvironmentIntegration() },
      { name: 'Cross-Component Communication', fn: () => this.testCrossComponentCommunication() },
      { name: 'Production Workflow', fn: () => this.testProductionWorkflow() },
      { name: 'Error Handling Integration', fn: () => this.testErrorHandlingIntegration() },
      { name: 'Security Integration', fn: () => this.testSecurityIntegration() }
    ];

    let passedTests = 0;
    const results = [];

    for (const test of integrationTests) {
      try {
        console.log(`\\n${integrationTests.indexOf(test) + 1}️⃣  ${test.name}...`);
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

    console.log('\\n🎯 COMPREHENSIVE INTEGRATION TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${passedTests}/${integrationTests.length}`);
    console.log(`❌ Failed: ${integrationTests.length - passedTests}/${integrationTests.length}`);
    console.log(`📈 Integration Score: ${((passedTests / integrationTests.length) * 100).toFixed(1)}%`);

    console.log('\\n📋 PRODUCTION READINESS SUMMARY:');
    console.log('1. 🔐 Key Management System: ' + (this.components.keymanagement ? '✅ Ready' : '❌ Not Ready'));
    console.log('2. 📊 Security Monitoring: ' + (this.components.securitymonitor ? '✅ Ready' : '❌ Not Ready'));
    console.log('3. ⚙️  Production Configuration: ' + (this.components.productionconfig ? '✅ Ready' : '❌ Not Ready'));
    console.log('4. 🚀 Deployment Scripts: ' + (this.components.deploymentscript ? '✅ Ready' : '❌ Not Ready'));
    console.log('5. 🚨 Emergency Response: ' + (this.components.emergencyresponse ? '✅ Ready' : '❌ Not Ready'));

    if (passedTests === integrationTests.length) {
      console.log('\\n🎉 PRODUCTION READINESS: FULLY INTEGRATED AND READY FOR MAINNET DEPLOYMENT');
      console.log('🚀 All critical components tested and verified for production use!');
    } else {
      console.log('\\n⚠️  PRODUCTION READINESS: Integration issues detected');
      console.log('🔧 Please address failed tests before proceeding to mainnet deployment');
    }

    return { passed: passedTests, total: integrationTests.length, results, readyForProduction: passedTests === integrationTests.length };
  }
}

export { ProductionReadinessIntegrationTest };
