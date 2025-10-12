// Apollo Client Configuration
export { default as apolloClient, getSubgraphUrl, SUBGRAPH_URLS } from './apollo-client'

// Query exports
export * from './analytics'
export * from './publishers'
export * from './licenses'
export * from './crawl-events'
export * from './payments'

// Re-export gql for convenience
export { gql } from '@apollo/client'
