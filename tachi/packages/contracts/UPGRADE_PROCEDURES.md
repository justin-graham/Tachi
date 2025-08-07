# UUPS Contract Upgrade Procedures

This document outlines the complete procedures for managing UUPS (Universal Upgradeable Proxy Standard) contracts in the Tachi Protocol, including deployment, upgrades, and operational security.

## Overview

The Tachi Protocol implements UUPS upgradeable contracts to enable:
- **Protocol Evolution**: Transition from Pay-Per-Crawl to Pay-Per-Action models
- **Bug Fixes**: Address critical issues without losing contract state
- **Feature Enhancements**: Add new functionality while preserving existing data
- **Security Updates**: Implement security improvements and optimizations

## Contract Architecture

### Upgradeable Contracts
1. **PaymentProcessorUpgradeable** - Handles payment processing and distribution
2. **ProofOfCrawlLedgerUpgradeable** - Maintains immutable crawl logs

### Security Model
- **UUPS Pattern**: Implementation contract controls upgrade authorization
- **Multi-Signature Governance**: Upgrades require multi-sig approval
- **Owner-Only Upgrades**: Only contract owner can authorize upgrades
- **Validation Checks**: OpenZeppelin upgrade validation prevents storage collisions

## Deployment Procedures

### Initial Deployment

#### 1. Deploy PaymentProcessorUpgradeable
```bash
cd /Users/justin/Tachi/tachi/packages/contracts
npx hardhat run scripts/deploy-payment-processor-upgradeable.ts --network base-sepolia
```

**Expected Output:**
```
✅ PaymentProcessorUpgradeable deployed to: 0x[PROXY_ADDRESS]
📋 Implementation address: 0x[IMPLEMENTATION_ADDRESS]
🔑 Proxy admin address: 0x[ADMIN_ADDRESS]
```

#### 2. Deploy ProofOfCrawlLedgerUpgradeable
```bash
npx hardhat run scripts/deploy-proof-of-crawl-ledger-upgradeable.ts --network base-sepolia
```

#### 3. Transfer Ownership to Multi-Sig
After deployment, transfer ownership to the multi-signature wallet:

```typescript
// In Hardhat console or script
const contract = await ethers.getContractAt("PaymentProcessorUpgradeable", PROXY_ADDRESS);
await contract.transferOwnership(MULTI_SIG_ADDRESS);
```

### Deployment Verification Checklist

- [ ] Proxy deployed successfully
- [ ] Implementation address recorded
- [ ] Contract owner set correctly
- [ ] Basic functionality tested
- [ ] Version number verified
- [ ] Multi-sig ownership transferred
- [ ] Deployment addresses saved securely

## Upgrade Procedures

### Pre-Upgrade Checklist

1. **Validate New Implementation**
   ```bash
   npx hardhat compile
   # Ensure no compilation errors
   ```

2. **Run Upgrade Validation**
   ```typescript
   await upgrades.validateUpgrade(PROXY_ADDRESS, NewImplementationFactory);
   ```

3. **Test on Local Network**
   ```bash
   # Deploy to local hardhat network first
   npx hardhat node
   npx hardhat run scripts/deploy-payment-processor-upgradeable.ts --network localhost
   ```

4. **Multi-Sig Preparation**
   - Prepare upgrade transaction data
   - Gather required signatures
   - Verify quorum requirements

### Upgrade Execution

#### Option 1: Direct Upgrade (Single Owner)
```bash
npx hardhat run scripts/upgrade-contracts.ts --network base-sepolia PaymentProcessorUpgradeable 0x[PROXY_ADDRESS]
```

#### Option 2: Multi-Sig Upgrade (Production)

1. **Prepare Upgrade Transaction**
   ```typescript
   import { ethers, upgrades } from "hardhat";
   
   async function prepareUpgrade() {
     const NewImplementation = await ethers.getContractFactory("PaymentProcessorUpgradeable");
     const newImplAddress = await upgrades.prepareUpgrade(PROXY_ADDRESS, NewImplementation);
     console.log("New implementation prepared at:", newImplAddress);
     
     // Generate upgrade call data
     const upgradeData = NewImplementation.interface.encodeFunctionData("upgradeToAndCall", [
       newImplAddress,
       "0x" // No additional call data needed
     ]);
     
     return { newImplAddress, upgradeData };
   }
   ```

2. **Submit to Multi-Sig**
   ```typescript
   // Submit transaction to multi-sig wallet
   const multiSig = await ethers.getContractAt("TachiMultiSig", MULTI_SIG_ADDRESS);
   await multiSig.submitTransaction(
     PROXY_ADDRESS,        // target
     0,                    // value
     upgradeData,          // data
     "Upgrade PaymentProcessor to v2.0.0" // description
   );
   ```

3. **Collect Signatures and Execute**
   ```typescript
   // Each signer confirms the transaction
   await multiSig.confirmTransaction(transactionId);
   
   // Execute when quorum reached
   await multiSig.executeTransaction(transactionId);
   ```

### Post-Upgrade Verification

1. **Verify Implementation Updated**
   ```typescript
   const newImpl = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
   console.log("New implementation:", newImpl);
   ```

2. **Test Contract Functionality**
   ```typescript
   const contract = await ethers.getContractAt("PaymentProcessorUpgradeable", PROXY_ADDRESS);
   
   // Verify version updated
   const version = await contract.getVersion();
   console.log("New version:", version);
   
   // Test core functionality
   const stats = await contract.getContractStats();
   console.log("Contract stats preserved:", stats);
   ```

3. **Verify State Preservation**
   - Check that all previous data is intact
   - Verify counters and mappings are preserved
   - Test both read and write operations

## Emergency Procedures

### Emergency Pause
If critical issues are discovered:

```typescript
// Emergency pause (if implemented)
const contract = await ethers.getContractAt("PaymentProcessorUpgradeable", PROXY_ADDRESS);
await contract.emergencyPause();
```

### Rollback Procedure
In case of upgrade issues:

1. **Prepare Previous Implementation**
   ```typescript
   const PreviousImplementation = await ethers.getContractFactory("PaymentProcessorUpgradeable_v1");
   const rollbackImpl = await upgrades.prepareUpgrade(PROXY_ADDRESS, PreviousImplementation);
   ```

2. **Execute Rollback via Multi-Sig**
   Follow standard upgrade procedure but with previous implementation

### Emergency Multi-Sig Recovery
If multi-sig becomes compromised:

1. **Deploy New Multi-Sig**
2. **Transfer Ownership** (requires current multi-sig)
3. **Update Emergency Contacts**

## Operational Security

### Access Control Matrix

| Role | Permissions | Implementation |
|------|-------------|----------------|
| Contract Owner | Authorize upgrades, transfer ownership | Multi-sig wallet |
| Multi-Sig Signers | Sign upgrade transactions | Individual EOAs |
| Deployer | Deploy new implementations | Development EOA |
| Emergency Admin | Emergency pause (if implemented) | Separate multi-sig |

### Security Best Practices

1. **Upgrade Validation**
   - Always run `upgrades.validateUpgrade()` before deployment
   - Test upgrades on testnets first
   - Verify storage layout compatibility

2. **Multi-Sig Security**
   - Use hardware wallets for signers
   - Implement time delays for upgrades
   - Require multiple confirmations

3. **Implementation Security**
   - Ensure `_authorizeUpgrade()` is properly restricted
   - Validate all new functions are secure
   - Review state variable additions carefully

4. **Monitoring**
   - Monitor upgrade events
   - Set up alerts for ownership changes
   - Track implementation address changes

### Testing Strategy

1. **Unit Tests**
   ```bash
   npx hardhat test test/upgradeable-contracts.test.ts
   ```

2. **Integration Tests**
   ```bash
   npx hardhat test test/upgrade-flow.test.ts
   ```

3. **Testnet Validation**
   ```bash
   # Deploy to Base Sepolia
   npx hardhat run scripts/deploy-all-upgradeable.ts --network base-sepolia
   
   # Test upgrade flow
   npx hardhat run scripts/test-upgrade-flow.ts --network base-sepolia
   ```

## Monitoring and Alerts

### Key Events to Monitor

1. **Upgrade Events**
   ```solidity
   event ContractUpgraded(string previousVersion, string newVersion, address indexed implementation);
   ```

2. **Ownership Changes**
   ```solidity
   event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
   ```

3. **Multi-Sig Events**
   ```solidity
   event TransactionSubmitted(uint256 indexed transactionId, string description);
   event TransactionExecuted(uint256 indexed transactionId);
   ```

### Monitoring Setup

```typescript
// Monitor upgrade events
const contract = new ethers.Contract(PROXY_ADDRESS, ABI, provider);
contract.on("ContractUpgraded", (prevVersion, newVersion, implementation) => {
  console.log(`Contract upgraded from ${prevVersion} to ${newVersion}`);
  console.log(`New implementation: ${implementation}`);
  // Send alert notification
});
```

## Troubleshooting

### Common Issues

1. **Storage Collision**
   - **Symptom**: `upgrades.validateUpgrade()` fails
   - **Solution**: Adjust storage layout in new implementation

2. **Ownership Issues**
   - **Symptom**: Upgrade transaction fails with "Ownable: caller is not the owner"
   - **Solution**: Verify multi-sig is the current owner

3. **Multi-Sig Execution Fails**
   - **Symptom**: Transaction reverts during execution
   - **Solution**: Check quorum, gas limits, and transaction data

### Debug Commands

```bash
# Check proxy details
npx hardhat run scripts/debug-proxy.ts --network base-sepolia 0x[PROXY_ADDRESS]

# Validate upgrade readiness
npx hardhat run scripts/validate-upgrade.ts --network base-sepolia

# Check multi-sig status
npx hardhat run scripts/check-multisig.ts --network base-sepolia
```

## Version Management

### Versioning Strategy
- **Major.Minor.Patch** format (e.g., 1.0.0)
- **Major**: Breaking changes, storage layout changes
- **Minor**: New features, non-breaking changes
- **Patch**: Bug fixes, optimizations

### Version Tracking
```typescript
// Each contract maintains its version
function getVersion() external pure returns (string memory) {
    return "2.1.0";
}
```

### Upgrade Log
Maintain a comprehensive log of all upgrades:

```json
{
  "upgrades": [
    {
      "date": "2024-01-15T10:30:00Z",
      "contractName": "PaymentProcessorUpgradeable",
      "proxyAddress": "0x123...",
      "fromVersion": "1.0.0",
      "toVersion": "1.1.0",
      "implementationAddress": "0x456...",
      "reason": "Add batch payment processing",
      "transactionHash": "0x789..."
    }
  ]
}
```

## Contact Information

### Emergency Contacts
- **Protocol Team**: [contact@tachiprotocol.com]
- **Multi-Sig Signers**: [Listed in emergency procedures]
- **Security Team**: [security@tachiprotocol.com]

### Resources
- **OpenZeppelin Upgrades Documentation**: https://docs.openzeppelin.com/upgrades-plugins/
- **UUPS Pattern Details**: https://eips.ethereum.org/EIPS/eip-1822
- **Hardhat Upgrades Plugin**: https://www.npmjs.com/package/@openzeppelin/hardhat-upgrades

---

**Last Updated**: December 2024
**Document Version**: 1.0.0
**Protocol Version**: 1.0.0
