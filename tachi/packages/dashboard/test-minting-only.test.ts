import { test, expect } from '@playwright/test'

test('Test NFT Minting Only', async ({ page }) => {
  console.log('🎯 === NFT MINTING TEST ===\n')
  
  console.log('1️⃣ Navigate to dashboard...')
  await page.goto('http://localhost:3003?test=true')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  
  console.log('2️⃣ Connect wallet...')
  await page.click('button:has-text("Connect Wallet")')
  console.log('✅ Wallet connect clicked')
  
  // Wait for wallet connection
  await page.waitForTimeout(3000)
  console.log('⏳ Waited 3s for wallet connection')
  
  console.log('3️⃣ Fill site details form...')
  await page.fill('input[placeholder="Enter your website URL"]', 'https://demo-site.com')
  await page.fill('input[placeholder="Enter your company name"]', 'Demo Company')
  await page.selectOption('select', 'technology')
  await page.click('button:has-text("Continue")')
  console.log('✅ Form filled and validated')
  
  console.log('4️⃣ Generate Terms...')
  await page.click('button:has-text("Generate Terms")')
  console.log('✅ Generate Terms clicked')
  
  // Wait for terms generation
  await page.waitForSelector('button:has-text("Accept Terms")', { timeout: 15000 })
  console.log('⏳ Waited for terms generation')
  
  console.log('5️⃣ Navigate to Terms tab...')
  await page.click('button:has-text("Terms")')
  console.log('✅ Terms tab clicked')
  
  console.log('6️⃣ Accept terms...')
  await page.click('button:has-text("Accept Terms")')
  console.log('✅ Terms accepted')
  
  console.log('7️⃣ Upload to IPFS...')
  await page.click('button:has-text("Upload to IPFS")')
  console.log('✅ IPFS upload clicked')
  
  // Wait for IPFS upload to complete
  await page.waitForSelector('button:has-text("Set Pricing")', { timeout: 10000 })
  console.log('✅ IPFS upload completed')
  
  console.log('⏳ Waited for auto-navigation to pricing')
  
  console.log('8️⃣ Set pricing...')
  await page.fill('input[type="number"]', '0.01')
  console.log('✅ Price set to $0.01')
  
  console.log('\n🚨 CRITICAL MOMENT: About to click Set Pricing...')
  console.log('    This should transition to license creation step')
  console.log('👆 CLICKING SET PRICING NOW...')
  
  await page.click('button:has-text("Set Pricing")')
  
  // Wait for the license creation step to load
  await page.waitForSelector('button:has-text("Create License (Mint NFT)")', { timeout: 10000 })
  console.log('✅ License creation step loaded')
  
  console.log('\n🎯 FINAL STEP: Testing NFT Minting...')
  console.log('👆 CLICKING CREATE LICENSE (MINT NFT) NOW...')
  
  // Listen for console logs to capture any errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('📱 [error]', msg.text())
    } else if (msg.type() === 'log') {
      console.log('📱 [log]', msg.text())
    }
  })
  
  // Click the mint button
  await page.click('button:has-text("Create License (Mint NFT)")')
  console.log('✅ Mint button clicked')
  
  // Wait a bit to see what happens
  await page.waitForTimeout(5000)
  console.log('⏳ Waited 5s for minting process')
  
  // Check if there are any error messages or success indicators
  const pageContent = await page.textContent('body')
  
  if (pageContent && (pageContent.includes('Transaction failed') || pageContent.includes('Error'))) {
    console.log('❌ Minting appears to have failed')
  } else if (pageContent && (pageContent.includes('Success') || pageContent.includes('License created'))) {
    console.log('✅ Minting appears to have succeeded')
  } else {
    console.log('⚠️ Minting result unclear')
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'minting-test-result.png', fullPage: true })
  console.log('📸 Screenshot saved')
  
  console.log('\n🎯 === END NFT MINTING TEST ===')
})
