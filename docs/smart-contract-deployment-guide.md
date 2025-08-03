# Smart Contract Deployment Guide

## Complete Deployment Guide for Tachi Protocol Contracts

This guide covers deploying Tachi Protocol smart contracts to Base network, including both testnet (Base Sepolia) and mainnet deployments.

## Prerequisites

### Development Environment

- **Node.js**: Version 18+ (for compatibility with latest tooling)
- **Git**: For version control
- **Code Editor**: VS Code recommended with Solidity extensions

### Blockchain Setup

- **Base Network Wallet**: MetaMask or Coinbase Wallet configured for Base
- **Funding**: ETH for gas fees (~0.1 ETH recommended)
- **USDC**: For testing payment functionality (testnet USDC available from faucets)

### Required Tools

```bash
# Install Hardhat and dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-ethers ethers
npm install --save-dev @nomicfoundation/hardhat-verify
npm install --save-dev dotenv
```

## Contract Overview

### Core Contracts

1. **CrawlNFT**: Publisher license NFT contract
   - Manages publisher registration
   - Self-minting capabilities for onboarding
   - License validation and ownership

2. **PaymentProcessor**: Handles USDC payments
   - Processes payments from crawlers to publishers
   - Validates payment amounts and recipients
   - Emits payment events for tracking

3. **ProofOfCrawlLedger**: Activity logging
   - Records crawl activities on-chain
   - Provides transparency and audit trails
   - Links crawls to IPFS content hashes

## Project Setup

### 1. Initialize Hardhat Project

```bash
mkdir tachi-contracts
cd tachi-contracts
npm init -y
npm install hardhat
npx hardhat
```

Choose "Create a TypeScript project" and install recommended dependencies.

### 2. Project Structure

```
tachi-contracts/
├── contracts/
│   ├── CrawlNFT.sol
│   ├── PaymentProcessor.sol
│   ├── ProofOfCrawlLedger.sol
│   └── interfaces/
├── scripts/
│   ├── deploy.ts
│   ├── deploy-self-mint.ts
│   └── verify-contracts.ts
├── test/
├── hardhat.config.ts
├── .env
└── package.json
```

### 3. Configure Environment

Create `.env` file:

```bash
# Wallet Configuration
PRIVATE_KEY=your-private-key-here
DEPLOYER_ADDRESS=0xYourWalletAddress

# Network Configuration - Base Sepolia (Testnet)
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_SEPOLIA_CHAIN_ID=84532

# Network Configuration - Base Mainnet (Production)
BASE_MAINNET_RPC=https://mainnet.base.org
BASE_MAINNET_CHAIN_ID=8453

# Block Explorer API Keys (for verification)
BASESCAN_API_KEY=your-basescan-api-key

# Contract Configuration
CRAWL_PRICE_USDC=0.01
SELF_MINTING_ENABLED=true

# USDC Contract Addresses
USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
USDC_BASE_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

⚠️ **Security**: Never commit `.env` to version control. Add it to `.gitignore`.

### 4. Hardhat Configuration

Create `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.basescan.org",
          apiKey: process.env.BASESCAN_API_KEY
        }
      }
    },
    "base-mainnet": {
      url: process.env.BASE_MAINNET_RPC || "https://mainnet.base.org", 
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      verify: {
        etherscan: {
          apiUrl: "https://api.basescan.org",
          apiKey: process.env.BASESCAN_API_KEY
        }
      }
    }
  },
  etherscan: {
    apiKey: {
      "base-sepolia": process.env.BASESCAN_API_KEY || "",
      "base-mainnet": process.env.BASESCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "base-mainnet", 
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  }
};

export default config;
```

## Contract Development

### 1. CrawlNFT Contract

Create `contracts/CrawlNFT.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CrawlNFT
 * @dev Publisher license NFT for Tachi Protocol
 */
contract CrawlNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    // Mapping from token ID to terms URI
    mapping(uint256 => string) private _tokenTermsURIs;
    
    // Mapping from owner to token ID (one license per address)
    mapping(address => uint256) private _ownerToTokenId;
    
    // Self-minting configuration
    bool public selfMintingEnabled;
    uint256 public mintPrice;
    
    event LicenseCreated(
        uint256 indexed tokenId,
        address indexed publisher,
        string termsURI
    );
    
    event SelfMintingToggled(bool enabled);
    
    constructor(
        string memory name,
        string memory symbol,
        bool _selfMintingEnabled
    ) ERC721(name, symbol) Ownable(msg.sender) {
        selfMintingEnabled = _selfMintingEnabled;
        mintPrice = 0; // Free minting initially
    }
    
    /**
     * @dev Mint a license for yourself (self-minting)
     */
    function mintMyLicense(string memory termsURI) external payable {
        require(selfMintingEnabled, "Self-minting is disabled");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_ownerToTokenId[msg.sender] == 0, "Already has a license");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(msg.sender, newTokenId);
        _tokenTermsURIs[newTokenId] = termsURI;
        _ownerToTokenId[msg.sender] = newTokenId;
        
        emit LicenseCreated(newTokenId, msg.sender, termsURI);
    }
    
    /**
     * @dev Admin function to create license for a publisher
     */
    function createLicense(
        address publisher,
        string memory termsURI
    ) external onlyOwner {
        require(_ownerToTokenId[publisher] == 0, "Already has a license");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(publisher, newTokenId);
        _tokenTermsURIs[newTokenId] = termsURI;
        _ownerToTokenId[publisher] = newTokenId;
        
        emit LicenseCreated(newTokenId, publisher, termsURI);
    }
    
    /**
     * @dev Get token ID for an owner
     */
    function getTokenIdByOwner(address owner) external view returns (uint256) {
        return _ownerToTokenId[owner];
    }
    
    /**
     * @dev Get terms URI for a token
     */
    function getTermsURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenTermsURIs[tokenId];
    }
    
    /**
     * @dev Toggle self-minting capability
     */
    function toggleSelfMinting() external onlyOwner {
        selfMintingEnabled = !selfMintingEnabled;
        emit SelfMintingToggled(selfMintingEnabled);
    }
    
    /**
     * @dev Set mint price
     */
    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
    }
    
    /**
     * @dev Withdraw collected fees
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Override transfer functions to prevent license transfers
     */
    function transferFrom(address, address, uint256) public pure override {
        revert("License transfers are not allowed");
    }
    
    function safeTransferFrom(address, address, uint256) public pure override {
        revert("License transfers are not allowed");
    }
    
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("License transfers are not allowed");
    }
}
```

### 2. PaymentProcessor Contract

Create `contracts/PaymentProcessor.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PaymentProcessor
 * @dev Handles USDC payments from crawlers to publishers
 */
contract PaymentProcessor is Ownable, ReentrancyGuard {
    IERC20 public immutable usdcToken;
    
    // Fee configuration
    uint256 public protocolFeePercentage = 250; // 2.5% (basis points)
    address public feeRecipient;
    
    // Payment tracking
    mapping(address => uint256) public publisherEarnings;
    mapping(address => uint256) public crawlerSpending;
    
    event PaymentProcessed(
        address indexed crawler,
        address indexed publisher,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );
    
    event FeesWithdrawn(
        address indexed recipient,
        uint256 amount
    );
    
    constructor(
        address _usdcToken,
        address _feeRecipient
    ) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Process payment from crawler to publisher
     */
    function payPublisher(
        address publisher,
        uint256 amount
    ) external nonReentrant {
        require(publisher != address(0), "Invalid publisher address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate fee
        uint256 fee = (amount * protocolFeePercentage) / 10000;
        uint256 publisherAmount = amount - fee;
        
        // Transfer USDC from crawler to contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        // Transfer publisher amount
        require(
            usdcToken.transfer(publisher, publisherAmount),
            "Publisher payment failed"
        );
        
        // Update tracking
        publisherEarnings[publisher] += publisherAmount;
        crawlerSpending[msg.sender] += amount;
        
        emit PaymentProcessed(
            msg.sender,
            publisher,
            publisherAmount,
            fee,
            block.timestamp
        );
    }
    
    /**
     * @dev Get accumulated fees
     */
    function getAccumulatedFees() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
    
    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        
        require(
            usdcToken.transfer(feeRecipient, balance),
            "Fee withdrawal failed"
        );
        
        emit FeesWithdrawn(feeRecipient, balance);
    }
    
    /**
     * @dev Update protocol fee percentage
     */
    function setProtocolFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee cannot exceed 10%");
        protocolFeePercentage = _feePercentage;
    }
    
    /**
     * @dev Update fee recipient
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Get publisher earnings
     */
    function getPublisherEarnings(address publisher) external view returns (uint256) {
        return publisherEarnings[publisher];
    }
    
    /**
     * @dev Get crawler spending
     */
    function getCrawlerSpending(address crawler) external view returns (uint256) {
        return crawlerSpending[crawler];
    }
}
```

### 3. ProofOfCrawlLedger Contract

Create `contracts/ProofOfCrawlLedger.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProofOfCrawlLedger
 * @dev Records crawl activities on-chain for transparency
 */
contract ProofOfCrawlLedger is Ownable {
    struct CrawlRecord {
        address crawler;
        string url;
        string ipfsHash;
        uint256 timestamp;
        bool success;
    }
    
    CrawlRecord[] public crawlRecords;
    
    // Mappings for efficient querying
    mapping(address => uint256[]) public crawlerRecords;
    mapping(string => uint256[]) public urlRecords;
    
    event CrawlLogged(
        uint256 indexed recordId,
        address indexed crawler,
        string url,
        string ipfsHash,
        bool success,
        uint256 timestamp
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Log a crawl activity
     */
    function logCrawl(
        string memory url,
        string memory ipfsHash,
        bool success
    ) external {
        uint256 recordId = crawlRecords.length;
        
        CrawlRecord memory record = CrawlRecord({
            crawler: msg.sender,
            url: url,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            success: success
        });
        
        crawlRecords.push(record);
        crawlerRecords[msg.sender].push(recordId);
        urlRecords[url].push(recordId);
        
        emit CrawlLogged(
            recordId,
            msg.sender,
            url,
            ipfsHash,
            success,
            block.timestamp
        );
    }
    
    /**
     * @dev Log crawl with URL (convenience function)
     */
    function logCrawlWithURL(
        string memory url,
        string memory ipfsHash
    ) external {
        logCrawl(url, ipfsHash, true);
    }
    
    /**
     * @dev Get total number of crawls logged
     */
    function getTotalCrawlsLogged() external view returns (uint256) {
        return crawlRecords.length;
    }
    
    /**
     * @dev Get crawl records for a crawler
     */
    function getCrawlerRecords(
        address crawler
    ) external view returns (uint256[] memory) {
        return crawlerRecords[crawler];
    }
    
    /**
     * @dev Get crawl records for a URL
     */
    function getURLRecords(
        string memory url
    ) external view returns (uint256[] memory) {
        return urlRecords[url];
    }
    
    /**
     * @dev Get crawl record by ID
     */
    function getCrawlRecord(
        uint256 recordId
    ) external view returns (CrawlRecord memory) {
        require(recordId < crawlRecords.length, "Record does not exist");
        return crawlRecords[recordId];
    }
    
    /**
     * @dev Get recent crawl records (last N records)
     */
    function getRecentCrawls(
        uint256 count
    ) external view returns (CrawlRecord[] memory) {
        uint256 totalRecords = crawlRecords.length;
        uint256 startIndex = totalRecords > count ? totalRecords - count : 0;
        uint256 resultCount = totalRecords - startIndex;
        
        CrawlRecord[] memory result = new CrawlRecord[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = crawlRecords[startIndex + i];
        }
        
        return result;
    }
}
```

## Deployment Scripts

### 1. Main Deployment Script

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentResult {
  crawlNFT: string;
  paymentProcessor: string;
  proofOfCrawlLedger: string;
  deployer: string;
  network: string;
  timestamp: number;
}

async function main() {
  console.log("🚀 Starting Tachi Protocol deployment...");
  
  // Get deployment configuration
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📋 Deployment Configuration:");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);
  
  if (parseFloat(ethers.formatEther(balance)) < 0.01) {
    throw new Error("Insufficient ETH balance for deployment");
  }
  
  // Get USDC address for the network
  const usdcAddress = getUSDCAddress(network.chainId);
  console.log(`USDC Address: ${usdcAddress}`);
  
  // Deploy CrawlNFT
  console.log("\n📄 Deploying CrawlNFT...");
  const CrawlNFT = await ethers.getContractFactory("CrawlNFT");
  const crawlNFT = await CrawlNFT.deploy(
    "Tachi Publisher License",
    "TPL",
    true // Self-minting enabled
  );
  await crawlNFT.waitForDeployment();
  const crawlNFTAddress = await crawlNFT.getAddress();
  console.log(`✅ CrawlNFT deployed to: ${crawlNFTAddress}`);
  
  // Deploy PaymentProcessor
  console.log("\n💰 Deploying PaymentProcessor...");
  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy(
    usdcAddress,
    deployer.address // Fee recipient
  );
  await paymentProcessor.waitForDeployment();
  const paymentProcessorAddress = await paymentProcessor.getAddress();
  console.log(`✅ PaymentProcessor deployed to: ${paymentProcessorAddress}`);
  
  // Deploy ProofOfCrawlLedger
  console.log("\n📚 Deploying ProofOfCrawlLedger...");
  const ProofOfCrawlLedger = await ethers.getContractFactory("ProofOfCrawlLedger");
  const proofOfCrawlLedger = await ProofOfCrawlLedger.deploy();
  await proofOfCrawlLedger.waitForDeployment();
  const proofOfCrawlLedgerAddress = await proofOfCrawlLedger.getAddress();
  console.log(`✅ ProofOfCrawlLedger deployed to: ${proofOfCrawlLedgerAddress}`);
  
  // Save deployment information
  const deploymentResult: DeploymentResult = {
    crawlNFT: crawlNFTAddress,
    paymentProcessor: paymentProcessorAddress,
    proofOfCrawlLedger: proofOfCrawlLedgerAddress,
    deployer: deployer.address,
    network: network.name,
    timestamp: Date.now()
  };
  
  const deploymentFile = getDeploymentFileName(network.chainId);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
  
  // Print summary
  console.log("\n🎉 Deployment Complete!");
  console.log("=".repeat(50));
  console.log(`Network: ${network.name}`);
  console.log(`CrawlNFT: ${crawlNFTAddress}`);
  console.log(`PaymentProcessor: ${paymentProcessorAddress}`);
  console.log(`ProofOfCrawlLedger: ${proofOfCrawlLedgerAddress}`);
  console.log("=".repeat(50));
  
  // Verification instructions
  console.log("\n🔍 To verify contracts on block explorer:");
  console.log(`npx hardhat verify --network ${network.name} ${crawlNFTAddress} "Tachi Publisher License" "TPL" true`);
  console.log(`npx hardhat verify --network ${network.name} ${paymentProcessorAddress} ${usdcAddress} ${deployer.address}`);
  console.log(`npx hardhat verify --network ${network.name} ${proofOfCrawlLedgerAddress}`);
}

function getUSDCAddress(chainId: bigint): string {
  const addresses: { [key: string]: string } = {
    "84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
    "8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"   // Base Mainnet
  };
  
  const address = addresses[chainId.toString()];
  if (!address) {
    throw new Error(`USDC address not configured for chain ID: ${chainId}`);
  }
  
  return address;
}

function getDeploymentFileName(chainId: bigint): string {
  const networkNames: { [key: string]: string } = {
    "84532": "baseSepolia",
    "8453": "baseMainnet",
    "31337": "localhost"
  };
  
  const networkName = networkNames[chainId.toString()] || "unknown";
  return path.join(__dirname, `../deployments/${networkName}.json`);
}

// Handle errors
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
```

### 2. Self-Mint Deployment Script

Create `scripts/deploy-self-mint.ts`:

```typescript
import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🚀 Deploying CrawlNFT with self-minting...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network: ${network.name} (${network.chainId})`);
  
  // Deploy CrawlNFT with self-minting enabled
  const CrawlNFT = await ethers.getContractFactory("CrawlNFT");
  const crawlNFT = await CrawlNFT.deploy(
    "Tachi Publisher License",
    "TPL", 
    true // Enable self-minting
  );
  
  await crawlNFT.waitForDeployment();
  const address = await crawlNFT.getAddress();
  
  console.log(`✅ CrawlNFT deployed to: ${address}`);
  
  // Verify self-minting is enabled
  let selfMintingEnabled = false;
  let retries = 3;
  
  while (retries > 0 && !selfMintingEnabled) {
    try {
      selfMintingEnabled = await crawlNFT.selfMintingEnabled();
      if (selfMintingEnabled) {
        console.log("✅ Self-minting is enabled");
        break;
      }
    } catch (error) {
      console.log(`⏳ Waiting for contract to be ready... (${retries} retries left)`);
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  if (!selfMintingEnabled && retries === 0) {
    console.log("⚠️  Could not verify self-minting status");
  }
  
  // Save deployment info
  const deploymentInfo = {
    address,
    deployer: deployer.address,
    network: network.name,
    chainId: network.chainId,
    selfMintingEnabled: true,
    timestamp: Date.now()
  };
  
  // Ensure deployments directory exists
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Write to both files for compatibility
  fs.writeFileSync("./deployments/crawlnft-deployment.json", JSON.stringify(deploymentInfo, null, 2));
  fs.writeFileSync("./deployments/baseSepolia.json", JSON.stringify({
    crawlNFT: address,
    ...deploymentInfo
  }, null, 2));
  
  console.log("💾 Deployment info saved");
  console.log(`\n🔍 Verify with: npx hardhat verify --network ${network.name} ${address} "Tachi Publisher License" "TPL" true`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
```

## Deployment Process

### 1. Pre-Deployment Checks

Create `scripts/preflight-check.ts`:

```typescript
import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function preflightCheck() {
  console.log("🔍 Running pre-deployment checks...\n");
  
  const checks = [
    checkEnvironmentVariables,
    checkNetworkConnection,
    checkWalletBalance,
    checkUSDCBalance,
    checkContractCompilation
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      await check();
    } catch (error) {
      console.error(`❌ ${error}`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log("\n🎉 All preflight checks passed! Ready for deployment.");
  } else {
    console.log("\n⚠️  Some checks failed. Please resolve issues before deployment.");
    process.exit(1);
  }
}

async function checkEnvironmentVariables() {
  console.log("📋 Checking environment variables...");
  
  const required = ["PRIVATE_KEY", "BASE_SEPOLIA_RPC"];
  for (const env of required) {
    if (!process.env[env]) {
      throw new Error(`Missing required environment variable: ${env}`);
    }
  }
  
  console.log("✅ Environment variables configured");
}

async function checkNetworkConnection() {
  console.log("🌐 Checking network connection...");
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC);
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Connected to Base Sepolia (Block: ${blockNumber})`);
  } catch (error) {
    throw new Error(`Network connection failed: ${error}`);
  }
}

async function checkWalletBalance() {
  console.log("💰 Checking wallet balance...");
  
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const balance = await provider.getBalance(wallet.address);
  const ethBalance = parseFloat(ethers.formatEther(balance));
  
  console.log(`Wallet: ${wallet.address}`);
  console.log(`Balance: ${ethBalance} ETH`);
  
  if (ethBalance < 0.01) {
    throw new Error("Insufficient ETH balance for deployment (need at least 0.01 ETH)");
  }
  
  console.log("✅ Sufficient ETH balance");
}

async function checkUSDCBalance() {
  console.log("💵 Checking USDC balance...");
  
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const usdcAbi = ["function balanceOf(address) view returns (uint256)"];
  const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, provider);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    const usdcBalance = parseFloat(ethers.formatUnits(balance, 6));
    
    console.log(`USDC Balance: ${usdcBalance} USDC`);
    
    if (usdcBalance < 1.0) {
      console.log("⚠️  Low USDC balance - consider getting testnet USDC for testing");
    } else {
      console.log("✅ Sufficient USDC balance for testing");
    }
  } catch (error) {
    console.log("⚠️  Could not check USDC balance - this is okay for deployment");
  }
}

async function checkContractCompilation() {
  console.log("🔨 Checking contract compilation...");
  
  try {
    await ethers.getContractFactory("CrawlNFT");
    await ethers.getContractFactory("PaymentProcessor");
    await ethers.getContractFactory("ProofOfCrawlLedger");
    console.log("✅ All contracts compile successfully");
  } catch (error) {
    throw new Error(`Contract compilation failed: ${error}`);
  }
}

preflightCheck().catch(console.error);
```

### 2. Deploy to Base Sepolia (Testnet)

```bash
# Run preflight checks
npx hardhat run scripts/preflight-check.ts

# Deploy contracts
npx hardhat run scripts/deploy.ts --network base-sepolia

# Deploy self-mint contract (alternative)
npx hardhat run scripts/deploy-self-mint.ts --network base-sepolia
```

### 3. Verify Contracts

```bash
# Verify CrawlNFT
npx hardhat verify --network base-sepolia <CRAWL_NFT_ADDRESS> "Tachi Publisher License" "TPL" true

# Verify PaymentProcessor  
npx hardhat verify --network base-sepolia <PAYMENT_PROCESSOR_ADDRESS> 0x036CbD53842c5426634e7929541eC2318f3dCF7e <DEPLOYER_ADDRESS>

# Verify ProofOfCrawlLedger
npx hardhat verify --network base-sepolia <PROOF_OF_CRAWL_LEDGER_ADDRESS>
```

### 4. Test Deployments

Create `scripts/test-deployment.ts`:

```typescript
import { ethers } from "hardhat";
import * as fs from "fs";

async function testDeployment() {
  console.log("🧪 Testing deployed contracts...");
  
  // Load deployment info
  const deploymentFile = "./deployments/baseSepolia.json";
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("Deployment file not found. Deploy contracts first.");
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const [deployer] = await ethers.getSigners();
  
  console.log(`Using contracts from: ${deploymentFile}`);
  console.log(`CrawlNFT: ${deployment.crawlNFT}`);
  
  // Test CrawlNFT
  const CrawlNFT = await ethers.getContractFactory("CrawlNFT");
  const crawlNFT = CrawlNFT.attach(deployment.crawlNFT);
  
  // Check self-minting status
  const selfMintingEnabled = await crawlNFT.selfMintingEnabled();
  console.log(`✅ Self-minting enabled: ${selfMintingEnabled}`);
  
  // Test minting (if self-minting is enabled)
  if (selfMintingEnabled) {
    console.log("🎫 Testing license minting...");
    
    try {
      const tx = await crawlNFT.mintMyLicense("https://example.com/terms");
      const receipt = await tx.wait();
      console.log(`✅ License minted! Transaction: ${receipt?.hash}`);
      
      // Check balance
      const balance = await crawlNFT.balanceOf(deployer.address);
      console.log(`✅ License balance: ${balance}`);
      
    } catch (error) {
      console.log(`⚠️  Minting test failed (may already have license): ${error}`);
    }
  }
  
  console.log("\n🎉 Deployment test complete!");
}

testDeployment().catch(console.error);
```

Run the test:

```bash
npx hardhat run scripts/test-deployment.ts --network base-sepolia
```

## Production Deployment

### 1. Mainnet Preparation

```bash
# Update .env for mainnet
BASE_MAINNET_RPC=https://mainnet.base.org
BASESCAN_API_KEY=your-api-key

# Ensure sufficient ETH for mainnet gas
# Check current gas prices and estimate costs
```

### 2. Deploy to Base Mainnet

```bash
# Run preflight checks for mainnet
npx hardhat run scripts/preflight-check.ts --network base-mainnet

# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network base-mainnet

# Verify contracts
npx hardhat verify --network base-mainnet <ADDRESSES>
```

### 3. Post-Deployment Setup

Create `scripts/post-deployment.ts`:

```typescript
async function postDeploymentSetup() {
  console.log("⚙️  Running post-deployment setup...");
  
  // Load deployment
  const deployment = JSON.parse(fs.readFileSync("./deployments/baseMainnet.json", "utf8"));
  
  // Setup initial configuration
  const crawlNFT = await ethers.getContractAt("CrawlNFT", deployment.crawlNFT);
  
  // Set initial mint price if needed
  if (process.env.MINT_PRICE_ETH) {
    const mintPrice = ethers.parseEther(process.env.MINT_PRICE_ETH);
    await crawlNFT.setMintPrice(mintPrice);
    console.log(`✅ Mint price set to ${process.env.MINT_PRICE_ETH} ETH`);
  }
  
  // Additional setup...
  console.log("✅ Post-deployment setup complete");
}
```

## Monitoring and Maintenance

### 1. Contract Interaction Scripts

Create utility scripts for common operations:

```typescript
// scripts/mint-license.ts
async function mintLicense(termsURI: string) {
  const deployment = JSON.parse(fs.readFileSync("./deployments/baseSepolia.json", "utf8"));
  const crawlNFT = await ethers.getContractAt("CrawlNFT", deployment.crawlNFT);
  
  const tx = await crawlNFT.mintMyLicense(termsURI);
  await tx.wait();
  
  console.log(`✅ License minted: ${tx.hash}`);
}

// scripts/check-earnings.ts
async function checkEarnings(publisherAddress: string) {
  const deployment = JSON.parse(fs.readFileSync("./deployments/baseSepolia.json", "utf8"));
  const paymentProcessor = await ethers.getContractAt("PaymentProcessor", deployment.paymentProcessor);
  
  const earnings = await paymentProcessor.getPublisherEarnings(publisherAddress);
  console.log(`Publisher earnings: ${ethers.formatUnits(earnings, 6)} USDC`);
}
```

### 2. Upgrade Considerations

For future upgrades, consider using OpenZeppelin's proxy patterns:

```bash
npm install @openzeppelin/contracts-upgradeable
npm install @openzeppelin/hardhat-upgrades
```

### 3. Security Monitoring

Set up monitoring for:
- Unusual transaction patterns
- Large USDC movements
- Contract upgrade events
- Failed payment attempts

## Troubleshooting

### Common Issues

1. **Gas estimation failures**
   ```bash
   # Check gas price
   npx hardhat run scripts/check-gas.ts --network base-sepolia
   ```

2. **Contract verification failures**
   ```bash
   # Manual verification with constructor args
   npx hardhat verify --network base-sepolia <ADDRESS> --constructor-args arguments.js
   ```

3. **Network connectivity issues**
   ```bash
   # Test RPC connection
   curl -X POST https://sepolia.base.org \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

### Debug Tools

```typescript
// scripts/debug-contract.ts
async function debugContract(contractAddress: string) {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC);
  
  // Check if contract exists
  const code = await provider.getCode(contractAddress);
  console.log(`Contract exists: ${code !== '0x'}`);
  
  // Get contract balance
  const balance = await provider.getBalance(contractAddress);
  console.log(`Contract balance: ${ethers.formatEther(balance)} ETH`);
}
```

## Security Checklist

- [ ] Private keys secured and never committed
- [ ] Contract functions have appropriate access controls
- [ ] Reentrancy protection implemented where needed
- [ ] Input validation on all public functions
- [ ] Events emitted for all state changes
- [ ] Emergency pause functionality considered
- [ ] Upgrade path planned (if using proxies)
- [ ] Third-party audit scheduled for mainnet
- [ ] Monitoring and alerting systems in place

## Support Resources

- **Hardhat Documentation**: [hardhat.org/docs](https://hardhat.org/docs)
- **Base Network Docs**: [docs.base.org](https://docs.base.org)
- **OpenZeppelin Contracts**: [docs.openzeppelin.com/contracts](https://docs.openzeppelin.com/contracts)
- **Ethers.js Documentation**: [docs.ethers.org](https://docs.ethers.org)
- **Tachi Discord**: [discord.gg/tachi](https://discord.gg/tachi)
