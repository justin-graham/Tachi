import { test, expect } from '@playwright/test'

test('Simple Demo Flow - Wallet State Check', async ({ page }) => {
  console.log('🎯 === SIMPLE DEMO FLOW - WALLET STATE FOCUS ===\n')
  
  // Capture console logs to debug wallet state
  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('🔍') || text.includes('🔄') || text.includes('LicenseCreationStep') || text.includes('wallet')) {
      console.log(`📱 ${text}`)
    }
  })
  
  await page.goto('http://localhost:3003?test=true')
  await page.waitForLoadState('networkidle')
  
  console.log('1️⃣ Connect wallet...')
  await page.click('[data-testid="test-wallet-connect"]')
  await page.waitForTimeout(1000)
  
  console.log('2️⃣ Fill basic form...')
  await page.fill('#domain', 'test.com')
  await page.fill('#websiteName', 'Test')  
  await page.fill('#description', 'Test')
  
  console.log('3️⃣ Navigate to terms...')
  await page.click('[role="tablist"] button:has-text("Terms of Service")')
  await page.waitForTimeout(500)
  
  console.log('4️⃣ Accept terms...')
  await page.click('[role="checkbox"]')
  
  console.log('5️⃣ Generate terms...')
  await page.click('button:has-text("Generate Terms")')
  await page.waitForTimeout(2000)
  
  console.log('6️⃣ Click Set Pricing (CRITICAL MOMENT)...')
  console.log('     🔍 Checking state before clicking...')
  
  // Check if Set Pricing button exists and is enabled
  const setPricingButton = page.locator('button:has-text("Set Pricing")')
  const isVisible = await setPricingButton.isVisible()
  const isEnabled = await setPricingButton.isEnabled()
  console.log(`     📋 Set Pricing button - visible: ${isVisible}, enabled: ${isEnabled}`)
  
  if (isVisible && isEnabled) {
    console.log('     👆 CLICKING SET PRICING...')
    await setPricingButton.click()
    
    console.log('7️⃣ Immediate check after clicking...')
    await page.waitForTimeout(100) // Minimal wait for render
    
    // Check for the specific error messages
    const walletNotConnected = await page.locator('text="Wallet Not Connected"').count()
    const pleaseConnect = await page.locator('text="Please connect your wallet"').count()
    const loading = await page.locator('text="Loading"').count()
    
    console.log(`     ❌ "Wallet Not Connected": ${walletNotConnected}`)
    console.log(`     ❌ "Please connect your wallet": ${pleaseConnect}`)
    console.log(`     ⏳ "Loading": ${loading}`)
    
    if (walletNotConnected > 0 || pleaseConnect > 0) {
      console.log('     🎯 ISSUE REPRODUCED! Found wallet not connected message')
      
      // Wait and check if it resolves
      console.log('     ⏳ Waiting to see if it resolves...')
      for (let i = 1; i <= 5; i++) {
        await page.waitForTimeout(1000)
        const notConnected = await page.locator('text="Wallet Not Connected"').count()
        const connect = await page.locator('text="Please connect your wallet"').count()
        console.log(`     ${i}s: Not Connected: ${notConnected}, Please Connect: ${connect}`)
        
        if (notConnected === 0 && connect === 0) {
          console.log(`     ✅ Issue resolved after ${i} seconds`)
          break
        }
      }
    } else {
      console.log('     ✅ No wallet connection issues detected')
    }
    
    await page.screenshot({ path: 'simple-demo-debug.png', fullPage: true })
    console.log('     📸 Screenshot saved: simple-demo-debug.png')
  } else {
    console.log('     ❌ Set Pricing button not clickable')
  }
  
  console.log('\n🎯 === END SIMPLE DEMO FLOW ===')
})
