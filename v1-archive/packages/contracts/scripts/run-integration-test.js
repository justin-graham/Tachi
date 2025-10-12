#!/usr/bin/env node

/**
 * Integration Test Runner
 * Executes the comprehensive production readiness integration test
 */

import { ProductionReadinessIntegrationTest } from './production-readiness-integration-test.js';

async function runIntegrationTestSuite() {
  console.log('🎯 Tachi Production Readiness Integration Test Suite');
  console.log('='.repeat(80));
  console.log('⏰ Started at:', new Date().toISOString());
  
  const integrationTest = new ProductionReadinessIntegrationTest();
  
  try {
    const results = await integrationTest.runIntegrationTest();
    
    console.log('\n📊 FINAL INTEGRATION RESULTS:');
    console.log('='.repeat(80));
    console.log(`🎯 Tests Passed: ${results.passed}/${results.total}`);
    console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    console.log(`🚀 Production Ready: ${results.readyForProduction ? 'YES' : 'NO'}`);
    
    if (results.readyForProduction) {
      console.log('\n✅ ALL SYSTEMS GO: Production deployment can proceed');
      console.log('🔐 Security infrastructure validated');
      console.log('📊 Monitoring systems operational'); 
      console.log('🚨 Emergency response systems ready');
      console.log('⚙️  Configuration management verified');
      console.log('🚀 Deployment pipeline tested');
    } else {
      console.log('\n⚠️ HOLD: Address integration issues before production deployment');
      
      const failedTests = results.results.filter(r => r.status === 'failed');
      if (failedTests.length > 0) {
        console.log('\n❌ Failed Tests:');
        failedTests.forEach((test, index) => {
          console.log(`   ${index + 1}. ${test.name}`);
          if (test.error) {
            console.log(`      Error: ${test.error}`);
          }
        });
      }
    }
    
    console.log('\n⏰ Completed at:', new Date().toISOString());
    console.log('='.repeat(80));
    
    process.exit(results.readyForProduction ? 0 : 1);
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST SUITE FAILED:');
    console.error(error.message);
    console.error('\n🔧 Stack trace:', error.stack);
    process.exit(1);
  }
}

runIntegrationTestSuite();
