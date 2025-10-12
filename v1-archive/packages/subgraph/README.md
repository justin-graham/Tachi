# Tachi Protocol Subgraph

This subgraph indexes all on-chain data for the Tachi Pay-Per-Crawl Protocol, providing a GraphQL API for querying:

- **Publishers** and their earnings
- **Licenses** (NFTs) and crawl activity
- **Crawl Events** and payments
- **Protocol Statistics** and analytics
- **Daily/Hourly Statistics** for trends

## 🌐 Production Endpoints

- **Base Mainnet**: `https://api.studio.thegraph.com/query/tachi-protocol/v1`
- **Base Sepolia**: `https://api.studio.thegraph.com/query/tachi-protocol-sepolia/v1`

## 🚀 Quick Start

### Prerequisites

1. Install The Graph CLI:
```bash
npm install -g @graphprotocol/graph-cli
```

2. Get your API key from [The Graph Studio](https://thegraph.com/studio/)

3. Set environment variable:
```bash
export GRAPH_API_KEY="your_api_key_here"
```

### Deploy Subgraph

```bash
# Deploy to Base Sepolia (testnet)
./deploy.sh base-sepolia

# Deploy to Base Mainnet (production)
./deploy.sh base
```

### Local Development

```bash
# Install dependencies
npm install

# Generate code from schema
npm run codegen

# Build subgraph
npm run build

# Deploy to local Graph Node
npm run deploy:local
```

## 📊 Schema Overview

### Core Entities

- **Publisher**: Wallet addresses that own licenses and receive payments
- **License**: NFTs representing domain crawling rights
- **CrawlEvent**: Individual crawl transactions with payment details
- **Payment**: All payment-related transactions (crawls, withdrawals)
- **ProtocolStats**: Global protocol metrics

### Analytics Entities

- **DailyStats**: Daily aggregated metrics
- **HourlyStats**: Hourly aggregated metrics
- **PublisherDailyStats**: Publisher-specific daily metrics
- **LicenseDailyStats**: License-specific daily metrics
- **CrawlerStats**: Crawler-specific spending metrics

## 🔍 Example Queries

### Get Publisher Earnings

```graphql
query GetPublisher($id: Bytes!) {
  publisher(id: $id) {
    id
    totalEarnings
    totalCrawls
    averageEarningPerCrawl
    licenses {
      id
      domain
      totalEarnings
      totalCrawls
    }
  }
}
```

### Get Recent Crawl Events

```graphql
query GetRecentCrawls($first: Int = 10) {
  crawlEvents(
    first: $first
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    requester
    publisher {
      id
    }
    license {
      domain
    }
    amount
    protocolFee
    targetUrl
    timestamp
  }
}
```

### Get Protocol Statistics

```graphql
query GetProtocolStats {
  protocolStats(id: "0x01") {
    totalVolume
    totalCrawls
    totalProtocolFees
    averageCrawlAmount
    totalPublishers
    totalLicenses
    totalActiveLicenses
  }
}
```

### Get Daily Analytics

```graphql
query GetDailyStats($first: Int = 30) {
  dailyStats(
    first: $first
    orderBy: date
    orderDirection: desc
  ) {
    id
    date
    volume
    crawlCount
    uniquePublishers
    uniqueCrawlers
    averageCrawlAmount
  }
}
```

### Get Top Publishers by Earnings

```graphql
query GetTopPublishers($first: Int = 10) {
  publishers(
    first: $first
    orderBy: totalEarnings
    orderDirection: desc
  ) {
    id
    totalEarnings
    totalCrawls
    averageEarningPerCrawl
    activeLicenses
    licenses {
      domain
      totalEarnings
    }
  }
}
```

### Get Publisher Activity Feed

```graphql
query GetPublisherActivity($publisherId: Bytes!, $first: Int = 20) {
  publisherActivities(
    where: { publisher: $publisherId }
    first: $first
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    type
    description
    amount
    timestamp
    license {
      domain
    }
  }
}
```

## 🏗️ Architecture

### Event Handling

1. **CrawlNFT Contract**:
   - `LicenseMinted`: Creates Publisher and License entities
   - `Transfer`: Tracks NFT transfers (should be rare for soulbound tokens)
   - `BaseURIUpdated`: Updates metadata references

2. **PaymentProcessor Contract**:
   - `CrawlRequested`: Core event creating CrawlEvent and updating all stats
   - `FeesWithdrawn`: Tracks publisher withdrawals
   - `ProtocolFeesWithdrawn`: Tracks protocol fee withdrawals
   - Fee configuration events

### Data Aggregation

- **Real-time**: Updates happen on every event
- **Daily Stats**: Automatically aggregated by day (UTC)
- **Hourly Stats**: Automatically aggregated by hour
- **Publisher/License Stats**: Updated with each crawl event

### Performance Optimizations

- Efficient entity relationships using derived fields
- Pre-calculated averages and totals
- Indexed fields for fast queries
- Pruned historical data (configurable)

## 📈 Dashboard Integration

### Apollo Client Setup

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

const client = new ApolloClient({
  uri: 'https://api.studio.thegraph.com/query/tachi-protocol/v1',
  cache: new InMemoryCache()
})

// Example query
const GET_PROTOCOL_STATS = gql`
  query GetProtocolStats {
    protocolStats(id: "0x01") {
      totalVolume
      totalCrawls
      averageCrawlAmount
    }
  }
`
```

### Real-time Updates

```typescript
// Subscribe to new crawl events
const CRAWL_EVENTS_SUBSCRIPTION = gql`
  subscription OnNewCrawlEvent {
    crawlEvents(
      first: 1
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      requester
      amount
      targetUrl
      timestamp
    }
  }
`
```

## 🔧 Development

### Schema Updates

1. Modify `schema.graphql`
2. Update mapping files in `src/`
3. Run `npm run codegen`
4. Test locally with `npm run deploy:local`
5. Deploy to testnet for validation

### Adding New Events

1. Update contract ABIs in `abis/`
2. Add event handlers in mapping files
3. Update schema if new entities needed
4. Add event to `subgraph.yaml`

### Testing

```bash
# Run unit tests
npm run test

# Test against local Graph Node
npm run deploy:local
```

## 🌍 Network Configurations

### Base Mainnet
- Network: `base`
- Chain ID: 8453
- CrawlNFT: `0x...` (Update with mainnet address)
- PaymentProcessor: `0x...` (Update with mainnet address)

### Base Sepolia
- Network: `base-sepolia`
- Chain ID: 84532
- CrawlNFT: `0xa974E189038f5b0dEcEbfCe7B0A108824acF3813`
- PaymentProcessor: `0x...` (Update when deployed)

## 📚 Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [GraphQL Query Language](https://graphql.org/learn/)
- [Tachi Protocol Documentation](../../../docs/)
