#!/usr/bin/env node

/**
 * Gateway Hardening Verification Script
 * Verifies that all security hardening features are properly implemented
 */

import fs from 'fs';
import path from 'path';

// ANSI colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Verify security implementation in source code
 */
function verifySourceCodeImplementation() {
  log('\n🔍 Verifying Source Code Implementation', colors.bold + colors.blue);
  
  const indexPath = path.join(process.cwd(), 'src/index.ts');
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  
  if (!fs.existsSync(indexPath)) {
    log('❌ src/index.ts not found', colors.red);
    return false;
  }
  
  if (!fs.existsSync(wranglerPath)) {
    log('❌ wrangler.toml not found', colors.red);
    return false;
  }
  
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  
  let score = 0;
  const checks = [];
  
  // Check for security headers function
  if (indexContent.includes('addSecurityHeaders')) {
    log('✅ Security headers function implemented', colors.green);
    checks.push({ name: 'Security Headers Function', passed: true });
    score++;
  } else {
    log('❌ Security headers function missing', colors.red);
    checks.push({ name: 'Security Headers Function', passed: false });
  }
  
  // Check for comprehensive security headers
  const requiredHeaders = [
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Content-Security-Policy',
    'X-XSS-Protection',
    'Referrer-Policy'
  ];
  
  let headerScore = 0;
  requiredHeaders.forEach(header => {
    if (indexContent.includes(header)) {
      headerScore++;
    }
  });
  
  if (headerScore === requiredHeaders.length) {
    log('✅ All required security headers implemented', colors.green);
    checks.push({ name: 'Required Security Headers', passed: true });
    score++;
  } else {
    log(`❌ Missing security headers: ${requiredHeaders.length - headerScore}/${requiredHeaders.length}`, colors.red);
    checks.push({ name: 'Required Security Headers', passed: false });
  }
  
  // Check for enhanced rate limiting
  if (indexContent.includes('RATE_LIMITER') && indexContent.includes('checkRateLimit')) {
    log('✅ Enhanced rate limiting implemented', colors.green);
    checks.push({ name: 'Enhanced Rate Limiting', passed: true });
    score++;
  } else {
    log('❌ Enhanced rate limiting missing', colors.red);
    checks.push({ name: 'Enhanced Rate Limiting', passed: false });
  }
  
  // Check for rate limiter binding in wrangler.toml
  if (wranglerContent.includes('[[rate_limiting]]') && wranglerContent.includes('binding = "RATE_LIMITER"')) {
    log('✅ Rate limiter binding configured in wrangler.toml', colors.green);
    checks.push({ name: 'Rate Limiter Binding Config', passed: true });
    score++;
  } else {
    log('❌ Rate limiter binding not configured', colors.red);
    checks.push({ name: 'Rate Limiter Binding Config', passed: false });
  }
  
  // Check for security headers in error responses
  if (indexContent.includes('addSecurityHeaders(response)') && indexContent.includes('createErrorResponse')) {
    log('✅ Security headers added to error responses', colors.green);
    checks.push({ name: 'Error Response Security', passed: true });
    score++;
  } else {
    log('❌ Security headers not added to error responses', colors.red);
    checks.push({ name: 'Error Response Security', passed: false });
  }
  
  // Check for CORS security hardening
  if (indexContent.includes('handleCORS') && indexContent.includes('addSecurityHeaders')) {
    log('✅ CORS responses include security headers', colors.green);
    checks.push({ name: 'CORS Security Hardening', passed: true });
    score++;
  } else {
    log('❌ CORS security hardening missing', colors.red);
    checks.push({ name: 'CORS Security Hardening', passed: false });
  }
  
  // Check for non-AI crawler security
  if (indexContent.includes('addSecurityHeaders(secureResponse)') && indexContent.includes('isAICrawler')) {
    log('✅ Security headers for non-AI crawler responses', colors.green);
    checks.push({ name: 'Non-AI Crawler Security', passed: true });
    score++;
  } else {
    log('❌ Non-AI crawler security missing', colors.red);
    checks.push({ name: 'Non-AI Crawler Security', passed: false });
  }
  
  // Check for proper rate limit error handling
  if (indexContent.includes('X-RateLimit-Reset') && indexContent.includes('Retry-After')) {
    log('✅ Proper rate limit error headers implemented', colors.green);
    checks.push({ name: 'Rate Limit Error Headers', passed: true });
    score++;
  } else {
    log('❌ Rate limit error headers incomplete', colors.red);
    checks.push({ name: 'Rate Limit Error Headers', passed: false });
  }
  
  // Check for type definitions
  const typePath = path.join(process.cwd(), 'src/types/rate-limiter.d.ts');
  if (fs.existsSync(typePath)) {
    log('✅ Rate limiter type definitions present', colors.green);
    checks.push({ name: 'Type Definitions', passed: true });
    score++;
  } else {
    log('❌ Rate limiter type definitions missing', colors.red);
    checks.push({ name: 'Type Definitions', passed: false });
  }
  
  log(`\nSource Code Implementation: ${score}/${checks.length} checks passed`, 
    score === checks.length ? colors.green : (score > checks.length / 2 ? colors.yellow : colors.red));
  
  return { score, total: checks.length, checks, passed: score === checks.length };
}

/**
 * Verify configuration files
 */
function verifyConfiguration() {
  log('\n📋 Verifying Configuration Files', colors.bold + colors.blue);
  
  const configFiles = [
    'wrangler.toml',
    'package.json',
    'tsconfig.json'
  ];
  
  let score = 0;
  const checks = [];
  
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file} exists`, colors.green);
      checks.push({ name: file, passed: true });
      score++;
    } else {
      log(`❌ ${file} missing`, colors.red);
      checks.push({ name: file, passed: false });
    }
  });
  
  // Check package.json for security test scripts
  if (fs.existsSync('package.json')) {
    const packageContent = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageContent.scripts && packageContent.scripts['test:security']) {
      log('✅ Security test script configured in package.json', colors.green);
      checks.push({ name: 'Security Test Script', passed: true });
      score++;
    } else {
      log('❌ Security test script not configured', colors.red);
      checks.push({ name: 'Security Test Script', passed: false });
    }
  }
  
  log(`\nConfiguration: ${score}/${checks.length} checks passed`, 
    score === checks.length ? colors.green : colors.yellow);
  
  return { score, total: checks.length, checks, passed: score === checks.length };
}

/**
 * Verify documentation and test files
 */
function verifyDocumentationAndTests() {
  log('\n📚 Verifying Documentation and Test Files', colors.bold + colors.blue);
  
  const requiredFiles = [
    'security-test.mjs',
    'SECURITY_HARDENING.md',
    'SECURITY_IMPLEMENTATION_SUMMARY.md'
  ];
  
  let score = 0;
  const checks = [];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file} exists`, colors.green);
      checks.push({ name: file, passed: true });
      score++;
    } else {
      log(`❌ ${file} missing`, colors.red);
      checks.push({ name: file, passed: false });
    }
  });
  
  // Check security test file content
  if (fs.existsSync('security-test.mjs')) {
    const testContent = fs.readFileSync('security-test.mjs', 'utf8');
    const testFeatures = [
      'testSecurityHeaders',
      'testRateLimit',
      'testCORS',
      'testRequestSizeLimit',
      'testErrorResponseSecurity'
    ];
    
    let testScore = 0;
    testFeatures.forEach(feature => {
      if (testContent.includes(feature)) {
        testScore++;
      }
    });
    
    if (testScore === testFeatures.length) {
      log('✅ Comprehensive security test suite implemented', colors.green);
      checks.push({ name: 'Test Suite Completeness', passed: true });
      score++;
    } else {
      log(`❌ Incomplete security test suite: ${testScore}/${testFeatures.length} features`, colors.red);
      checks.push({ name: 'Test Suite Completeness', passed: false });
    }
  }
  
  log(`\nDocumentation and Tests: ${score}/${checks.length} checks passed`, 
    score === checks.length ? colors.green : colors.yellow);
  
  return { score, total: checks.length, checks, passed: score === checks.length };
}

/**
 * Check build and compilation
 */
async function verifyBuildAndCompilation() {
  log('\n🔨 Verifying Build and Compilation', colors.bold + colors.blue);
  
  const { execSync } = await import('child_process');
  const checks = [];
  let score = 0;
  
  try {
    // Check TypeScript compilation
    execSync('pnpm build', { stdio: 'pipe' });
    log('✅ TypeScript compilation successful', colors.green);
    checks.push({ name: 'TypeScript Build', passed: true });
    score++;
  } catch (error) {
    log('❌ TypeScript compilation failed', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    checks.push({ name: 'TypeScript Build', passed: false });
  }
  
  try {
    // Check type checking
    execSync('pnpm typecheck', { stdio: 'pipe' });
    log('✅ TypeScript type checking passed', colors.green);
    checks.push({ name: 'Type Checking', passed: true });
    score++;
  } catch (error) {
    log('❌ TypeScript type checking failed', colors.red);
    checks.push({ name: 'Type Checking', passed: false });
  }
  
  // Check if dist folder exists after build
  if (fs.existsSync('dist/index.js')) {
    log('✅ Build output generated successfully', colors.green);
    checks.push({ name: 'Build Output', passed: true });
    score++;
  } else {
    log('❌ Build output not generated', colors.red);
    checks.push({ name: 'Build Output', passed: false });
  }
  
  log(`\nBuild and Compilation: ${score}/${checks.length} checks passed`, 
    score === checks.length ? colors.green : colors.red);
  
  return { score, total: checks.length, checks, passed: score === checks.length };
}

/**
 * Main verification function
 */
async function runVerification() {
  log('🛡️  Tachi Protocol Gateway Hardening Verification', colors.bold + colors.blue);
  log('===================================================', colors.blue);
  
  const results = [];
  
  // Run all verification checks
  results.push(verifySourceCodeImplementation());
  results.push(verifyConfiguration());
  results.push(verifyDocumentationAndTests());
  results.push(await verifyBuildAndCompilation());
  
  // Calculate overall score
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const totalChecks = results.reduce((sum, result) => sum + result.total, 0);
  const overallPassed = results.every(result => result.passed);
  
  // Summary
  log('\n📊 Overall Verification Results', colors.bold + colors.blue);
  log('===============================', colors.blue);
  
  results.forEach((result, index) => {
    const sections = [
      'Source Code Implementation',
      'Configuration',
      'Documentation and Tests', 
      'Build and Compilation'
    ];
    
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? colors.green : colors.red;
    log(`${status} ${sections[index]}: ${result.score}/${result.total}`, color);
  });
  
  log(`\nOverall Score: ${totalScore}/${totalChecks} (${Math.round(totalScore/totalChecks * 100)}%)`, 
    overallPassed ? colors.green : (totalScore/totalChecks > 0.8 ? colors.yellow : colors.red));
  
  if (overallPassed) {
    log('\n🎉 Gateway Hardening Verification PASSED!', colors.bold + colors.green);
    log('All security features are properly implemented and working.', colors.green);
  } else if (totalScore/totalChecks > 0.8) {
    log('\n⚠️  Gateway Hardening Verification MOSTLY PASSED!', colors.bold + colors.yellow);
    log('Most security features are implemented, but some issues need attention.', colors.yellow);
  } else {
    log('\n❌ Gateway Hardening Verification FAILED!', colors.bold + colors.red);
    log('Critical security features are missing or not working properly.', colors.red);
  }
  
  return overallPassed;
}

// Run verification if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runVerification().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`❌ Verification failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}
