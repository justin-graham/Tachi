import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useSearchParams } from 'next/navigation'
import { showApiError } from '../toast'

interface CrawlLog {
  id: string
  gatewayId: string
  timestamp: string
  ipAddress: string
  userAgent: string
  requestPath: string
  responseStatus: number
  responseTime: number
  paymentAmount: string
  paymentStatus: 'success' | 'failed' | 'pending'
  crawlerType: 'openai' | 'anthropic' | 'google' | 'unknown'
}

interface DailyStats {
  date: string
  totalRequests: number
  successfulRequests: number
  revenue: string
  uniqueVisitors: number
  averageResponseTime: number
}

interface AnalyticsData {
  totalRequests: number
  totalRevenue: string
  averagePrice: string
  successRate: number
  topCrawlers: Array<{
    name: string
    requests: number
    revenue: string
  }>
  dailyStats: DailyStats[]
  recentLogs: CrawlLog[]
}

interface StatsFilters {
  gatewayId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export function useCrawlStats(filters: StatsFilters = {}) {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  
  // Build query params from filters
  const queryParams = new URLSearchParams()
  if (filters.gatewayId) queryParams.set('gatewayId', filters.gatewayId)
  if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) queryParams.set('dateTo', filters.dateTo)
  if (filters.page) queryParams.set('page', filters.page.toString())
  if (filters.limit) queryParams.set('limit', filters.limit.toString())
  
  // Main analytics query
  const { 
    data: analytics, 
    isLoading: isLoadingAnalytics,
    error: analyticsError 
  } = useQuery({
    queryKey: ['analytics', address, queryParams.toString()],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!address || !isConnected) {
        return {
          totalRequests: 0,
          totalRevenue: '0',
          averagePrice: '0',
          successRate: 0,
          topCrawlers: [],
          dailyStats: [],
          recentLogs: []
        }
      }
      
      const response = await fetch(`/api/stats/${address}?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      
      return response.json()
    },
    enabled: isConnected && !!address,
    staleTime: 60000, // 1 minute
    retry: 2,
    onError: (error) => {
      console.error('Analytics fetch error:', error)
      showApiError('Analytics data fetch', error instanceof Error ? error.message : 'Unknown error')
    }
  })
  
  // Detailed logs query (separate for performance)
  const { 
    data: logs, 
    isLoading: isLoadingLogs,
    error: logsError 
  } = useQuery({
    queryKey: ['crawl-logs', address, queryParams.toString()],
    queryFn: async (): Promise<{ logs: CrawlLog[], total: number }> => {
      if (!address || !isConnected) return { logs: [], total: 0 }
      
      const response = await fetch(`/api/logs/${address}?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch crawl logs')
      
      return response.json()
    },
    enabled: isConnected && !!address,
    staleTime: 30000, // 30 seconds
    retry: 2,
    onError: (error) => {
      console.error('Crawl logs fetch error:', error)
      showApiError('Crawl logs fetch', error instanceof Error ? error.message : 'Unknown error')
    }
  })
  
  // Real-time stats query (polls every 30 seconds)
  const { 
    data: realtimeStats,
    isLoading: isLoadingRealtime 
  } = useQuery({
    queryKey: ['realtime-stats', address],
    queryFn: async (): Promise<{
      activeRequests: number
      requestsLastHour: number
      revenueLastHour: string
    }> => {
      if (!address || !isConnected) {
        return {
          activeRequests: 0,
          requestsLastHour: 0,
          revenueLastHour: '0'
        }
      }
      
      const response = await fetch(`/api/stats/realtime/${address}`)
      if (!response.ok) throw new Error('Failed to fetch realtime stats')
      
      return response.json()
    },
    enabled: isConnected && !!address,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 15000, // 15 seconds
    retry: 1,
    onError: (error) => {
      console.error('Realtime stats fetch error:', error)
      // Don't show toast for realtime errors as they're frequent
    }
  })
  
  // Export data function
  const exportData = async (format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected')
    }
    
    const response = await fetch(`/api/export/${address}?format=${format}&${queryParams}`)
    if (!response.ok) throw new Error('Failed to export data')
    
    return response.blob()
  }
  
  // Utility functions
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', address] })
    queryClient.invalidateQueries({ queryKey: ['crawl-logs', address] })
    queryClient.invalidateQueries({ queryKey: ['realtime-stats', address] })
  }
  
  const getFilteredStats = (gatewayId?: string): AnalyticsData | undefined => {
    if (!analytics || !gatewayId) return analytics
    
    // Filter analytics data by gateway
    return {
      ...analytics,
      dailyStats: analytics.dailyStats,
      recentLogs: analytics.recentLogs.filter(log => log.gatewayId === gatewayId)
    }
  }
  
  return {
    // Data
    analytics,
    logs: logs?.logs || [],
    totalLogs: logs?.total || 0,
    realtimeStats,
    
    // Loading states
    isLoadingAnalytics,
    isLoadingLogs,
    isLoadingRealtime,
    isLoading: isLoadingAnalytics || isLoadingLogs,
    
    // Connection state
    isConnected,
    
    // Errors
    analyticsError,
    logsError,
    
    // Actions
    exportData,
    refreshData,
    getFilteredStats,
    
    // Current filters
    filters,
  }
}

// Hook for URL-based filters (for pagination, etc.)
export function useCrawlStatsWithURLFilters() {
  const searchParams = useSearchParams()
  
  const filters: StatsFilters = {
    gatewayId: searchParams.get('gateway') || undefined,
    dateFrom: searchParams.get('from') || undefined,
    dateTo: searchParams.get('to') || undefined,
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 50,
  }
  
  return useCrawlStats(filters)
}