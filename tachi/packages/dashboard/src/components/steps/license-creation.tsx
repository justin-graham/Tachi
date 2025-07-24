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
  walletAddress?: string
  onComplete: (data: { tokenId?: bigint; transactionHash: string }) => void
  isComplete: boolean
}

export function LicenseCreationStep({ siteDetails, walletAddress, onComplete, isComplete }: LicenseCreationStepProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  
  // Use prop wallet address if available, fallback to hook
  const effectiveAddress = walletAddress || address
  
  // Debug logging for wallet state
  console.log(`🔍 LicenseCreationStep render - propAddress: ${walletAddress}, hookAddress: ${address}, effectiveAddress: ${effectiveAddress}`)
  
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [hasExistingLicense, setHasExistingLicense] = useState<boolean | null>(null)
  const [checkingLicense, setCheckingLicense] = useState(false)
  const [mintResult, setMintResult] = useState<{ hash: string; tokenId?: bigint } | null>(null)
  const [walletStateStable, setWalletStateStable] = useState(false)
  const [addressHistory, setAddressHistory] = useState<(string | undefined)[]>([])

  // Track address changes to detect if wallet was ever connected
  useEffect(() => {
    setAddressHistory(prev => [...prev, effectiveAddress].slice(-5)) // Keep last 5 values
    console.log(`📋 Address history updated: ${JSON.stringify([...addressHistory, effectiveAddress].slice(-5))}`)
  }, [effectiveAddress])

  // Enhanced wallet state stabilization with multiple checks
  useEffect(() => {
    let attempts = 0
    const maxAttempts = 10
    
    const checkWalletState = () => {
      attempts++
      console.log(`🔄 Wallet state check attempt ${attempts}/${maxAttempts} - address: ${effectiveAddress}`)
      
      if (effectiveAddress || attempts >= maxAttempts) {
        setWalletStateStable(true)
        console.log(`✅ Wallet state stabilized after ${attempts} attempts - address: ${effectiveAddress}`)
      } else {
        setTimeout(checkWalletState, 200)
      }
    }

    checkWalletState()
  }, [effectiveAddress])

  // Check existing license when wallet is ready
  useEffect(() => {
    const checkExistingLicense = async () => {
      if (!effectiveAddress || !chainId || checkingLicense) return
      
      setCheckingLicense(true)
      setMintError(null)
      
      try {
        console.log(`🔍 Checking existing license for ${effectiveAddress} on chain ${chainId}`)
        const hasLicense = await checkHasLicense(chainId, effectiveAddress as `0x${string}`)
        setHasExistingLicense(hasLicense)
        console.log(`📄 License check result: ${hasLicense}`)
      } catch (error) {
        console.error('Error checking existing license:', error)
        setHasExistingLicense(false)
      } finally {
        setCheckingLicense(false)
      }
    }

    if (walletStateStable) {
      checkExistingLicense()
    }
  }, [effectiveAddress, chainId, walletStateStable, checkingLicense])

  const handleMint = async () => {
    console.log(`🔍 handleMint called - effectiveAddress: ${effectiveAddress}, chainId: ${chainId}, termsURI: ${siteDetails?.termsURI}`)
    
    if (!effectiveAddress || !chainId || !siteDetails?.termsURI) {
      const error = `Missing required data: wallet address: ${effectiveAddress}, chainId: ${chainId}, termsURI: ${siteDetails?.termsURI}`
      console.error('❌', error)
      setMintError(error)
      return
    }

    // Validate address format
    if (!effectiveAddress.startsWith('0x') || effectiveAddress.length !== 42) {
      const error = `Invalid wallet address format: ${effectiveAddress}`
      console.error('❌', error)
      setMintError(error)
      return
    }

    setIsMinting(true)
    setMintError(null)

    try {
      console.log(`🚀 Calling mintLicenseAsOwner with:`, {
        chainId,
        publisher: effectiveAddress,
        termsURI: siteDetails.termsURI
      })
      
      const result = await mintLicenseAsOwner(chainId, effectiveAddress as `0x${string}`, siteDetails.termsURI)
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
    if (!chainId) return null
    
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

  if (!walletStateStable) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Initializing Wallet Connection
          </CardTitle>
          <CardDescription>
            Checking wallet state...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            <p>Address from prop: {walletAddress || 'none'}</p>
            <p>Address from hook: {address || 'none'}</p>
            <p>Effective address: {effectiveAddress || 'none'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!effectiveAddress && walletStateStable) {
    const everHadAddress = addressHistory.some((addr: string | undefined) => addr && typeof addr === 'string' && addr.length > 0)
    
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Wallet Not Connected
          </CardTitle>
          <CardDescription>
            {everHadAddress 
              ? "Your wallet was disconnected. Please reconnect to continue."
              : "Please connect your wallet to create a license"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Debug Info:</p>
            <p>Prop address: {walletAddress || 'none'}</p>
            <p>Hook address: {address || 'none'}</p>
            <p>History: {addressHistory.filter(Boolean).length > 0 ? 'Had addresses' : 'Never connected'}</p>
          </div>
        </CardContent>
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
            Verifying if you already have a license...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (hasExistingLicense) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            License Already Exists
          </CardTitle>
          <CardDescription>
            This wallet already has a license. Each wallet can only hold one license.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Badge variant="outline" className="mt-2">
            License Found: {effectiveAddress}
          </Badge>
        </CardContent>
      </Card>
    )
  }

  if (isComplete || mintResult) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            License Created Successfully!
          </CardTitle>
          <CardDescription>
            Your publisher license has been minted to the blockchain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mintResult && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction:</span>
                <code className="text-xs">{mintResult.hash.slice(0, 10)}...{mintResult.hash.slice(-8)}</code>
              </div>
              {mintResult.tokenId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Token ID:</span>
                  <Badge variant="outline">#{mintResult.tokenId.toString()}</Badge>
                </div>
              )}
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Create Publisher License</CardTitle>
        <CardDescription>
          Mint your NFT license to enable content publishing on the Tachi network.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wallet:</span>
            <code className="text-xs">{effectiveAddress?.slice(0, 6)}...{effectiveAddress?.slice(-4)}</code>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network:</span>
            <Badge variant="outline">
              {chainId === 31337 ? 'Hardhat Local' : 
               chainId === 84532 ? 'Base Sepolia' :
               chainId === 8453 ? 'Base' : `Chain ${chainId}`}
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Site:</span>
            <span className="text-xs">{siteDetails?.websiteName || 'Unknown'}</span>
          </div>
        </div>

        {mintError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700 font-medium">Minting Failed</span>
            </div>
            <p className="text-xs text-red-600 mt-1">{mintError}</p>
          </div>
        )}

        <Button 
          onClick={handleMint} 
          disabled={isMinting || !effectiveAddress || !siteDetails?.termsURI}
          className="w-full"
        >
          {isMinting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating License...
            </>
          ) : (
            'Create License (Mint NFT)'
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          This will create an NFT license on the blockchain for your site.
        </div>
      </CardContent>
    </Card>
  )
}
