import { useState, useEffect, useRef } from 'react'
import { usePublicClient, useChainId } from 'wagmi'
import { Address, Log, parseEventLogs } from 'viem'
import { getContractAddresses } from '../contracts/config'
import { PAYMENT_PROCESSOR_ABI, CRAWL_NFT_ABI } from '../contracts/abis'

// Event types from our contracts
export interface CrawlRequestEvent {
  tokenId: bigint
  targetUrl: string
  publisherAmount: bigint
  protocolFee: bigint
  publisher: Address
  requester: Address
  blockNumber: bigint
  transactionHash: string
  logIndex: number
  timestamp?: number
}

export interface PaymentProcessedEvent {
  publisher: Address
  amount: bigint
  blockNumber: bigint
  transactionHash: string
  logIndex: number
  timestamp?: number
}

export interface LicenseIssuedEvent {
  tokenId: bigint
  publisher: Address
  blockNumber: bigint
  transactionHash: string
  timestamp?: number
}

export interface ContractEventFilters {
  publisher?: Address
  requester?: Address
  tokenId?: bigint
  fromBlock?: bigint
  toBlock?: bigint
  enabled?: boolean
}

// Hook for listening to CrawlRequest events
export function useCrawlRequestEvents(filters: ContractEventFilters = {}) {
  const [events, setEvents] = useState<CrawlRequestEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const addresses = getContractAddresses(chainId)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const blockTimestampCacheRef = useRef<Map<bigint, number>>(new Map())

  useEffect(() => {
    if (filters.enabled === false) {
      setEvents([])
      setError(null)
      setIsLoading(true)
      return
    }

    if (!publicClient || !addresses.paymentProcessor) return

    const getBlockTimestamp = async (blockNumber?: bigint | null) => {
      if (blockNumber === undefined || blockNumber === null) return undefined
      const cache = blockTimestampCacheRef.current
      if (cache.has(blockNumber)) {
        return cache.get(blockNumber) as number
      }

      const block = await publicClient.getBlock({ blockNumber })
      const timestamp = Number(block.timestamp)
      cache.set(blockNumber, timestamp)
      return timestamp
    }

    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch logs in chunks to avoid Alchemy free tier limits (10 blocks max)
        const CHUNK_SIZE = 10n
        const fromBlock = filters.fromBlock ?? 0n
        const toBlock = filters.toBlock ?? (await publicClient.getBlockNumber())

        const allLogs: any[] = []
        let currentFrom = typeof fromBlock === 'bigint' ? fromBlock : 0n
        const currentTo = typeof toBlock === 'bigint' ? toBlock : await publicClient.getBlockNumber()

        while (currentFrom <= currentTo) {
          const chunkTo = currentFrom + CHUNK_SIZE - 1n > currentTo ? currentTo : currentFrom + CHUNK_SIZE - 1n

          const logs = await publicClient.getLogs({
            address: addresses.paymentProcessor,
            event: {
              type: 'event',
              name: 'CrawlRequested',
              inputs: [
                { name: 'requester', type: 'address', indexed: true },
                { name: 'publisher', type: 'address', indexed: true },
                { name: 'tokenId', type: 'uint256', indexed: true },
                { name: 'amount', type: 'uint256', indexed: false },
                { name: 'protocolFee', type: 'uint256', indexed: false },
                { name: 'targetUrl', type: 'string', indexed: false }
              ]
            },
            fromBlock: currentFrom,
            toBlock: chunkTo
          })

          allLogs.push(...logs)
          currentFrom = chunkTo + 1n
        }

        const logs = allLogs

        const parsedEvents = parseEventLogs({
          abi: PAYMENT_PROCESSOR_ABI,
          logs: logs as Log[]
        })

        const crawlEvents: CrawlRequestEvent[] = await Promise.all(
          parsedEvents
          .filter(log => log.eventName === 'CrawlRequested')
          .map(async log => ({
            tokenId: log.args.tokenId as bigint,
            targetUrl: log.args.targetUrl as string,
            publisherAmount: log.args.amount as bigint,
            protocolFee: log.args.protocolFee as bigint,
            publisher: log.args.publisher as Address,
            requester: log.args.requester as Address,
            blockNumber: log.blockNumber as bigint,
            transactionHash: log.transactionHash as string,
            logIndex: Number(log.logIndex ?? 0),
            timestamp: await getBlockTimestamp(log.blockNumber as bigint | null)
          }))
        )

        // Apply filters
        const filteredEvents = crawlEvents.filter(event => {
          if (filters.publisher && event.publisher !== filters.publisher) return false
          if (filters.requester && event.requester !== filters.requester) return false
          if (filters.tokenId && event.tokenId !== filters.tokenId) return false
          return true
        })

        setEvents(filteredEvents)
      } catch (err) {
        console.error('Error fetching crawl request events:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()

    // Set up real-time event listener
    const unsubscribe = publicClient.watchEvent({
      address: addresses.paymentProcessor,
      event: {
        type: 'event',
        name: 'CrawlRequested',
        inputs: [
          { name: 'requester', type: 'address', indexed: true },
          { name: 'publisher', type: 'address', indexed: true },
          { name: 'tokenId', type: 'uint256', indexed: true },
          { name: 'amount', type: 'uint256', indexed: false },
          { name: 'protocolFee', type: 'uint256', indexed: false },
          { name: 'targetUrl', type: 'string', indexed: false }
        ]
      },
      onLogs: async (logs) => {
        const parsedEvents = parseEventLogs({
          abi: PAYMENT_PROCESSOR_ABI,
          logs: logs as Log[]
        })

        const newEvents: CrawlRequestEvent[] = await Promise.all(
          parsedEvents
          .filter(log => log.eventName === 'CrawlRequested')
          .map(async log => ({
            tokenId: log.args.tokenId as bigint,
            targetUrl: log.args.targetUrl as string,
            publisherAmount: log.args.amount as bigint,
            protocolFee: log.args.protocolFee as bigint,
            publisher: log.args.publisher as Address,
            requester: log.args.requester as Address,
            blockNumber: log.blockNumber as bigint,
            transactionHash: log.transactionHash as string,
            logIndex: Number(log.logIndex ?? 0),
            timestamp: await getBlockTimestamp(log.blockNumber as bigint | null)
          }))
        )

        // Apply filters and add new events
        const filteredNewEvents = newEvents.filter(event => {
          if (filters.publisher && event.publisher !== filters.publisher) return false
          if (filters.requester && event.requester !== filters.requester) return false
          if (filters.tokenId && event.tokenId !== filters.tokenId) return false
          return true
        })

        if (filteredNewEvents.length > 0) {
          setEvents(prev => [...filteredNewEvents, ...prev])
        }
      }
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe()
    }
  }, [publicClient, addresses.paymentProcessor, chainId, filters.publisher, filters.requester, filters.tokenId, filters.fromBlock, filters.toBlock, filters.enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return { events, isLoading, error }
}

// Hook for listening to PaymentProcessed events
export function usePaymentProcessedEvents(filters: ContractEventFilters = {}) {
  const [events, setEvents] = useState<PaymentProcessedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const addresses = getContractAddresses(chainId)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const blockTimestampCacheRef = useRef<Map<bigint, number>>(new Map())

  useEffect(() => {
    if (filters.enabled === false) {
      setEvents([])
      setError(null)
      setIsLoading(true)
      return
    }

    if (!publicClient || !addresses.paymentProcessor) return

    const getBlockTimestamp = async (blockNumber?: bigint | null) => {
      if (blockNumber === undefined || blockNumber === null) return undefined
      const cache = blockTimestampCacheRef.current
      if (cache.has(blockNumber)) {
        return cache.get(blockNumber) as number
      }

      const block = await publicClient.getBlock({ blockNumber })
      const timestamp = Number(block.timestamp)
      cache.set(blockNumber, timestamp)
      return timestamp
    }

    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch logs in chunks to avoid Alchemy free tier limits (10 blocks max)
        const CHUNK_SIZE = 10n
        const fromBlock = filters.fromBlock ?? 0n
        const toBlock = filters.toBlock ?? (await publicClient.getBlockNumber())

        const allLogs: any[] = []
        let currentFrom = typeof fromBlock === 'bigint' ? fromBlock : 0n
        const currentTo = typeof toBlock === 'bigint' ? toBlock : await publicClient.getBlockNumber()

        while (currentFrom <= currentTo) {
          const chunkTo = currentFrom + CHUNK_SIZE - 1n > currentTo ? currentTo : currentFrom + CHUNK_SIZE - 1n

          const logs = await publicClient.getLogs({
            address: addresses.paymentProcessor,
            event: {
              type: 'event',
              name: 'FeesWithdrawn',
              inputs: [
                { name: 'publisher', type: 'address', indexed: true },
                { name: 'amount', type: 'uint256', indexed: false }
              ]
            },
            fromBlock: currentFrom,
            toBlock: chunkTo
          })

          allLogs.push(...logs)
          currentFrom = chunkTo + 1n
        }

        const logs = allLogs

        const parsedEvents = parseEventLogs({
          abi: PAYMENT_PROCESSOR_ABI,
          logs: logs as Log[]
        })

        const paymentEvents: PaymentProcessedEvent[] = await Promise.all(
          parsedEvents
          .filter(log => log.eventName === 'FeesWithdrawn')
          .map(async log => ({
            publisher: log.args.publisher as Address,
            amount: log.args.amount as bigint,
            blockNumber: log.blockNumber as bigint,
            transactionHash: log.transactionHash as string,
            logIndex: Number(log.logIndex ?? 0),
            timestamp: await getBlockTimestamp(log.blockNumber as bigint | null)
          }))
        )

        const filteredEvents = paymentEvents.filter(event => {
          if (filters.publisher && event.publisher !== filters.publisher) return false
          return true
        })

        setEvents(filteredEvents)
      } catch (err) {
        console.error('Error fetching payment processed events:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()

    // Real-time listener
    const unsubscribe = publicClient.watchEvent({
      address: addresses.paymentProcessor,
      event: {
        type: 'event',
        name: 'FeesWithdrawn',
        inputs: [
          { name: 'publisher', type: 'address', indexed: true },
          { name: 'amount', type: 'uint256', indexed: false }
        ]
      },
      onLogs: async (logs) => {
        const parsedEvents = parseEventLogs({
          abi: PAYMENT_PROCESSOR_ABI,
          logs: logs as Log[]
        })

        const newEvents: PaymentProcessedEvent[] = await Promise.all(
          parsedEvents
          .filter(log => log.eventName === 'FeesWithdrawn')
          .map(async log => ({
            publisher: log.args.publisher as Address,
            amount: log.args.amount as bigint,
            blockNumber: log.blockNumber as bigint,
            transactionHash: log.transactionHash as string,
            logIndex: Number(log.logIndex ?? 0),
            timestamp: await getBlockTimestamp(log.blockNumber as bigint | null)
          }))
        )

        const filteredNewEvents = newEvents.filter(event => {
          if (filters.publisher && event.publisher !== filters.publisher) return false
          return true
        })

        if (filteredNewEvents.length > 0) {
          setEvents(prev => [...filteredNewEvents, ...prev])
        }
      }
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe()
    }
  }, [publicClient, addresses.paymentProcessor, chainId, filters.publisher, filters.fromBlock, filters.toBlock, filters.enabled])

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return { events, isLoading, error }
}

// Hook for listening to License events
export function useLicenseIssuedEvents(filters: ContractEventFilters = {}) {
  const [events, setEvents] = useState<LicenseIssuedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const addresses = getContractAddresses(chainId)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!publicClient || !addresses.crawlNFT) return

    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch logs in chunks to avoid Alchemy free tier limits (10 blocks max)
        const CHUNK_SIZE = 10n
        const fromBlock = filters.fromBlock ?? 0n
        const toBlock = filters.toBlock ?? (await publicClient.getBlockNumber())

        const allLogs: any[] = []
        let currentFrom = typeof fromBlock === 'bigint' ? fromBlock : 0n
        const currentTo = typeof toBlock === 'bigint' ? toBlock : await publicClient.getBlockNumber()

        while (currentFrom <= currentTo) {
          const chunkTo = currentFrom + CHUNK_SIZE - 1n > currentTo ? currentTo : currentFrom + CHUNK_SIZE - 1n

          const logs = await publicClient.getLogs({
            address: addresses.crawlNFT,
            event: {
              name: 'Transfer',
              inputs: [
                { name: 'from', type: 'address', indexed: true },
                { name: 'to', type: 'address', indexed: true },
                { name: 'tokenId', type: 'uint256', indexed: true }
              ]
            },
            fromBlock: currentFrom,
            toBlock: chunkTo
          })

          allLogs.push(...logs)
          currentFrom = chunkTo + 1n
        }

        const logs = allLogs

        const parsedEvents = parseEventLogs({
          abi: CRAWL_NFT_ABI,
          logs: logs as Log[]
        })

        // Filter for minting events (from address 0x0)
        const licenseEvents: LicenseIssuedEvent[] = parsedEvents
          .filter(log =>
            log.eventName === 'Transfer' &&
            log.args.from === '0x0000000000000000000000000000000000000000'
          )
          .map(log => ({
            tokenId: log.args.tokenId as bigint,
            publisher: log.args.to as Address,
            blockNumber: log.blockNumber as bigint,
            transactionHash: log.transactionHash as string
          }))

        const filteredEvents = licenseEvents.filter(event => {
          if (filters.publisher && event.publisher !== filters.publisher) return false
          if (filters.tokenId && event.tokenId !== filters.tokenId) return false
          return true
        })

        setEvents(filteredEvents)
      } catch (err) {
        console.error('Error fetching license issued events:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()

    // Real-time listener for new license mints
    const unsubscribe = publicClient.watchEvent({
      address: addresses.crawlNFT,
      event: {
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'tokenId', type: 'uint256', indexed: true }
        ]
      },
      onLogs: (logs) => {
        const parsedEvents = parseEventLogs({
          abi: CRAWL_NFT_ABI,
          logs: logs as Log[]
        })

        const newEvents: LicenseIssuedEvent[] = parsedEvents
          .filter(log =>
            log.eventName === 'Transfer' &&
            log.args.from === '0x0000000000000000000000000000000000000000'
          )
          .map(log => ({
            tokenId: log.args.tokenId as bigint,
            publisher: log.args.to as Address,
            blockNumber: log.blockNumber as bigint,
            transactionHash: log.transactionHash as string,
            timestamp: Date.now()
          }))

        const filteredNewEvents = newEvents.filter(event => {
          if (filters.publisher && event.publisher !== filters.publisher) return false
          if (filters.tokenId && event.tokenId !== filters.tokenId) return false
          return true
        })

        if (filteredNewEvents.length > 0) {
          setEvents(prev => [...filteredNewEvents, ...prev])
        }
      }
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe()
    }
  }, [publicClient, addresses.crawlNFT, chainId, filters.publisher, filters.tokenId, filters.fromBlock, filters.toBlock])

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return { events, isLoading, error }
}

// Combined hook for all contract events
export function useAllContractEvents(filters: ContractEventFilters = {}) {
  const crawlRequestEvents = useCrawlRequestEvents(filters)
  const paymentProcessedEvents = usePaymentProcessedEvents(filters)
  const licenseIssuedEvents = useLicenseIssuedEvents(filters)

  const isLoading = crawlRequestEvents.isLoading || paymentProcessedEvents.isLoading || licenseIssuedEvents.isLoading
  const hasError = crawlRequestEvents.error || paymentProcessedEvents.error || licenseIssuedEvents.error

  return {
    crawlRequestEvents: crawlRequestEvents.events,
    paymentProcessedEvents: paymentProcessedEvents.events,
    licenseIssuedEvents: licenseIssuedEvents.events,
    isLoading,
    error: hasError
  }
}
