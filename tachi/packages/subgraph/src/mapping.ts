// Tachi Protocol - Main Subgraph Mappings Entry Point
// This file exports all mapping functions for The Graph Protocol

export {
  handleCrawlRequested,
  handleFeesWithdrawn,
  handleProtocolFeesWithdrawn,
  handleBaseCrawlFeeUpdated,
  handleProtocolFeePercentUpdated,
  handleFeeRecipientUpdated
} from './payment-processor'

export {
  handleLicenseMinted,
  handleTransfer,
  handleBaseURIUpdated
} from './crawl-nft'

// Re-export helper functions for use in other mappings
export * from './helpers'
