'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { LicenseStatus } from '../../../components/licensing/LicenseStatus'
import { PublisherBalance } from '../../../components/payments/PublisherBalance'
import { CrawlRequestForm } from '../../../components/payments/CrawlRequestForm'
import * as Sentry from '@sentry/nextjs'

export default function ContractsPage() {
  const { isConnected } = useAccount()

  const triggerSentryTestError = () => {
    try {
      // Call a function that doesn't exist to trigger an error
      (window as any).nonExistentFunction()
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Web3 Contracts</h1>
          <p className="text-gray-600">
            Manage your publisher license, view earnings, and submit crawl requests on-chain
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={triggerSentryTestError}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            title="Test Sentry Error Monitoring"
          >
            Test Error
          </button>
          <ConnectButton />
        </div>
      </div>

      {!isConnected ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Connect your Web3 wallet to access smart contract features, manage your publisher license, 
              and process payments on the Base network.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* License Status Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Publisher License</h2>
            <LicenseStatus />
          </section>

          {/* Publisher Balance Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Earnings & Withdrawals</h2>
            <div className="max-w-md">
              <PublisherBalance />
            </div>
          </section>

          {/* Crawl Request Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Crawl Request</h2>
            <CrawlRequestForm />
          </section>

          {/* Contract Information */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contract Information</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Network</h3>
                <p className="text-gray-600">Base Mainnet (Chain ID: 8453)</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Payment Token</h3>
                <p className="text-gray-600">USDC (USD Coin)</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Protocol Fee</h3>
                <p className="text-gray-600">2.5% on all crawl requests</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">License Type</h3>
                <p className="text-gray-600">Soulbound NFT (Non-transferable)</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}