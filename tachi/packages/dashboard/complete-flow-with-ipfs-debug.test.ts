import { test, expect } from '@playwright/test'

test('Complete Demo Flow with IPFS Upload', async ({ page }) => {
  console.log('🎯 === COMPLETE DEMO FLOW WITH IPFS UPLOAD ===\n')
  
  // Capture console logs to debug flow
  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('🔍') || text.includes('🔄') || text.includes('LicenseCreationStep') || 
        text.includes('wallet') || text.includes('IPFS') || text.includes('onComplete')) {
      console.log(`📱 ${text}`)
    }
  })
  
  const testUrl = 'http://localhost:3003?test=true'
  console.log(`🌐 Navigating to: ${testUrl}`)
  await page.goto(testUrl)
  await page.waitForLoadState('networkidle')
  
  console.log('\n1️⃣ Connect Test Wallet...')
  await page.click('[data-testid="test-wallet-connect"]')
  await page.waitForTimeout(3000)
  console.log('✅ Wallet connected')
  
  console.log('\n2️⃣ Fill Site Details Form...')
  await page.waitForSelector('#domain', { timeout: 10000 })
  
  const formFields = [
    { selector: '#domain', value: 'demo.com' },
    { selector: '#websiteName', value: 'Demo Site' },
    { selector: '#description', value: 'Demo description for testing' },
    { selector: '#contactEmail', value: 'demo@demo.com' },
    { selector: '#companyName', value: 'Demo Company' }
  ]
  
  for (const field of formFields) {
    await page.fill(field.selector, field.value)
    console.log(`✅ Filled ${field.selector}: ${field.value}`)
  }
  
  await page.locator('#domain').blur()
  await page.waitForTimeout(1000)
  console.log('✅ Form validation triggered')
  
  console.log('\n3️⃣ Generate Terms...')
  const generateButton = page.locator('button:has-text("Generate Terms")')
  await expect(generateButton).toBeVisible()
  await generateButton.click()
  console.log('✅ Generate Terms clicked')
  
  // Wait for terms generation and auto-navigation to terms tab
  await page.waitForTimeout(3000)
  console.log('⏳ Waited for terms generation')
  
  console.log('\n4️⃣ Navigate to Terms tab and accept terms...')
  // The generate button should have switched us to the terms tab automatically
  // Let's check if we're on the terms tab or manually switch
  const termsTab = page.locator('button:has-text("Terms of Service")')
  if (await termsTab.isVisible()) {
    await termsTab.click()
    await page.waitForTimeout(500)
    console.log('✅ Navigated to Terms tab')
  }
  
  // Accept terms checkbox
  const checkbox = page.locator('[role="checkbox"]')
  if (await checkbox.isVisible()) {
    await checkbox.click()
    console.log('✅ Terms accepted')
  } else {
    console.log('⚠️ Terms checkbox not found, checking for alternative selector')
    const checkboxAlt = page.locator('input[type="checkbox"]')
    if (await checkboxAlt.isVisible()) {
      await checkboxAlt.click()
      console.log('✅ Terms accepted (alternative selector)')
    }
  }
  
  console.log('\n5️⃣ Upload Terms to IPFS...')
  const uploadButton = page.locator('button:has-text("Upload to IPFS")')
  await expect(uploadButton).toBeVisible()
  
  console.log('👆 CLICKING UPLOAD TO IPFS...')
  await uploadButton.click()
  
  console.log('⏳ Waiting for IPFS upload to complete...')
  // Wait for IPFS upload success
  await page.waitForSelector('text="Terms uploaded to IPFS"', { timeout: 15000 })
  console.log('✅ IPFS upload completed!')
  
  // Wait for automatic navigation to pricing step
  await page.waitForTimeout(2000)
  console.log('⏳ Waiting for auto-navigation to pricing...')
  
  console.log('\n6️⃣ Check if we are on Pricing step...')
  const pricingForm = page.locator('text="Set Pricing"')
  const isPricingVisible = await pricingForm.isVisible()
  console.log(`📋 Pricing form visible: ${isPricingVisible}`)
  
  if (isPricingVisible) {
    console.log('✅ Successfully navigated to Pricing step!')
    
    // Set a price
    const priceInput = page.locator('#price')
    if (await priceInput.isVisible()) {
      await priceInput.fill('0.01')
      console.log('✅ Set price to $0.01')
      
      // Submit pricing
      const setPricingButton = page.locator('button:has-text("Set Pricing")')
      console.log('👆 CLICKING SET PRICING BUTTON...')
      await setPricingButton.click()
      
      console.log('\n7️⃣ IMMEDIATE CHECK after Set Pricing...')
      await page.waitForTimeout(100)
      
      // Now we should be on the License Creation step - check for wallet messages
      const walletNotConnected = await page.locator('text="Wallet Not Connected"').count()
      const pleaseConnect = await page.locator('text="Please connect your wallet"').count()
      const loading = await page.locator('text="Loading"').count()
      const connected = await page.locator('text="Connected Wallet:"').count()
      
      console.log(`❌ "Wallet Not Connected": ${walletNotConnected}`)
      console.log(`❌ "Please connect your wallet": ${pleaseConnect}`)
      console.log(`⏳ "Loading": ${loading}`)
      console.log(`✅ "Connected Wallet:": ${connected}`)
      
      if (walletNotConnected > 0 || pleaseConnect > 0) {
        console.log('🎯 ISSUE REPRODUCED! Found wallet not connected message in License Creation step')
        
        // Monitor state progression
        for (let i = 1; i <= 6; i++) {
          await page.waitForTimeout(1000)
          const notConnected = await page.locator('text="Wallet Not Connected"').count()
          const connect = await page.locator('text="Please connect your wallet"').count()
          const loading = await page.locator('text="Loading"').count()
          const connected = await page.locator('text="Connected Wallet:"').count()
          
          console.log(`⏱️  ${i}s: Not Connected: ${notConnected}, Please Connect: ${connect}, Loading: ${loading}, Connected: ${connected}`)
          
          if (notConnected === 0 && connect === 0 && connected > 0) {
            console.log(`✅ Wallet state resolved after ${i} seconds`)
            break
          }
        }
      } else {
        console.log('✅ No wallet connection issues detected!')
      }
      
      await page.screenshot({ path: 'complete-flow-with-ipfs-debug.png', fullPage: true })
      console.log('📸 Screenshot saved')
    }
  } else {
    console.log('❌ Could not reach Pricing step')
    
    // Debug current state
    const allText = await page.textContent('body')
    console.log('🔍 Current page content (first 500 chars):')
    console.log(allText?.substring(0, 500))
  }
  
  console.log('\n🎯 === END COMPLETE DEMO FLOW ===')
})
