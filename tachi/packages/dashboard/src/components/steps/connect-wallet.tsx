"use client"

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
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
  const [preferredChain] = useState(baseSepolia) // Use Base Sepolia for testing

  const isCorrectChain = chainId === preferredChain.id
  const canProceed = isConnected && address && isCorrectChain

  useEffect(() => {
    if (canProceed && address && !isComplete) {
      onComplete(address)
    }
  }, [canProceed, address, isComplete, onComplete])

  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: preferredChain.id })
    }
  }

  const getConnectionStatus = () => {
    if (!isConnected) return { variant: "outline" as const, text: "Not Connected" }
    if (!isCorrectChain) return { variant: "warning" as const, text: "Wrong Network" }
    return { variant: "success" as const, text: "Connected" }
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
          Connect your Ethereum wallet to get started with Tachi. You'll need to be on the {preferredChain.name} network.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span className="text-sm font-medium">Connection Status:</span>
          <Badge variant={status.variant}>{status.text}</Badge>
        </div>

        {/* Wallet Address Display */}
        {isConnected && address && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Wallet Address</span>
            </div>
            <code className="text-xs text-gray-600 break-all">
              {address}
            </code>
          </div>
        )}

        {/* Network Status */}
        {isConnected && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span className="text-sm font-medium">Network:</span>
            </div>
            <div className="flex items-center space-x-2">
              {isCorrectChain ? (
                <Badge variant="success">{preferredChain.name}</Badge>
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

        {/* Connect Button */}
        <div className="flex justify-center">
          <ConnectButton 
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
            chainStatus={{
              smallScreen: 'icon',
              largeScreen: 'full',
            }}
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />
        </div>

        {/* Instructions */}
        {!isConnected && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Getting Started:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Click "Connect Wallet" to open the wallet selection modal</li>
              <li>• Choose your preferred wallet (MetaMask, WalletConnect, etc.)</li>
              <li>• Approve the connection in your wallet</li>
              <li>• Switch to {preferredChain.name} network if prompted</li>
            </ul>
          </div>
        )}

        {/* Success Message */}
        {canProceed && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Wallet connected successfully! You can now proceed to the next step.
              </span>
            </div>
          </div>
        )}

        {/* Error/Warning Messages */}
        {isConnected && !isCorrectChain && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Please switch to {preferredChain.name} network to continue.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
