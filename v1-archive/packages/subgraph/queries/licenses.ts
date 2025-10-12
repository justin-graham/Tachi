import { gql } from '@apollo/client'

// Get license details
export const GET_LICENSE = gql`
  query GetLicense($id: Bytes!) {
    license(id: $id) {
      id
      tokenId
      domain
      tokenURI
      totalEarnings
      totalCrawls
      averageEarningPerCrawl
      mintedAt
      mintedAtBlock
      mintedTxHash
      lastCrawlAt
      isActive
      publisher {
        id
        totalEarnings
        totalCrawls
      }
    }
  }
`

// Get multiple licenses with pagination
export const GET_LICENSES = gql`
  query GetLicenses($first: Int = 10, $skip: Int = 0, $orderBy: String = "totalEarnings", $orderDirection: String = "desc") {
    licenses(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      tokenId
      domain
      totalEarnings
      totalCrawls
      averageEarningPerCrawl
      mintedAt
      lastCrawlAt
      isActive
      publisher {
        id
      }
    }
  }
`

// Get licenses for a specific publisher
export const GET_PUBLISHER_LICENSES = gql`
  query GetPublisherLicenses($publisherId: Bytes!, $first: Int = 20) {
    licenses(
      where: { publisher: $publisherId }
      first: $first
      orderBy: mintedAt
      orderDirection: desc
    ) {
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
`

// Get top licenses by earnings
export const GET_TOP_LICENSES = gql`
  query GetTopLicenses($first: Int = 10) {
    licenses(
      first: $first
      orderBy: totalEarnings
      orderDirection: desc
      where: { totalEarnings_gt: "0" }
    ) {
      id
      tokenId
      domain
      totalEarnings
      totalCrawls
      averageEarningPerCrawl
      publisher {
        id
      }
    }
  }
`

// Get recently minted licenses
export const GET_RECENT_LICENSES = gql`
  query GetRecentLicenses($first: Int = 10) {
    licenses(
      first: $first
      orderBy: mintedAt
      orderDirection: desc
    ) {
      id
      tokenId
      domain
      mintedAt
      mintedTxHash
      publisher {
        id
      }
    }
  }
`

// Get license activities
export const GET_LICENSE_ACTIVITIES = gql`
  query GetLicenseActivities($licenseId: Bytes!, $first: Int = 20, $skip: Int = 0) {
    licenseActivities(
      where: { license: $licenseId }
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
      requester
    }
  }
`

// Get license daily statistics
export const GET_LICENSE_DAILY_STATS = gql`
  query GetLicenseDailyStats($licenseId: Bytes!, $first: Int = 30) {
    licenseDailyStats(
      where: { license: $licenseId }
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
    }
  }
`

// Search licenses by domain
export const SEARCH_LICENSES = gql`
  query SearchLicenses($domain: String!, $first: Int = 10) {
    licenses(
      where: { domain_contains_nocase: $domain }
      first: $first
      orderBy: totalEarnings
      orderDirection: desc
    ) {
      id
      tokenId
      domain
      totalEarnings
      totalCrawls
      publisher {
        id
      }
    }
  }
`
