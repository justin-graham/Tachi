import { test } from '@playwright/test'

test('Complete Flow to License Creation Debug', async ({ page }) => {
  console.log('🔍 Testing complete flow to license creation...')
  
  // Listen for console logs to see our debug messages
  page.on('console', msg => {
    if (msg.type() === 'log' && (msg.text().includes('🔍') || msg.text().includes('🔄') || msg.text().includes('❌'))) {
      console.log(`📱 Debug: ${msg.text()}`)
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
  
  console.log('\n📝 Step 2: Fill minimum site details...')
  await page.fill('#domain', 'demo.com')
  await page.fill('#websiteName', 'Demo Site')
  await page.fill('#description', 'Demo description')
  
  console.log('\n📜 Step 3: Navigate to Terms...')
  const termsTab = page.locator('[role="tablist"] button:has-text("Terms of Service")')
  if (await termsTab.count() > 0) {
    await termsTab.click()
    await page.waitForTimeout(1000)
    
    // Accept terms
    const termsCheckbox = page.locator('[role="checkbox"]')
    if (await termsCheckbox.count() > 0) {
      await termsCheckbox.click()
      await page.waitForTimeout(500)
    }
    
    // Click Generate Terms
    const generateButton = page.locator('button:has-text("Generate Terms")')
    if (await generateButton.count() > 0) {
      await generateButton.click()
      await page.waitForTimeout(3000) // Wait for generation
    }
  }
  
  console.log('\n💰 Step 4: Set Pricing...')
  // Should auto-navigate to pricing, just click Set Pricing button
  const setPricingButton = page.locator('button:has-text("Set Pricing")')
  if (await setPricingButton.count() > 0) {
    await setPricingButton.click()
    await page.waitForTimeout(2000) // Wait for navigation to license creation
  }
  
  console.log('\n🎫 Step 5: Check License Creation State...')
  
  // Check for wallet messages immediately
  const walletNotConnected = page.locator('text="Wallet Not Connected"')
  const notConnectedCount = await walletNotConnected.count()
  console.log(`❌ "Wallet Not Connected" messages (immediate): ${notConnectedCount}`)
  
  if (notConnectedCount > 0) {
    console.log('⚠️ FOUND: Wallet not connected message immediately after pricing!')
  }
  
  // Check for loading state
  const loadingState = page.locator('text="Loading"')
  const loadingCount = await loadingState.count()
  console.log(`⏳ Loading state visible: ${loadingCount}`)
  
  // Wait a bit and check again
  await page.waitForTimeout(2000)
  const notConnectedCountAfter = await walletNotConnected.count()
  console.log(`❌ "Wallet Not Connected" messages (after 2s): ${notConnectedCountAfter}`)
  
  const loadingCountAfter = await loadingState.count()
  console.log(`⏳ Loading state after 2s: ${loadingCountAfter}`)
  
  // Check for debug wallet info
  const debugWallet = page.locator('text="Connected Wallet:"')
  const debugCount = await debugWallet.count()
  console.log(`🐛 Debug wallet info visible: ${debugCount}`)
  
  // Check current URL/tab
  const currentUrl = page.url()
  console.log(`🌐 Current URL: ${currentUrl}`)
  
  await page.screenshot({ path: 'complete-flow-license-debug.png', fullPage: true })
  console.log('📸 Screenshot saved: complete-flow-license-debug.png')
})
