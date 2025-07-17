# Tachi Protocol - Development & Deployment Guide

## Overview

This guide provides comprehensive instructions for developing, testing, and deploying the Tachi Protocol smart contracts to Base network.

## Architecture

The Tachi Protocol consists of four main smart contracts:

1. **CrawlNFT** - Soulbound tokens representing content licenses
2. **PaymentProcessor** - Handles USDC payments between crawlers and publishers
3. **ProofOfCrawlLedger** - On-chain logging for transparency and auditability
4. **MockUSDC** - Test token for development and testing

## Development Environment

### Prerequisites

- Node.js v18+
- pnpm package manager
- Hardhat development environment
- Foundry (for additional testing)

### Installation

```bash
cd tachi/packages/contracts
pnpm install
```

### Available Scripts

```bash
# Build contracts
pnpm run build

# Run all tests (Foundry + Hardhat)
pnpm run test

# Clean build artifacts
pnpm run clean

# Format Solidity code
pnpm run format
```

## Testing

### Foundry Tests (Unit Tests)

The project includes comprehensive unit tests for all contracts:

- **CrawlNFT Tests**: 21 tests covering soulbound behavior, licensing, and access control
- **PaymentProcessor Tests**: 20 tests covering payment flows, error handling, and security
- **ProofOfCrawlLedger Tests**: 27 tests covering logging, batch operations, and pause functionality
- **TachiCore Tests**: 11 tests covering core protocol functionality

Run Foundry tests:
```bash
forge test
```

### Hardhat Integration Tests

Complete end-to-end integration tests written in TypeScript:

- **Complete Crawl Payment Flow**: Tests the entire workflow from payment to NFT minting
- **Error Handling**: Validates proper error conditions and edge cases
- **Soulbound Token Behavior**: Ensures NFTs cannot be transferred
- **Contract Deployment**: Validates initial contract states

Run Hardhat tests:
```bash
npx hardhat test
```

### Test Coverage

- **Total Tests**: 79 tests across all contracts
- **All tests passing**: ✅ 79/79 tests pass
- **Coverage**: Comprehensive coverage of all contract functionality

## Deployment

### Supported Networks

The deployment script supports multiple Base networks:

1. **Base Mainnet** (Chain ID: 8453)
   - USDC Address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
   - Explorer: https://basescan.org

2. **Base Sepolia Testnet** (Chain ID: 84532)
   - USDC Address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Explorer: https://sepolia.basescan.org

3. **Base Goerli Testnet** (Chain ID: 84531) [Deprecated]
   - USDC Address: `0x60bBA138A74C5e7326885De5090700626950d509`
   - Explorer: https://goerli.basescan.org

4. **Local Development** (Chain ID: 31337)
   - Deploys MockUSDC for testing
   - Explorer: http://localhost:8545

### Environment Setup

Create a `.env` file in the contracts directory:

```env
# Private key for deployment
PRIVATE_KEY=your_private_key_here

# RPC URLs
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_GOERLI_RPC_URL=https://goerli.base.org

# Block explorer API key for verification
BASESCAN_API_KEY=your_basescan_api_key
```

### Deployment Commands

#### Local Testing
```bash
# Start local hardhat node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

#### Testnet Deployment
```bash
# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia

# Deploy to Base Goerli (deprecated)
npx hardhat run scripts/deploy.ts --network baseGoerli
```

#### Mainnet Deployment
```bash
# Deploy to Base Mainnet
npx hardhat run scripts/deploy.ts --network base
```

### Deployment Features

The deployment script provides:

1. **Multi-network Support**: Automatic network detection and configuration
2. **Gas Tracking**: Detailed gas usage reporting for each contract
3. **Deployment Artifacts**: JSON files saved to `deployments/` directory
4. **Verification Commands**: Pre-formatted commands for block explorer verification
5. **Error Handling**: Comprehensive error handling and validation
6. **MockUSDC Deployment**: Automatic test token deployment for local development

### Sample Deployment Output

```
🚀 Starting Tachi Protocol Deployment...
==================================================
📡 Network: hardhat (Chain ID: 31337)
🌐 Network Config: Local Development
👤 Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Balance: 10000.0 ETH

📦 Deploying MockUSDC...
✅ MockUSDC deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
⛽ Gas used: 629,283

📦 Deploying CrawlNFT...
✅ CrawlNFT deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
⛽ Gas used: 1,478,388

📦 Deploying PaymentProcessor...
✅ PaymentProcessor deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
⛽ Gas used: 832,866

📦 Deploying ProofOfCrawlLedger...
✅ ProofOfCrawlLedger deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
⛽ Gas used: 809,873

==================================================
🎉 DEPLOYMENT COMPLETE!
==================================================
📊 Total Gas Used: 3,750,410
💸 Estimated Cost: 0.00375041 ETH (at 1 gwei)
```

## Contract Verification

After deployment, verify contracts on the block explorer:

```bash
# Verify CrawlNFT
npx hardhat verify --network baseSepolia <CRAWL_NFT_ADDRESS>

# Verify PaymentProcessor
npx hardhat verify --network baseSepolia <PAYMENT_PROCESSOR_ADDRESS> "<USDC_ADDRESS>"

# Verify ProofOfCrawlLedger
npx hardhat verify --network baseSepolia <PROOF_OF_CRAWL_LEDGER_ADDRESS>

# Verify MockUSDC (local only)
npx hardhat verify --network localhost <MOCK_USDC_ADDRESS> "Mock USDC" "USDC"
```

## Gas Usage Estimates

Typical gas usage for deployment:

- **CrawlNFT**: ~1,478,388 gas
- **PaymentProcessor**: ~832,866 gas
- **ProofOfCrawlLedger**: ~809,873 gas
- **MockUSDC**: ~629,283 gas (local only)
- **Total**: ~3,750,410 gas

## Next Steps

1. **Deploy to Testnet**: Test the contracts on Base Sepolia
2. **Frontend Integration**: Update your frontend/gateway with deployed contract addresses
3. **Monitoring**: Set up monitoring for contract interactions
4. **Security Audit**: Consider a security audit before mainnet deployment

## File Structure

```
packages/contracts/
├── src/                    # Solidity contracts
│   ├── CrawlNFT.sol
│   ├── PaymentProcessor.sol
│   ├── ProofOfCrawlLedger.sol
│   └── MockUSDC.sol
├── test/                   # Test files
│   ├── CrawlNFT.t.sol     # Foundry tests
│   ├── PaymentProcessor.t.sol
│   ├── ProofOfCrawlLedger.t.sol
│   └── Integration.test.ts # Hardhat tests
├── scripts/
│   └── deploy.ts          # Deployment script
├── deployments/           # Deployment artifacts
├── hardhat.config.ts      # Hardhat configuration
├── foundry.toml          # Foundry configuration
└── package.json
```

## Support

For questions or issues:
1. Check the test files for usage examples
2. Review the deployment logs for troubleshooting
3. Ensure your environment variables are properly configured
4. Verify you have sufficient ETH for gas fees
