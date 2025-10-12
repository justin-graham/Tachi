'use client'

import { useMemo } from 'react'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { ApiClient, useAuth } from '@/hooks/useAuth'

export interface BillingBalance {
  onChainBalance: string
  onChainBalanceWei: string
  pendingWithdrawal: string
  pendingWithdrawalWei: string
  totalEarnings: number
  totalRequests: number
  availableToWithdraw: string
  lockedInEscrow: string
  walletAddress: string | null
  lastUpdated: string | Date
}

export interface BillingTransaction {
  id: string
  type: 'earning' | 'withdrawal'
  amount: number
  amountEth?: number
  status: 'completed' | 'pending' | 'failed'
  crawlerAddress?: string | null
  crawlerName?: string | null
  url?: string | null
  txHash?: string | null
  blockNumber?: number | null
  createdAt: string
  completedAt?: string | null
  notes?: Record<string, any> | null
}

export interface BillingHistorySummary {
  totalEarnings: number
  totalWithdrawals: number
  pendingWithdrawals: number
  transactionCount: number
}

export interface BillingHistory {
  transactions: BillingTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: BillingHistorySummary
}

export interface PaymentHistoryFilters {
  page?: number
  limit?: number
  type?: 'all' | 'earnings' | 'withdrawals'
  startDate?: string
  endDate?: string
}

const BILLING_BALANCE_QUERY_KEY = ['publisher', 'billing', 'balance'] as const
const BILLING_HISTORY_QUERY_KEY = ['publisher', 'billing', 'history'] as const

function useApiClient(baseUrl = ''): ApiClient {
  const { token } = useAuth()
  return useMemo(() => new ApiClient(baseUrl, token), [baseUrl, token])
}

export function useBillingBalance(): UseQueryResult<BillingBalance> {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: BILLING_BALANCE_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get('/api/payments/balance')
      const data = response as BillingBalance
      return data
    },
    staleTime: 60_000,
  })
}

export function usePaymentHistory(filters: PaymentHistoryFilters = {}): UseQueryResult<BillingHistory> {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: [BILLING_HISTORY_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.type) params.set('type', filters.type)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const response = await apiClient.get(`/api/payments/history${queryString}`)
      return response as BillingHistory
    },
    staleTime: 60_000,
  })
}
