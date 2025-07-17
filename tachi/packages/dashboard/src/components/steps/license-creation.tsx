"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, ExternalLink, AlertTriangle } from 'lucide-react'
import { useAccount, useChainId } from 'wagmi'
import { mintLicenseAsOwner, checkHasLicense } from '@/utils/mint-license'
import { useEffect } from 'react'
import { SiteDetailsStepData } from '@/schemas/site-details'

interface LicenseCreationStepProps {
  siteDetails?: SiteDetailsStepData
  onComplete: (data: { tokenId?: bigint; transactionHash: string }) => void
  isComplete: boolean
}

export function LicenseCreationStep({ siteDetails, onComplete, isComplete }: LicenseCreationStepProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [hasExistingLicense, setHasExistingLicense] = useState<boolean | null>(null)
  const [checkingLicense, setCheckingLicense] = useState(false)
  const [mintResult, setMintResult] = useState<{ hash: string; tokenId?: bigint } | null>(null)

  // Check if user already has a license
  useEffect(() => {
    async function checkLicense() {
      if (!address) return
      
      setCheckingLicense(true)
      try {
        const hasLicense = await checkHasLicense(chainId, address)
        setHasExistingLicense(hasLicense)
      } catch (error) {
        console.error('Error checking license:', error)
        setHasExistingLicense(false)
      } finally {
        setCheckingLicense(false)
      }
    }
    
    checkLicense()
  }, [address, chainId])

  const handleMintLicense = async () => {
    if (!address || !siteDetails?.termsURI) {
      setMintError('Missing required data: wallet address or terms URI')
      return
    }

    setIsMinting(true)
    setMintError(null)

    try {
      const result = await mintLicenseAsOwner(chainId, address, siteDetails.termsURI)
      setMintResult(result)
      onComplete({ 
        transactionHash: result.hash,
        tokenId: result.tokenId 
      })
    } catch (error: any) {
      console.error('Minting failed:', error)
      setMintError(error.message || 'Failed to mint license')
    } finally {
      setIsMinting(false)
    }
  }

  const getExplorerUrl = (hash: string) => {
    switch (chainId) {
      case 31337:
        return `http://localhost:8545/tx/${hash}`
      case 84532:
        return `https://sepolia.basescan.org/tx/${hash}`
      case 8453:
        return `https://basescan.org/tx/${hash}`
      default:
        return null
    }
  }

  if (!address) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-red-600">Wallet Not Connected</CardTitle>
          <CardDescription>
            Please connect your wallet to create a license
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (checkingLicense) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking License Status
          </CardTitle>
          <CardDescription>
            Verifying if you already have a CrawlNFT license...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (hasExistingLicense) {
    return (
      <Card className="w-full max-w-md mx-auto border-orange-200">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            License Already Exists
          </CardTitle>
          <CardDescription>
            You already have a CrawlNFT license. Each publisher can only have one license.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={() => onComplete({ transactionHash: 'existing' })}
            variant="outline"
          >
            Continue with Existing License
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isComplete || mintResult) {
    return (
      <Card className="w-full max-w-md mx-auto border-green-200">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            License Created Successfully!
          </CardTitle>
          <CardDescription>
            Your CrawlNFT license has been minted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mintResult && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Transaction Hash:</span>
                <div className="font-mono text-xs break-all bg-gray-50 p-2 rounded mt-1">
                  {mintResult.hash}
                </div>
              </div>
              
              {getExplorerUrl(mintResult.hash) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const url = getExplorerUrl(mintResult.hash)
                    if (url) window.open(url, '_blank')
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>
              )}
            </div>
          )}
          
          <Badge variant="success" className="w-full justify-center py-2">
            ✅ Ready to Deploy Gateway
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Create License</CardTitle>
        <CardDescription>
          Mint your CrawlNFT license to join the Tachi protocol
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Site Details Summary */}
        {siteDetails && (
          <div className="bg-blue-50 p-3 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">License Details:</h4>
            <div className="text-xs space-y-1">
              <div>Domain: <code className="bg-white px-1 rounded">{siteDetails.domain}</code></div>
              <div>Terms: <span className="text-green-600">✓ Uploaded to IPFS</span></div>
            </div>
          </div>
        )}

        {/* Minting Button */}
        <Button
          onClick={handleMintLicense}
          disabled={isMinting || !siteDetails?.termsURI}
          className="w-full"
        >
          {isMinting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Minting License...
            </>
          ) : (
            'Create License (Mint NFT)'
          )}
        </Button>

        {/* Error Display */}
        {mintError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Minting Failed</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{mintError}</p>
          </div>
        )}

        {/* Warning Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-700">
              <p className="font-medium">Demo Mode</p>
              <p>This uses the deployer's key for minting. In production, this would be handled securely via a backend service.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
