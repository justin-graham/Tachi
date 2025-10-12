'use client'

import { useAccount, useChainId } from 'wagmi'
import { useHasLicense, usePublisherTokenId, useLicenseData } from '../../lib/contracts/hooks'

interface LicenseStatusProps {
  className?: string
}

export function LicenseStatus({ className = '' }: LicenseStatusProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  
  const { data: hasLicense, isLoading: isLoadingLicense } = useHasLicense(address, chainId)
  const { data: tokenId } = usePublisherTokenId(address, chainId)
  const { data: licenseData, isLoading: isLoadingData } = useLicenseData(
    tokenId ? Number(tokenId) : undefined, 
    chainId
  )

  if (!address) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <p className="text-gray-600 text-center">Connect wallet to check license status</p>
      </div>
    )
  }

  if (isLoadingLicense || isLoadingData) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Checking license status...</span>
        </div>
      </div>
    )
  }

  if (!hasLicense || !tokenId || !licenseData) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">No Publisher License</h3>
            <p className="text-red-600 text-sm">
              You don't have a valid publisher license. Contact support to obtain one.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const [publisher, isActive, mintTimestamp, lastUpdated] = licenseData
  const mintDate = new Date(Number(mintTimestamp) * 1000)
  const updateDate = new Date(Number(lastUpdated) * 1000)

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">License Status</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-600">Token ID:</span>
          <span className="text-sm text-gray-900">#{tokenId.toString()}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-600">Publisher Address:</span>
          <span className="text-sm text-gray-900 font-mono">
            {publisher.slice(0, 6)}...{publisher.slice(-4)}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-600">Issued Date:</span>
          <span className="text-sm text-gray-900">
            {mintDate.toLocaleDateString()}
          </span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-600">Last Updated:</span>
          <span className="text-sm text-gray-900">
            {updateDate.toLocaleDateString()}
          </span>
        </div>
      </div>

      {isActive && (
        <div className="mt-4 p-3 bg-green-50 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="ml-2 text-sm text-green-800">
              Your license is active and valid for receiving payments
            </span>
          </div>
        </div>
      )}
    </div>
  )
}