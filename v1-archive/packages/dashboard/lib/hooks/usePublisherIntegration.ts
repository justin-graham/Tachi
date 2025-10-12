'use client'

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import { ApiClient, useAuth } from '@/hooks/useAuth'

interface WebhookConfig {
  webhookUrl: string | null
  hasSecret: boolean
  secretPreview: string | null
  lastRotatedAt: string | null
}

interface WebhookUpdateResponse {
  webhookUrl: string | null
  secretPreview: string | null
  lastRotatedAt: string | null
  rotatedSecret?: string
}

interface WebhookTestResponse {
  status: 'success' | 'failed'
  statusCode: number | null
  latencyMs: number
  responseBody: any
  error?: string
}

interface CodeSnippetResponse {
  language: string
  snippet: string
}

interface PlaygroundPayload {
  targetUrl: string
  format: 'markdown' | 'html' | 'text' | 'json'
  amount: string
  apiKey: string
  maxWaitSeconds?: number
}

interface PlaygroundResponse {
  status: 'completed' | 'failed' | 'pending'
  upstreamStatus: number
  elapsedMs: number
  response: any
  error?: string
  transactionHash?: string
}

interface PublisherStatusResponse {
  isPaused: boolean
  status: 'pending' | 'active' | 'suspended' | 'inactive'
}

interface DeleteRequestResponse {
  success: boolean
  message: string
}

interface WithdrawalResponse {
  success: boolean
  status: 'completed' | 'pending'
  transactionHash?: string
  amount: string
  toAddress: string
}

const WEBHOOK_QUERY_KEY = ['publisher', 'integration', 'webhook'] as const
const CODE_SNIPPET_QUERY_KEY = ['publisher', 'integration', 'snippet'] as const

function useApiClient(baseUrl = ''): ApiClient {
  const { token } = useAuth()
  return useMemo(() => new ApiClient(baseUrl, token), [baseUrl, token])
}

export function useWebhookConfig(): UseQueryResult<WebhookConfig> {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: WEBHOOK_QUERY_KEY,
    queryFn: async () => apiClient.getWebhookConfig() as Promise<WebhookConfig>,
    staleTime: 60_000,
  })
}

export function useUpdateWebhookConfig(): UseMutationResult<WebhookUpdateResponse, Error, { webhookUrl?: string | null; secret?: string | null; rotateSecret?: boolean }> {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => apiClient.updateWebhookConfig(payload) as Promise<WebhookUpdateResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_QUERY_KEY })
    },
  })
}

export function useTestWebhook(): UseMutationResult<WebhookTestResponse, Error, { payload?: Record<string, any>; method?: 'POST' | 'PUT' }> {
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: (payload) => apiClient.testWebhook(payload) as Promise<WebhookTestResponse>,
  })
}

export function useCodeSnippet(language: string): UseQueryResult<CodeSnippetResponse> {
  const apiClient = useApiClient()

  return useQuery({
    queryKey: [...CODE_SNIPPET_QUERY_KEY, language],
    queryFn: async () => apiClient.getCodeSnippet(language) as Promise<CodeSnippetResponse>,
    staleTime: 60_000,
  })
}

export function usePlayground(): UseMutationResult<PlaygroundResponse, Error, PlaygroundPayload> {
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: (payload) => apiClient.runPlayground(payload) as Promise<PlaygroundResponse>,
  })
}

export function useUpdatePublisherStatus(): UseMutationResult<PublisherStatusResponse, Error, { action: 'pause' | 'resume' }> {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ action }) => apiClient.updatePublisherStatus(action) as Promise<PublisherStatusResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['publisher', 'profile'] })
    },
  })
}

export function useDeletePublisherRequest(): UseMutationResult<DeleteRequestResponse, Error, { reason?: string }> {
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: ({ reason }) => apiClient.requestAccountDeletion(reason) as Promise<DeleteRequestResponse>,
  })
}

export function useWithdrawalRequest(): UseMutationResult<WithdrawalResponse, Error, { amount: string; toAddress: string }> {
  const apiClient = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => apiClient.requestWithdrawal(payload) as Promise<WithdrawalResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publisher', 'billing', 'balance'] })
      queryClient.invalidateQueries({ queryKey: ['publisher', 'billing', 'history'] })
    },
  })
}
