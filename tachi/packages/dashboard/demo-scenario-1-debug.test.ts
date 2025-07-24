import { test } from '@playwright/test'

test('Demo Scenario 1 - Manual Flow Debug', async ({ page }) => {
  console.log('🎯 Testing Demo Scenario 1 manual flow...')
  
  // Listen for all console messages
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log(`📱 App log: ${msg.text()}`)
    } else if (msg.type() === 'error') {
      console.log(`❌ Console error: ${msg.text()}`)
    } else if (msg.type() === 'warning') {
      console.log(`⚠️ Console warn: ${msg.text()}`)
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
  
  console.log('\n📝 Step 2: Fill Site Details...')
  await page.fill('#domain', 'demo-site.example.com')
  await page.fill('#websiteName', 'Demo Site')
  await page.fill('#description', 'A demo site for testing')
  await page.fill('#email', 'demo@example.com')
  console.log('✅ Form filled')
  
  console.log('\n📜 Step 3: Navigate to Terms of Service...')
  const termsTab = page.locator('[data-value="site-details"] [role="tablist"] button:has-text("Terms of Service")')
  await termsTab.click()
  await page.waitForTimeout(1000)
  console.log('✅ Terms tab clicked')
  
  console.log('\n🔍 Step 4: Check for wallet connection messages...')
  
  // Check for any "Wallet Not Connected" messages
  const walletNotConnected = page.locator('text="Wallet Not Connected"')
  const notConnectedCount = await walletNotConnected.count()
  console.log(`❌ "Wallet Not Connected" messages: ${notConnectedCount}`)
  
  // Check for "Please connect your wallet" messages
  const pleaseConnect = page.locator('text*="Please connect your wallet"')
  const pleaseConnectCount = await pleaseConnect.count()
  console.log(`💡 "Please connect your wallet" messages: ${pleaseConnectCount}`)
  
  // Check for Generate Terms button
  const generateButton = page.locator('button:has-text("Generate Terms")')
  const generateCount = await generateButton.count()
  console.log(`🔘 Generate Terms buttons: ${generateCount}`)
  
  if (generateCount > 0) {
    const isEnabled = await generateButton.first().isEnabled()
    console.log(`🔘 Generate Terms button enabled: ${isEnabled}`)
  }
  
  // Check for terms acceptance checkbox
  const termsCheckbox = page.locator('[role="checkbox"]')
  const checkboxCount = await termsCheckbox.count()
  console.log(`☑️ Terms checkboxes: ${checkboxCount}`)
  
  console.log('\n📸 Step 5: Take screenshot and check debug info...')
  
  // Check debug wallet info
  const debugWallet = page.locator('text="Connected Wallet:"')
  const debugCount = await debugWallet.count()
  console.log(`🐛 Debug wallet info visible: ${debugCount}`)
  
  if (debugCount > 0) {
    const walletInfo = await debugWallet.locator('..').textContent()
    console.log(`   Wallet info: ${walletInfo}`)
  }
  
  await page.screenshot({ path: 'demo-scenario-1-debug.png', fullPage: true })
  console.log('📸 Screenshot saved: demo-scenario-1-debug.png')
  
  console.log('\n🎭 Step 6: Try to generate terms (if button exists)...')
  
  if (generateCount > 0) {
    try {
      await generateButton.first().click()
      await page.waitForTimeout(3000)
      console.log('✅ Generate Terms clicked')
      
      // Check for any new wallet messages after clicking
      const newNotConnectedCount = await walletNotConnected.count()
      const newPleaseConnectCount = await pleaseConnect.count()
      console.log(`❌ "Wallet Not Connected" after generate: ${newNotConnectedCount}`)
      console.log(`💡 "Please connect your wallet" after generate: ${newPleaseConnectCount}`)
      
      // Check if we moved to next step
      const pricingTab = page.locator('[data-value="pricing"]')
      const pricingActive = await pricingTab.count()
      console.log(`💰 Pricing tab active: ${pricingActive}`)
      
      // Take another screenshot
      await page.screenshot({ path: 'demo-scenario-1-after-generate.png', fullPage: true })
      console.log('📸 After generate screenshot: demo-scenario-1-after-generate.png')
      
    } catch (error) {
      console.log(`❌ Error clicking Generate Terms: ${error}`)
    }
  }
  
  console.log('\n🏁 Demo Scenario 1 debug complete!')
})
