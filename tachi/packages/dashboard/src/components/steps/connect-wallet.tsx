"use client"

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { base, baseSepolia, hardhat } from 'wagmi/chains'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Wallet, AlertTriangle, Network } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ConnectWalletStepProps {
  onComplete: (walletAddress: string) => void
  isComplete: boolean
}

export function ConnectWalletStep({ onComplete, isComplete }: ConnectWalletStepProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  
  // Test mode for automated testing
  const isTestMode = typeof window !== 'undefined' && window.location.search.includes('test=true')
  const [testWalletConnected, setTestWalletConnected] = useState(false)
  const testAddress = '0x1234567890123456789012345678901234567890'
  
  // Determine preferred chain based on environment
  const preferredChain = (() => {
    // For testing/development, allow hardhat local network
    if (chainId === hardhat.id || process.env.NODE_ENV === 'development') {
      return hardhat
    }
    return baseSepolia // Use Base Sepolia for production testing
  })()

  const isCorrectChain = chainId === preferredChain.id
  
  // For development/testing, be more lenient with chain requirements
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Use test wallet in test mode
  const effectiveIsConnected = isTestMode ? testWalletConnected : isConnected
  const effectiveAddress = isTestMode ? (testWalletConnected ? testAddress : undefined) : address
  const canProceed = effectiveIsConnected && effectiveAddress && (isCorrectChain || isDevelopment || isTestMode)

  useEffect(() => {
    if (canProceed && effectiveAddress && !isComplete) {
      console.log(`✅ Wallet connected: ${effectiveAddress} on chain ${chainId} (test mode: ${isTestMode})`)
      onComplete(effectiveAddress)
    }
  }, [canProceed, effectiveAddress, isComplete, onComplete, chainId, isTestMode])

  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: preferredChain.id })
    }
  }

  const getConnectionStatus = () => {
    if (!effectiveIsConnected) return { variant: "outline" as const, text: "Not Connected" }
    if (!isCorrectChain && !isDevelopment && !isTestMode) return { variant: "warning" as const, text: "Wrong Network" }
    return { variant: "success" as const, text: isTestMode ? "Test Wallet Connected" : "Connected" }
  }

  const status = getConnectionStatus()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Wallet className="h-6 w-6 text-blue-600" />
          <CardTitle>Connect Your Wallet</CardTitle>
        </div>
        <CardDescription>
          Connect your Ethereum wallet to get started with Tachi.
          {isDevelopment && ' (Development mode - any network accepted)'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span className="text-sm font-medium">Connection Status:</span>
          <Badge variant={status.variant}>{status.text}</Badge>
        </div>

        {/* Wallet Address Display */}
        {effectiveIsConnected && effectiveAddress && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Wallet Address</span>
              {isTestMode && <Badge variant="outline" className="text-xs">TEST</Badge>}
            </div>
            <code className="text-xs text-gray-600 break-all">
              {effectiveAddress}
            </code>
          </div>
        )}

        {/* Network Status */}
        {effectiveIsConnected && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span className="text-sm font-medium">Network:</span>
            </div>
            <div className="flex items-center space-x-2">
              {isCorrectChain || isDevelopment || isTestMode ? (
                <Badge variant="success">
                  {isTestMode ? 'Test Network' :
                   chainId === hardhat.id ? 'Hardhat Local' : 
                   chainId === baseSepolia.id ? 'Base Sepolia' :
                   chainId === base.id ? 'Base' : `Chain ${chainId}`}
                </Badge>
              ) : (
                <div className="flex items-center space-x-2">
                  <Badge variant="warning">Wrong Network</Badge>
                  <Button 
                    size="sm" 
                    onClick={handleSwitchNetwork}
                    disabled={isSwitching}
                  >
                    {isSwitching ? 'Switching...' : `Switch to ${preferredChain.name}`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection Button */}
        <div className="flex justify-center space-x-2">
          <ConnectButton />
          {isTestMode && !testWalletConnected && (
            <Button 
              onClick={() => setTestWalletConnected(true)}
              data-testid="test-wallet-connect"
              variant="outline"
            >
              Connect Test Wallet
            </Button>
          )}
        </div>

        {/* Success Message */}
        {canProceed && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700 font-medium">
              {isTestMode ? 'Test wallet connected successfully!' : 'Wallet connected successfully!'} 
              {!isComplete && ' Proceeding to next step...'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
