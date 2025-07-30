"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, ExternalLink, AlertTriangle } from 'lucide-react'
import { useAccount, useChainId } from 'wagmi'
import { useMintLicense, useHasLicense } from '@/hooks/use-crawl-nft'
import { SiteDetailsStepData } from '@/schemas/site-details'

interface LicenseCreationStepProps {
  siteDetails?: SiteDetailsStepData
  walletAddress?: string
  onComplete: (data: { transactionHash: string }) => void
  isComplete: boolean
}

export function LicenseCreationStep({ siteDetails, walletAddress, onComplete, isComplete }: LicenseCreationStepProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { 
    mintLicense, 
    hash, 
    isPending: isMinting, 
    isConfirming, 
    isConfirmed, 
    error: mintHookError 
  } = useMintLicense()
  const { data: hasExistingLicense, isLoading: checkingLicense } = useHasLicense()
  
  const effectiveAddress = walletAddress || address
  
  const [mintError, setMintError] = useState<string | null>(null)
  const [walletStateStable, setWalletStateStable] = useState(false)

  // Stabilize wallet connection state
  useEffect(() => {
    const timer = setTimeout(() => {
      setWalletStateStable(true)
    }, 1000) // Wait 1s to ensure wallet connection is stable
    return () => clearTimeout(timer)
  }, [])

  const handleMint = () => {
    if (!effectiveAddress || !chainId || !siteDetails?.termsURI) {
      setMintError("Missing required data: Wallet, Chain, or Terms URI is not available.")
      return
    }
    setMintError(null)
    mintLicense(effectiveAddress as `0x${string}`, siteDetails.termsURI)
  }

  // React to hook state changes for completion and errors
  useEffect(() => {
    if (isConfirmed && hash) {
      onComplete({ transactionHash: hash })
    }
    if (mintHookError) {
      setMintError(mintHookError.message)
    }
  }, [isConfirmed, hash, mintHookError, onComplete])

  const getExplorerUrl = (txHash: string) => {
    if (!chainId) return '#'
    const explorers: Record<number, string> = {
      31337: `#`, // No real explorer for local dev
      84532: `https://sepolia.basescan.org/tx/${txHash}`,
      8453: `https://basescan.org/tx/${txHash}`,
    }
    return explorers[chainId] || '#'
  }

  const renderStatus = () => {
    if (isComplete || (isConfirmed && hash)) {
      return <Badge variant="success" className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />License Minted</Badge>
    }
    if (isMinting || isConfirming) {
      return <Badge variant="secondary" className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{isConfirming ? 'Confirming...' : 'Minting...'}</Badge>
    }
    if (mintHookError || mintError) {
      return <Badge variant="destructive" className="flex items-center gap-2"><XCircle className="h-4 w-4" />Minting Failed</Badge>
    }
    if (hasExistingLicense) {
      return <Badge variant="default" className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />License Exists</Badge>
    }
    if (checkingLicense || !walletStateStable) {
      return <Badge variant="secondary" className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Initializing...</Badge>
    }
    if (!effectiveAddress) {
        return <Badge variant="destructive" className="flex items-center gap-2"><XCircle className="h-4 w-4" />Wallet Not Connected</Badge>
    }
    return <Badge variant="outline" className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />Ready to Mint</Badge>
  }

  const renderAction = () => {
    if (hash && (isConfirmed || isComplete)) {
      const explorerUrl = getExplorerUrl(hash)
      if (explorerUrl === '#') {
        return <p className="text-sm text-gray-500">Transaction sent locally.</p>
      }
      return (
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
          View Transaction <ExternalLink className="h-4 w-4" />
        </a>
      )
    }

    if (isComplete && !hash) {
      return <p className="text-sm text-gray-500">License has been minted.</p>
    }

    if (hasExistingLicense) {
      return <p className="text-sm text-gray-500">You can proceed.</p>
    }
    
    return (
      <Button onClick={handleMint} disabled={!effectiveAddress || isMinting || isConfirming || checkingLicense || hasExistingLicense === null || !walletStateStable}>
        {isMinting || isConfirming ? 'Minting...' : 'Mint License'}
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Create License</CardTitle>
        <CardDescription>
          Mint a non-transferable NFT that represents your license to use the Tachi protocol. This is a one-time process per wallet address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="font-medium">License Status</div>
            {renderStatus()}
          </div>
          <div className="flex items-center justify-end">
            {renderAction()}
          </div>
          {(mintHookError || mintError) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-semibold text-red-800">Error Details:</p>
              <p className="text-sm text-red-700 break-all">{mintHookError?.message || mintError}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
