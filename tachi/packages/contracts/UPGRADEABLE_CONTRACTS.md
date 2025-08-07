# Tachi Protocol - Upgradeable Contracts

This document outlines the implementation of UUPS (Universal Upgradeable Proxy Standard) upgradeable contracts for Tachi Protocol, enabling post-launch bug fixes and feature additions without complex migrations.

## 🎯 Overview

The upgradeable contracts architecture consists of:

- **CrawlNFTUpgradeable**: Soulbound license tokens for publishers with upgrade capability
- **PaymentProcessorUpgradeable**: USDC payment processing with upgrade capability  
- **TachiMultiSig**: Multi-signature wallet for secure ownership management
- **UUPS Proxy Pattern**: OpenZeppelin's secure upgrade mechanism

## 📁 File Structure

```
contracts/
├── CrawlNFTUpgradeable.sol      # Main upgradeable NFT contract
├── PaymentProcessorUpgradeable.sol  # Payment processing contract
├── TachiMultiSig.sol            # Multi-signature wallet
└── ...

scripts/
├── deploy-upgradeable.ts        # Deploy UUPS proxy contracts
├── upgrade-clean.ts             # Upgrade existing contracts
├── setup-multisig.ts            # Setup multi-sig ownership
└── test-upgradeable.ts          # Comprehensive testing

deployments/
├── base-sepolia-upgradeable.json
├── base-upgradeable.json
└── ...
```

## 🚀 Quick Start

### 1. Deploy Upgradeable Contracts

```bash
# Deploy to Base Sepolia (testnet)
pnpm run deploy:upgradeable:base-sepolia

# Deploy to Base Mainnet (production)
pnpm run deploy:upgradeable:base
```

### 2. Test Upgrades

```bash
# Test upgrade functionality
pnpm run test:upgradeable:base-sepolia
```

### 3. Setup Multi-Sig Ownership

```bash
# Setup multi-sig for production security
pnpm run setup:multisig:base-sepolia
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `deploy:upgradeable` | Deploy contracts to hardhat local network |
| `deploy:upgradeable:base-sepolia` | Deploy to Base Sepolia testnet |
| `deploy:upgradeable:base` | Deploy to Base Mainnet |
| `upgrade` | Upgrade existing contracts (local) |
| `upgrade:base-sepolia` | Upgrade contracts on Base Sepolia |
| `upgrade:base` | Upgrade contracts on Base Mainnet |
| `setup:multisig` | Setup multi-sig ownership (local) |
| `setup:multisig:base-sepolia` | Setup multi-sig on Base Sepolia |
| `setup:multisig:base` | Setup multi-sig on Base Mainnet |
| `test:upgradeable` | Test upgrade functionality (local) |
| `test:upgradeable:base-sepolia` | Test upgrades on Base Sepolia |

## 🏗️ Architecture

### UUPS Proxy Pattern

The contracts use OpenZeppelin's UUPS proxy pattern:

- **Proxy Contract**: Stores state and delegates calls to implementation
- **Implementation Contract**: Contains the logic that can be upgraded
- **Admin**: Controller that can authorize upgrades

```
User → Proxy Contract → Implementation Contract
         │                     │
         └─── State Storage     └─── Logic & Functions
```

### CrawlNFTUpgradeable

```solidity
contract CrawlNFTUpgradeable is 
    Initializable,
    ERC721Upgradeable, 
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    function initialize(
        string memory name,
        string memory symbol, 
        string memory baseTokenURI
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721Enumerable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        _baseTokenURI = baseTokenURI;
    }
    
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyOwner 
    {}
}
```

### PaymentProcessorUpgradeable

```solidity
contract PaymentProcessorUpgradeable is 
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    function initialize(
        address _usdcToken,
        address _crawlNFTContract
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        usdcToken = IERC20(_usdcToken);
        crawlNFTContract = ICrawlNFT(_crawlNFTContract);
    }
}
```

## 🔐 Security Model

### Multi-Sig Ownership

Production contracts use multi-signature wallets:

- **Threshold**: 2 of 3 signatures required
- **Owners**: Team members with hardware wallets
- **Upgrade Control**: Only multi-sig can authorize upgrades

### Access Control

```solidity
function _authorizeUpgrade(address newImplementation) 
    internal 
    override 
    onlyOwner 
{
    // Only contract owner can authorize upgrades
}
```

### Upgrade Safety

- **Storage Layout**: Preserved across upgrades
- **Function Selectors**: Maintained for compatibility  
- **State Variables**: Cannot be removed, only added
- **Initialization**: Protected against re-initialization

## 🌐 Network Configuration

### Base Sepolia (Testnet)

```json
{
  "chainId": 84532,
  "rpcUrl": "https://sepolia.base.org",
  "usdcToken": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "explorerUrl": "https://sepolia.basescan.org"
}
```

### Base Mainnet (Production)

```json
{
  "chainId": 8453,
  "rpcUrl": "https://mainnet.base.org", 
  "usdcToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "explorerUrl": "https://basescan.org"
}
```

## 📋 Deployment Process

### Phase 1: Initial Deployment

1. Deploy implementation contracts
2. Deploy UUPS proxies
3. Initialize contracts with proper parameters
4. Verify contracts on explorer
5. Save deployment addresses

### Phase 2: Multi-Sig Setup

1. Deploy multi-signature wallet
2. Transfer contract ownership to multi-sig
3. Test multi-sig functionality
4. Document multi-sig procedures

### Phase 3: Upgrade Testing

1. Deploy new implementation
2. Validate upgrade compatibility
3. Execute upgrade through multi-sig
4. Verify state preservation
5. Test new functionality

## 🔄 Upgrade Workflow

### 1. Prepare New Implementation

```bash
# Create new implementation contract
# Update contract logic while preserving storage layout
```

### 2. Validate Upgrade

```typescript
// Validate that the upgrade is safe
await upgrades.validateUpgrade(proxyAddress, NewImplementation);
```

### 3. Execute Upgrade

```typescript
// Upgrade through proxy
await upgrades.upgradeProxy(proxyAddress, NewImplementation);
```

### 4. Verify Upgrade

```bash
# Test upgrade functionality
pnpm run test:upgradeable:base-sepolia
```

## 🧪 Testing

### Automated Tests

The `test-upgradeable.ts` script includes:

- ✅ Initial deployment verification
- ✅ Basic functionality testing
- ✅ Upgrade compatibility validation
- ✅ State preservation checks
- ✅ Access control verification
- ✅ Gas usage analysis

### Test Coverage

- **CrawlNFT**: Minting, soulbound transfers, metadata
- **PaymentProcessor**: USDC integration, payment flows
- **Upgrades**: Proxy functionality, state preservation
- **Access Control**: Owner restrictions, multi-sig requirements

## 🚨 Important Notes

### Storage Layout Rules

```solidity
// ❌ DON'T: Remove or reorder variables
contract V1 {
    uint256 public var1;
    uint256 public var2; // Don't remove this
}

// ✅ DO: Only add new variables at the end
contract V2 {
    uint256 public var1;
    uint256 public var2; // Keep existing variables
    uint256 public var3; // Add new variables at the end
}
```

### Function Selector Preservation

- Keep existing public/external functions
- Can modify internal function logic
- Can add new functions
- Cannot remove or change signatures

### Multi-Sig Best Practices

1. **Hardware Wallets**: Use hardware wallets for all owners
2. **Geographic Distribution**: Distribute owners across locations
3. **Backup Plans**: Maintain secure backup procedures
4. **Testing**: Test multi-sig on testnet before mainnet

## 📚 Resources

- [OpenZeppelin Upgrades](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
- [UUPS Pattern](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable)
- [Base Network](https://docs.base.org/)
- [Hardhat Upgrades](https://hardhat.org/hardhat-upgrades/docs/overview)

## 🆘 Troubleshooting

### Common Issues

1. **Storage Layout Error**: Check variable ordering in upgrades
2. **Access Denied**: Verify contract ownership
3. **Initialization Failed**: Check initializer modifiers
4. **Multi-Sig Failed**: Verify threshold and signatures

### Support

For technical issues:
1. Check deployment logs in `deployments/` folder
2. Verify contract addresses on block explorer
3. Test on Base Sepolia before mainnet deployment
4. Contact team for multi-sig coordination

---

**⚠️ Production Warning**: Always test upgrades on Base Sepolia before deploying to mainnet. Ensure multi-sig is properly configured with trusted signers.
