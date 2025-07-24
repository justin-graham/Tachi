import { test } from '@playwright/test'

test('Debug - Test wallet connection flow', async ({ page }) => {
  console.log('🔍 Testing wallet connection flow...')
  
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
  
  console.log('🔍 Looking for test wallet connect button...')
  const testConnectButton = page.locator('[data-testid="test-wallet-connect"]')
  
  if (await testConnectButton.count() > 0) {
    console.log('✅ Test wallet connect button found')
    console.log('👆 Clicking test wallet connect button...')
    await testConnectButton.click()
    await page.waitForTimeout(2000)
  } else {
    console.log('🔍 Looking for regular Connect Wallet button...')
    const connectButton = page.locator('[data-testid="rk-connect-button"]')
    await connectButton.waitFor({ state: 'visible' })
    console.log('✅ Connect Wallet button found')
    
    console.log('👆 Clicking Connect Wallet button...')
    await connectButton.click()
    await page.waitForTimeout(2000)
  }
  
  console.log('🔍 Checking if wallet step completed...')
  
  // Look for the success message
  const successMessage = page.locator('text="Wallet connected successfully!"')
  const hasSuccess = await successMessage.count()
  console.log(`🎉 Success message count: ${hasSuccess}`)
  
  // Look for site details form
  const siteForm = page.locator('#domain, #websiteName, input[placeholder*="example"], input[placeholder*="Website"]')
  const formCount = await siteForm.count()
  console.log(`📝 Site details form elements count: ${formCount}`)
  
  // Check current tab
  const activeTab = page.locator('[data-state="active"]')
  const activeCount = await activeTab.count()
  console.log(`🗂️ Active tab elements: ${activeCount}`)
  
  if (activeCount > 0) {
    const activeValue = await activeTab.first().getAttribute('data-value')
    console.log(`🎯 Current active tab: ${activeValue}`)
  }
  
  // Look for debug info
  const debugInfo = page.locator('text="Connected Wallet:"')
  const debugCount = await debugInfo.count()
  console.log(`🐛 Debug wallet info visible: ${debugCount}`)
  
  await page.screenshot({ path: 'wallet-flow-debug.png' })
  console.log('📸 Screenshot saved as wallet-flow-debug.png')
})
