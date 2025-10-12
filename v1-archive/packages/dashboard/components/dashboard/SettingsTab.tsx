'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card'
import { EnhancedInput } from '@/components/ui/enhanced-input'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import {
  usePublisherProfile,
  useUpdatePublisherProfile,
  useUpdatePublisherStatus,
  useDeletePublisherRequest,
  type PublisherProfile,
  type UpdatePublisherProfileInput,
} from '@/lib/hooks'

interface ProfileFormState {
  name: string
  website: string
  contactEmail: string
  description: string
  pricePerRequest: string
  rateLimitPerHour: string
  termsOfService: string
}

const INITIAL_FORM: ProfileFormState = {
  name: '',
  website: '',
  contactEmail: '',
  description: '',
  pricePerRequest: '0.01',
  rateLimitPerHour: '1000',
  termsOfService: '',
}

function mapProfileToForm(profile: PublisherProfile | undefined): ProfileFormState {
  if (!profile) return INITIAL_FORM
  return {
    name: profile.name ?? '',
    website: profile.website ?? '',
    contactEmail: profile.contactEmail ?? '',
    description: profile.description ?? '',
    pricePerRequest: profile.pricePerRequest?.toString() ?? '0.01',
    rateLimitPerHour: profile.rateLimitPerHour?.toString() ?? '1000',
    termsOfService: profile.termsOfService ?? '',
  }
}

function prepareUpdatePayload(state: ProfileFormState): UpdatePublisherProfileInput {
  return {
    name: state.name.trim() || undefined,
    website: state.website.trim() || null,
    contactEmail: state.contactEmail.trim() || undefined,
    description: state.description.trim() || null,
    pricePerRequest: Number.parseFloat(state.pricePerRequest) || 0,
    rateLimitPerHour: Number.parseInt(state.rateLimitPerHour, 10) || 0,
    termsOfService: state.termsOfService.trim() || null,
  }
}

export function SettingsTab() {
  const profileQuery = usePublisherProfile()
  const updateProfileMutation = useUpdatePublisherProfile()
  const updateStatusMutation = useUpdatePublisherStatus()
  const deleteRequestMutation = useDeletePublisherRequest()
  const [formState, setFormState] = useState<ProfileFormState>(INITIAL_FORM)

  useEffect(() => {
    if (profileQuery.data) {
      setFormState(mapProfileToForm(profileQuery.data))
    }
  }, [profileQuery.data])

  const isBusy = useMemo(() => updateProfileMutation.isPending, [updateProfileMutation.isPending])

  const handleInputChange = (field: keyof ProfileFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      const payload = prepareUpdatePayload(formState)
      await updateProfileMutation.mutateAsync(payload)
      toast.success('Publisher profile updated')
      await profileQuery.refetch()
    } catch (error: any) {
      const message = error?.message ?? 'Failed to update settings'
      toast.error(message)
    }
  }

  const handleToggleGateway = () => {
    const action: 'pause' | 'resume' = isPaused ? 'resume' : 'pause'
    updateStatusMutation.mutate(
      { action },
      {
        onSuccess: async () => {
          toast.success(action === 'pause' ? 'Gateway paused' : 'Gateway resumed')
          await profileQuery.refetch()
        },
        onError: (error) => toast.error(error.message),
      }
    )
  }

  const handleDeleteAccountRequest = () => {
    const reason = window.prompt('Briefly describe why you want to delete your account (optional):') ?? undefined
    deleteRequestMutation.mutate(
      { reason },
      {
        onSuccess: (response) => toast.success(response.message),
        onError: (error) => toast.error(error.message),
      }
    )
  }

  const isPaused = profileQuery.data?.isPaused ?? false

  if (profileQuery.isLoading) {
    return <div className="py-12 text-center text-[#52796F]">Loading publisher settings...</div>
  }

  if (profileQuery.isError) {
    return (
      <div className="py-12 text-center text-red-600">
        Failed to load publisher settings.{' '}
        <button className="underline" onClick={() => profileQuery.refetch()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <EnhancedCard variant="elevated" className="bg-white">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Publisher Profile</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">Publisher Name</label>
              <EnhancedInput
                placeholder="Example News"
                value={formState.name}
                onChange={handleInputChange('name')}
                disabled={isBusy}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">Website</label>
              <EnhancedInput
                type="url"
                placeholder="https://example.com"
                value={formState.website}
                onChange={handleInputChange('website')}
                disabled={isBusy}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">Contact Email</label>
              <EnhancedInput
                type="email"
                placeholder="editor@example.com"
                value={formState.contactEmail}
                onChange={handleInputChange('contactEmail')}
                disabled={isBusy}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">Publisher Description</label>
            <textarea
              className="mt-2 w-full min-h-[160px] resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              placeholder="Add a short description of the content you protect with Tachi."
              value={formState.description}
              onChange={handleInputChange('description')}
              disabled={isBusy}
            />
            <p className="text-xs text-[#6B7280] mt-2">Displayed to crawlers in your payment-required responses.</p>
          </div>
        </EnhancedCardContent>
      </EnhancedCard>

      <EnhancedCard variant="elevated" className="bg-white">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Pricing & Rate Limits</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">Price Per Request (USDC)</label>
            <input
              type="number"
              step="0.001"
              min="0"
              className="mt-2 w-full border-b-2 border-[#FF7043] bg-transparent px-0 py-2 font-mono text-lg focus:outline-none focus:border-[#FF7043]"
              value={formState.pricePerRequest}
              onChange={handleInputChange('pricePerRequest')}
              disabled={isBusy}
            />
            <p className="text-xs text-[#6B7280] mt-2">
              This rate is embedded into your generated worker and shown to crawlers before payment.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">Rate Limit (requests/hour)</label>
            <input
              type="number"
              min="1"
              className="mt-2 w-full border-b-2 border-[#FF7043] bg-transparent px-0 py-2 font-mono text-lg focus:outline-none focus:border-[#FF7043]"
              value={formState.rateLimitPerHour}
              onChange={handleInputChange('rateLimitPerHour')}
              disabled={isBusy}
            />
            <p className="text-xs text-[#6B7280] mt-2">
              Set a ceiling for paid crawls to protect infrastructure and shape demand.
            </p>
          </div>
        </EnhancedCardContent>
      </EnhancedCard>

      <EnhancedCard variant="elevated" className="bg-white">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Terms of Service & Compliance</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">Terms of Service URL or Markdown</label>
            <textarea
              className="mt-2 w-full min-h-[160px] resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              placeholder="Provide a hosted URL or paste plaintext terms that specify your crawl policy."
              value={formState.termsOfService}
              onChange={handleInputChange('termsOfService')}
              disabled={isBusy}
            />
            <p className="text-xs text-[#6B7280] mt-2">
              Crawlers receive these terms alongside pricing details before each payment request.
            </p>
          </div>
          <EnhancedButton
            className="font-mono tracking-wide"
            onClick={handleSave}
            loading={isBusy}
            disabled={isBusy}
          >
            SAVE SETTINGS
          </EnhancedButton>
        </EnhancedCardContent>
      </EnhancedCard>

      <EnhancedCard variant="outline" className="bg-white border-red-200">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Danger Zone</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent className="space-y-3">
          <p className="text-sm text-[#6B7280]">
            Temporarily pause your gateway if you need to perform maintenance or remove paid access entirely. Contact the
            Tachi team for irreversible actions such as deleting your publisher account.
          </p>
          <p className="text-xs text-[#6B7280]">
            Current status: <span className="font-semibold">{profileQuery.data?.status?.toUpperCase()}</span>
          </p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <EnhancedButton
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
              loading={updateStatusMutation.isPending}
              onClick={handleToggleGateway}
            >
              {isPaused ? 'RESUME GATEWAY' : 'PAUSE GATEWAY'}
            </EnhancedButton>
            <EnhancedButton
              variant="ghost"
              className="text-red-600 hover:bg-red-50"
              loading={deleteRequestMutation.isPending}
              onClick={handleDeleteAccountRequest}
            >
              DELETE ACCOUNT
            </EnhancedButton>
          </div>
          {isPaused && (
            <p className="text-xs text-[#6B7280]">
              Gateway is currently paused. Resume it to start accepting paid crawl requests again.
            </p>
          )}
        </EnhancedCardContent>
      </EnhancedCard>
    </div>
  )
}

export default SettingsTab
