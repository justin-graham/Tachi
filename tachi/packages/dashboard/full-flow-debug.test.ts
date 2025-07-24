import { test } from '@playwright/test'

test('Debug - Full onboarding flow analysis', async ({ page }) => {
  console.log('🔍 Testing full onboarding flow...')
  
  // Listen for console logs
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log(`📱 App log: ${msg.text()}`)
    } else if (msg.type() === 'error') {
      console.log(`❌ Console error: ${msg.text()}`)
    }
  })
  
  await page.goto('http://localhost:3003?test=true')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  
  console.log('🚀 Starting full flow analysis...')
  
  // Step 1: Connect Wallet
  console.log('👛 Step 1: Connecting Wallet...')
  const testConnectButton = page.locator('[data-testid="test-wallet-connect"]')
  await testConnectButton.click()
  await page.waitForTimeout(2000)
  console.log('✅ Wallet connected')
  
  // Debug: Screenshot after wallet connection
  await page.screenshot({ path: 'debug-1-wallet-connected.png', fullPage: true })
  
  // Step 2: Fill Site Details
  console.log('📝 Step 2: Filling Site Details...')
  
  // Fill domain
  const domainField = page.locator('#domain, input[placeholder="example.com"]').first()
  if (await domainField.isVisible()) {
    await domainField.fill('test-publisher.example.com')
    console.log('✅ Filled domain')
  }
  
  // Fill website name
  const websiteNameField = page.locator('#websiteName, input[placeholder*="Website"]').first()
  if (await websiteNameField.isVisible()) {
    await websiteNameField.fill('AI Content Test Site')
    console.log('✅ Filled website name')
  }
  
  // Fill other fields
  const descriptionField = page.locator('#description, textarea').first()
  if (await descriptionField.isVisible()) {
    await descriptionField.fill('Test site for AI content crawling')
    console.log('✅ Filled description')
  }
  
  const emailField = page.locator('#email, input[type="email"]').first()
  if (await emailField.isVisible()) {
    await emailField.fill('test@example.com')
    console.log('✅ Filled email')
  }
  
  // Debug: Screenshot after filling details
  await page.screenshot({ path: 'debug-2-details-filled.png', fullPage: true })
  await page.waitForTimeout(1000)
  
  // Step 3: Navigate to Terms Tab
  console.log('📜 Step 3: Navigating to Terms...')
  const termsTab = page.locator('button:has-text("Terms of Service")')
  if (await termsTab.isVisible()) {
    await termsTab.click()
    console.log('✅ Clicked Terms of Service tab')
    await page.waitForTimeout(2000)
    
    // Debug: Screenshot after clicking terms tab
    await page.screenshot({ path: 'debug-3-terms-tab.png', fullPage: true })
  }
  
  // Step 4: Look for Generate Terms Button
  console.log('🔧 Step 4: Looking for Generate Terms button...')
  
  // List all buttons on page
  const allButtons = await page.locator('button').all()
  console.log(`🔘 Found ${allButtons.length} buttons on page:`)
  for (let i = 0; i < allButtons.length; i++) {
    const buttonText = await allButtons[i].textContent()
    const isVisible = await allButtons[i].isVisible()
    console.log(`  Button ${i + 1}: "${buttonText}" (visible: ${isVisible})`)
  }
  
  // Look specifically for generate buttons
  const generateButtons = [
    'button:has-text("Generate Terms")',
    'button:has-text("Generate Default Terms")',
    'button:has-text("Create Terms")',
    'button:has-text("Generate")',
    '[data-testid="generate-terms"]'
  ]
  
  let generateButtonFound = false
  for (const selector of generateButtons) {
    const button = page.locator(selector)
    const count = await button.count()
    if (count > 0) {
      console.log(`🎯 Found generate button: ${selector} (${count} elements)`)
      const isVisible = await button.first().isVisible()
      console.log(`   Visible: ${isVisible}`)
      
      if (isVisible) {
        await button.first().click()
        console.log(`✅ Clicked generate button: ${selector}`)
        generateButtonFound = true
        await page.waitForTimeout(5000) // Wait for IPFS upload
        break
      }
    }
  }
  
  if (!generateButtonFound) {
    console.log('❌ No generate terms button found')
  }
  
  // Debug: Screenshot after generate attempt
  await page.screenshot({ path: 'debug-4-after-generate.png', fullPage: true })
  
  // Step 5: Check current state
  console.log('🔍 Step 5: Checking current state...')
  
  // Look for success messages
  const successMessages = [
    'text*="success"',
    'text*="complete"',
    'text*="uploaded"',
    'text*="IPFS"',
    '.bg-green-50',
    '.text-green-'
  ]
  
  for (const selector of successMessages) {
    const element = page.locator(selector)
    const count = await element.count()
    if (count > 0) {
      const texts = await element.allTextContents()
      console.log(`✅ Success indicator "${selector}": ${texts.join(', ')}`)
    }
  }
  
  // Check current active step
  const tabs = await page.locator('[role="tab"], button[data-value]').all()
  for (let i = 0; i < tabs.length; i++) {
    const tabText = await tabs[i].textContent()
    const dataValue = await tabs[i].getAttribute('data-value')
    const isActive = await tabs[i].getAttribute('data-state') === 'active'
    console.log(`📋 Tab ${i + 1}: "${tabText}" (data-value: ${dataValue}, active: ${isActive})`)
  }
  
  // Look for pricing/license elements
  const pricingElements = page.locator('input[type="number"], input[placeholder*="price"], text*="pricing"')
  const pricingCount = await pricingElements.count()
  console.log(`💰 Pricing elements found: ${pricingCount}`)
  
  const licenseElements = page.locator('text*="license", text*="mint", text*="NFT"')
  const licenseCount = await licenseElements.count()
  console.log(`🎨 License elements found: ${licenseCount}`)
  
  // Final screenshot
  await page.screenshot({ path: 'debug-5-final-state.png', fullPage: true })
  
  console.log('🏁 Flow analysis complete!')
})
