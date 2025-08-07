# Tachi Protocol Subgraph Deployment Guide

## Overview
This guide walks you through deploying the Tachi Protocol subgraph to The Graph Network. The subgraph indexes all on-chain data from the Tachi Protocol smart contracts and provides a GraphQL API for querying.

## Prerequisites

1. **Graph Studio Account**: Create an account at [The Graph Studio](https://thegraph.com/studio/)
2. **Deployed Contracts**: Ensure your smart contracts are deployed to the target network
3. **API Key**: Generate an API key from Graph Studio

## Quick Deployment

### 1. Setup Graph Studio

1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Connect your wallet
3. Create a new subgraph:
   - Click "Create a Subgraph"
   - Name: `tachi-protocol`
   - Description: "Tachi Protocol - Pay-per-crawl data indexing"
   - Network: Base Mainnet (or Base Sepolia for testnet)

### 2. Install Graph CLI

```bash
npm install -g @graphprotocol/graph-cli
```

### 3. Authenticate

```bash
graph auth --studio YOUR_API_KEY
```

### 4. Update Contract Addresses

Before deploying, update the contract addresses in the network configuration files:

**For Base Mainnet (`networks/base.json`):**
```json
{
  "crawlNFT": {
    "address": "YOUR_MAINNET_CRAWL_NFT_ADDRESS",
    "startBlock": YOUR_DEPLOYMENT_BLOCK
  },
  "paymentProcessor": {
    "address": "YOUR_MAINNET_PAYMENT_PROCESSOR_ADDRESS", 
    "startBlock": YOUR_DEPLOYMENT_BLOCK
  }
}
```

**For Base Sepolia (`networks/base-sepolia.json`):**
```json
{
  "crawlNFT": {
    "address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    "startBlock": 123456
  },
  "paymentProcessor": {
    "address": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    "startBlock": 123456
  }
}
```

### 5. Deploy to Base Sepolia (Testnet)

```bash
cd /path/to/tachi/packages/subgraph

# Generate network-specific subgraph.yaml
npm run prepare:base-sepolia

# Generate types
npm run codegen

# Build
npm run build

# Deploy
npm run deploy:base-sepolia
```

### 6. Deploy to Base Mainnet (Production)

```bash
# Generate network-specific subgraph.yaml  
npm run prepare:base

# Generate types
npm run codegen

# Build
npm run build

# Deploy
npm run deploy:base
```

## Available Commands

```bash
# Development
npm run codegen          # Generate types from schema and ABIs
npm run build           # Build the subgraph
npm run test           # Run tests (if available)

# Network Preparation
npm run prepare:localhost     # Prepare for local development
npm run prepare:base-sepolia  # Prepare for Base Sepolia testnet
npm run prepare:base         # Prepare for Base Mainnet

# Authentication
npm run auth:testnet    # Authenticate for testnet deployment
npm run auth:mainnet    # Authenticate for mainnet deployment

# Deployment
npm run deploy:localhost      # Deploy to local graph-node
npm run deploy:base-sepolia  # Deploy to Base Sepolia
npm run deploy:base         # Deploy to Base Mainnet
```

## GraphQL API Usage

Once deployed, your subgraph will be available at:
- **Testnet**: `https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/tachi-testnet/v1.0.0`
- **Mainnet**: `https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/tachi-mainnet/v1.0.0`

### Example Queries

**Get Protocol Statistics:**
```graphql
query GetProtocolStats {
  protocolStats(id: "1") {
    totalVolume
    totalCrawls
    totalProtocolFees
    totalLicenses
    totalPublishers
  }
}
```

**Get Recent Crawl Events:**
```graphql
query GetRecentCrawls {
  crawlEvents(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    requester
    amount
    timestamp
    license {
      domain
    }
  }
}
```

**Get Top Publishers:**
```graphql
query GetTopPublishers {
  publishers(first: 10, orderBy: totalEarnings, orderDirection: desc) {
    id
    totalEarnings
    totalCrawls
    licenses {
      domain
      totalEarnings
    }
  }
}
```

## Dashboard Integration

Use the provided Apollo Client configuration and queries for seamless integration with your Next.js dashboard:

```typescript
import { apolloClient, GET_PROTOCOL_STATS } from '@tachi/subgraph/queries'

// In your React component
const { data, loading, error } = useQuery(GET_PROTOCOL_STATS, { client: apolloClient })
```

## Monitoring & Debugging

1. **Graph Studio Dashboard**: Monitor indexing status, query volume, and errors
2. **Logs**: Check subgraph logs for indexing issues
3. **Playground**: Test queries in the Graph Studio playground
4. **Health**: Monitor subgraph health and sync status

## Troubleshooting

### Common Issues

1. **Contract Address Mismatch**
   - Verify contract addresses in network config files
   - Ensure contracts are verified on Etherscan/Basescan

2. **StartBlock Too Early**
   - Use deployment block number or later
   - Avoid scanning unnecessary historical blocks

3. **ABI Mismatch**
   - Ensure ABI files match deployed contracts
   - Re-generate ABIs if contracts were updated

4. **Indexing Errors**
   - Check event signatures match contract events
   - Verify mapping logic handles all event parameters

### Support

- [The Graph Discord](https://discord.gg/graphprotocol)
- [Documentation](https://thegraph.com/docs/)
- [GitHub Issues](https://github.com/graphprotocol/graph-node/issues)

## Next Steps

After successful deployment:

1. **Test queries** in Graph Studio playground
2. **Update dashboard** to use production endpoints
3. **Monitor performance** and optimize queries
4. **Set up alerts** for indexing issues
5. **Plan version updates** for contract upgrades
