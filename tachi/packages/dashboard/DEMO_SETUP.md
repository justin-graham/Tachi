# 🚀 Tachi Dashboard Demo Setup Guide

## Quick Demo Instructions

### Step 1: Start Infrastructure
```bash
# Terminal 1: Start Hardhat Network
cd /Users/justin/Tachi/tachi/packages/contracts
npx hardhat node

# Terminal 2: Deploy Contracts  
npx hardhat run scripts/deploy.ts --network localhost

# Terminal 3: Start Dashboard
cd /Users/justin/Tachi/tachi/packages/dashboard
npm run dev
```

### Step 2: Open Dashboard
Visit: `http://localhost:3003/?test=true`

### Step 3: Connect Wallet  
Click "Connect Wallet" and choose any wallet option (test mode)

### Step 4: Fill Required Fields (IMPORTANT!)
**The Generate Terms button is DISABLED until ALL fields are properly filled:**

#### Website Details Tab:
1. **Domain**: `example.com` *(valid domain format required)*
2. **Website Name**: `My Demo Site` *(1-100 characters)*  
3. **Description**: `This is a demo website for testing the Tachi crawling protocol with pay-per-crawl functionality.` *(10-500 characters)*
4. **Contact Email**: `demo@example.com` *(valid email format)*
5. **Company Name**: `Demo Company LLC` *(1-100 characters)*

#### Field Validation Rules:
- **Domain**: Must be valid format (e.g., example.com, not localhost)
- **Website Name**: 1-100 chars, alphanumeric + spaces + basic punctuation
- **Description**: 10-500 chars, meaningful content required
- **Contact Email**: Valid email format, max 254 chars
- **Company Name**: 1-100 chars, alphanumeric + spaces + business punctuation

### Step 5: Generate Terms
- After ALL fields are filled and valid, the "Generate Terms" button will become **enabled**
- Click "Generate Terms" to create Terms of Service
- Switch to "Terms of Service" tab to review generated terms
- Accept the terms checkbox
- Click "Upload to IPFS" to complete onboarding

## Troubleshooting

### Generate Terms Button Disabled?
**Check that ALL required fields are filled with valid data:**
1. Domain must be a real domain format (not localhost)
2. Description must be at least 10 meaningful characters
3. Email must be valid format
4. All fields must pass regex validation

### Form Validation Errors?
- Look for red error messages under each field
- Ensure no special characters that aren't allowed
- Check character length requirements

### Demo Values That Work:
```
Domain: demo.tachi.com
Website Name: Tachi Demo Site
Description: This is a demonstration website for testing the Tachi pay-per-crawl protocol and smart contract integration.
Contact Email: demo@tachi.com  
Company Name: Tachi Protocol LLC
```

## Quick Test Command

To verify everything works automatically:
```bash
cd /Users/justin/Tachi/tachi/packages/dashboard
npm test -- playwright.test.ts
```

This runs the full automated test that bypasses form validation with force clicks.
