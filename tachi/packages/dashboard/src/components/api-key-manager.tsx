'use client'

import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Key, 
  Copy, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff, 
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  totalRequests: number
  monthlyRequests: number
  lastUsedAt?: string
  createdAt: string
  expiresAt?: string
}

interface NewApiKey extends ApiKey {
  key: string // Full key is only available when first created
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newApiKey, setNewApiKey] = useState<NewApiKey | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const { toast } = useToast()

  // Load API keys on component mount
  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/keys/create')
      const data = await response.json()
      
      if (data.success) {
        setApiKeys(data.apiKeys)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load API keys",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your API key",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/keys/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newKeyName.trim() })
      })

      const data = await response.json()
      
      if (data.success) {
        setNewApiKey(data.apiKey)
        setShowCreateModal(false)
        setShowKeyModal(true)
        setNewKeyName('')
        await loadApiKeys() // Refresh the list
        toast({
          title: "Success",
          description: "API key created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create API key",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteApiKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${keyName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        await loadApiKeys() // Refresh the list
        toast({
          title: "Success",
          description: "API key deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete API key",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">
            Manage your API keys for the Tachi Protocol
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </Button>
      </div>

      {/* API Keys List */}
      <div className="grid gap-4">
        {loading && apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </CardContent>
          </Card>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
              <p className="text-muted-foreground mb-4">
                Create your first API key to start using the Tachi Protocol
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Key className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                      <CardDescription className="font-mono text-sm">
                        {apiKey.keyPrefix}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApiKey(apiKey.id, apiKey.name)}
                      disabled={loading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatNumber(apiKey.totalRequests)}</p>
                      <p className="text-muted-foreground">Total Requests</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatNumber(apiKey.monthlyRequests)}</p>
                      <p className="text-muted-foreground">This Month</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatDate(apiKey.createdAt)}</p>
                      <p className="text-muted-foreground">Created</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never'}
                      </p>
                      <p className="text-muted-foreground">Last Used</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create API Key Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key to access the Tachi Protocol. Give it a descriptive name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                API Key Name
              </label>
              <Input
                placeholder="e.g., Production Crawler, Development Testing"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                disabled={loading}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Choose a name that helps you identify this key's purpose
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={createApiKey}
                disabled={loading || !newKeyName.trim()}
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Create Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Show New API Key Modal */}
      <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Your API key has been created successfully. Copy it now - you won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          {newApiKey && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Important: Save this key now
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      This is the only time you'll see the complete key. Store it securely.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  API Key Name
                </label>
                <p className="text-lg font-semibold">{newApiKey.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Your API Key
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all select-all">
                    {newApiKey.key}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(newApiKey.key)}
                    className="flex-shrink-0"
                  >
                    {copiedKey ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Usage:</strong> Include this key in your API requests as a Bearer token.</p>
                <p><strong>Example:</strong></p>
                <code className="block p-2 bg-muted rounded text-xs">
                  Authorization: Bearer {newApiKey.keyPrefix}
                </code>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setShowKeyModal(false)}>
                  I've Saved My Key
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
