import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'

// Default subgraph URLs - these will be updated based on deployment
const SUBGRAPH_URLS = {
  // Production URL - will be updated after deployment to The Graph Studio
  mainnet: 'https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/tachi-mainnet/v1.0.0',
  
  // Base Sepolia testnet URL - will be updated after deployment
  testnet: 'https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/tachi-testnet/v1.0.0',
  
  // Local development URL (for testing with graph-node)
  local: 'http://localhost:8000/subgraphs/name/tachi/tachi-protocol'
}

// Determine which network to use based on environment
const getSubgraphUrl = (): string => {
  const env = process.env.NODE_ENV || 'development'
  const network = process.env.NEXT_PUBLIC_NETWORK || 'testnet'
  
  if (env === 'development') {
    return SUBGRAPH_URLS.local
  }
  
  if (network === 'mainnet') {
    return SUBGRAPH_URLS.mainnet
  }
  
  return SUBGRAPH_URLS.testnet
}

// Create HTTP link
const httpLink = createHttpLink({
  uri: getSubgraphUrl()
})

// Apollo Client configuration
const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      // Optimize caching for entities
      Publisher: {
        keyFields: ['id']
      },
      License: {
        keyFields: ['id']
      },
      CrawlEvent: {
        keyFields: ['id']
      },
      Payment: {
        keyFields: ['id']
      },
      DailyStats: {
        keyFields: ['id']
      },
      HourlyStats: {
        keyFields: ['id']
      },
      PublisherActivity: {
        keyFields: ['id']
      },
      LicenseActivity: {
        keyFields: ['id']
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true
    },
    query: {
      errorPolicy: 'all'
    }
  }
})

export default apolloClient

// Export configuration utilities
export { getSubgraphUrl, SUBGRAPH_URLS }
