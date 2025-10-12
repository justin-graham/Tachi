#!/usr/bin/env node

/**
 * Tachi Publisher Onboarding - Comprehensive Test Runner
 * 
 * This script orchestrates the complete testing workflow:
 * 1. Starts Hardhat network
 * 2. Deploys smart contracts
 * 3. Starts dashboard server
 * 4. Runs Playwright automation tests
 * 5. Generates comprehensive report
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

class TachiTestRunner {
  constructor() {
    this.processes = []
    this.testResults = {
      contractDeployment: false,
      dashboardLaunch: false,
      playwrightTests: false,
      onboardingFlow: false,
      cloudflareWorker: false
    }
  }

  async run() {
    console.log(`
🚀 TACHI PUBLISHER ONBOARDING - AUTOMATED TEST SUITE
====================================================
This will run the complete end-to-end testing workflow.
`)

    try {
      // Step 1: Environment Setup
      await this.setupEnvironment()
      
      // Step 2: Start Hardhat Network
      await this.startHardhatNetwork()
      
      // Step 3: Deploy Contracts
      await this.deployContracts()
      
      // Step 4: Start Dashboard
      await this.startDashboard()
      
      // Step 5: Wait for Services
      await this.waitForServices()
      
      // Step 6: Run Playwright Tests
      await this.runPlaywrightTests()
      
      // Step 7: Generate Report
      await this.generateReport()
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message)
      await this.cleanup()
      process.exit(1)
    }
  }

  async setupEnvironment() {
    console.log('\n📋 Step 1: Setting up test environment...')
    
    // Check if required directories exist
    const requiredDirs = ['test-results', 'playwright-report']
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`✅ Created directory: ${dir}`)
      }
    }
    
    // Check if contracts directory exists
    const contractsPath = '../contracts'
    if (!fs.existsSync(contractsPath)) {
      throw new Error('Contracts directory not found. Please ensure you are in the dashboard package.')
    }
    
    console.log('✅ Environment setup complete')
  }

  async startHardhatNetwork() {
    console.log('\n🔗 Step 2: Starting Hardhat network...')
    
    return new Promise((resolve, reject) => {
      const hardhatProcess = spawn('npx', ['hardhat', 'node'], {
        cwd: '../contracts',
        stdio: ['ignore', 'pipe', 'pipe']
      })
      
      this.processes.push({ name: 'hardhat', process: hardhatProcess })
      
      let networkReady = false
      const timeout = setTimeout(() => {
        if (!networkReady) {
          reject(new Error('Hardhat network startup timeout'))
        }
      }, 30000)
      
      hardhatProcess.stdout.on('data', (data) => {
        const output = data.toString()
        if (output.includes('Started HTTP and WebSocket JSON-RPC server')) {
          networkReady = true
          clearTimeout(timeout)
          console.log('✅ Hardhat network is running')
          resolve(true)
        }
      })
      
      hardhatProcess.stderr.on('data', (data) => {
        console.log('Hardhat stderr:', data.toString())
      })
      
      hardhatProcess.on('error', (error) => {
        reject(new Error(`Hardhat network failed to start: ${error.message}`))
      })
    })
  }

  async deployContracts() {
    console.log('\n📦 Step 3: Deploying smart contracts...')
    
    try {
      const { stdout, stderr } = await execAsync('npx hardhat run scripts/deploy.ts --network hardhat', {
        cwd: '../contracts'
      })
      
      if (stdout.includes('DEPLOYMENT COMPLETE')) {
        console.log('✅ Smart contracts deployed successfully')
        this.testResults.contractDeployment = true
      } else {
        throw new Error('Contract deployment did not complete successfully')
      }
      
    } catch (error) {
      throw new Error(`Contract deployment failed: ${error.message}`)
    }
  }

  async startDashboard() {
    console.log('\n🌐 Step 4: Starting dashboard server...')
    
    return new Promise((resolve, reject) => {
      const dashboardProcess = spawn('npm', ['run', 'dev'], {
        stdio: ['ignore', 'pipe', 'pipe']
      })
      
      this.processes.push({ name: 'dashboard', process: dashboardProcess })
      
      let serverReady = false
      const timeout = setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Dashboard server startup timeout'))
        }
      }, 45000)
      
      dashboardProcess.stdout.on('data', (data) => {
        const output = data.toString()
        if (output.includes('Local:') && output.includes('3003')) {
          serverReady = true
          clearTimeout(timeout)
          console.log('✅ Dashboard server is running on port 3003')
          this.testResults.dashboardLaunch = true
          resolve(true)
        }
      })
      
      dashboardProcess.stderr.on('data', (data) => {
        const output = data.toString()
        // Next.js outputs some info to stderr, so we check for actual errors
        if (output.includes('Error:') || output.includes('Failed to')) {
          console.warn('Dashboard stderr:', output)
        }
      })
      
      dashboardProcess.on('error', (error) => {
        reject(new Error(`Dashboard server failed to start: ${error.message}`))
      })
    })
  }

  async waitForServices() {
    console.log('\n⏳ Step 5: Waiting for services to be ready...')
    
    // Wait for Hardhat
    await this.waitForUrl('http://127.0.0.1:8545', 'Hardhat JSON-RPC')
    
    // Wait for Dashboard
    await this.waitForUrl('http://localhost:3003', 'Dashboard')
    
    console.log('✅ All services are ready')
  }

  async waitForUrl(url, serviceName) {
    const maxAttempts = 30
    const delay = 1000
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url)
        if (response.ok || response.status === 405) { // 405 is OK for JSON-RPC
          console.log(`✅ ${serviceName} is accessible`)
          return
        }
      } catch (error) {
        // Service not ready yet
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw new Error(`${serviceName} did not become accessible at ${url}`)
  }

  async runPlaywrightTests() {
    console.log('\n🎭 Step 6: Running Playwright automation tests...')
    
    try {
      const { stdout, stderr } = await execAsync('npx playwright test --reporter=line,json:test-results/results.json', {
        timeout: 180000 // 3 minutes
      })
      
      console.log('Playwright output:', stdout)
      if (stderr) console.warn('Playwright stderr:', stderr)
      
      // Parse test results
      if (fs.existsSync('test-results/results.json')) {
        const results = JSON.parse(fs.readFileSync('test-results/results.json', 'utf-8'))
        
        this.testResults.playwrightTests = results.stats.failed === 0
        
        // Check specific test results
        const onboardingTest = results.suites[0]?.specs?.find(spec => 
          spec.title.includes('Complete Publisher Onboarding Flow')
        )
        this.testResults.onboardingFlow = onboardingTest?.tests?.[0]?.status === 'passed'
        
        console.log('✅ Playwright tests completed')
      }
      
    } catch (error) {
      console.warn('⚠️ Playwright tests encountered issues:', error.message)
      // Don't fail entirely - we'll report what happened
    }
  }

  async generateReport() {
    console.log('\n📊 Step 7: Generating comprehensive test report...')
    
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'Tachi Publisher Onboarding Automation',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      },
      results: this.testResults,
      summary: {
        totalTests: Object.keys(this.testResults).length,
        passed: Object.values(this.testResults).filter(Boolean).length,
        failed: Object.values(this.testResults).filter(result => !result).length
      }
    }
    
    // Save detailed report
    fs.writeFileSync('test-results/automation-report.json', JSON.stringify(report, null, 2))
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport(report)
    fs.writeFileSync('test-results/automation-report.html', htmlReport)
    
    // Print summary
    this.printSummary(report)
  }

  generateHtmlReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Tachi Onboarding Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
    .success { color: #16a085; }
    .failure { color: #e74c3c; }
    .test-item { margin: 10px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
    .summary { font-size: 18px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Tachi Publisher Onboarding Test Report</h1>
      <p><strong>Generated:</strong> ${report.timestamp}</p>
      <p><strong>Environment:</strong> ${report.environment.platform} ${report.environment.architecture}, Node.js ${report.environment.nodeVersion}</p>
    </div>
    
    <div class="summary">
      <h2>📊 Test Summary</h2>
      <p><strong>Total Tests:</strong> ${report.summary.totalTests}</p>
      <p class="success"><strong>Passed:</strong> ${report.summary.passed}</p>
      <p class="failure"><strong>Failed:</strong> ${report.summary.failed}</p>
    </div>
    
    <h2>🔍 Detailed Results</h2>
    ${Object.entries(report.results).map(([test, passed]) => `
      <div class="test-item">
        <span class="${passed ? 'success' : 'failure'}">${passed ? '✅' : '❌'}</span>
        <strong>${test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</strong>
      </div>
    `).join('')}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <h3>🎯 Next Steps</h3>
      ${report.summary.failed === 0 ? 
        '<p class="success">🎉 All tests passed! The publisher onboarding flow is working correctly.</p>' :
        '<p class="failure">⚠️ Some tests failed. Please check the detailed logs and fix any issues.</p>'
      }
    </div>
  </div>
</body>
</html>
    `
  }

  printSummary(report) {
    console.log(`
📊 TACHI AUTOMATION TEST RESULTS
================================

🎯 Test Summary:
├── Total Tests: ${report.summary.totalTests}
├── Passed: ${report.summary.passed}
└── Failed: ${report.summary.failed}

🔍 Detailed Results:
${Object.entries(report.results).map(([test, passed]) => 
  `${passed ? '✅' : '❌'} ${test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`
).join('\n')}

📁 Reports Generated:
├── JSON: test-results/automation-report.json
├── HTML: test-results/automation-report.html
└── Playwright: playwright-report/index.html

${report.summary.failed === 0 ? 
  '🎉 SUCCESS: All automation tests passed!' :
  '⚠️ ISSUES: Please review failed tests and fix any problems.'
}
`)
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up processes...')
    
    for (const { name, process } of this.processes) {
      try {
        process.kill('SIGTERM')
        console.log(`✅ Stopped ${name}`)
      } catch (error) {
        console.warn(`⚠️ Failed to stop ${name}:`, error.message)
      }
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\n🛑 Received SIGINT, cleaning up...')
  await runner.cleanup()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\\n🛑 Received SIGTERM, cleaning up...')
  await runner.cleanup()
  process.exit(0)
})

// Run the test suite
const runner = new TachiTestRunner()
runner.run().then(() => {
  console.log('\\n🎯 Test automation completed')
  runner.cleanup()
}).catch((error) => {
  console.error('\\n❌ Test automation failed:', error)
  runner.cleanup()
  process.exit(1)
})
