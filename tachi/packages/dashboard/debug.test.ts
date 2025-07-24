import { test } from '@playwright/test'

test('Debug - What is on the page?', async ({ page }) => {
  console.log('🔍 Debugging what is actually on the page...')
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console error:', msg.text())
    }
  })
  
  await page.goto('http://localhost:3003')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000) // Give more time for React components to load
  
  // Get page title
  const title = await page.title()
  console.log(`📄 Page title: ${title}`)
  
  // Get all the actual rendered HTML
  const html = await page.innerHTML('body')
  console.log('🏗️ HTML structure (first 1000 chars):')
  console.log(html.substring(0, 1000))
  
  // Look for specific OnboardingWizard elements by text content
  const welcomeElements = await page.locator('text="Welcome to Tachi"').count()
  console.log(`🧙 Found ${welcomeElements} welcome header elements`)
  
  // Look for Card components
  const cardElements = await page.locator('[class*="card"]').count()
  console.log(`🃏 Found ${cardElements} card elements`)
  
  // Look for step progress indicators
  const stepIcons = await page.locator('svg[class*="h-4"]').count()
  console.log(`📊 Found ${stepIcons} step icons`)
  
  // Look for tabs content (TabsContent components)
  const tabsContent = await page.locator('[data-state="active"], [data-state="inactive"]').count()
  console.log(`🗂️ Found ${tabsContent} tabs content elements`)
  
  // Look for any wallet-related elements with more detail
  const walletElements = await page.locator('[data-testid*="rk"], button:has-text("Connect")').all()
  console.log(`🔍 Found ${walletElements.length} wallet-related elements`)
  for (let i = 0; i < walletElements.length; i++) {
    const text = await walletElements[i].textContent()
    const testId = await walletElements[i].getAttribute('data-testid')
    console.log(`  Wallet element ${i + 1}: "${text}" (testid: ${testId})`)
  }
  
  // Look for any form elements with more detail
  const formElements = await page.locator('input, textarea, select').all()
  console.log(`📝 Found ${formElements.length} form elements`)
  
  // List all button text
  const buttons = await page.locator('button').all()
  console.log(`🔘 Found ${buttons.length} buttons`)
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent()
    const classes = await buttons[i].getAttribute('class')
    console.log(`  Button ${i + 1}: "${text}" (classes: ${classes})`)
  }
  
  // Take screenshot
  await page.screenshot({ path: 'debug-page.png', fullPage: true })
  console.log('📸 Screenshot saved as debug-page.png')
})
