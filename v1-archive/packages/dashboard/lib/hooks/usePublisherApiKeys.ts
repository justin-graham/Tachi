'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import { ApiClient, useAuth } from '@/hooks/useAuth'
import {
  PublisherApiKeysService,
  type PublisherApiKey,
  type CreateApiKeyResponse,
} from '@/lib/services/publisherApiKeys'
export type { PublisherApiKey, CreateApiKeyResponse } from '@/lib/services/publisherApiKeys'

const API_KEYS_QUERY_KEY = ['publisher', 'api-keys'] as const

function useApiClient(baseUrl = ''): ApiClient {
  const { token } = useAuth()
  return useMemo(() => new ApiClient(baseUrl, token), [baseUrl, token])
}

export function usePublisherApiKeys(): UseQueryResult<PublisherApiKey[]> {
  const apiClient = useApiClient()
  const service = useMemo(() => new PublisherApiKeysService(apiClient), [apiClient])

  return useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: () => service.list(),
    staleTime: 30_000,
  })
}

export function useCreatePublisherApiKey(): UseMutationResult<CreateApiKeyResponse, Error, { name: string }> {
  const apiClient = useApiClient()
  const service = useMemo(() => new PublisherApiKeysService(apiClient), [apiClient])
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name }) => service.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })
    },
  })
}

export function useRevokePublisherApiKey(): UseMutationResult<void, Error, { keyId: string }> {
  const apiClient = useApiClient()
  const service = useMemo(() => new PublisherApiKeysService(apiClient), [apiClient])
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ keyId }) => service.revoke(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })
    },
  })
}
