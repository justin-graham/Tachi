import { test, expect } from '@playwright/test'

test('Demo Scenario 1 - Correct Flow Debug', async ({ page }) => {
  console.log('🎯 === DEMO SCENARIO 1 - CORRECTED FLOW DEBUG ===\n')
  
  // Capture console logs to debug wallet state
  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('🔍') || text.includes('🔄') || text.includes('LicenseCreationStep') || text.includes('wallet') || text.includes('Wallet')) {
      console.log(`📱 ${text}`)
    }
  })
  
  const testUrl = 'http://localhost:3003?test=true'
  console.log(`🌐 Navigating to: ${testUrl}`)
  await page.goto(testUrl)
  await page.waitForLoadState('networkidle')
  console.log('📄 Page loaded')
  
  console.log('\n1️⃣ Connect Test Wallet...')
  const testWalletButton = page.locator('[data-testid="test-wallet-connect"]')
  await expect(testWalletButton).toBeVisible()
  await testWalletButton.click()
  console.log('✅ Clicked Connect Test Wallet')
  
  // Wait for connection
  await page.waitForTimeout(3000)
  console.log('⏳ Waited for wallet connection')
  
  console.log('\n2️⃣ Wait for site details form...')
  await page.waitForSelector('#domain', { timeout: 10000 })
  console.log('✅ Site details form is available')
  
  console.log('\n3️⃣ Fill Publisher Information...')
  const formFields = [
    { name: 'domain', value: 'demo.com', selector: '#domain' },
    { name: 'websiteName', value: 'Demo Site', selector: '#websiteName' },
    { name: 'description', value: 'Demo description', selector: '#description' },
    { name: 'contactEmail', value: 'demo@demo.com', selector: '#contactEmail' },
    { name: 'companyName', value: 'Demo Company', selector: '#companyName' }
  ]
  
  for (const field of formFields) {
    await page.fill(field.selector, field.value)
    console.log(`✅ Filled ${field.name}: ${field.value}`)
  }
  
  // Trigger validation
  await page.locator('#domain').blur()
  await page.waitForTimeout(1000)
  console.log('✅ Form validation triggered')
  
  console.log('\n4️⃣ Generate Terms (staying on Website Details tab)...')
  const generateButton = page.locator('button:has-text("Generate Terms")')
  await expect(generateButton).toBeVisible()
  
  const isDisabled = await generateButton.isDisabled()
  console.log(`📋 Generate Terms button disabled: ${isDisabled}`)
  
  if (isDisabled) {
    console.log('🚀 Button disabled, attempting force click...')
    await generateButton.click({ force: true })
  } else {
    await generateButton.click()
  }
  console.log('✅ Generate Terms clicked')
  
  // Wait for terms generation
  await page.waitForTimeout(5000)
  console.log('⏳ Waited for terms generation')
  
  console.log('\n5️⃣ Look for Set Pricing button (THE CRITICAL MOMENT)...')
  // Give more time for the UI to update after terms generation
  await page.waitForTimeout(2000)
  
  const setPricingButton = page.locator('button:has-text("Set Pricing")')
  const isPricingVisible = await setPricingButton.isVisible()
  const isPricingEnabled = await setPricingButton.isEnabled()
  
  console.log(`📋 Set Pricing button - visible: ${isPricingVisible}, enabled: ${isPricingEnabled}`)
  
  if (isPricingVisible && isPricingEnabled) {
    console.log('👆 ABOUT TO CLICK SET PRICING...')
    console.log('🔍 Checking wallet state before click...')
    
    // Check current page state
    const currentlyNotConnected = await page.locator('text="Wallet Not Connected"').count()
    const currentlyConnected = await page.locator('text="Connected"').count()
    console.log(`📊 Before click - Not Connected: ${currentlyNotConnected}, Connected: ${currentlyConnected}`)
    
    console.log('👆 CLICKING SET PRICING NOW...')
    await setPricingButton.click()
    
    console.log('\n6️⃣ IMMEDIATE CHECK after Set Pricing click...')
    await page.waitForTimeout(100) // Minimal wait for DOM update
    
    const immediateNotConnected = await page.locator('text="Wallet Not Connected"').count()
    const immediateLoading = await page.locator('text="Loading"').count()
    const immediateConnected = await page.locator('text="Connected Wallet:"').count()
    const immediateConnect = await page.locator('text="Please connect your wallet"').count()
    
    console.log(`❌ "Wallet Not Connected": ${immediateNotConnected}`)
    console.log(`❌ "Please connect your wallet": ${immediateConnect}`)
    console.log(`⏳ "Loading": ${immediateLoading}`)
    console.log(`✅ "Connected Wallet:": ${immediateConnected}`)
    
    if (immediateNotConnected > 0 || immediateConnect > 0) {
      console.log('🎯 ISSUE REPRODUCED! Found wallet not connected message immediately after Set Pricing')
      
      console.log('\n⏳ Monitoring state progression...')
      for (let i = 1; i <= 6; i++) {
        await page.waitForTimeout(1000)
        const notConnected = await page.locator('text="Wallet Not Connected"').count()
        const pleaseConnect = await page.locator('text="Please connect your wallet"').count()
        const loading = await page.locator('text="Loading"').count()
        const connected = await page.locator('text="Connected Wallet:"').count()
        
        console.log(`⏱️  ${i}s: Not Connected: ${notConnected}, Please Connect: ${pleaseConnect}, Loading: ${loading}, Connected: ${connected}`)
        
        if (notConnected === 0 && pleaseConnect === 0 && connected > 0) {
          console.log(`✅ Wallet state resolved after ${i} seconds`)
          break
        }
      }
    } else {
      console.log('✅ No wallet connection issues detected - working correctly!')
    }
    
    // Take screenshot
    await page.screenshot({ path: 'corrected-demo-debug.png', fullPage: true })
    console.log('📸 Screenshot saved: corrected-demo-debug.png')
    
  } else {
    console.log('❌ Set Pricing button not available')
    
    // Debug current state
    const allButtons = page.locator('button')
    const buttonCount = await allButtons.count()
    console.log(`🔍 Found ${buttonCount} buttons on page:`)
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      try {
        const button = allButtons.nth(i)
        const text = await button.textContent()
        const isVisible = await button.isVisible()
        const isEnabled = await button.isEnabled()
        console.log(`   ${i + 1}. "${text}" (visible: ${isVisible}, enabled: ${isEnabled})`)
      } catch (e) {
        console.log(`   ${i + 1}. (could not get details)`)
      }
    }
  }
  
  console.log('\n🎯 === END CORRECTED DEMO SCENARIO 1 DEBUG ===')
})
