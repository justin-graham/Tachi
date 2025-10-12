'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedInput } from '@/components/ui/enhanced-input'
import { usePublisherApiKeys, useCreatePublisherApiKey, useRevokePublisherApiKey } from '@/lib/hooks'

const MAX_KEYS_LIMIT = 10

function formatDate(value?: string) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleString()
}

export function ApiKeysTab() {
  const [keyName, setKeyName] = useState('')
  const [lastPlaintextKey, setLastPlaintextKey] = useState<string | null>(null)

  const {
    data: apiKeys = [],
    isLoading,
    isError,
    refetch,
  } = usePublisherApiKeys()
  const createKeyMutation = useCreatePublisherApiKey()
  const revokeKeyMutation = useRevokePublisherApiKey()

  const handleCreateKey = async () => {
    const trimmed = keyName.trim()
    if (!trimmed) {
      toast.error('Give the API key a name before creating it.')
      return
    }

    try {
      const response = await createKeyMutation.mutateAsync({ name: trimmed })
      setKeyName('')
      setLastPlaintextKey(response.plainKey ?? null)
      toast.success('API key created.')
      refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create API key.'
      toast.error(message)
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeKeyMutation.mutateAsync({ keyId })
      toast.success('API key revoked.')
      refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke API key.'
      toast.error(message)
    }
  }

  const handleCopyPlainKey = async (value: string) => {
    if (typeof window === 'undefined' || !navigator?.clipboard || !window.isSecureContext) {
      toast.error('Copy is unavailable in this environment. Copy the key manually.')
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      toast.success('API key copied to clipboard.')
    } catch {
      toast.error('Unable to copy API key. Copy it manually instead.')
    }
  }

  return (
    <div className="space-y-6">
      <EnhancedCard variant="elevated" className="bg-white">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Generate API Key</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Key name</label>
            <EnhancedInput
              placeholder="Production crawler"
              value={keyName}
              onChange={(event) => setKeyName(event.target.value)}
              disabled={createKeyMutation.isPending || apiKeys.length >= MAX_KEYS_LIMIT}
            />
          </div>
          <EnhancedButton
            onClick={handleCreateKey}
            loading={createKeyMutation.isPending}
            disabled={createKeyMutation.isPending || !keyName.trim() || apiKeys.length >= MAX_KEYS_LIMIT}
            className="font-mono tracking-wide"
          >
            Create key
          </EnhancedButton>
        </EnhancedCardContent>
        <EnhancedCardContent className="pt-0 text-xs text-[#6B7280]">
          You can create up to {MAX_KEYS_LIMIT} API keys. Store them securely—this dashboard only shows the secret once.
        </EnhancedCardContent>
      </EnhancedCard>

      {lastPlaintextKey && (
        <EnhancedCard variant="outline" className="bg-[#FFF4ED] border-[#FF7043]">
          <EnhancedCardContent className="space-y-4">
            <p className="text-sm font-semibold text-[#D35400]">
              Copy and store this API key securely. You will not be able to view it again.
            </p>
            <code className="block rounded border border-[#FF7043] bg-white px-4 py-3 font-mono text-sm break-all">
              {lastPlaintextKey}
            </code>
            <EnhancedButton variant="outline" className="font-mono" onClick={() => handleCopyPlainKey(lastPlaintextKey)}>
              Copy key
            </EnhancedButton>
          </EnhancedCardContent>
        </EnhancedCard>
      )}

      <EnhancedCard variant="elevated" className="bg-white">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Existing API Keys</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          {isLoading && <div className="py-8 text-center text-[#52796F]">Loading API keys…</div>}
          {isError && (
            <div className="py-8 text-center text-red-600">
              Failed to load API keys.{' '}
              <button type="button" className="underline" onClick={() => refetch()}>
                Try again
              </button>
            </div>
          )}
          {!isLoading && !isError && apiKeys.length === 0 && (
            <div className="py-8 text-center text-[#52796F]">No keys yet. Create one to get started.</div>
          )}
          {!isLoading && !isError && apiKeys.length > 0 && (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{key.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      ID: <span className="font-mono">{`${key.id.slice(0, 8)}…${key.id.slice(-6)}`}</span> · Created{' '}
                      {formatDate(key.createdAt)}
                    </p>
                  </div>
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => handleRevokeKey(key.id)}
                    loading={revokeKeyMutation.isPending && revokeKeyMutation.variables?.keyId === key.id}
                  >
                    Revoke
                  </EnhancedButton>
                </div>
              ))}
            </div>
          )}
        </EnhancedCardContent>
      </EnhancedCard>
    </div>
  )
}

export default ApiKeysTab
