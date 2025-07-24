import { test } from '@playwright/test'

test('License Creation Wallet State Debug', async ({ page }) => {
  console.log('🔍 Testing license creation wallet state...')
  
  // Listen for console logs to see our debug messages
  page.on('console', msg => {
    if (msg.type() === 'log' && msg.text().includes('🔍')) {
      console.log(`📱 Debug: ${msg.text()}`)
    } else if (msg.type() === 'log' && msg.text().includes('🔄')) {
      console.log(`📱 Stabilize: ${msg.text()}`)
    } else if (msg.type() === 'log' && msg.text().includes('❌') && msg.text().includes('Showing wallet not connected')) {
      console.log(`📱 Error: ${msg.text()}`)
    }
  })
  
  await page.goto('http://localhost:3003?test=true')
  await page.waitForLoadState('networkidle')
  
  console.log('\n🔗 Step 1: Connect Wallet...')
  const testConnectButton = page.locator('[data-testid="test-wallet-connect"]')
  if (await testConnectButton.count() > 0) {
    await testConnectButton.click()
    await page.waitForTimeout(2000)
    console.log('✅ Test wallet connected')
  }
  
  console.log('\n📝 Step 2: Navigate directly to License tab...')
  // Click the license tab directly to simulate quick navigation
  const licenseTab = page.locator('[data-value="license"]')
  if (await licenseTab.count() > 0) {
    await licenseTab.click()
    await page.waitForTimeout(500) // Short wait to see if wallet message appears
    
    console.log('🔍 Step 3: Check for wallet messages immediately...')
    const walletNotConnected = page.locator('text="Wallet Not Connected"')
    const notConnectedCount = await walletNotConnected.count()
    console.log(`❌ "Wallet Not Connected" messages (immediate): ${notConnectedCount}`)
    
    if (notConnectedCount > 0) {
      console.log('⚠️ Found wallet not connected message immediately after navigation!')
    }
    
    // Wait a bit longer and check again
    await page.waitForTimeout(2000)
    const notConnectedCountAfter = await walletNotConnected.count()
    console.log(`❌ "Wallet Not Connected" messages (after 2s): ${notConnectedCountAfter}`)
    
    // Check for loading state
    const loadingState = page.locator('text="Loading"')
    const loadingCount = await loadingState.count()
    console.log(`⏳ Loading state visible: ${loadingCount}`)
    
    // Check for debug wallet info
    const debugWallet = page.locator('text="Connected Wallet:"')
    const debugCount = await debugWallet.count()
    console.log(`🐛 Debug wallet info visible: ${debugCount}`)
    
    await page.screenshot({ path: 'license-creation-wallet-debug.png', fullPage: true })
    console.log('📸 Screenshot saved: license-creation-wallet-debug.png')
    
  } else {
    console.log('❌ License tab not found')
  }
})
