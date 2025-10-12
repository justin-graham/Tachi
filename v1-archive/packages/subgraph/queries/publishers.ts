import { gql } from '@apollo/client'

// Get publisher details with all related data
export const GET_PUBLISHER = gql`
  query GetPublisher($id: Bytes!) {
    publisher(id: $id) {
      id
      totalEarnings
      totalCrawls
      totalWithdrawn
      activeLicenses
      averageEarningPerCrawl
      firstCrawlAt
      lastCrawlAt
      createdAt
      updatedAt
      licenses {
        id
        tokenId
        domain
        totalEarnings
        totalCrawls
        averageEarningPerCrawl
        mintedAt
        lastCrawlAt
        isActive
      }
    }
  }
`

// Get multiple publishers with pagination
export const GET_PUBLISHERS = gql`
  query GetPublishers($first: Int = 10, $skip: Int = 0, $orderBy: String = "totalEarnings", $orderDirection: String = "desc") {
    publishers(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      totalEarnings
      totalCrawls
      totalWithdrawn
      activeLicenses
      averageEarningPerCrawl
      lastCrawlAt
      licenses {
        id
        domain
        totalEarnings
      }
    }
  }
`

// Get top publishers by earnings
export const GET_TOP_PUBLISHERS = gql`
  query GetTopPublishers($first: Int = 10) {
    publishers(
      first: $first
      orderBy: totalEarnings
      orderDirection: desc
      where: { totalEarnings_gt: "0" }
    ) {
      id
      totalEarnings
      totalCrawls
      averageEarningPerCrawl
      activeLicenses
      licenses {
        domain
        totalEarnings
        totalCrawls
      }
    }
  }
`

// Get publisher activity feed
export const GET_PUBLISHER_ACTIVITIES = gql`
  query GetPublisherActivities($publisherId: Bytes!, $first: Int = 20, $skip: Int = 0) {
    publisherActivities(
      where: { publisher: $publisherId }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      type
      description
      amount
      timestamp
      blockNumber
      transactionHash
      license {
        id
        domain
      }
    }
  }
`

// Get publisher daily statistics
export const GET_PUBLISHER_DAILY_STATS = gql`
  query GetPublisherDailyStats($publisherId: Bytes!, $first: Int = 30) {
    publisherDailyStats(
      where: { publisher: $publisherId }
      first: $first
      orderBy: date
      orderDirection: desc
    ) {
      id
      date
      earnings
      crawlCount
      uniqueCrawlers
      averageEarningPerCrawl
      feesWithdrawn
    }
  }
`

// Search publishers by domain
export const SEARCH_PUBLISHERS_BY_DOMAIN = gql`
  query SearchPublishersByDomain($domain: String!, $first: Int = 10) {
    licenses(
      where: { domain_contains_nocase: $domain }
      first: $first
    ) {
      id
      domain
      totalEarnings
      totalCrawls
      publisher {
        id
        totalEarnings
        totalCrawls
        activeLicenses
      }
    }
  }
`
