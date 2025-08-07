import { gql } from '@apollo/client'

// Get crawl event details
export const GET_CRAWL_EVENT = gql`
  query GetCrawlEvent($id: Bytes!) {
    crawlEvent(id: $id) {
      id
      license {
        id
        tokenId
        domain
      }
      requester
      amount
      ipfsHash
      timestamp
      blockNumber
      transactionHash
      status
    }
  }
`

// Get crawl events with pagination and filtering
export const GET_CRAWL_EVENTS = gql`
  query GetCrawlEvents(
    $first: Int = 10, 
    $skip: Int = 0, 
    $orderBy: String = "timestamp", 
    $orderDirection: String = "desc",
    $where: CrawlEvent_filter
  ) {
    crawlEvents(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      license {
        id
        tokenId
        domain
      }
      requester
      amount
      ipfsHash
      timestamp
      blockNumber
      transactionHash
      status
    }
  }
`

// Get crawl events for a specific license
export const GET_LICENSE_CRAWL_EVENTS = gql`
  query GetLicenseCrawlEvents($licenseId: Bytes!, $first: Int = 20, $skip: Int = 0) {
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
      ipfsHash
      timestamp
      blockNumber
      transactionHash
      status
    }
  }
`

// Get crawl events by requester
export const GET_REQUESTER_CRAWL_EVENTS = gql`
  query GetRequesterCrawlEvents($requester: Bytes!, $first: Int = 20, $skip: Int = 0) {
    crawlEvents(
      where: { requester: $requester }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      license {
        id
        tokenId
        domain
      }
      amount
      ipfsHash
      timestamp
      blockNumber
      transactionHash
      status
    }
  }
`

// Get recent crawl events
export const GET_RECENT_CRAWL_EVENTS = gql`
  query GetRecentCrawlEvents($first: Int = 10) {
    crawlEvents(
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      license {
        id
        tokenId
        domain
      }
      requester
      amount
      timestamp
      status
    }
  }
`

// Get crawl events by amount range
export const GET_CRAWL_EVENTS_BY_AMOUNT = gql`
  query GetCrawlEventsByAmount($minAmount: BigInt!, $maxAmount: BigInt!, $first: Int = 20) {
    crawlEvents(
      where: { 
        amount_gte: $minAmount
        amount_lte: $maxAmount
      }
      first: $first
      orderBy: amount
      orderDirection: desc
    ) {
      id
      license {
        id
        tokenId
        domain
      }
      requester
      amount
      timestamp
    }
  }
`

// Get crawl events by date range
export const GET_CRAWL_EVENTS_BY_DATE = gql`
  query GetCrawlEventsByDate($startTime: BigInt!, $endTime: BigInt!, $first: Int = 50) {
    crawlEvents(
      where: { 
        timestamp_gte: $startTime
        timestamp_lte: $endTime
      }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      license {
        id
        tokenId
        domain
      }
      requester
      amount
      timestamp
      status
    }
  }
`

// Subscribe to new crawl events
export const SUBSCRIBE_TO_NEW_CRAWL_EVENTS = gql`
  subscription OnNewCrawlEvents {
    crawlEvents(
      first: 10
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      license {
        id
        tokenId
        domain
      }
      requester
      amount
      timestamp
      status
    }
  }
`
