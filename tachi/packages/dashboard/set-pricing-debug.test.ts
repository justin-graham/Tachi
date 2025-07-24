import { test } from '@playwright/test'

test('Debug - Set Pricing Wallet State', async ({ page }) => {
  console.log('🔍 Debugging Set Pricing wallet state...')
  
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log(`📱 App log: ${msg.text()}`)
    } else if (msg.type() === 'error') {
      console.log(`❌ Console error: ${msg.text()}`)
    }
  })
  
  await page.goto('http://localhost:3003?test=true')
  await page.waitForTimeout(3000)
  
  console.log('🔍 Step 1: Connect wallet...')
  const testConnectButton = page.locator('[data-testid="test-wallet-connect"]')
  if (await testConnectButton.count() > 0) {
    await testConnectButton.click()
    await page.waitForTimeout(2000)
  }
  
  console.log('📋 Step 2: Fill form and generate terms...')
  const formData = {
    domain: 'example.com',
    websiteName: 'Demo Site',
    description: 'This is a demonstration website for testing the Tachi pay-per-crawl protocol and smart contract integration with enough characters.',
    contactEmail: 'demo@example.com',
    companyName: 'Demo Company'
  }
  
  await page.locator('#domain').fill(formData.domain)
  await page.locator('#websiteName').fill(formData.websiteName)
  await page.locator('#description').fill(formData.description)
  await page.locator('#contactEmail').fill(formData.contactEmail)
  await page.locator('#companyName').fill(formData.companyName)
  await page.waitForTimeout(1000)
  
  // Generate terms
  const generateButton = page.locator('button:has-text("Generate Terms")')
  await generateButton.click()
  await page.waitForTimeout(3000)
  
  // Switch to Terms tab
  const termsTab = page.locator('button:has-text("Terms of Service")')
  if (await termsTab.count() > 0) {
    await termsTab.click()
    await page.waitForTimeout(1000)
  }
  
  console.log('☑️ Step 3: Accept terms...')
  const termsCheckbox = page.locator('[role="checkbox"]')
  if (await termsCheckbox.count() > 0) {
    const checkboxState = await termsCheckbox.getAttribute('data-state')
    if (checkboxState === 'unchecked') {
      await termsCheckbox.click()
      await page.waitForTimeout(1000)
    }
  }
  
  console.log('📤 Step 4: Upload to IPFS...')
  const uploadButton = page.locator('button:has-text("Upload to IPFS")')
  if (await uploadButton.count() > 0) {
    await uploadButton.click()
    await page.waitForTimeout(5000) // Wait for upload and navigation
  }
  
  console.log('💰 Step 5: Now at Set Pricing - checking wallet state...')
  
  // Check current page heading
  const headings = page.locator('h1, h2, h3')
  const headingCount = await headings.count()
  console.log(`📋 Headings found: ${headingCount}`)
  
  for (let i = 0; i < Math.min(headingCount, 5); i++) {
    const headingText = await headings.nth(i).textContent()
    console.log(`   Heading ${i + 1}: "${headingText}"`)
  }
  
  // Look for "Wallet Not Connected" message
  const walletNotConnected = page.locator('text="Wallet Not Connected"')
  const notConnectedCount = await walletNotConnected.count()
  console.log(`❌ "Wallet Not Connected" messages: ${notConnectedCount}`)
  
  // Look for "Please connect your wallet" message
  const connectMessage = page.locator('text="Please connect your wallet"')
  const connectMessageCount = await connectMessage.count()
  console.log(`💡 "Please connect your wallet" messages: ${connectMessageCount}`)
  
  // Look for debug wallet info
  const debugWallet = page.locator('text="Connected Wallet:"')
  const debugCount = await debugWallet.count()
  console.log(`🐛 Debug wallet info visible: ${debugCount}`)
  
  if (debugCount > 0) {
    const walletInfo = await debugWallet.textContent()
    console.log(`   Debug wallet info: ${walletInfo}`)
  }
  
  // Look for any wallet connect buttons on this step
  const connectButtons = page.locator('button:has-text("Connect"), [data-testid="rk-connect-button"], [data-testid="test-wallet-connect"]')
  const connectButtonCount = await connectButtons.count()
  console.log(`🔗 Connect buttons on Set Pricing step: ${connectButtonCount}`)
  
  if (connectButtonCount > 0) {
    for (let i = 0; i < connectButtonCount; i++) {
      const buttonText = await connectButtons.nth(i).textContent()
      const isVisible = await connectButtons.nth(i).isVisible()
      const isDisabled = await connectButtons.nth(i).getAttribute('disabled')
      console.log(`   Button ${i + 1}: "${buttonText}" (visible: ${isVisible}, disabled: ${isDisabled !== null})`)
    }
  }
  
  // Check RainbowKit connection state
  const rainbowKitAccount = page.locator('[data-testid="rk-account-button"]')
  const rkAccountCount = await rainbowKitAccount.count()
  console.log(`🌈 RainbowKit account button: ${rkAccountCount}`)
  
  if (rkAccountCount > 0) {
    const accountText = await rainbowKitAccount.textContent()
    console.log(`   Account button text: "${accountText}"`)
  }
  
  // Look for any error messages or warnings
  const errorMessages = page.locator('.text-red-600, .text-red-500, [class*="error"]')
  const errorCount = await errorMessages.count()
  console.log(`❌ Error messages: ${errorCount}`)
  
  if (errorCount > 0) {
    for (let i = 0; i < Math.min(errorCount, 3); i++) {
      const errorText = await errorMessages.nth(i).textContent()
      console.log(`   Error ${i + 1}: ${errorText}`)
    }
  }
  
  // Check for any pricing form fields
  const pricingFields = page.locator('input[type="number"], input[placeholder*="price"], input[placeholder*="$"]')
  const pricingFieldCount = await pricingFields.count()
  console.log(`💰 Pricing input fields: ${pricingFieldCount}`)
  
  // Check URL to confirm we're on the right page
  const currentUrl = page.url()
  console.log(`🌐 Current URL: ${currentUrl}`)
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'set-pricing-wallet-debug.png', fullPage: true })
  console.log('📸 Set pricing wallet debug screenshot saved')
  
  console.log('🔍 Step 6: Try to interact with wallet connection...')
  
  // If there's a connect button, try clicking it
  if (connectButtonCount > 0) {
    const firstConnectButton = connectButtons.first()
    const isVisible = await firstConnectButton.isVisible()
    
    if (isVisible) {
      console.log('🔄 Trying to click connect button...')
      await firstConnectButton.click()
      await page.waitForTimeout(3000)
      
      // Check if wallet state changed
      const newNotConnectedCount = await walletNotConnected.count()
      console.log(`❌ "Wallet Not Connected" after click: ${newNotConnectedCount}`)
      
      const newDebugCount = await debugWallet.count()
      console.log(`🐛 Debug wallet info after click: ${newDebugCount}`)
    }
  }
})
