import { test } from '@playwright/test'

test('Fast Manual Navigation Simulation', async ({ page }) => {
  console.log('🚀 Simulating fast manual navigation...')
  
  // Listen for console logs to see our debug messages
  page.on('console', msg => {
    if (msg.type() === 'log' && (msg.text().includes('🔍') || msg.text().includes('🔄') || msg.text().includes('❌'))) {
      console.log(`📱 Debug: ${msg.text()}`)
    }
  })
  
  await page.goto('http://localhost:3003?test=true')
  await page.waitForLoadState('networkidle')
  
  console.log('\n⚡ Step 1: Quick Connect Wallet...')
  const testConnectButton = page.locator('[data-testid="test-wallet-connect"]')
  if (await testConnectButton.count() > 0) {
    await testConnectButton.click()
    await page.waitForTimeout(500) // Shorter wait to simulate fast clicking
    console.log('✅ Quick wallet connect')
  }
  
  console.log('\n⚡ Step 2: Quick fill site details...')
  await page.fill('#domain', 'demo.com')
  await page.fill('#websiteName', 'Demo')
  await page.fill('#description', 'Demo')
  
  console.log('\n⚡ Step 3: Fast navigate to Terms...')
  const termsTab = page.locator('[role="tablist"] button:has-text("Terms of Service")')
  if (await termsTab.count() > 0) {
    await termsTab.click()
    await page.waitForTimeout(200) // Very short wait
    
    // Fast accept terms
    const termsCheckbox = page.locator('[role="checkbox"]')
    if (await termsCheckbox.count() > 0) {
      await termsCheckbox.click()
      await page.waitForTimeout(100)
    }
    
    // Fast Generate Terms
    const generateButton = page.locator('button:has-text("Generate Terms")')
    if (await generateButton.count() > 0) {
      await generateButton.click()
      await page.waitForTimeout(1000) // Minimal wait for generation
    }
  }
  
  console.log('\n⚡ Step 4: Fast Set Pricing...')
  const setPricingButton = page.locator('button:has-text("Set Pricing")')
  if (await setPricingButton.count() > 0) {
    await setPricingButton.click()
    
    // Check immediately after clicking - this is when manual users would see the issue
    console.log('\n🔍 IMMEDIATE CHECK (simulating fast manual navigation):')
    const walletNotConnected = page.locator('text="Wallet Not Connected"')
    const immediateCount = await walletNotConnected.count()
    console.log(`❌ "Wallet Not Connected" (0ms): ${immediateCount}`)
    
    if (immediateCount > 0) {
      console.log('🎯 REPRODUCED: Found wallet not connected message with fast navigation!')
    }
    
    // Check at various intervals
    for (const delay of [100, 500, 1000, 2000]) {
      await page.waitForTimeout(delay - (delay === 100 ? 0 : 100))
      const count = await walletNotConnected.count()
      console.log(`❌ "Wallet Not Connected" (${delay}ms): ${count}`)
    }
    
    // Check loading state progression
    const loadingState = page.locator('text="Loading"')
    const loadingCount = await loadingState.count()
    console.log(`⏳ Loading state visible: ${loadingCount}`)
    
    // Check final state
    const debugWallet = page.locator('text="Connected Wallet:"')
    const debugCount = await debugWallet.count()
    console.log(`🐛 Debug wallet info visible: ${debugCount}`)
    
    await page.screenshot({ path: 'fast-navigation-debug.png', fullPage: true })
    console.log('📸 Screenshot saved: fast-navigation-debug.png')
  }
})
