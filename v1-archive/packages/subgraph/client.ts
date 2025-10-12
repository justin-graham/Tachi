// Apollo Client configuration for Tachi Protocol Subgraph
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

// Subgraph endpoints by network
const SUBGRAPH_ENDPOINTS = {
  base: 'https://api.studio.thegraph.com/query/tachi-protocol/v1',
  'base-sepolia': 'https://api.studio.thegraph.com/query/tachi-protocol-sepolia/v1',
  localhost: 'http://localhost:8000/subgraphs/name/tachi-protocol'
}

// Get the current network from environment or default to sepolia
const network = (process.env.NEXT_PUBLIC_NETWORK as keyof typeof SUBGRAPH_ENDPOINTS) || 'base-sepolia'
const uri = SUBGRAPH_ENDPOINTS[network]

// HTTP Link
const httpLink = createHttpLink({
  uri,
})

// Auth link (if needed for private subgraphs)
const authLink = setContext((_, { headers }) => {
  // Add auth header if API key is available
  const apiKey = process.env.NEXT_PUBLIC_GRAPH_API_KEY
  
  return {
    headers: {
      ...headers,
      ...(apiKey && { authorization: `Bearer ${apiKey}` }),
    }
  }
})

// Error link for handling GraphQL errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      // Log GraphQL errors only in development
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
        )
      }
    })
  }

  if (networkError) {
    // Log network errors only in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Network error: ${networkError}`)
    }
  }
})

// Cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        crawlEvents: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming]
          }
        },
        publishers: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming]
          }
        }
      }
    },
    Publisher: {
      fields: {
        licenses: {
          merge(existing = [], incoming) {
            return incoming
          }
        },
        activities: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming]
          }
        }
      }
    }
  }
})

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
  },
})

// Export useful constants
export { network, uri }
export const isMainnet = network === 'base'
export const isTestnet = network === 'base-sepolia'
export const isLocal = network === 'localhost'
