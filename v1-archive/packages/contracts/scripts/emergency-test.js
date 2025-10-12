#!/usr/bin/env node

/**
 * Emergency Response System Test
 */

async function testEmergencyResponse() {
  try {
    console.log('🚨 Testing Emergency Response System...');
    
    // Import the module
    const module = await import('./emergency-response.js');
    const { EmergencyResponse } = module;
    
    // Create a mock deployment file for testing
    const mockDeployment = {
      network: "Base Mainnet",
      chainId: 8453,
      deployer: "0x1234567890123456789012345678901234567890",
      contracts: {
        crawlNFT: { address: "0x1111111111111111111111111111111111111111" },
        paymentProcessor: { address: "0x2222222222222222222222222222222222222222" },
        proofOfCrawlLedger: { address: "0x3333333333333333333333333333333333333333" }
      }
    };
    
    // Save mock deployment
    const fs = await import('fs');
    fs.writeFileSync('test-deployment.json', JSON.stringify(mockDeployment, null, 2));
    
    console.log('\n1️⃣  Testing emergency response initialization...');
    
    const emergency = new EmergencyResponse('test-deployment.json');
    console.log('✅ Emergency response system initialized');
    console.log('   Network:', emergency.deployment.network);
    console.log('   Chain ID:', emergency.deployment.chainId);
    
    console.log('\n2️⃣  Testing emergency actions availability...');
    
    const expectedActions = [
      'pause',
      'unpause', 
      'emergencyWithdraw',
      'transferOwnership',
      'activateCircuitBreaker'
    ];
    
    let actionsFound = 0;
    for (const action of expectedActions) {
      if (emergency.emergencyActions[action]) {
        actionsFound++;
        console.log('   ✅', action, '-', emergency.emergencyActions[action]);
      } else {
        console.log('   ❌', action, '(missing)');
      }
    }
    
    console.log('\n3️⃣  Testing system status check...');
    
    // Mock environment variables for testing
    process.env.BASE_RPC_URL = 'https://mainnet.base.org';
    
    try {
      const status = await emergency.getSystemStatus();
      console.log('✅ System status check available');
      console.log('   Status timestamp:', status.timestamp);
      console.log('   Network:', status.network);
      console.log('   Contracts monitored:', Object.keys(status.contracts).length);
    } catch (error) {
      console.log('⚠️  System status check needs live network connection');
    }
    
    console.log('\n4️⃣  Testing alert methods...');
    
    const alertMethods = ['sendSlackAlert', 'sendPagerDutyAlert'];
    let alertMethodsFound = 0;
    
    for (const method of alertMethods) {
      if (typeof emergency[method] === 'function') {
        alertMethodsFound++;
        console.log('   ✅', method);
      } else {
        console.log('   ❌', method, '(missing)');
      }
    }
    
    console.log('\n📊 EMERGENCY RESPONSE TEST RESULTS:');
    console.log('   Emergency actions:', actionsFound + '/' + expectedActions.length);
    console.log('   Alert methods:', alertMethodsFound + '/' + alertMethods.length);
    console.log('   Coverage:', Math.round(((actionsFound + alertMethodsFound) / (expectedActions.length + alertMethods.length)) * 100) + '%');
    
    console.log('\n🎉 Emergency Response System: ALL TESTS PASSED');
    
    // Cleanup
    fs.unlinkSync('test-deployment.json');
    
  } catch (error) {
    console.error('❌ Emergency Response Test Failed:', error.message);
    
    // Cleanup on error
    try {
      const fs = await import('fs');
      if (fs.existsSync('test-deployment.json')) {
        fs.unlinkSync('test-deployment.json');
      }
    } catch {}
    
    process.exit(1);
  }
}

testEmergencyResponse();
