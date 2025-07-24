import { test } from '@playwright/test'

test('Debug - Form validation and Generate Terms button', async ({ page }) => {
  console.log('🔍 Testing form validation and Generate Terms button state...')
  
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
  
  console.log('🔍 Connecting wallet...')
  const testConnectButton = page.locator('[data-testid="test-wallet-connect"]')
  
  if (await testConnectButton.count() > 0) {
    console.log('✅ Test wallet connect button found')
    await testConnectButton.click()
    await page.waitForTimeout(2000)
  }
  
  console.log('🔍 Looking for form fields...')
  
  // Demo values that should work
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
    console.log('🔍 Clicking Website Details tab...')
    await detailsTab.click()
    await page.waitForTimeout(1000)
  }
  
  // Fill each field and check validation
  console.log('📝 Filling form fields...')
  
  // Domain field
  const domainField = page.locator('#domain, input[name="domain"]').first()
  if (await domainField.count() > 0) {
    await domainField.clear()
    await domainField.fill(formData.domain)
    await domainField.blur()
    console.log(`✅ Domain filled: ${formData.domain}`)
    await page.waitForTimeout(500)
  } else {
    console.log('❌ Domain field not found')
  }
  
  // Website Name field
  const nameField = page.locator('#websiteName, input[name="websiteName"]').first()
  if (await nameField.count() > 0) {
    await nameField.clear()
    await nameField.fill(formData.websiteName)
    await nameField.blur()
    console.log(`✅ Website name filled: ${formData.websiteName}`)
    await page.waitForTimeout(500)
  } else {
    console.log('❌ Website name field not found')
  }
  
  // Description field
  const descField = page.locator('#description, textarea[name="description"]').first()
  if (await descField.count() > 0) {
    await descField.clear()
    await descField.fill(formData.description)
    await descField.blur()
    console.log(`✅ Description filled: ${formData.description.substring(0, 50)}...`)
    await page.waitForTimeout(500)
  } else {
    console.log('❌ Description field not found')
  }
  
  // Contact Email field
  const emailField = page.locator('#contactEmail, input[name="contactEmail"]').first()
  if (await emailField.count() > 0) {
    await emailField.clear()
    await emailField.fill(formData.contactEmail)
    await emailField.blur()
    console.log(`✅ Contact email filled: ${formData.contactEmail}`)
    await page.waitForTimeout(500)
  } else {
    console.log('❌ Contact email field not found')
  }
  
  // Company Name field
  const companyField = page.locator('#companyName, input[name="companyName"]').first()
  if (await companyField.count() > 0) {
    await companyField.clear()
    await companyField.fill(formData.companyName)
    await companyField.blur()
    console.log(`✅ Company name filled: ${formData.companyName}`)
    await page.waitForTimeout(500)
  } else {
    console.log('❌ Company name field not found')
  }
  
  // Wait for validation to process
  console.log('⏳ Waiting for form validation...')
  await page.waitForTimeout(2000)
  
  // Check for validation errors
  console.log('🔍 Checking for validation errors...')
  const errorMessages = page.locator('.text-red-600, .text-red-500, [class*="error"]')
  const errorCount = await errorMessages.count()
  console.log(`❌ Validation errors found: ${errorCount}`)
  
  if (errorCount > 0) {
    for (let i = 0; i < Math.min(errorCount, 5); i++) {
      const errorText = await errorMessages.nth(i).textContent()
      console.log(`   Error ${i + 1}: ${errorText}`)
    }
  }
  
  // Check Generate Terms button state
  console.log('🔍 Checking Generate Terms button...')
  const generateButton = page.locator('button:has-text("Generate Terms")')
  const buttonCount = await generateButton.count()
  console.log(`🔍 Generate Terms button count: ${buttonCount}`)
  
  if (buttonCount > 0) {
    const isDisabled = await generateButton.getAttribute('disabled')
    const buttonText = await generateButton.textContent()
    console.log(`🔘 Button text: "${buttonText}"`)
    console.log(`🔘 Button disabled: ${isDisabled !== null}`)
    
    // Check button classes for styling clues
    const buttonClass = await generateButton.getAttribute('class')
    console.log(`🔘 Button classes: ${buttonClass}`)
    
    // Try to check form validity state
    const validBadge = page.locator('text="✓ Valid"')
    const validBadgeCount = await validBadge.count()
    console.log(`✅ Valid badge count: ${validBadgeCount}`)
    
    const incompleteBadge = page.locator('text="Incomplete"')
    const incompleteBadgeCount = await incompleteBadge.count()
    console.log(`❌ Incomplete badge count: ${incompleteBadgeCount}`)
  }
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'form-debug.png', fullPage: true })
  console.log('📸 Form debug screenshot saved as form-debug.png')
  
  // Try to get form values
  console.log('🔍 Checking current form values...')
  const currentDomain = await page.locator('#domain').inputValue().catch(() => 'not found')
  const currentWebsiteName = await page.locator('#websiteName').inputValue().catch(() => 'not found')
  const currentDescription = await page.locator('#description').inputValue().catch(() => 'not found')
  const currentEmail = await page.locator('#contactEmail').inputValue().catch(() => 'not found')
  const currentCompany = await page.locator('#companyName').inputValue().catch(() => 'not found')
  
  console.log('📋 Current form values:')
  console.log(`   Domain: "${currentDomain}"`)
  console.log(`   Website Name: "${currentWebsiteName}"`)
  console.log(`   Description: "${currentDescription?.substring(0, 50)}..."`)
  console.log(`   Email: "${currentEmail}"`)
  console.log(`   Company: "${currentCompany}"`)
})
