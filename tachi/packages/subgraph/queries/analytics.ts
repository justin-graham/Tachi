import { gql } from '@apollo/client'

// Get protocol-wide statistics
export const GET_PROTOCOL_STATS = gql`
  query GetProtocolStats {
    protocolStats(id: "0x01") {
      id
      totalVolume
      totalCrawls
      totalProtocolFees
      totalProtocolFeesWithdrawn
      baseCrawlFee
      protocolFeePercent
      feeRecipient
      totalPublishers
      totalLicenses
      totalActiveLicenses
      averageCrawlAmount
      firstCrawlAt
      lastCrawlAt
      lastUpdatedAt
    }
  }
`

// Get daily statistics for analytics
export const GET_DAILY_STATS = gql`
  query GetDailyStats($first: Int = 30, $skip: Int = 0) {
    dailyStats(
      first: $first
      skip: $skip
      orderBy: date
      orderDirection: desc
    ) {
      id
      date
      volume
      crawlCount
      uniquePublishers
      uniqueCrawlers
      protocolFees
      averageCrawlAmount
      newLicenses
      newPublishers
    }
  }
`

// Get hourly statistics for real-time charts
export const GET_HOURLY_STATS = gql`
  query GetHourlyStats($first: Int = 24, $skip: Int = 0) {
    hourlyStats(
      first: $first
      skip: $skip
      orderBy: hour
      orderDirection: desc
    ) {
      id
      hour
      volume
      crawlCount
      uniquePublishers
      uniqueCrawlers
      averageCrawlAmount
    }
  }
`

// Get recent crawl events
export const GET_RECENT_CRAWLS = gql`
  query GetRecentCrawls($first: Int = 20, $skip: Int = 0) {
    crawlEvents(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      requester
      publisher {
        id
      }
      license {
        id
        tokenId
        domain
      }
      amount
      protocolFee
      netAmount
      targetUrl
      timestamp
      blockNumber
      transactionHash
      gasPrice
      gasUsed
    }
  }
`

// Get crawl events for a specific publisher
export const GET_PUBLISHER_CRAWLS = gql`
  query GetPublisherCrawls($publisherId: Bytes!, $first: Int = 20, $skip: Int = 0) {
    crawlEvents(
      where: { publisher: $publisherId }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      requester
      license {
        id
        tokenId
        domain
      }
      amount
      protocolFee
      netAmount
      targetUrl
      timestamp
      transactionHash
    }
  }
`

// Get crawl events for a specific license
export const GET_LICENSE_CRAWLS = gql`
  query GetLicenseCrawls($licenseId: Bytes!, $first: Int = 20, $skip: Int = 0) {
    crawlEvents(
      where: { license: $licenseId }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      requester
      amount
      protocolFee
      netAmount
      targetUrl
      timestamp
      transactionHash
    }
  }
`

// Subscribe to new crawl events
export const SUBSCRIBE_TO_CRAWL_EVENTS = gql`
  subscription OnNewCrawlEvents {
    crawlEvents(
      first: 1
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
      targetUrl
      timestamp
    }
  }
`
