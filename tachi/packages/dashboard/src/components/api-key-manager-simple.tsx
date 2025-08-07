'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
  totalRequests: number
  monthlyRequests: number
  key?: string // Only present when just created
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Simple toast state
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/keys/create')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setApiKeys(data.apiKeys || [])
        }
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      showToast('Please enter a name for your API key', 'error')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/keys/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setNewlyCreatedKey(data.apiKey.key)
        setApiKeys(prev => [data.apiKey, ...prev])
        setNewKeyName('')
        setShowCreateForm(false)
        showToast('API key created successfully!', 'success')
      } else {
        showToast(data.error || 'Failed to create API key', 'error')
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      showToast('Failed to create API key', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key.id !== id))
        showToast('API key deleted successfully', 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to delete API key', 'error')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      showToast('Failed to delete API key', 'error')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 'success')
    }).catch(() => {
      showToast('Failed to copy to clipboard', 'error')
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading API keys...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Newly created key display */}
      {newlyCreatedKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <AlertTriangle className="w-5 h-5" />
              Save Your API Key
            </CardTitle>
            <CardDescription className="text-green-700">
              This is the only time you'll be able to see your API key. Please copy it and store it securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-white border rounded-md font-mono text-sm">
              <code className="flex-1 break-all">{newlyCreatedKey}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newlyCreatedKey)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setNewlyCreatedKey(null)}
            >
              I've saved my key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create new API key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Create and manage API keys for accessing the Tachi Protocol
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New API Key
            </Button>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="keyName">API Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="My API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createApiKey} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Key'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewKeyName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            {apiKeys.length} of 10 API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No API keys created yet</p>
              <p className="text-sm">Create your first API key to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{apiKey.name}</h3>
                        <Badge variant="secondary">{apiKey.prefix}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created {formatDate(apiKey.createdAt)}
                        </div>
                        {apiKey.lastUsedAt && (
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Last used {formatDate(apiKey.lastUsedAt)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Total requests: <strong>{apiKey.totalRequests}</strong></span>
                        <span>This month: <strong>{apiKey.monthlyRequests}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteApiKey(apiKey.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
