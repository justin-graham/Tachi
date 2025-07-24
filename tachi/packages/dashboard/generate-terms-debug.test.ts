import { test } from '@playwright/test'

test('Debug - Generate Terms State', async ({ page }) => {
  console.log('🔍 Debugging Generate Terms state...')
  
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
  await page.waitForTimeout(1000)
  
  console.log('📋 Form filled, checking Generate Terms button...')
  
  const generateButton = page.locator('button:has-text("Generate Terms")')
  const isDisabled = await generateButton.getAttribute('disabled')
  console.log(`🔘 Generate Terms button disabled: ${isDisabled !== null}`)
  
  console.log('🚀 Clicking Generate Terms...')
  await generateButton.click()
  
  console.log('⏳ Waiting for terms generation...')
  await page.waitForTimeout(5000) // Give more time for generation
  
  // Check if we're on terms tab
  const activeTab = page.locator('[data-state="active"]')
  const activeTabText = await activeTab.textContent()
  console.log(`🗂️ Active tab: "${activeTabText}"`)
  
  // Check for any error messages 
  const errorMessages = page.locator('.text-red-600, .text-red-500, [class*="error"]')
  const errorCount = await errorMessages.count()
  console.log(`❌ Error messages visible: ${errorCount}`)
  
  if (errorCount > 0) {
    for (let i = 0; i < Math.min(errorCount, 3); i++) {
      const errorText = await errorMessages.nth(i).textContent()
      console.log(`   Error ${i + 1}: ${errorText}`)
    }
  }
  
  // Look for the specific checkbox with more selectors
  const checkboxSelectors = [
    'input[type="checkbox"]',
    '[role="checkbox"]', 
    '.bg-blue-50 input',
    'input[checked]',
    'input:not([checked])'
  ]
  
  console.log('🔍 Looking for checkbox with different selectors...')
  for (const selector of checkboxSelectors) {
    const elements = page.locator(selector)
    const count = await elements.count()
    console.log(`   ${selector}: ${count} elements`)
  }
  
  // Look for the blue acceptance box specifically
  const blueBox = page.locator('.bg-blue-50')
  const blueBoxCount = await blueBox.count()
  console.log(`🔵 Blue acceptance boxes: ${blueBoxCount}`)
  
  if (blueBoxCount > 0) {
    const blueBoxText = await blueBox.first().textContent()
    console.log(`📝 Blue box content: "${blueBoxText?.substring(0, 200)}..."`)
  }
  
  // Look for Shield component
  const shieldIcon = page.locator('svg:has(path), .lucide-shield')
  const shieldCount = await shieldIcon.count()
  console.log(`🛡️ Shield icons: ${shieldCount}`)
  
  // Check for "Accept Terms" text specifically
  const acceptTermsText = page.locator('text="Accept Terms of Service"')
  const acceptTermsCount = await acceptTermsText.count()
  console.log(`📋 "Accept Terms of Service" text: ${acceptTermsCount}`)
  
  // Check if there's an element with Checkbox import
  const radixCheckbox = page.locator('[data-state]')
  const radixCount = await radixCheckbox.count()
  console.log(`⚡ Radix UI elements: ${radixCount}`)
  
  if (radixCount > 0) {
    for (let i = 0; i < Math.min(radixCount, 3); i++) {
      const state = await radixCheckbox.nth(i).getAttribute('data-state')
      const role = await radixCheckbox.nth(i).getAttribute('role')
      console.log(`   Radix ${i + 1}: state="${state}", role="${role}"`)
    }
  }
  
  await page.screenshot({ path: 'generate-terms-state-debug.png', fullPage: true })
  console.log('📸 Generate terms state debug screenshot saved')
})
