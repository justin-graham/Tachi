'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import { ApiClient, useAuth } from '@/hooks/useAuth'

export interface PublisherProfile {
  id: string
  userId: string
  name: string
  website?: string | null
  description?: string | null
  contactEmail?: string | null
  pricePerRequest: number
  rateLimitPerHour: number
  termsOfService?: string | null
  status: 'pending' | 'active' | 'suspended' | 'inactive'
  totalEarnings: number
  totalRequests: number
  stripeAccountId?: string | null
  webhookUrl?: string | null
  webhookSecretPreview?: string | null
  webhookRotatedAt?: string | null
  isPaused: boolean
  createdAt: string
  updatedAt: string
}

interface PublisherProfileResponse {
  profile: PublisherProfile
}

export type UpdatePublisherProfileInput = Partial<{
  name: string
  website: string | null
  description: string | null
  contactEmail: string | null
  pricePerRequest: number
  rateLimitPerHour: number
  termsOfService: string | null
}>

const PUBLISHER_PROFILE_QUERY_KEY = ['publisher', 'profile'] as const

function useApiClient(baseUrl = ''): ApiClient {
  const { token } = useAuth()
  return useMemo(() => new ApiClient(baseUrl, token), [baseUrl, token])
}

export function usePublisherProfile(): UseQueryResult<PublisherProfile> {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: PUBLISHER_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get('/api/publishers/profile/me')
      const data = response as PublisherProfileResponse
      return data.profile
    },
    staleTime: 60_000,
  })
}

export function useUpdatePublisherProfile(): UseMutationResult<PublisherProfileResponse, Error, UpdatePublisherProfileInput> {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates) => {
      // The API expects PUT with JSON body
      const response = await apiClient.put('/api/publishers/profile/me', updates)
      return response as PublisherProfileResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PUBLISHER_PROFILE_QUERY_KEY, data.profile)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PUBLISHER_PROFILE_QUERY_KEY })
    },
  })
}
