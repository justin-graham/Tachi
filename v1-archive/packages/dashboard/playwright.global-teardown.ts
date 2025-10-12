import { FullConfig } from '@playwright/test'

/**
 * Playwright Global Teardown
 * 
 * Cleanup tasks after all tests complete
 */

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up test environment...')
  
  // Clean up any test artifacts
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    // Remove test files if they exist
    const testFiles = [
      './test-crawl-terms.json',
      './cloudflare-worker.js'
    ]
    
    for (const file of testFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
        console.log(`🗑️ Removed: ${file}`)
      }
    }
    
    console.log('✅ Cleanup complete')
  } catch (error) {
    console.warn('⚠️ Cleanup had some issues:', error)
  }
}

export default globalTeardown
