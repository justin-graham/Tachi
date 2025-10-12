# Tachi Protocol Contract Addresses

This document contains the official smart contract addresses for the Tachi Protocol across different networks.

## Base Mainnet (Chain ID: 8453)

> ⚠️ **Production Deployment Status**: Contracts are ready for mainnet deployment but addresses are not yet finalized. Update this document once contracts are deployed to Base mainnet.

### Core Protocol Contracts

| Contract | Address | Status | Purpose |
|----------|---------|--------|---------|
| **CrawlNFT** | `TBD` | 🚧 Pending Deployment | Publisher license NFTs |
| **PaymentProcessor** | `TBD` | 🚧 Pending Deployment | USDC payment handling |
| **ProofOfCrawlLedger** | `TBD` | 🚧 Pending Deployment | On-chain crawl logging |
| **TachiMultiSig** | `TBD` | 🚧 Pending Deployment | Protocol governance |
| **TachiMultiSigFactory** | `TBD` | 🚧 Pending Deployment | Multi-sig deployment |

### Token Contracts

| Token | Address | Status | Purpose |
|-------|---------|--------|---------|
| **USDC** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | ✅ Official | Payment currency |
| **WETH** | `0x4200000000000000000000000000000000000006` | ✅ Official | Wrapped ETH (if needed) |

### Network Information

```javascript
const BASE_MAINNET = {
  chainId: 8453,
  name: 'Base',
  rpcUrl: 'https://mainnet.base.org',
  blockExplorer: 'https://basescan.org',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  }
};
```

---

## Base Sepolia Testnet (Chain ID: 84532)

### Core Protocol Contracts

| Contract | Address | Status | Purpose |
|----------|---------|--------|---------|
| **CrawlNFT** | `0x...` | 🧪 Testnet Deployed | Publisher license NFTs |
| **PaymentProcessor** | `0x...` | 🧪 Testnet Deployed | USDC payment handling |
| **ProofOfCrawlLedger** | `0x...` | 🧪 Testnet Deployed | On-chain crawl logging |
| **TachiMultiSig** | `0x...` | 🧪 Testnet Deployed | Protocol governance |
| **TachiMultiSigFactory** | `0x...` | 🧪 Testnet Deployed | Multi-sig deployment |

### Token Contracts

| Token | Address | Status | Purpose |
|-------|---------|--------|---------|
| **USDC** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | ✅ Official | Payment currency (testnet) |
| **WETH** | `0x4200000000000000000000000000000000000006` | ✅ Official | Wrapped ETH (testnet) |

### Network Information

```javascript
const BASE_SEPOLIA = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  }
};
```

---

## Configuration Examples

### JavaScript/TypeScript SDK

```javascript
// Base Mainnet Configuration
const MAINNET_CONFIG = {
  network: 'base',
  chainId: 8453,
  rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY',
  contracts: {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    crawlNFT: 'TBD', // Update after deployment
    paymentProcessor: 'TBD', // Update after deployment
    proofOfCrawlLedger: 'TBD' // Update after deployment
  }
};

// Base Sepolia Configuration  
const TESTNET_CONFIG = {
  network: 'base-sepolia',
  chainId: 84532,
  rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY',
  contracts: {
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    crawlNFT: '0x...', // Testnet address
    paymentProcessor: '0x...', // Testnet address
    proofOfCrawlLedger: '0x...' // Testnet address
  }
};
```

### Cloudflare Worker Environment Variables

```toml
# wrangler.toml for Base Mainnet
[vars]
NETWORK = "base"
CHAIN_ID = "8453"
BASE_RPC_URL = "https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY"
USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
CRAWL_NFT_ADDRESS = "TBD"
PAYMENT_PROCESSOR_ADDRESS = "TBD"
PROOF_OF_CRAWL_LEDGER_ADDRESS = "TBD"

# wrangler.toml for Base Sepolia
[vars.sepolia]
NETWORK = "base-sepolia"
CHAIN_ID = "84532"
BASE_RPC_URL = "https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
CRAWL_NFT_ADDRESS = "0x..."
PAYMENT_PROCESSOR_ADDRESS = "0x..."
PROOF_OF_CRAWL_LEDGER_ADDRESS = "0x..."
```

### Environment Variables (.env)

```bash
# Base Mainnet
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_CRAWL_NFT_ADDRESS=TBD
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=TBD
NEXT_PUBLIC_PROOF_OF_CRAWL_LEDGER_ADDRESS=TBD

# Base Sepolia
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_CRAWL_NFT_ADDRESS=0x...
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=0x...
NEXT_PUBLIC_PROOF_OF_CRAWL_LEDGER_ADDRESS=0x...
```

---

## Contract ABIs

### Core Contract Interfaces

The protocol uses these key contract interfaces:

#### CrawlNFT
```solidity
interface ICrawlNFT {
    function mintLicense(address publisher, string calldata termsURI) external;
    function hasLicense(address publisher) external view returns (bool);
    function getPublisherTokenId(address publisher) external view returns (uint256);
    function getTermsURI(uint256 tokenId) external view returns (string memory);
    function burn(uint256 tokenId) external;
}
```

#### PaymentProcessor
```solidity
interface IPaymentProcessor {
    function payPublisher(address publisher, uint256 amount) external;
    function payPublisherByNFT(address crawlNFT, uint256 tokenId, uint256 amount) external;
    function getUSDCTokenAddress() external view returns (address);
    
    event Payment(address indexed crawler, address indexed publisher, uint256 amount);
}
```

#### ProofOfCrawlLedger
```solidity
interface IProofOfCrawlLedger {
    function logCrawl(uint256 crawlTokenId, address crawlerAddress) external;
    function getCrawlCount(uint256 crawlTokenId) external view returns (uint256);
    function hasCrawlAccess(uint256 crawlTokenId, address crawlerAddress) external view returns (bool);
    
    event CrawlLogged(uint256 indexed crawlTokenId, address indexed crawler, uint256 timestamp);
}
```

---

## Deployment Checklist

When deploying to Base mainnet, ensure:

### Pre-Deployment
- [ ] All contracts compiled and tested on Base Sepolia
- [ ] Multi-signature wallet setup complete
- [ ] Deployment scripts reviewed and tested
- [ ] Gas estimation completed
- [ ] Sufficient ETH for deployment in deployer wallet

### Deployment Process
- [ ] Deploy CrawlNFT contract
- [ ] Deploy PaymentProcessor contract
- [ ] Deploy ProofOfCrawlLedger contract
- [ ] Deploy TachiMultiSig and Factory contracts
- [ ] Transfer ownership to multi-signature wallet
- [ ] Verify contracts on BaseScan

### Post-Deployment
- [ ] Update this documentation with actual addresses
- [ ] Update SDK configuration files
- [ ] Update Cloudflare Worker templates
- [ ] Update dashboard configuration
- [ ] Announce addresses to community
- [ ] Submit for inclusion in token lists (if applicable)

---

## Security Considerations

### Address Verification

Always verify contract addresses through multiple sources:

1. **Official Documentation** (this file)
2. **BaseScan Contract Verification**
3. **Official Tachi Protocol Announcements**
4. **GitHub Repository Updates**

### Best Practices

- **Never send funds to unverified addresses**
- **Double-check chain ID when switching networks**
- **Verify contract source code on BaseScan**
- **Use official RPCs from trusted providers**
- **Keep private keys secure and never share them**

### Official Communication Channels

- **GitHub**: [Tachi Protocol Repository](https://github.com/tachi-protocol/tachi)
- **Twitter**: [@TachiProtocol](#)
- **Discord**: [Community Server](#)
- **Documentation**: [docs.tachi.ai](#)

---

## Changelog

### Pending Updates

- [ ] Add Base mainnet contract addresses once deployed
- [ ] Update SDK factory functions with mainnet addresses  
- [ ] Update Cloudflare Worker templates
- [ ] Add deployment transaction hashes for verification

### Version History

- **v1.0.0-rc** - Initial documentation with testnet addresses
- **v1.0.0** - To be released with mainnet deployment

---

**⚠️ Important**: This document will be updated immediately after mainnet deployment. Bookmark this page and check for updates before integrating with the protocol.

For the most up-to-date information, always refer to the official [Tachi Protocol documentation](https://docs.tachi.ai) and [GitHub repository](https://github.com/tachi-protocol/tachi).