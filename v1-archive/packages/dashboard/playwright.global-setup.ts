import { chromium, FullConfig } from '@playwright/test'

/**
 * Playwright Global Setup
 * 
 * Ensures all required services are running before tests begin:
 * - Hardhat local network
 * - Smart contracts deployed
 * - Dashboard server running
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Tachi Test Environment Setup...')
  
  // Check if Hardhat network is accessible
  try {
    const response = await fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    })
    
    if (response.ok) {
      console.log('✅ Hardhat network is running')
    } else {
      console.warn('⚠️ Hardhat network check failed')
    }
  } catch (error) {
    console.warn('⚠️ Could not connect to Hardhat network at http://127.0.0.1:8545')
    console.log('   Please ensure: npx hardhat node is running')
  }
  
  // Check if dashboard is accessible
  try {
    const response = await fetch('http://localhost:3003')
    if (response.ok) {
      console.log('✅ Dashboard is accessible')
    } else {
      console.warn('⚠️ Dashboard accessibility check failed')
    }
  } catch (error) {
    console.warn('⚠️ Could not connect to dashboard at http://localhost:3003')
    console.log('   Dashboard will be started by webServer config')
  }
  
  // Verify contracts are deployed by checking deployment file
  try {
    const fs = await import('fs')
    const deploymentPath = './deployments/hardhat-31337.json'
    
    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'))
      console.log('✅ Contract deployment found:')
      console.log(`   - CrawlNFT: ${deployment.contracts.crawlNFT.address}`)
      console.log(`   - PaymentProcessor: ${deployment.contracts.paymentProcessor.address}`)
      console.log(`   - ProofLedger: ${deployment.contracts.proofOfCrawlLedger.address}`)
    } else {
      console.warn('⚠️ No contract deployment found')
      console.log('   Please ensure contracts are deployed with: npx hardhat run scripts/deploy.ts --network hardhat')
    }
  } catch (error) {
    console.warn('⚠️ Could not verify contract deployment')
  }
  
  console.log('🎯 Test environment setup complete')
}

export default globalSetup
