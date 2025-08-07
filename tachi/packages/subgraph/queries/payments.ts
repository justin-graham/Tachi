import { gql } from '@apollo/client'

// Get payment details
export const GET_PAYMENT = gql`
  query GetPayment($id: Bytes!) {
    payment(id: $id) {
      id
      license {
        id
        tokenId
        domain
      }
      requester
      amount
      protocolFee
      publisherEarning
      timestamp
      blockNumber
      transactionHash
      type
    }
  }
`

// Get payments with pagination and filtering
export const GET_PAYMENTS = gql`
  query GetPayments(
    $first: Int = 10, 
    $skip: Int = 0, 
    $orderBy: String = "timestamp", 
    $orderDirection: String = "desc",
    $where: Payment_filter
  ) {
    payments(
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
      protocolFee
      publisherEarning
      timestamp
      blockNumber
      transactionHash
      type
    }
  }
`

// Get payments for a specific license
export const GET_LICENSE_PAYMENTS = gql`
  query GetLicensePayments($licenseId: Bytes!, $first: Int = 20, $skip: Int = 0) {
    payments(
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
      publisherEarning
      timestamp
      blockNumber
      transactionHash
      type
    }
  }
`

// Get payments by requester
export const GET_REQUESTER_PAYMENTS = gql`
  query GetRequesterPayments($requester: Bytes!, $first: Int = 20, $skip: Int = 0) {
    payments(
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
      protocolFee
      publisherEarning
      timestamp
      type
    }
  }
`

// Get payments by publisher
export const GET_PUBLISHER_PAYMENTS = gql`
  query GetPublisherPayments($publisherId: Bytes!, $first: Int = 20, $skip: Int = 0) {
    payments(
      where: { license_: { publisher: $publisherId } }
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
      requester
      amount
      protocolFee
      publisherEarning
      timestamp
      type
    }
  }
`

// Get recent payments
export const GET_RECENT_PAYMENTS = gql`
  query GetRecentPayments($first: Int = 10) {
    payments(
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
      publisherEarning
      timestamp
      type
    }
  }
`

// Get payments by amount range
export const GET_PAYMENTS_BY_AMOUNT = gql`
  query GetPaymentsByAmount($minAmount: BigInt!, $maxAmount: BigInt!, $first: Int = 20) {
    payments(
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
      publisherEarning
      timestamp
      type
    }
  }
`

// Get total earnings for a publisher
export const GET_PUBLISHER_TOTAL_EARNINGS = gql`
  query GetPublisherTotalEarnings($publisherId: Bytes!) {
    publisher(id: $publisherId) {
      id
      totalEarnings
      totalCrawls
      licenses {
        id
        totalEarnings
        totalCrawls
      }
    }
  }
`

// Get payment statistics
export const GET_PAYMENT_STATS = gql`
  query GetPaymentStats {
    protocolStats(id: "1") {
      totalPayments
      totalRevenue
      totalProtocolFees
      totalPublisherEarnings
      averagePaymentAmount
    }
  }
`
