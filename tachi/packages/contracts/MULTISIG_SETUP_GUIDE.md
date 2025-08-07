# Gnosis Safe Multisig Setup Guide

This guide walks through setting up a Gnosis Safe multisig wallet for secure contract ownership of the Tachi Protocol.

## 🎯 Overview

- **Purpose**: Replace single private key control with distributed multisig governance
- **Security Benefit**: Requires multiple signatures to execute critical operations
- **Recommended Setup**: 3-of-5 or 2-of-3 multisig for production

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Team member wallet addresses (minimum 3 members)
- [ ] Access to [Gnosis Safe](https://safe.global/) interface
- [ ] Sufficient ETH/BASE tokens for transaction fees
- [ ] Understanding of multisig operations and responsibilities

## 🚀 Step 1: Create Gnosis Safe

### 1.1 Navigate to Gnosis Safe
- Go to [https://safe.global/](https://safe.global/)
- Connect your wallet (MetaMask, WalletConnect, etc.)
- Select **Base Network** for production or **Base Sepolia** for testing

### 1.2 Create New Safe
1. Click **"Create Safe"**
2. Choose **"Create New Safe"**
3. Select the appropriate network (Base/Base Sepolia)

### 1.3 Configure Owners
```
Owner 1: 0x1234...abcd (Team Lead)
Owner 2: 0x5678...efgh (Technical Lead)  
Owner 3: 0x9abc...ijkl (Security Lead)
Owner 4: 0xdef0...mnop (Operations Lead) [Optional]
Owner 5: 0x1357...qrst (Governance Lead) [Optional]
```

### 1.4 Set Threshold
- **For 3 owners**: Use 2-of-3 (requires 2 signatures)
- **For 5 owners**: Use 3-of-5 (requires 3 signatures)
- **Security vs Availability**: Higher thresholds = more secure but slower operations

### 1.5 Deploy Safe
1. Review configuration
2. Pay deployment fee
3. Wait for confirmation
4. **Save the Safe address** - you'll need this for ownership transfer

## 🔒 Step 2: Prepare Current Contracts

### 2.1 Verify Current Ownership
```bash
cd /packages/contracts
npx hardhat run scripts/verify-multisig-ownership.ts --network base
```

### 2.2 Update Configuration
Edit `scripts/transfer-ownership-multisig.ts`:
```typescript
const MULTISIG_CONFIG = {
  MULTISIG_ADDRESS: "0xYourGnosisSafeAddress", // Replace with actual Safe address
  CONTRACTS: {
    crawlNFT: "0xYourCrawlNFTAddress",
    paymentProcessor: "0xYourPaymentProcessorAddress",
  },
  NETWORK: "base", // or "base-sepolia"
};
```

## 🔄 Step 3: Transfer Ownership

### 3.1 Dry Run (Recommended)
Test the transfer on Base Sepolia testnet first:
```bash
npx hardhat run scripts/transfer-ownership-multisig.ts --network base-sepolia
```

### 3.2 Production Transfer
**⚠️ CRITICAL: This action is irreversible!**

Before executing:
- [ ] Verify multisig address is correct
- [ ] Confirm all team members have access to their wallets
- [ ] Test multisig functionality with a small transaction
- [ ] Have emergency procedures ready

Execute transfer:
```bash
npx hardhat run scripts/transfer-ownership-multisig.ts --network base
```

### 3.3 Verify Transfer
```bash
npx hardhat run scripts/verify-multisig-ownership.ts --network base
```

## 🧪 Step 4: Test Multisig Operations

### 4.1 Test Transaction
Perform a non-critical operation to test the multisig:

1. **Propose Transaction** (any owner):
   - Go to Gnosis Safe interface
   - Navigate to "New Transaction"
   - Select "Contract Interaction"
   - Enter contract address and function call

2. **Sign Transaction** (required threshold):
   - Other owners review the transaction
   - Sign via Gnosis Safe interface
   - Execute when threshold is reached

### 4.2 Common Operations to Test
- Update contract metadata (safe operation)
- Call view functions
- Test emergency procedures

## 🚨 Step 5: Emergency Procedures

### 5.1 Emergency Contacts
```
Primary Contact: [Name] - [Phone] - [Email]
Secondary Contact: [Name] - [Phone] - [Email]
Technical Emergency: [Name] - [Phone] - [Email]
```

### 5.2 Emergency Scenarios

#### Scenario 1: Owner Wallet Compromised
1. **Immediate Action**: Remove compromised owner from Safe
2. **How**: Use remaining owners to execute `removeOwner` transaction
3. **Follow-up**: Add new owner address

#### Scenario 2: Multiple Owners Unavailable
1. **Assessment**: Determine if threshold can still be met
2. **If Yes**: Proceed with available owners
3. **If No**: Use emergency recovery procedures (see emergency-recovery.ts)

#### Scenario 3: Multisig Wallet Compromised
1. **Immediate Action**: Execute emergency recovery script
2. **Script**: `emergency-recovery.ts`
3. **Authorization Required**: Protocol governance approval

### 5.3 Emergency Recovery
```bash
# Generate transaction data for emergency transfer
npx hardhat run scripts/emergency-recovery.ts --generate-tx --network base

# Execute emergency recovery (last resort)
npx hardhat run scripts/emergency-recovery.ts --network base
```

## 📋 Step 6: Operational Procedures

### 6.1 Regular Operations

#### Contract Upgrades
1. **Proposal**: Technical team proposes upgrade
2. **Review**: All owners review changes and testing results
3. **Approval**: Submit multisig transaction
4. **Execution**: Meet signature threshold and execute

#### Parameter Changes
1. **Proposal**: Document proposed changes and rationale
2. **Discussion**: Team discussion in secure channel
3. **Approval**: Submit multisig transaction with clear description
4. **Execution**: Coordinate timing for execution

### 6.2 Security Best Practices

#### For Multisig Owners
- [ ] Use hardware wallets when possible
- [ ] Keep backup of seed phrases in secure, separate locations
- [ ] Regularly verify Safe configuration
- [ ] Stay informed about protocol operations
- [ ] Never share private keys or seed phrases

#### For Operations
- [ ] Always verify transaction details before signing
- [ ] Use clear, descriptive transaction names
- [ ] Document all multisig operations
- [ ] Coordinate critical operations timing
- [ ] Have rollback plans for upgrades

## 🔧 Step 7: Monitoring & Maintenance

### 7.1 Regular Checks
- **Weekly**: Verify multisig configuration
- **Monthly**: Test emergency procedures
- **Quarterly**: Review and update owner list if needed

### 7.2 Monitoring Script
Set up automated monitoring:
```bash
# Add to cron job or CI/CD pipeline
npx hardhat run scripts/verify-multisig-ownership.ts --network base
```

### 7.3 Documentation Updates
Keep this documentation updated with:
- Current Safe address
- Current owner addresses
- Updated emergency contacts
- Lessons learned from operations

## 📞 Support & Resources

### Gnosis Safe Resources
- [Gnosis Safe Documentation](https://docs.safe.global/)
- [Safe Transaction Service API](https://docs.safe.global/safe-core-api/available-services)
- [Community Support](https://help.safe.global/)

### Tachi Protocol Resources
- Emergency Procedures: `SECURE_OWNERSHIP_GUIDE.md`
- Recovery Scripts: `scripts/emergency-recovery.ts`
- Verification Tools: `scripts/verify-multisig-ownership.ts`

## ✅ Post-Setup Checklist

After completing the multisig setup:

- [ ] All contracts owned by multisig wallet
- [ ] Multisig configuration verified
- [ ] Test transaction successfully executed
- [ ] Emergency procedures documented and tested
- [ ] All team members trained on multisig operations
- [ ] Monitoring scripts deployed
- [ ] Documentation updated with actual addresses and contacts

---

**⚠️ Remember**: Multisig security is only as strong as its weakest link. Ensure all owners understand their responsibilities and maintain proper security practices.
