import { useEffect, useMemo, useState } from 'react'
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import { useCrawlRequestEvents } from './useContractEvents'
import { usePublisherBalance, formatUSDC } from '../contracts/hooks'

export interface DashboardStats {
  revenue: number
  requests: number
  avgPerRequest: number
  uptime: number
  last7DaysRevenue: number[]
  revenueChange: number
  requestsChange: number
  avgChange: number
  uptimeChange: number
  avgRevenue: number
  recentCrawls: Array<{
    time: string
    crawler: string
    amount: number
    txHash: string
    blockNumber: string
  }>
  contractInfo: {
    address: string
    network: string
    currentRate: number
    origin: string
  }
  isLoading: boolean
  error: Error | null
}

export function useDashboardData(): DashboardStats {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const [fromBlock, setFromBlock] = useState<bigint | null | undefined>(undefined)

  useEffect(() => {
    let isCancelled = false

    const deriveFromBlock = async () => {
      if (!publicClient) {
        setFromBlock(undefined)
        return
      }

      try {
        const latestBlock = await publicClient.getBlock({ blockTag: 'latest' })

        if (!latestBlock?.number || latestBlock.timestamp === undefined) {
          if (!isCancelled) setFromBlock(null)
          return
        }

        // Reduced from 7 days to 1 hour due to Alchemy free tier limits (10 blocks max per request)
        // 7 days = ~302k blocks on Base, which would require 30k API calls
        // 1 hour = ~1800 blocks on Base, which requires 180 API calls
        const oneHourInSeconds = 60 * 60
        const targetTimestamp = Number(latestBlock.timestamp) - oneHourInSeconds

        if (targetTimestamp <= 0) {
          if (!isCancelled) setFromBlock(0n)
          return
        }

        const timestampCache = new Map<bigint, number>()
        timestampCache.set(latestBlock.number, Number(latestBlock.timestamp))

        const getBlockTimestamp = async (blockNumber: bigint) => {
          if (timestampCache.has(blockNumber)) {
            return timestampCache.get(blockNumber) as number
          }

          const block = await publicClient.getBlock({ blockNumber })
          const timestamp = Number(block.timestamp)
          timestampCache.set(blockNumber, timestamp)
          return timestamp
        }

        let low = 0n
        let high = latestBlock.number
        let candidate = 0n

        while (low <= high) {
          const mid = low + (high - low) / 2n
          const timestamp = await getBlockTimestamp(mid)

          if (timestamp > targetTimestamp) {
            if (mid === 0n) {
              break
            }
            high = mid - 1n
          } else {
            candidate = mid
            low = mid + 1n
          }
        }

        if (!isCancelled) {
          setFromBlock(candidate)
        }
      } catch (error) {
        console.error('Failed to derive dashboard block window:', error)
        if (!isCancelled) {
          setFromBlock(null)
        }
      }
    }

    deriveFromBlock()

    return () => {
      isCancelled = true
    }
  }, [publicClient])

  const crawlRequestFilters = useMemo(() => ({
    publisher: address,
    fromBlock: fromBlock ?? undefined,
    enabled: !!address && fromBlock !== undefined
  }), [address, fromBlock])

  // Fetch blockchain events for this publisher
  const { 
    events: crawlRequestEvents, 
    isLoading: crawlRequestsLoading, 
    error: crawlRequestsError 
  } = useCrawlRequestEvents(crawlRequestFilters)

  const { 
    data: publisherBalance, 
    isLoading: balanceLoading 
  } = usePublisherBalance(address, chainId)

  // Process blockchain data into dashboard metrics
  const dashboardData = useMemo(() => {
    const isLoading = crawlRequestsLoading || balanceLoading
    const error = crawlRequestsError || null

    if (isLoading || !address) {
      return {
        revenue: 0,
        requests: 0,
        avgPerRequest: 0,
        uptime: 0,
        last7DaysRevenue: [0, 0, 0, 0, 0, 0, 0],
        revenueChange: 0,
        requestsChange: 0,
        avgChange: 0,
        uptimeChange: 0,
        avgRevenue: 0,
        recentCrawls: [],
        contractInfo: {
          address: '0x0000...0000',
          network: chainId === 8453 ? 'Base Mainnet' : 'Unknown Network',
          currentRate: 0,
          origin: 'api.tachi.com'
        },
        isLoading: true,
        error: null
      }
    }

    // Calculate total revenue from payment events
    const totalRevenue = crawlRequestEvents.reduce((sum, event) => {
      const publisherAmount = parseFloat(formatUSDC(event.publisherAmount))
      return sum + publisherAmount
    }, 0)

    // Add current balance to revenue (earned but not withdrawn)
    const currentBalance = publisherBalance ? parseFloat(formatUSDC(publisherBalance)) : 0
    const totalEarnings = totalRevenue + currentBalance

    // Calculate request metrics
    const totalRequests = crawlRequestEvents.length
    const avgPerRequest = totalRequests > 0 ? totalEarnings / totalRequests : 0

    const now = Date.now()

    const buildDailyArray = <T>(mapper: (dayStart: number, dayEnd: number) => T, fallback: T): T[] => {
      const values: T[] = []
      for (let i = 6; i >= 0; i--) {
        const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000
        const dayEnd = now - i * 24 * 60 * 60 * 1000
        values.push(mapper(dayStart, dayEnd))
      }
      return values.length ? values : Array(7).fill(fallback)
    }

    const dailyRevenue = buildDailyArray((dayStart, dayEnd) => {
      return crawlRequestEvents
        .filter(event => {
          const eventTime = (event.timestamp || 0) * 1000
          return eventTime >= dayStart && eventTime < dayEnd
        })
        .reduce((sum, event) => sum + parseFloat(formatUSDC(event.publisherAmount)), 0)
    }, 0)

    const dailyRequests = buildDailyArray((dayStart, dayEnd) => {
      return crawlRequestEvents.filter(event => {
        const eventTime = (event.timestamp || 0) * 1000
        return eventTime >= dayStart && eventTime < dayEnd
      }).length
    }, 0)

    const dailySuccesses = dailyRequests

    const avgRevenue = dailyRevenue.reduce((sum, day) => sum + day, 0) / (dailyRevenue.length || 1)

    const lastTwo = (values: number[]) => {
      const current = values[values.length - 1] ?? 0
      const previous = values[values.length - 2] ?? 0
      return { current, previous }
    }

    const percentChange = (current: number, previous: number) => {
      if (previous <= 0) return 0
      return ((current - previous) / previous) * 100
    }

    const { current: revenueToday, previous: revenueYesterday } = lastTwo(dailyRevenue)
    const { current: requestsToday, previous: requestsYesterday } = lastTwo(dailyRequests)
    const { current: successToday, previous: successYesterday } = lastTwo(dailySuccesses)

    const revenueChange = percentChange(revenueToday, revenueYesterday)
    const requestsChange = percentChange(requestsToday, requestsYesterday)

    const avgToday = requestsToday > 0 ? revenueToday / requestsToday : 0
    const avgYesterday = requestsYesterday > 0 ? revenueYesterday / requestsYesterday : 0
    const avgChange = percentChange(avgToday, avgYesterday)

    const totalSuccessfulRequests = crawlRequestEvents.length
    const uptime = totalRequests > 0 ? (totalSuccessfulRequests / totalRequests) * 100 : 0
    const uptimeToday = requestsToday > 0 ? (successToday / requestsToday) * 100 : uptime
    const uptimeYesterday = requestsYesterday > 0 ? (successYesterday / requestsYesterday) * 100 : uptime
    const uptimeChange = percentChange(uptimeToday, uptimeYesterday)

    // Format recent crawl requests
    const recentCrawls = crawlRequestEvents
      .slice(0, 5) // Get last 5 requests
      .map(event => ({
        time: event.timestamp 
          ? new Date(event.timestamp * 1000).toLocaleTimeString()
          : new Date().toLocaleTimeString(),
        crawler: `${event.requester.slice(0, 6)}...${event.requester.slice(-4)}`,
        amount: parseFloat(formatUSDC(event.publisherAmount)),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber.toString()
      }))

    return {
      revenue: totalEarnings,
      requests: totalRequests,
      avgPerRequest,
      uptime,
      last7DaysRevenue: dailyRevenue,
      revenueChange,
      requestsChange,
      avgChange,
      uptimeChange,
      avgRevenue,
      recentCrawls,
      contractInfo: {
        address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x0000...0000',
        network: chainId === 8453 ? 'Base Mainnet' : `Network ${chainId}`,
        currentRate: avgPerRequest,
        origin: 'api.tachi.com'
      },
      isLoading: false,
      error
    }
  }, [
    crawlRequestEvents, 
    publisherBalance, 
    address, 
    chainId,
    crawlRequestsLoading,
    balanceLoading,
    crawlRequestsError
  ])

  return dashboardData
}
