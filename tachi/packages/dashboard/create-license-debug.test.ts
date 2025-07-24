import { test } from '@playwright/test'

test('Debug - Create License Step Wallet Issue', async ({ page }) => {
  console.log('🔍 Testing create license step wallet connection...')
  
  // Listen for console logs from the app
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log(`📱 App log: ${msg.text()}`)
    } else if (msg.type() === 'error') {
      console.log(`❌ Console error: ${msg.text()}`)
    }
  })
  
  await page.goto('http://localhost:3003?test=true')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)
  
  console.log('🔍 Step 1: Connect wallet initially...')
  const testConnectButton = page.locator('[data-testid="test-wallet-connect"]')
  
  if (await testConnectButton.count() > 0) {
    console.log('✅ Test wallet connect button found')
    await testConnectButton.click()
    await page.waitForTimeout(2000)
  }
  
  console.log('📋 Step 2: Fill site details form...')
  
  // Fill form with demo values
  const formData = {
    domain: 'example.com',
    websiteName: 'Demo Site',
    description: 'This is a demonstration website for testing the Tachi pay-per-crawl protocol and smart contract integration with enough characters.',
    contactEmail: 'demo@example.com',
    companyName: 'Demo Company'
  }
  
  // Navigate to Website Details tab if needed
  const detailsTab = page.locator('button:has-text("Website Details")')
  if (await detailsTab.count() > 0) {
    await detailsTab.click()
    await page.waitForTimeout(1000)
  }
  
  // Fill fields
  await page.locator('#domain').fill(formData.domain)
  await page.locator('#websiteName').fill(formData.websiteName)
  await page.locator('#description').fill(formData.description)
  await page.locator('#contactEmail').fill(formData.contactEmail)
  await page.locator('#companyName').fill(formData.companyName)
  
  await page.waitForTimeout(2000)
  console.log('✅ Form filled')
  
  console.log('📜 Step 3: Generate Terms...')
  const generateButton = page.locator('button:has-text("Generate Terms")')
  
  if (await generateButton.count() > 0) {
    const isDisabled = await generateButton.getAttribute('disabled')
    console.log(`🔘 Generate Terms button disabled: ${isDisabled !== null}`)
    
    if (isDisabled !== null) {
      console.log('🚀 Button disabled, attempting force click...')
      await generateButton.click({ force: true })
    } else {
      await generateButton.click()
    }
    
    await page.waitForTimeout(3000)
    console.log('✅ Generate Terms clicked')
  }
  
  console.log('📋 Step 4: Navigate to Create License...')
  
  // Look for various ways to get to create license step
  const termsTab = page.locator('button:has-text("Terms of Service")')
  if (await termsTab.count() > 0) {
    console.log('🔍 Clicking Terms of Service tab...')
    await termsTab.click()
    await page.waitForTimeout(1000)
  }
  
  // Check if we need to accept terms
  const termsCheckbox = page.locator('[role="checkbox"]')
  const checkboxCount = await termsCheckbox.count()
  console.log(`☑️ Terms acceptance checkboxes: ${checkboxCount}`)
  
  if (checkboxCount > 0) {
    const checkboxState = await termsCheckbox.getAttribute('data-state')
    console.log(`📋 Checkbox state: ${checkboxState}`)
    
    if (checkboxState === 'unchecked') {
      console.log('🔍 Checking terms acceptance checkbox...')
      await termsCheckbox.click()
      await page.waitForTimeout(1000)
      
      const newState = await termsCheckbox.getAttribute('data-state')
      console.log(`📋 New checkbox state: ${newState}`)
    }
  }
  
  // Look for upload/complete buttons and check their state
  const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Complete"), button:has-text("Continue")')
  const uploadCount = await uploadButton.count()
  console.log(`🔗 Upload/Continue buttons found: ${uploadCount}`)
  
  if (uploadCount > 0) {
    for (let i = 0; i < uploadCount; i++) {
      const buttonText = await uploadButton.nth(i).textContent()
      const isDisabled = await uploadButton.nth(i).getAttribute('disabled')
      const isVisible = await uploadButton.nth(i).isVisible()
      console.log(`   Button ${i + 1}: "${buttonText}" (disabled: ${isDisabled !== null}, visible: ${isVisible})`)
    }
    
    const firstButton = uploadButton.first()
    const isDisabled = await firstButton.getAttribute('disabled')
    
    if (isDisabled !== null) {
      console.log('🚀 Upload button disabled, attempting force click...')
      await firstButton.click({ force: true })
    } else {
      console.log('🔍 Upload button enabled, clicking normally...')
      await firstButton.click()
    }
    
    await page.waitForTimeout(3000)
  }
  
  // Check if we can find create license step
  const createLicenseHeading = page.locator('text="Create License", h1:has-text("License"), h2:has-text("License")')
  const licenseStepCount = await createLicenseHeading.count()
  console.log(`🎫 Create License step elements: ${licenseStepCount}`)
  
  console.log('🔍 Step 5: Check wallet connection state...')
  
  // Look for "Wallet Not Connected" message
  const walletNotConnected = page.locator('text="Wallet Not Connected"')
  const notConnectedCount = await walletNotConnected.count()
  console.log(`❌ "Wallet Not Connected" messages: ${notConnectedCount}`)
  
  // Look for connect wallet message
  const connectWalletMessage = page.locator('text="Please connect your wallet"')
  const connectMessageCount = await connectWalletMessage.count()
  console.log(`💡 "Please connect your wallet" messages: ${connectMessageCount}`)
  
  // Look for any wallet connect buttons on this step
  const stepConnectButtons = page.locator('button:has-text("Connect"), [data-testid="rk-connect-button"], [data-testid="test-wallet-connect"]')
  const stepConnectCount = await stepConnectButtons.count()
  console.log(`🔗 Connect buttons on this step: ${stepConnectCount}`)
  
  if (stepConnectCount > 0) {
    for (let i = 0; i < stepConnectCount; i++) {
      const buttonText = await stepConnectButtons.nth(i).textContent()
      const isVisible = await stepConnectButtons.nth(i).isVisible()
      console.log(`   Button ${i + 1}: "${buttonText}" (visible: ${isVisible})`)
    }
  }
  
  // Look for debug wallet info
  const debugWallet = page.locator('text="Connected Wallet:"')
  const debugCount = await debugWallet.count()
  console.log(`🐛 Debug wallet info visible: ${debugCount}`)
  
  if (debugCount > 0) {
    const walletInfo = await debugWallet.textContent()
    console.log(`   Wallet info: ${walletInfo}`)
  }
  
  // Check current URL
  const currentUrl = page.url()
  console.log(`🌐 Current URL: ${currentUrl}`)
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'create-license-debug.png', fullPage: true })
  console.log('📸 Create license debug screenshot saved')
  
  console.log('🔍 Step 6: Check page content...')
  
  // Get page title and main headings
  const pageTitle = await page.title()
  console.log(`📄 Page title: ${pageTitle}`)
  
  const headings = page.locator('h1, h2, h3')
  const headingCount = await headings.count()
  console.log(`📋 Headings found: ${headingCount}`)
  
  for (let i = 0; i < Math.min(headingCount, 5); i++) {
    const headingText = await headings.nth(i).textContent()
    console.log(`   Heading ${i + 1}: "${headingText}"`)
  }
})
