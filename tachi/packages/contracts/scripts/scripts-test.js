#!/usr/bin/env node

/**
 * Production Scripts Validation Test
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Testing Production Deployment Scripts...');

const requiredScripts = [
  'production-deploy.js',
  'validate-deployment.js', 
  'emergency-response.js',
  'key-management.js',
  'security-monitor.js'
];

const requiredClasses = [
  'ProductionDeployer',
  'PostDeploymentValidator',
  'EmergencyResponse',
  'SecureKeyManager',
  'SecurityMonitor'
];

try {
  console.log('\n1️⃣  Testing script files exist...');
  
  let scriptsFound = 0;
  for (const script of requiredScripts) {
    const scriptPath = path.join('scripts', script);
    if (fs.existsSync(scriptPath)) {
      scriptsFound++;
      console.log('   ✅', script);
    } else {
      console.log('   ❌', script, '(missing)');
    }
  }
  
  console.log('\n2️⃣  Testing script content structure...');
  
  let classesFound = 0;
  for (let i = 0; i < requiredScripts.length; i++) {
    const script = requiredScripts[i];
    const className = requiredClasses[i];
    const scriptPath = path.join('scripts', script);
    
    if (fs.existsSync(scriptPath)) {
      const content = fs.readFileSync(scriptPath, 'utf8');
      if (content.includes(`class ${className}`)) {
        classesFound++;
        console.log('   ✅', `${script} contains ${className} class`);
      } else {
        console.log('   ❌', `${script} missing ${className} class`);
      }
    }
  }
  
  console.log('\n3️⃣  Testing key deployment methods...');
  
  const deployScript = path.join('scripts', 'production-deploy.js');
  if (fs.existsSync(deployScript)) {
    const deployContent = fs.readFileSync(deployScript, 'utf8');
    
    const deployMethods = [
      'preDeploymentChecks',
      'deployContracts',
      'verifyContracts', 
      'setupMonitoring',
      'saveDeploymentResults'
    ];
    
    let methodsFound = 0;
    for (const method of deployMethods) {
      if (deployContent.includes(`async ${method}(`)) {
        methodsFound++;
        console.log('   ✅', method);
      } else {
        console.log('   ❌', method, '(missing)');
      }
    }
    
    console.log('\\n   Deployment methods coverage:', Math.round((methodsFound / deployMethods.length) * 100) + '%');
  }
  
  console.log('\n4️⃣  Testing emergency response methods...');
  
  const emergencyScript = path.join('scripts', 'emergency-response.js');
  if (fs.existsSync(emergencyScript)) {
    const emergencyContent = fs.readFileSync(emergencyScript, 'utf8');
    
    const emergencyMethods = [
      'pauseContracts',
      'unpauseContracts',
      'emergencyWithdraw',
      'transferOwnership',
      'activateCircuitBreaker'
    ];
    
    let emergencyMethodsFound = 0;
    for (const method of emergencyMethods) {
      if (emergencyContent.includes(`async ${method}(`)) {
        emergencyMethodsFound++;
        console.log('   ✅', method);
      } else {
        console.log('   ❌', method, '(missing)');
      }
    }
    
    console.log('\\n   Emergency methods coverage:', Math.round((emergencyMethodsFound / emergencyMethods.length) * 100) + '%');
  }
  
  console.log('\n5️⃣  Testing security features...');
  
  const securityScript = path.join('scripts', 'security-monitor.js');
  if (fs.existsSync(securityScript)) {
    const securityContent = fs.readFileSync(securityScript, 'utf8');
    
    const securityFeatures = [
      'monitorBlocks',
      'analyzeTransaction',
      'sendSlackAlert',
      'sendPagerDutyAlert'
    ];
    
    let securityFeaturesFound = 0;
    for (const feature of securityFeatures) {
      if (securityContent.includes(feature)) {
        securityFeaturesFound++;
        console.log('   ✅', feature);
      } else {
        console.log('   ❌', feature, '(missing)');
      }
    }
    
    console.log('\\n   Security features coverage:', Math.round((securityFeaturesFound / securityFeatures.length) * 100) + '%');
  }
  
  console.log('\n📊 PRODUCTION SCRIPTS TEST RESULTS:');
  console.log('   Scripts found:', scriptsFound + '/' + requiredScripts.length);
  console.log('   Classes found:', classesFound + '/' + requiredClasses.length);
  console.log('   Overall coverage:', Math.round(((scriptsFound + classesFound) / (requiredScripts.length + requiredClasses.length)) * 100) + '%');
  
  if (scriptsFound === requiredScripts.length && classesFound === requiredClasses.length) {
    console.log('\n🎉 Production Deployment Scripts: ALL TESTS PASSED');
  } else {
    console.log('\n⚠️  Production Deployment Scripts: Some components missing');
  }
  
} catch (error) {
  console.error('❌ Production Scripts Test Failed:', error.message);
  process.exit(1);
}
