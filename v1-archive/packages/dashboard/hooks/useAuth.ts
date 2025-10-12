'use client'

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'

export interface User {
  id: string
  address?: string
  userType: 'publisher' | 'crawler'
  createdAt: Date
  lastActiveAt: Date
  email: string
  emailVerified: boolean
  walletConnected: boolean
  onboardingCompleted: boolean
  profile?: {
    name?: string
    email?: string
    website?: string
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
}

interface AuthContextType extends AuthState {
  login: (userType: 'publisher' | 'crawler') => Promise<{ success: boolean; error?: string }>
  connectWallet: () => Promise<{ success: boolean; error?: string }>
  logout: (all?: boolean) => Promise<void>
  refreshAuth: () => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null)

// Auth hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Auth provider hook for managing state
export function useAuthProvider(): AuthContextType {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null
  })

  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()

  // Check authentication status
  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        let token = localStorage.getItem('tachi-token')

        // If token is present but expired, try to refresh it
        if (token && data.tokenExpired) {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'include'
          })

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            token = refreshData.token
            localStorage.setItem('tachi-token', token)
          } else {
            // Refresh failed, clear token
            localStorage.removeItem('tachi-token')
            token = null
          }
        }

        setAuthState({
          user: {
            ...data.user,
            createdAt: new Date(data.user.createdAt),
            lastActiveAt: new Date(data.user.lastActiveAt)
          },
          isAuthenticated: true,
          isLoading: false,
          token
        })
      } else {
        // Clear any stored token
        localStorage.removeItem('tachi-token')
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          token: null
        })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null
      })
    }
  }, [])


  // Wallet connection for existing users
  const connectWallet = useCallback(async () => {
    if (!address || !isConnected) {
      return { success: false, error: 'Wallet not connected' }
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))

      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })

      if (!nonceResponse.ok) {
        const error = await nonceResponse.json()
        throw new Error(error.error || 'Failed to get nonce')
      }

      const { nonce } = await nonceResponse.json()

      // Step 2: Create message and sign
      const message = `Connect wallet to Tachi Protocol\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n${address}\n\nNonce:\n${nonce}`

      const signature = await signMessageAsync({ message })

      // Step 3: Connect wallet to existing account
      const connectResponse = await fetch('/api/auth/connect-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, nonce }),
        credentials: 'include'
      })

      if (!connectResponse.ok) {
        const error = await connectResponse.json()
        throw new Error(error.error || 'Wallet connection failed')
      }

      await connectResponse.json()

      await refreshAuth()

      return { success: true }
    } catch (error: any) {
      console.error('Wallet connection failed:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: error.message || 'Wallet connection failed' }
    }
  }, [address, isConnected, signMessageAsync, refreshAuth])

  // Wallet-based login function (legacy for new wallet-only users)
  const login = useCallback(async (userType: 'publisher' | 'crawler') => {
    if (!address || !isConnected) {
      return { success: false, error: 'Wallet not connected' }
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))

      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })

      if (!nonceResponse.ok) {
        const error = await nonceResponse.json()
        throw new Error(error.error || 'Failed to get nonce')
      }

      const { nonce } = await nonceResponse.json()

      // Step 2: Create message and sign
      const message = `Welcome to Tachi Protocol!

This request will not trigger a blockchain transaction or cost any gas fees.

Your authentication status will reset after 24 hours.

Wallet address:
${address}

Nonce:
${nonce}`

      const signature = await signMessageAsync({ message })

      // Step 3: Authenticate with signature
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature,
          nonce,
          userType
        }),
        credentials: 'include'
      })

      if (!loginResponse.ok) {
        const error = await loginResponse.json()
        throw new Error(error.error || 'Authentication failed')
      }

      const { token } = await loginResponse.json()

      // Store token in localStorage
      localStorage.setItem('tachi-token', token)

      await refreshAuth()

      return { success: true }
    } catch (error: any) {
      console.error('Login failed:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: false, error: error.message || 'Login failed' }
    }
  }, [address, isConnected, signMessageAsync, refreshAuth])

  // Logout function
  const logout = useCallback(async (all = false) => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all }),
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    }

    // Clear local state regardless
    localStorage.removeItem('tachi-token')
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null
    })

    // Disconnect wallet if requested
    if (all) {
      disconnect()
    }
  }, [disconnect])

  // Check auth on mount and when wallet changes
  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  // Auto-logout if wallet disconnects
  useEffect(() => {
    if (!isConnected && authState.isAuthenticated) {
      logout()
    }
  }, [isConnected, authState.isAuthenticated, logout])

  return {
    ...authState,
    login,
    connectWallet,
    logout,
    refreshAuth
  }
}

// Auth context provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider()
  return React.createElement(AuthContext.Provider, { value: auth }, children)
}

// Utility functions for API calls
export class ApiClient {
  private baseUrl: string
  private token: string | null

  constructor(baseUrl = '', token: string | null = null) {
    this.baseUrl = baseUrl
    this.token = token || localStorage.getItem('tachi-token')
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    })

    const raw = await response.text()
    let data: any = null
    try {
      data = raw ? JSON.parse(raw) : null
    } catch {
      data = raw
    }

    if (!response.ok) {
      const message =
        (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' && data.error) ||
        (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message) ||
        response.statusText ||
        `HTTP ${response.status}`
      throw new Error(message)
    }

    return data
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' })
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // Publisher integration methods
  async getWebhookConfig() {
    return this.get('/api/publishers/webhooks')
  }

  async updateWebhookConfig(payload: { webhookUrl?: string | null; secret?: string | null; rotateSecret?: boolean }) {
    return this.put('/api/publishers/webhooks', payload)
  }

  async testWebhook(payload: { payload?: Record<string, any>; method?: 'POST' | 'PUT' }) {
    return this.post('/api/publishers/webhooks/test', payload)
  }

  async getCodeSnippet(lang: string) {
    const query = new URLSearchParams({ lang }).toString()
    return this.get(`/api/publishers/code-snippets?${query}`)
  }

  async runPlayground(payload: {
    targetUrl: string
    format: 'markdown' | 'html' | 'text' | 'json'
    amount: string
    apiKey: string
    maxWaitSeconds?: number
  }) {
    return this.post('/api/publishers/playground', payload)
  }

  async updatePublisherStatus(action: 'pause' | 'resume') {
    return this.post('/api/publishers/status', { action })
  }

  async requestAccountDeletion(reason?: string) {
    return this.post('/api/publishers/delete-request', { reason })
  }

  async requestWithdrawal(payload: { amount: string; toAddress: string }) {
    return this.post('/api/payments/withdraw', payload)
  }
}
