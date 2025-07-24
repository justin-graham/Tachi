import { test } from '@playwright/test'

test('Debug - Terms Acceptance Checkbox', async ({ page }) => {
  console.log('🔍 Finding terms acceptance checkbox...')
  
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log(`📱 App log: ${msg.text()}`)
    }
  })
  
  await page.goto('http://localhost:3003?test=true')
  await page.waitForTimeout(3000)
  
  // Connect wallet
  const testConnectButton = page.locator('[data-testid="test-wallet-connect"]')
  if (await testConnectButton.count() > 0) {
    await testConnectButton.click()
    await page.waitForTimeout(2000)
  }
  
  // Fill form
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
  await page.waitForTimeout(2000)
  
  // Generate terms
  const generateButton = page.locator('button:has-text("Generate Terms")')
  if (await generateButton.count() > 0) {
    await generateButton.click()
    await page.waitForTimeout(3000)
  }
  
  // Switch to Terms tab
  const termsTab = page.locator('button:has-text("Terms of Service")')
  if (await termsTab.count() > 0) {
    await termsTab.click()
    await page.waitForTimeout(2000)
  }
  
  console.log('🔍 Looking for terms acceptance elements...')
  
  // Look for any checkboxes
  const allCheckboxes = page.locator('input[type="checkbox"]')
  const checkboxCount = await allCheckboxes.count()
  console.log(`☑️ All checkboxes: ${checkboxCount}`)
  
  // Look for terms acceptance text
  const acceptText = page.locator('text="Accept", text="terms", text="service"')
  const acceptCount = await acceptText.count()
  console.log(`📝 Accept/terms text elements: ${acceptCount}`)
  
  if (acceptCount > 0) {
    for (let i = 0; i < Math.min(acceptCount, 3); i++) {
      const text = await acceptText.nth(i).textContent()
      console.log(`   Text ${i + 1}: "${text}"`)
    }
  }
  
  // Look for specific terms acceptance patterns
  const termsAcceptance = page.locator('text="Accept Terms", text="Accept the terms", text="terms of service"')
  const termsAcceptCount = await termsAcceptance.count()
  console.log(`📋 Terms acceptance elements: ${termsAcceptCount}`)
  
  // Look for elements with Shield icon (from the component)
  const shieldElements = page.locator('svg, [class*="shield"]')
  const shieldCount = await shieldElements.count()
  console.log(`🛡️ Shield elements: ${shieldCount}`)
  
  // Look for any labels near checkboxes
  const labels = page.locator('label')
  const labelCount = await labels.count()
  console.log(`🏷️ Label elements: ${labelCount}`)
  
  // Check if terms are generated
  const termsContent = page.locator('pre, textarea, [class*="whitespace-pre"]')
  const termsContentCount = await termsContent.count()
  console.log(`📄 Terms content elements: ${termsContentCount}`)
  
  if (termsContentCount > 0) {
    const firstTermsText = await termsContent.first().textContent()
    const termsLength = firstTermsText?.length || 0
    console.log(`📝 Terms content length: ${termsLength} characters`)
    console.log(`📝 Terms preview: "${firstTermsText?.substring(0, 100)}..."`)
  }
  
  // Check upload button state in detail
  const uploadButton = page.locator('button:has-text("Upload")')
  if (await uploadButton.count() > 0) {
    const isDisabled = await uploadButton.getAttribute('disabled')
    const classes = await uploadButton.getAttribute('class')
    console.log(`🔄 Upload button disabled: ${isDisabled !== null}`)
    console.log(`🎨 Upload button classes: ${classes}`)
  }
  
  await page.screenshot({ path: 'terms-acceptance-debug.png', fullPage: true })
  console.log('📸 Terms acceptance debug screenshot saved')
})
