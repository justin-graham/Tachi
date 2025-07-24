import { test, expect } from '@playwright/test'

test('Demo Scenario 1 - Exact Manual Workflow Replication', async ({ page }) => {
  console.log('🎯 === DEMO SCENARIO 1 - EXACT MANUAL WORKFLOW ===\n')
  
  // Capture ALL console messages to see exactly what's happening
  page.on('console', msg => {
    const text = msg.text()
    console.log(`📱 [${msg.type()}] ${text}`)
  })
  
  // Also capture any page errors
  page.on('pageerror', error => {
    console.log(`❌ Page error: ${error.message}`)
  })
  
  console.log('1️⃣ Navigate to dashboard...')
  await page.goto('http://localhost:3003?test=true')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  
  console.log('2️⃣ Connect wallet...')
  await page.click('[data-testid="test-wallet-connect"]')
  console.log('✅ Wallet connect clicked')
  
  // Give wallet time to connect completely
  await page.waitForTimeout(3000)
  console.log('⏳ Waited 3s for wallet connection')
  
  console.log('3️⃣ Fill site details form...')
  await page.waitForSelector('#domain', { timeout: 10000 })
  
  await page.fill('#domain', 'demo.com')
  await page.fill('#websiteName', 'Demo Site')
  await page.fill('#description', 'Demo description')
  await page.fill('#contactEmail', 'demo@demo.com')
  await page.fill('#companyName', 'Demo Company')
  
  // Trigger validation
  await page.locator('#domain').blur()
  await page.waitForTimeout(1000)
  console.log('✅ Form filled and validated')
  
  console.log('4️⃣ Generate Terms...')
  const generateButton = page.locator('button:has-text("Generate Terms")')
  await generateButton.click()
  console.log('✅ Generate Terms clicked')
  
  // Wait for terms generation
  await page.waitForTimeout(3000)
  console.log('⏳ Waited for terms generation')
  
  console.log('5️⃣ Navigate to Terms tab...')
  const termsTab = page.locator('button:has-text("Terms of Service")')
  await termsTab.click()
  await page.waitForTimeout(500)
  console.log('✅ Terms tab clicked')
  
  console.log('6️⃣ Accept terms...')
  const checkbox = page.locator('[role="checkbox"]')
  await checkbox.click()
  await page.waitForTimeout(500)
  console.log('✅ Terms accepted')
  
  console.log('7️⃣ Upload to IPFS...')
  const uploadButton = page.locator('button:has-text("Upload to IPFS")')
  await uploadButton.click()
  console.log('✅ IPFS upload clicked')
  
  // Wait for IPFS upload completion
  await page.waitForSelector('.bg-green-50', { timeout: 15000 })
  console.log('✅ IPFS upload completed')
  
  // Wait for automatic navigation to pricing
  await page.waitForTimeout(3000)
  console.log('⏳ Waited for auto-navigation to pricing')
  
  console.log('8️⃣ Set pricing...')
  const priceInput = page.locator('#price')
  await priceInput.fill('0.01')
  console.log('✅ Price set to $0.01')
  
  console.log('\n🚨 CRITICAL MOMENT: About to click Set Pricing...')
  console.log('    This is when the wallet state issue should occur')
  
  const setPricingButton = page.locator('button:has-text("Set Pricing")')
  console.log('👆 CLICKING SET PRICING NOW...')
  await setPricingButton.click()
  
  console.log('\n9️⃣ IMMEDIATE INSPECTION (0ms delay)...')
  
  // Check ALL possible wallet-related messages immediately
  const checks = [
    { selector: 'text="Wallet Not Connected"', name: 'Wallet Not Connected' },
    { selector: 'text="Please connect your wallet"', name: 'Please connect your wallet' },
    { selector: 'text="Connect your wallet"', name: 'Connect your wallet' },
    { selector: 'text="No wallet connected"', name: 'No wallet connected' },
    { selector: 'text="Loading"', name: 'Loading' },
    { selector: 'text="Loading License Creation"', name: 'Loading License Creation' },
    { selector: 'text="Connecting Wallet"', name: 'Connecting Wallet' },
    { selector: 'text="Connected Wallet:"', name: 'Connected Wallet:' },
    { selector: '.text-red-600', name: 'Red error text' },
    { selector: '.text-green-600', name: 'Green success text' }
  ]
  
  console.log('📊 IMMEDIATE STATE CHECK:')
  for (const check of checks) {
    const count = await page.locator(check.selector).count()
    if (count > 0) {
      console.log(`   ❗ ${check.name}: ${count}`)
      
      // If we find error messages, this is the problem
      if (check.name.includes('Not Connected') || check.name.includes('connect your wallet')) {
        console.log(`   🎯 FOUND THE ISSUE! "${check.name}" appears immediately after Set Pricing`)
      }
    }
  }
  
  console.log('\n🔄 MONITORING STATE PROGRESSION...')
  for (let second = 1; second <= 10; second++) {
    await page.waitForTimeout(1000)
    
    const notConnected = await page.locator('text="Wallet Not Connected"').count()
    const pleaseConnect = await page.locator('text="Please connect your wallet"').count()
    const loading = await page.locator('text="Loading"').count()
    const connected = await page.locator('text="Connected Wallet:"').count()
    
    console.log(`⏱️  ${second}s: NotConnected=${notConnected}, PleaseConnect=${pleaseConnect}, Loading=${loading}, Connected=${connected}`)
    
    // If error messages persist beyond 5 seconds, that's definitely the issue
    if (second >= 5 && (notConnected > 0 || pleaseConnect > 0)) {
      console.log(`   🚨 ERROR PERSISTS: Wallet error messages still showing after ${second} seconds!`)
    }
    
    if (notConnected === 0 && pleaseConnect === 0 && connected > 0) {
      console.log(`   ✅ Wallet state resolved after ${second} seconds`)
      break
    }
  }
  
  // Take screenshot for visual debugging
  await page.screenshot({ path: 'demo-scenario-1-exact-manual.png', fullPage: true })
  console.log('📸 Screenshot saved')
  
  console.log('\n🎯 === END EXACT MANUAL WORKFLOW TEST ===')
})
