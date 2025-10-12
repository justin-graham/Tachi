# Tachi Protocol - Production Readiness Implementation Plan

## 🎯 **Phase 1: Core Infrastructure Hardening (1-2 Weeks)**

### 1. Deploy Production Subgraph ⏱️ Days 1-3

**Current State:** Mock data in dashboard  
**Target:** Real-time on-chain data via The Graph

**Implementation Steps:**
```bash
# 1. Finalize subgraph schema
cd subgraph/
graph init --from-contract 0x[CrawlNFT_ADDRESS] --network base-sepolia

# 2. Deploy to The Graph
graph auth --product hosted-service [ACCESS_TOKEN]
graph deploy --product hosted-service [USERNAME]/tachi-protocol

# 3. Update dashboard to consume subgraph
# Replace all mock data with GraphQL queries
```

**Files to Update:**
- `subgraph/schema.graphql` - Define Payment, CrawlLogged, Publisher entities
- `dashboard/lib/graphql/` - GraphQL queries and Apollo client setup
- `dashboard/hooks/useSubgraph.ts` - Custom hooks for real-time data

---

### 2. Implement Upgradeable Contracts ⏱️ Days 2-4

**Current State:** Non-upgradeable contracts  
**Target:** UUPS proxy pattern with multi-sig governance

**Implementation Steps:**
```solidity
// 1. Convert to UUPS pattern
contract PaymentProcessorV1 is 
    Initializable, 
    UUPSUpgradeable, 
    OwnableUpgradeable {
    
    function initialize(address _usdcToken) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        usdcToken = _usdcToken;
    }
    
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyOwner 
    {}
}
```

**Files to Create:**
- `contracts/PaymentProcessorV1.sol` - Upgradeable payment processor
- `contracts/CrawlNFTV1.sol` - Upgradeable NFT contract
- `scripts/deploy-proxy.ts` - Deployment with OpenZeppelin proxies
- `scripts/upgrade-contracts.ts` - Safe upgrade procedures

---

### 3. Secure Contract Ownership ⏱️ Days 3-5

**Current State:** EOA ownership  
**Target:** Gnosis Safe multi-sig ownership

**Implementation Steps:**
```bash
# 1. Deploy Gnosis Safe
npx hardhat run scripts/deploy-multisig.ts --network base-sepolia

# 2. Transfer ownership
npx hardhat run scripts/transfer-ownership.ts --network base-sepolia

# 3. Verify ownership transfer
npx hardhat run scripts/verify-ownership.ts --network base-sepolia
```

**Multi-sig Configuration:**
- **Signers:** 3 team members
- **Threshold:** 2 of 3 signatures required
- **Emergency contacts:** Pre-approved for time-sensitive operations

---

### 4. Set Up Environments ⏱️ Days 4-6

**Target Environment Structure:**
```
Development:  Local + Base Sepolia
Staging:      Vercel Preview + Base Sepolia  
Production:   Vercel Production + Base Mainnet
```

**Environment Variables by Stage:**

**Vercel Dashboard:**
```bash
# Development
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/[dev-subgraph]

# Staging  
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/[staging-subgraph]

# Production
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/[prod-subgraph]
```

**Cloudflare Worker:**
```bash
# wrangler.toml environments
[env.development]
name = "tachi-gateway-dev"
compatibility_date = "2024-01-01"

[env.staging] 
name = "tachi-gateway-staging"
compatibility_date = "2024-01-01"

[env.production]
name = "tachi-gateway-prod"
compatibility_date = "2024-01-01"
```

---

## 🔒 **Phase 2: Security & Pre-Launch (2-3 Weeks)**

### 1. Commission Security Audit ⏱️ Week 3-4

**Audit Preparation Checklist:**
- [ ] Complete NatSpec documentation for all contracts
- [ ] Finalize test suite (95%+ coverage)
- [ ] Create technical specification document
- [ ] Prepare audit questionnaire responses

**Recommended Auditors:**
- **Tier 1:** Consensys Diligence, OpenZeppelin, Trail of Bits
- **Tier 2:** Quantstamp, CertiK, Hacken
- **Budget:** $15-30k for comprehensive audit

---

### 2. Build Developer Portal ⏱️ Week 4-5

**Core Features:**
```typescript
// Simple developer registration
interface DeveloperAccount {
  email: string;
  companyName: string;
  apiKey: string;
  gasSponsorshipLimit: number;
  monthlySpent: number;
}

// API key management
interface APIKey {
  key: string;
  permissions: Permission[];
  rateLimit: RateLimit;
  createdAt: Date;
  lastUsed: Date;
}
```

**Implementation:**
- **Authentication:** NextAuth.js with Google OAuth
- **API Key Generation:** Secure random strings with rate limiting
- **Usage Tracking:** Integration with Alchemy Paymaster

---

### 3. Gateway Hardening ⏱️ Week 5

**Security Enhancements:**
```typescript
// Rate limiting by API key
const rateLimiter = new Map<string, RateLimit>();

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
};

// Input validation
function validateCrawlRequest(request: CrawlRequest): boolean {
  return (
    isValidURL(request.url) &&
    isValidUserAgent(request.userAgent) &&
    isValidAPIKey(request.apiKey)
  );
}
```

---

### 4. Final Testnet E2E ⏱️ Week 5-6

**Test Scenarios:**
1. **Publisher Onboarding:** Deploy gateway, verify configuration
2. **Crawler Payment:** Full payment flow with gas sponsorship
3. **Content Access:** Verify paywall and content delivery
4. **Multi-user:** Concurrent crawlers and publishers
5. **Edge Cases:** Failed payments, invalid requests, rate limits

---

## 🚀 **Phase 3: Launch (1 Week)**

### 1. Mainnet Deployment ⏱️ Day 1-2

**Deployment Checklist:**
- [ ] Deploy contracts via multi-sig
- [ ] Verify contracts on BaseScan
- [ ] Update subgraph for mainnet
- [ ] Configure production environments
- [ ] Test critical flows on mainnet

### 2. Final Configuration ⏱️ Day 3

**Production Updates:**
- [ ] Update all environment variables
- [ ] Configure Cloudflare DNS
- [ ] Set up monitoring and alerts
- [ ] Enable production logging

### 3. Genesis Publishers ⏱️ Day 4-5

**Target Publishers:**
- 3-5 high-quality content publishers
- Manual onboarding and support
- Custom pricing negotiations if needed

### 4. Public Launch ⏱️ Day 6-7

**Launch Activities:**
- [ ] Public announcement
- [ ] Documentation portal live
- [ ] Community channels active
- [ ] Support processes in place

---

## 📋 **Implementation Priorities**

### **Critical Path Items (Cannot Launch Without):**
1. ✅ Upgradeable contracts deployed
2. ✅ Multi-sig ownership transfer
3. ✅ Security audit completed
4. ✅ Subgraph deployed and integrated

### **Important (Should Have for Launch):**
1. 🔄 Environment separation complete
2. 🔄 Developer portal functional
3. 🔄 Gateway security hardened
4. 🔄 E2E testing completed

### **Nice to Have (Can Ship Post-Launch):**
1. 📋 Advanced monitoring dashboards
2. 📋 SDK documentation portal
3. 📋 Community governance tools
4. 📋 Advanced analytics features

---

## 🎯 **Success Metrics**

### **Week 1-2 Goals:**
- [ ] Contracts deployed with proxy pattern
- [ ] Multi-sig ownership active
- [ ] Subgraph serving real data
- [ ] All environments configured

### **Week 3-5 Goals:**
- [ ] Security audit initiated
- [ ] Developer portal MVP complete
- [ ] Gateway security hardened
- [ ] Testnet E2E tests passing

### **Week 6 Goals:**
- [ ] Mainnet contracts deployed
- [ ] Genesis publishers onboarded
- [ ] Public launch executed
- [ ] Monitoring and support active

---

**Next Step:** Begin with subgraph schema finalization and UUPS contract conversion.
