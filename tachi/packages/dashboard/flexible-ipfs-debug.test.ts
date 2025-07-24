import { test, expect } from '@playwright/test'

test('Flexible IPFS Upload Flow', async ({ page }) => {
  console.log('🎯 === FLEXIBLE IPFS UPLOAD FLOW ===\n')
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('📄') || text.includes('🔗') || text.includes('IPFS') || text.includes('onComplete')) {
      console.log(`📱 ${text}`)
    }
  })
  
  await page.goto('http://localhost:3003?test=true')
  await page.waitForLoadState('networkidle')
  
  console.log('1️⃣ Connect wallet and fill form...')
  await page.click('[data-testid="test-wallet-connect"]')
  await page.waitForTimeout(2000)
  
  await page.waitForSelector('#domain')
  await page.fill('#domain', 'demo.com')
  await page.fill('#websiteName', 'Demo Site')
  await page.fill('#description', 'Demo description')
  await page.fill('#contactEmail', 'demo@demo.com')
  await page.fill('#companyName', 'Demo Company')
  await page.locator('#domain').blur()
  await page.waitForTimeout(1000)
  
  console.log('2️⃣ Generate terms...')
  await page.click('button:has-text("Generate Terms")')
  await page.waitForTimeout(3000)
  
  console.log('3️⃣ Navigate to terms tab...')
  await page.click('button:has-text("Terms of Service")')
  await page.waitForTimeout(500)
  
  console.log('4️⃣ Accept terms...')
  const checkbox = page.locator('[role="checkbox"]')
  await checkbox.click()
  
  console.log('5️⃣ Upload to IPFS...')
  const uploadButton = page.locator('button:has-text("Upload to IPFS")')
  await uploadButton.click()
  
  console.log('⏳ Waiting for IPFS upload result...')
  
  // Try multiple success indicators
  const successIndicators = [
    'text="Terms uploaded to IPFS"',
    'text="Terms uploaded"',
    'text="uploaded to IPFS"',
    'text="IPFS Hash:"',
    '.bg-green-50',
    'text="Site details and terms configured successfully"'
  ]
  
  let uploadSuccess = false
  for (const indicator of successIndicators) {
    try {
      await page.waitForSelector(indicator, { timeout: 5000 })
      console.log(`✅ Found success indicator: ${indicator}`)
      uploadSuccess = true
      break
    } catch (e) {
      console.log(`⏳ Indicator ${indicator} not found, trying next...`)
    }
  }
  
  if (!uploadSuccess) {
    console.log('⚠️ No clear success indicator found, checking page state...')
    
    // Check for error messages
    const errorText = await page.locator('.text-red-600').count()
    console.log(`❌ Error messages found: ${errorText}`)
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'ipfs-upload-state-debug.png', fullPage: true })
    
    // Check page text content for any IPFS-related content
    const pageText = await page.textContent('body')
    const ipfsHashes = pageText?.match(/Qm[a-zA-Z0-9]{44}/g) || []
    console.log(`🔗 IPFS hashes found in page: ${ipfsHashes.length}`)
    ipfsHashes.forEach(hash => console.log(`   ${hash}`))
    
    if (ipfsHashes.length > 0) {
      console.log('✅ IPFS hash detected, assuming upload succeeded')
      uploadSuccess = true
    }
  }
  
  if (uploadSuccess) {
    console.log('6️⃣ Checking for automatic navigation to next step...')
    await page.waitForTimeout(3000)
    
    // Look for pricing form
    const pricingVisible = await page.locator('text="Set Pricing"').isVisible()
    console.log(`📋 Pricing form visible: ${pricingVisible}`)
    
    if (pricingVisible) {
      console.log('✅ Successfully reached Pricing step!')
      
      // Fill price and submit
      await page.fill('#price', '0.01')
      console.log('👆 CLICKING SET PRICING TO TRIGGER WALLET STATE ISSUE...')
      await page.click('button:has-text("Set Pricing")')
      
      console.log('7️⃣ CHECKING LICENSE CREATION STEP FOR WALLET ISSUES...')
      await page.waitForTimeout(100)
      
      const walletNotConnected = await page.locator('text="Wallet Not Connected"').count()
      const pleaseConnect = await page.locator('text="Please connect your wallet"').count()
      const loading = await page.locator('text="Loading"').count()
      
      console.log(`❌ "Wallet Not Connected": ${walletNotConnected}`)
      console.log(`❌ "Please connect your wallet": ${pleaseConnect}`)
      console.log(`⏳ "Loading": ${loading}`)
      
      if (walletNotConnected > 0 || pleaseConnect > 0) {
        console.log('🎯 ISSUE REPRODUCED! Found wallet connection error in License Creation step')
        
        // Monitor resolution
        for (let i = 1; i <= 5; i++) {
          await page.waitForTimeout(1000)
          const notConnected = await page.locator('text="Wallet Not Connected"').count()
          const connect = await page.locator('text="Please connect your wallet"').count()
          console.log(`⏱️  ${i}s: Not Connected: ${notConnected}, Please Connect: ${connect}`)
          
          if (notConnected === 0 && connect === 0) {
            console.log(`✅ Issue resolved after ${i} seconds`)
            break
          }
        }
      } else {
        console.log('✅ No wallet connection issues detected!')
      }
      
      await page.screenshot({ path: 'license-creation-wallet-state.png', fullPage: true })
      console.log('📸 Screenshot saved')
    } else {
      console.log('❌ Did not reach Pricing step, checking current step...')
      
      // Debug current step
      const stepTitles = await page.locator('h1, h2, h3, [class*="title"]').allTextContents()
      console.log('🔍 Page titles found:')
      stepTitles.forEach(title => console.log(`   "${title}"`))
    }
  } else {
    console.log('❌ IPFS upload did not succeed')
  }
  
  console.log('\n🎯 === END FLEXIBLE IPFS UPLOAD FLOW ===')
})
