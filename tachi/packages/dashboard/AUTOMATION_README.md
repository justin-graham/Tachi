# 🚀 Tachi Publisher Onboarding - Test Automation Suite

This directory contains comprehensive end-to-end test automation for the Tachi Publisher Onboarding workflow.

## 🎯 What This Automates

The automation suite covers the complete publisher onboarding flow:

1. **Smart Contract Deployment** - Deploys CrawlNFT, PaymentProcessor, ProofLedger, MockUSDC
2. **Wallet Connection** - Simulates MetaMask wallet connection 
3. **Publisher Registration** - Fills out publisher information form
4. **Pricing & Terms Setup** - Configures pricing and crawler terms
5. **NFT Minting** - Mints publisher registration NFT
6. **Cloudflare Worker Code** - Generates and validates worker deployment code
7. **On-Chain Verification** - Verifies all data is correctly stored on blockchain

## 🛠️ Quick Start

### Option 1: One-Click Automation (Recommended)
```bash
./run-automation.sh
```

### Option 2: Direct Node Execution
```bash
npm run automation
```

### Option 3: Manual Playwright Tests Only
```bash
npm run test
```

## 📋 Available Test Commands

| Command | Description |
|---------|-------------|
| `npm run automation` | Run complete automated test suite |
| `npm run test` | Run Playwright tests only (requires services running) |
| `npm run test:headed` | Run tests with visible browser windows |
| `npm run test:ui` | Interactive Playwright test runner |
| `npm run test:debug` | Debug mode with step-by-step execution |
| `npm run test:report` | Open last test report |

## 🏗️ Architecture

### Core Files

- **`playwright.test.ts`** - Main E2E test suite with 8 automated steps
- **`playwright.config.ts`** - Multi-browser test configuration
- **`run-automation.mjs`** - Complete automation orchestrator
- **`run-automation.sh`** - Simple bash launcher

### Support Files

- **`playwright.global-setup.ts`** - Pre-test environment validation
- **`playwright.global-teardown.ts`** - Post-test cleanup
- **`test-onboarding.mjs`** - Manual testing alternative

## 🎭 Test Coverage

### Automated Test Steps

1. **Environment Setup** - Validates Hardhat network and dashboard accessibility
2. **Wallet Connection** - Simulates MetaMask connection to local network
3. **Publisher Information** - Fills contact details and website information
4. **Pricing Configuration** - Sets up crawler pricing ($1.00 base + $0.10/page)
5. **Terms & Conditions** - Configures crawler terms and rate limiting
6. **NFT Minting** - Mints publisher registration NFT with metadata
7. **Worker Code Generation** - Generates Cloudflare Worker deployment code
8. **Blockchain Verification** - Validates on-chain data integrity

### Browser Coverage

- ✅ **Chromium** (Desktop)
- ✅ **Firefox** (Desktop) 
- ✅ **WebKit/Safari** (Desktop)
- ✅ **Mobile Chrome** (Android simulation)
- ✅ **Mobile Safari** (iOS simulation)

## 📊 Reports & Output

After running automation, you'll get:

### 📁 Generated Reports
- **`test-results/automation-report.json`** - Machine-readable test results
- **`test-results/automation-report.html`** - Human-readable test report
- **`playwright-report/index.html`** - Detailed Playwright test report
- **`test-results/`** - Screenshots, videos, traces on failures

### 🔍 Sample Report Output
```
📊 TACHI AUTOMATION TEST RESULTS
================================

🎯 Test Summary:
├── Total Tests: 5
├── Passed: 5
└── Failed: 0

🔍 Detailed Results:
✅ Contract Deployment
✅ Dashboard Launch  
✅ Playwright Tests
✅ Onboarding Flow
✅ Cloudflare Worker

🎉 SUCCESS: All automation tests passed!
```

## 🔧 Technical Requirements

### Prerequisites
- **Node.js** 18+ with npm/pnpm
- **Hardhat** development environment
- **Next.js** dashboard application
- **Playwright** test framework (auto-installed)

### Automatic Setup
The automation handles:
- Hardhat network startup
- Smart contract deployment
- Dashboard server launch
- Test execution
- Report generation
- Cleanup

## 🐛 Troubleshooting

### Common Issues

**❌ "Hardhat network startup timeout"**
```bash
# Solution: Kill existing Hardhat processes
pkill -f "hardhat node"
```

**❌ "Dashboard server startup timeout"**  
```bash
# Solution: Check port 3003 availability
lsof -ti:3003 | xargs kill -9
```

**❌ "Contract deployment failed"**
```bash
# Solution: Clean Hardhat cache and redeploy
cd ../contracts && npx hardhat clean
```

**❌ "Playwright browser not found"**
```bash
# Solution: Install Playwright browsers
npx playwright install
```

### Debug Mode

For detailed debugging:
```bash
npm run test:debug
```

This opens:
- Step-by-step test execution
- Browser DevTools
- Playwright Inspector
- Live DOM inspection

## 🚦 Manual Testing Alternative

If automation fails, use manual testing:

1. **Start services manually:**
   ```bash
   # Terminal 1: Start Hardhat
   cd ../contracts && npx hardhat node
   
   # Terminal 2: Deploy contracts  
   cd ../contracts && npx hardhat run scripts/deploy.ts --network hardhat
   
   # Terminal 3: Start dashboard
   npm run dev
   ```

2. **Run manual test:**
   ```bash
   node test-onboarding.mjs
   ```

3. **Follow manual guide:**
   See `PUBLISHER_ONBOARDING_TEST.md`

## 🔄 CI/CD Integration

For continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Run Tachi E2E Tests
  run: |
    cd tachi/packages/dashboard
    npm run automation
    
- name: Upload Test Reports
  uses: actions/upload-artifact@v3
  with:
    name: test-reports
    path: |
      test-results/
      playwright-report/
```

## 📚 Additional Resources

- **[Manual Testing Guide](./PUBLISHER_ONBOARDING_TEST.md)** - Step-by-step manual testing
- **[Development Setup](./DEVELOPMENT.md)** - Local development environment
- **[Contracts Documentation](../contracts/README.md)** - Smart contract details
- **[Playwright Documentation](https://playwright.dev/)** - Test framework reference

---

🎯 **Ready to test?** Run `./run-automation.sh` to get started!
