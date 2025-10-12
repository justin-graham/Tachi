'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '../../components/ui/enhanced-card'
import { EnhancedButton } from '../../components/ui/enhanced-button'
import { EnhancedInput } from '../../components/ui/enhanced-input'
import { EnhancedBadge } from '../../components/ui/enhanced-badge'
import { useAuth, ApiClient } from '../../hooks/useAuth'

const ONBOARDING_STORAGE_KEY = 'tachi-publisher-registration'

interface PublisherFormState {
  name: string
  domain: string
  contactEmail: string
  pricePerRequest: string
  termsAccepted: boolean
}

interface PublisherResponse {
  message?: string
  publisher?: {
    id: string
    name: string
    domain: string
    email: string
    websiteUrl?: string | null
    contactEmail?: string | null
    pricePerRequest?: number
    totalEarnings?: number
    totalRequests?: number
    status?: string
    createdAt?: string
  }
  apiKey?: string
}

type OnboardingStep = 'wallet' | 'publisher' | 'contract' | 'complete'

const STEP_SEQUENCE: OnboardingStep[] = ['wallet', 'publisher', 'contract', 'complete']

const initialFormState: PublisherFormState = {
  name: '',
  domain: '',
  contactEmail: '',
  pricePerRequest: '1.00',
  termsAccepted: false,
}

export default function TachiOnboarding() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { token, user, refreshAuth } = useAuth()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [formState, setFormState] = useState<PublisherFormState>(initialFormState)
  const [publisherResult, setPublisherResult] = useState<PublisherResponse | null>(null)
  const [hasRestored, setHasRestored] = useState(false)

  const apiClient = useMemo(() => new ApiClient('', token), [token])

  useEffect(() => {
    if (user?.profile?.email && !formState.contactEmail) {
      setFormState(prev => ({ ...prev, contactEmail: user.profile?.email ?? '' }))
    }
  }, [user, formState.contactEmail])

  useEffect(() => {
    if (typeof window === 'undefined' || hasRestored) return

    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (stored) {
      try {
        const parsed: PublisherResponse = JSON.parse(stored)
        setPublisherResult(parsed)
        if (parsed.publisher) {
          setCurrentStepIndex(2)
        }
      } catch (error) {
        console.warn('Failed to parse stored publisher registration', error)
      }
    }

    setHasRestored(true)
  }, [hasRestored])

  const registerPublisher = useMutation({
    mutationFn: async (payload: PublisherFormState) => {
      const response = await apiClient.post('/api/publishers/register', {
        name: payload.name,
        domain: payload.domain,
        email: payload.contactEmail,
        description: '',
        pricePerRequest: Number(payload.pricePerRequest || '0'),
      })

      return response as PublisherResponse
    },
    onSuccess: (data) => {
      setPublisherResult(data)
      setCurrentStepIndex(2)
      toast.success('Publisher profile created successfully')
      if (typeof window !== 'undefined') {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data))
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to register publisher'
      toast.error(message)
    }
  })

  const currentStep = STEP_SEQUENCE[currentStepIndex]

  const advanceStep = () => setCurrentStepIndex((index) => Math.min(index + 1, STEP_SEQUENCE.length - 1))
  const retreatStep = () => setCurrentStepIndex((index) => Math.max(index - 1, 0))

  const handlePublisherSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.termsAccepted) {
      toast.error('Please accept the terms to continue')
      return
    }

    const normalizedDomain = formState.domain
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/$/, '')
      .split('/')[0]

    registerPublisher.mutate({
      ...formState,
      domain: normalizedDomain,
    })
  }

  const handleComplete = async () => {
    try {
      // Mark onboarding as complete
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success('Onboarding complete!')
        // Refresh auth state to get updated user data
        try {
          await refreshAuth()
        } catch (authError) {
          console.error('Failed to refresh auth state:', authError)
        }
        router.push('/dashboard')
      } else {
        console.error('Failed to complete onboarding')
        toast.error('Failed to complete onboarding. Please try again.')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('An error occurred. Please try again.')
    }
  }

  const renderProgress = () => (
    <div className="p-6">
      <div className="flex items-center justify-between">
        {STEP_SEQUENCE.map((step, index) => {
          const isCurrent = index === currentStepIndex
          const isCompleted = index < currentStepIndex
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold ${
                    isCurrent
                      ? 'bg-[#FF7043] text-white'
                      : isCompleted
                        ? 'bg-[#52796F] text-white'
                        : 'bg-gray-200 text-[#52796F]'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div
                  className={`mt-2 text-xs font-medium font-['Coinbase Display'] ${
                    isCurrent
                      ? 'text-[#FF7043]'
                      : isCompleted
                        ? 'text-[#52796F]'
                        : 'text-[#52796F]'
                  }`}
                >
                  {step === 'wallet' && 'Connect Wallet'}
                  {step === 'publisher' && 'Publisher Details'}
                  {step === 'contract' && 'Integration'}
                  {step === 'complete' && 'All Set'}
                </div>
              </div>
              {index < STEP_SEQUENCE.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    isCompleted ? 'bg-[#52796F]' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderWalletStep = () => (
    <EnhancedCard variant="elevated" className="max-w-2xl mx-auto bg-white">
      {renderProgress()}
      <EnhancedCardContent className="space-y-8">
        <div className="text-center space-y-6">
          <p className="text-[#1A1A1A] leading-relaxed">
            Connect your wallet to link on-chain activity with your Tachi profile.
          </p>
          {isConnected && address ? (
            <div className="space-y-6">
              <EnhancedBadge variant="success" size="lg" className="inline-flex">
                Wallet connected
              </EnhancedBadge>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-xs text-[#52796F] uppercase tracking-wide font-medium mb-1">Connected Address</p>
                <p className="font-mono text-[#1A1A1A] font-medium">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </p>
              </div>
              <EnhancedButton onClick={advanceStep} className="w-full" size="lg">
                Continue →
              </EnhancedButton>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <ConnectButton showBalance={false} accountStatus="address" label="Connect wallet" />
              </div>
              <p className="text-sm text-[#52796F]">
                We support MetaMask, WalletConnect, Coinbase Wallet, and other EVM-compatible wallets.
              </p>
            </div>
          )}
        </div>
      </EnhancedCardContent>
    </EnhancedCard>
  )

  const renderPublisherStep = () => (
    <EnhancedCard variant="elevated" className="max-w-2xl mx-auto bg-white">
      {renderProgress()}
      <form onSubmit={handlePublisherSubmit}>
        <EnhancedCardContent className="space-y-8">
          <div className="text-center">
            <p className="text-[#1A1A1A] leading-relaxed">
              Tell us about your publication so we can configure pricing and access controls.
            </p>
          </div>
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">Publisher / Site Name</label>
              <EnhancedInput
                placeholder="Example News"
                value={formState.name}
                onChange={(event) => setFormState(prev => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">Primary Domain</label>
              <EnhancedInput
                placeholder="example.com"
                value={formState.domain}
                onChange={(event) => setFormState(prev => ({ ...prev, domain: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">Contact Email</label>
              <EnhancedInput
                type="email"
                placeholder="editor@example.com"
                value={formState.contactEmail}
                onChange={(event) => setFormState(prev => ({ ...prev, contactEmail: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-3 font-['Coinbase Display']">
                Price per crawl request (USDC)
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-[#FF7043] text-[#1A1A1A] font-mono text-lg font-bold focus:outline-none focus:border-[#FF7043]"
                  value={formState.pricePerRequest}
                  onChange={(event) => setFormState(prev => ({ ...prev, pricePerRequest: event.target.value }))}
                  required
                />
                <span className="absolute right-0 top-1/2 transform -translate-y-1/2 text-[#52796F] font-medium">USDC</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.termsAccepted}
                  onChange={(event) => setFormState(prev => ({ ...prev, termsAccepted: event.target.checked }))}
                  className="w-5 h-5 mt-0.5 text-[#FF7043] border-2 border-gray-300 rounded focus:ring-[#FF7043] focus:ring-2"
                />
                <div className="text-sm">
                  <span className="text-[#1A1A1A] font-medium">
                    I agree to the publisher terms and payment processing policies.
                  </span>
                  <p className="text-[#52796F] mt-1">
                    You retain full ownership of your content while granting paid access to approved crawlers.
                  </p>
                </div>
              </label>
            </div>
          </div>
          <div className="flex justify-between space-x-4">
            <EnhancedButton variant="outline" type="button" onClick={retreatStep}>
              ← Back
            </EnhancedButton>
            <EnhancedButton
              type="submit"
              loading={registerPublisher.isLoading}
              disabled={registerPublisher.isLoading}
            >
              Continue →
            </EnhancedButton>
          </div>
        </EnhancedCardContent>
      </form>
    </EnhancedCard>
  )

  const renderContractStep = () => (
    <EnhancedCard variant="elevated" className="max-w-2xl mx-auto bg-white">
      {renderProgress()}
      <EnhancedCardContent className="space-y-8">
        <div className="text-center space-y-4">
          <p className="text-[#1A1A1A] leading-relaxed">
            Your publisher profile is ready. Use the generated API key to configure gateways and start serving paid
            content.
          </p>
        </div>
        {publisherResult?.publisher ? (
          <div className="bg-gray-50 rounded-lg p-6 border space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#52796F]">Publisher Name</span>
              <span className="font-medium text-[#1A1A1A]">{publisherResult.publisher.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#52796F]">Domain</span>
              <span className="font-mono text-[#1A1A1A]">{publisherResult.publisher.domain}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-[#52796F]">API Key</span>
              <div className="flex items-center justify-between bg-white border rounded px-3 py-2">
                <span className="font-mono text-sm truncate">
                  {publisherResult.apiKey ?? 'No API key returned'}
                </span>
                <EnhancedButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (publisherResult.apiKey && typeof window !== 'undefined') {
                      navigator.clipboard.writeText(publisherResult.apiKey)
                      toast.success('API key copied to clipboard')
                    }
                  }}
                  disabled={!publisherResult.apiKey}
                >
                  Copy
                </EnhancedButton>
              </div>
              <p className="text-xs text-[#52796F]">
                Store this key securely. You can rotate keys later from the dashboard.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-700">
            We could not find a saved publisher profile. Please return to the previous step and submit your details.
          </div>
        )}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border text-sm text-left text-[#52796F]">
            <p className="font-medium text-[#1A1A1A] mb-2">Next steps</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Deploy the generated Cloudflare Worker or gateway to guard your content.</li>
              <li>Share your pricing endpoint with approved crawlers.</li>
              <li>Rotate API keys and update terms from the dashboard whenever needed.</li>
            </ul>
          </div>
          <div className="flex justify-between space-x-4">
            <EnhancedButton variant="outline" onClick={retreatStep}>
              ← Back
            </EnhancedButton>
            <EnhancedButton onClick={advanceStep}>
              Continue →
            </EnhancedButton>
          </div>
        </div>
      </EnhancedCardContent>
    </EnhancedCard>
  )

  const renderCompletionStep = () => (
    <EnhancedCard variant="elevated" className="max-w-2xl mx-auto bg-white">
      {renderProgress()}
      <EnhancedCardContent className="space-y-6 text-center">
        <EnhancedBadge variant="success" size="lg" className="inline-flex">
          Onboarding complete
        </EnhancedBadge>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-[#1A1A1A] font-['Coinbase Display']">
            You&apos;re ready to monetize your content
          </h2>
          <p className="text-[#52796F]">
            Head to the dashboard to manage API keys, configure billing, and track crawler activity in real time.
          </p>
        </div>
        <EnhancedButton size="lg" onClick={handleComplete}>
          Go to dashboard →
        </EnhancedButton>
      </EnhancedCardContent>
    </EnhancedCard>
  )

  switch (currentStep) {
    case 'wallet':
      return renderWalletStep()
    case 'publisher':
      return renderPublisherStep()
    case 'contract':
      return renderContractStep()
    case 'complete':
      return renderCompletionStep()
    default:
      return null
  }
}
