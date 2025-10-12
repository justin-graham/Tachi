import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { env } from '../env'
import { showApiSuccess, showApiError, showSuccess, showError } from '../toast'

interface GatewayConfig {
  licenseTokenId: string
  price: string
  originUrl: string
  subdomain?: string
}

interface ProvisionedGateway {
  id: string
  licenseTokenId: string
  gatewayUrl: string
  originUrl: string
  price: string
  status: 'provisioning' | 'active' | 'error' | 'paused'
  createdAt: string
  updatedAt: string
  stats: {
    totalRequests: number
    successfulRequests: number
    revenue: string
  }
}

interface ProvisionGatewayParams extends GatewayConfig {
  // Additional params for gateway provisioning
}

interface UpdateGatewayParams {
  gatewayId: string
  price?: string
  originUrl?: string
  status?: 'active' | 'paused'
}

export function useGatewayProvision() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const apiBaseUrl = env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  
  // Query to fetch user's gateways
  const { 
    data: gateways, 
    isLoading: isLoadingGateways,
    error: gatewaysError 
  } = useQuery({
    queryKey: ['gateways', address],
    queryFn: async (): Promise<ProvisionedGateway[]> => {
      if (!address || !isConnected) return []
      
      const response = await fetch(`${apiBaseUrl}/api/gateway/list/${address}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch gateways')
      
      return response.json()
    },
    enabled: isConnected && !!address,
    staleTime: 30000,
    retry: 2,
  })
  
  // Provision new gateway mutation
  const provisionGateway = useMutation({
    mutationFn: async (params: ProvisionGatewayParams): Promise<ProvisionedGateway> => {
      if (!address || !isConnected) {
        throw new Error('Wallet not connected')
      }
      
      const response = await fetch(`${apiBaseUrl}/api/gateway/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...params,
          publisherAddress: address,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to provision gateway')
      }
      
      return response.json()
    },
    onSuccess: () => {
      showApiSuccess('Gateway provisioned')
      // Invalidate and refetch gateways
      queryClient.invalidateQueries({ queryKey: ['gateways', address] })
    },
    onError: (error) => {
      console.error('Provision gateway error:', error)
      showApiError('Gateway provisioning', error instanceof Error ? error.message : 'Unknown error')
    }
  })
  
  // Update gateway configuration mutation
  const updateGateway = useMutation({
    mutationFn: async (params: UpdateGatewayParams): Promise<ProvisionedGateway> => {
      if (!address || !isConnected) {
        throw new Error('Wallet not connected')
      }
      
      const response = await fetch(`${apiBaseUrl}/api/gateway/${params.gatewayId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          price: params.price,
          originUrl: params.originUrl,
          status: params.status,
          publisherAddress: address,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update gateway')
      }
      
      return response.json()
    },
    onSuccess: () => {
      showApiSuccess('Gateway updated')
      queryClient.invalidateQueries({ queryKey: ['gateways', address] })
    },
    onError: (error) => {
      console.error('Update gateway error:', error)
      showApiError('Gateway update', error instanceof Error ? error.message : 'Unknown error')
    }
  })
  
  // Delete gateway mutation
  const deleteGateway = useMutation({
    mutationFn: async (gatewayId: string): Promise<void> => {
      if (!address || !isConnected) {
        throw new Error('Wallet not connected')
      }
      
      const response = await fetch(`${apiBaseUrl}/api/gateway/${gatewayId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          publisherAddress: address,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete gateway')
      }
    },
    onSuccess: () => {
      showApiSuccess('Gateway deleted')
      queryClient.invalidateQueries({ queryKey: ['gateways', address] })
    },
    onError: (error) => {
      console.error('Delete gateway error:', error)
      showApiError('Gateway deletion', error instanceof Error ? error.message : 'Unknown error')
    }
  })
  
  // Test gateway connectivity
  const testGateway = useMutation({
    mutationFn: async (gatewayUrl: string): Promise<{ status: 'success' | 'error', responseTime: number, error?: string }> => {
      const startTime = Date.now()
      
      try {
        const response = await fetch(`${gatewayUrl}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })
        
        const responseTime = Date.now() - startTime
        
        if (response.status === 402) {
          // Expected HTTP 402 Payment Required response
          return {
            status: 'success',
            responseTime,
          }
        } else {
          return {
            status: 'error',
            responseTime,
            error: `Unexpected status: ${response.status}`,
          }
        }
      } catch (error) {
        const responseTime = Date.now() - startTime
        return {
          status: 'error',
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        showSuccess(`Gateway test successful (${data.responseTime}ms)`, { icon: '✅' })
      } else {
        showError(`Gateway test failed: ${data.error}`, { icon: '❌' })
      }
    },
    onError: (error) => {
      console.error('Test gateway error:', error)
      showError('Gateway test failed to complete', { icon: '❌' })
    }
  })
  
  return {
    // State
    gateways: gateways || [],
    isConnected,
    
    // Loading states
    isLoadingGateways,
    isProvisioning: provisionGateway.isPending,
    isUpdating: updateGateway.isPending,
    isDeleting: deleteGateway.isPending,
    isTesting: testGateway.isPending,
    
    // Actions
    provisionGateway: provisionGateway.mutate,
    updateGateway: updateGateway.mutate,
    deleteGateway: deleteGateway.mutate,
    testGateway: testGateway.mutate,
    
    // Errors
    gatewaysError,
    provisionError: provisionGateway.error,
    updateError: updateGateway.error,
    deleteError: deleteGateway.error,
    testError: testGateway.error,
    
    // Test results
    testResult: testGateway.data,
  }
}
