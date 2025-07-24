import { test, expect } from '@playwright/test'

test('Manual Demo Scenario 1 - Step by Step Debug', async ({ page }) => {
  console.log('🎬 === DEMO SCENARIO 1 DEBUG - STEP BY STEP ===\n')
  
  // Capture ALL console logs from the page
  const consoleMessages: string[] = []
  page.on('console', msg => {
    const text = msg.text()
    consoleMessages.push(`[${msg.type()}] ${text}`)
    if (text.includes('🔍') || text.includes('🔄') || text.includes('❌') || text.includes('LicenseCreationStep')) {
      console.log(`📱 Page Debug: ${text}`)
    }
  })
  
  console.log('🌐 Step 0: Navigate to app...')
  await page.goto('http://localhost:3003?test=true')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  
  console.log('\n📱 Step 1: Connect Wallet...')
  const connectButton = page.locator('[data-testid="test-wallet-connect"]')
  await expect(connectButton).toBeVisible()
  await connectButton.click()
  console.log('✅ Wallet connect button clicked')
  
  // Wait for wallet to connect and verify
  await page.waitForTimeout(500)
  const walletInfo = await page.locator('[data-testid="wallet-info"]').textContent()
  console.log(`💼 Wallet state: ${walletInfo || 'No wallet info found'}`)
  
  console.log('\n📝 Step 2: Fill Site Details...')
  await page.fill('#domain', 'demo-site.com')
  await page.fill('#websiteName', 'Demo Website')
  await page.fill('#description', 'Demo description for testing')
  console.log('✅ Site details filled')
  
  console.log('\n📋 Step 3: Navigate to Terms...')
  const termsTab = page.locator('[role="tablist"] button:has-text("Terms of Service")')
  await expect(termsTab).toBeVisible()
  await termsTab.click()
  await page.waitForTimeout(300)
  console.log('✅ Terms tab clicked')
  
  console.log('\n✓ Step 4: Accept Terms...')
  const checkbox = page.locator('[role="checkbox"]')
  await expect(checkbox).toBeVisible()
  await checkbox.click()
  console.log('✅ Terms accepted')
  
  console.log('\n🔨 Step 5: Generate Terms...')
  const generateButton = page.locator('button:has-text("Generate Terms")')
  await expect(generateButton).toBeEnabled()
  await generateButton.click()
  
  // Wait for terms generation
  console.log('⏳ Waiting for terms generation...')
  await page.waitForTimeout(2000)
  console.log('✅ Terms generation complete')
  
  console.log('\n💰 Step 6: Navigate to Set Pricing (THE CRITICAL MOMENT)...')
  const setPricingButton = page.locator('button:has-text("Set Pricing")')
  await expect(setPricingButton).toBeVisible()
  
  console.log('🎯 ABOUT TO CLICK SET PRICING - checking current state...')
  const currentWalletInfo = await page.locator('[data-testid="wallet-info"]').textContent()
  console.log(`💼 Current wallet state: ${currentWalletInfo || 'No wallet info'}`)
  
  console.log('👆 CLICKING SET PRICING NOW...')
  await setPricingButton.click()
  
  console.log('\n🔍 IMMEDIATE STATE CHECK (0ms delay):')
  await page.waitForTimeout(50) // Just enough for DOM to update
  
  const walletNotConnectedElements = page.locator('text="Wallet Not Connected"')
  const loadingElements = page.locator('text="Loading"')
  const connectedWalletElements = page.locator('text="Connected Wallet:"')
  
  const immediateNotConnected = await walletNotConnectedElements.count()
  const immediateLoading = await loadingElements.count()
  const immediateConnected = await connectedWalletElements.count()
  
  console.log(`❌ "Wallet Not Connected" messages: ${immediateNotConnected}`)
  console.log(`⏳ "Loading" messages: ${immediateLoading}`)
  console.log(`✅ "Connected Wallet:" messages: ${immediateConnected}`)
  
  if (immediateNotConnected > 0) {
    console.log('🎯 REPRODUCED THE ISSUE! Found "Wallet Not Connected" immediately after clicking Set Pricing')
  }
  
  console.log('\n🕐 PROGRESSIVE STATE CHECKS:')
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(500)
    const notConnected = await walletNotConnectedElements.count()
    const loading = await loadingElements.count()
    const connected = await connectedWalletElements.count()
    
    console.log(`⏱️  After ${(i + 1) * 500}ms - Not Connected: ${notConnected}, Loading: ${loading}, Connected: ${connected}`)
    
    if (notConnected === 0 && connected > 0) {
      console.log(`✅ Wallet state resolved after ${(i + 1) * 500}ms`)
      break
    }
  }
  
  // Take a screenshot for visual debugging
  await page.screenshot({ path: 'manual-demo-debug.png', fullPage: true })
  console.log('📸 Screenshot saved: manual-demo-debug.png')
  
  // Log all captured console messages for deeper debugging
  console.log('\n📋 ALL CONSOLE MESSAGES FROM PAGE:')
  consoleMessages.forEach(msg => console.log(`  ${msg}`))
  
  console.log('\n🎬 === END DEMO SCENARIO 1 DEBUG ===')
})
