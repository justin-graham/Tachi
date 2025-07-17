import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { Providers } from '../src/providers/web3-provider'
import '../src/app/globals.css'
import { useEffect, useState } from 'react'

function ConnectWalletDemo() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [preferredChain] = useState(baseSepolia)

  const isCorrectChain = chainId === preferredChain.id
  const canProceed = isConnected && address && isCorrectChain

  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: preferredChain.id })
    }
  }

  const getConnectionStatus = () => {
    if (!isConnected) return { variant: "outline", text: "Not Connected" }
    if (!isCorrectChain) return { variant: "warning", text: "Wrong Network" }
    return { variant: "success", text: "Connected" }
  }

  const status = getConnectionStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto space-y-6 px-4">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to Tachi
          </h1>
          <p className="text-lg text-gray-600">
            Connect your wallet to get started with the pay-per-crawl protocol
          </p>
        </div>

        {/* Connect Wallet Step */}
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600">
              Connect your Ethereum wallet to get started. You'll need to be on the {preferredChain.name} network.
            </p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg mb-4">
            <span className="text-sm font-medium">Status:</span>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
              status.variant === 'success' ? 'bg-green-500 text-white' :
              status.variant === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-gray-200 text-gray-800'
            }`}>
              {status.text}
            </span>
          </div>

          {/* Wallet Address Display */}
          {isConnected && address && (
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium">Wallet Address</span>
              </div>
              <code className="text-xs text-gray-600 break-all">
                {address}
              </code>
            </div>
          )}

          {/* Network Status */}
          {isConnected && (
            <div className="flex items-center justify-between p-3 border rounded-lg mb-4">
              <span className="text-sm font-medium">Network:</span>
              <div className="flex items-center space-x-2">
                {isCorrectChain ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-500 text-white">
                    {preferredChain.name}
                  </span>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-500 text-white">
                      Wrong Network
                    </span>
                    <button 
                      onClick={handleSwitchNetwork}
                      disabled={isSwitching}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isSwitching ? 'Switching...' : `Switch to ${preferredChain.name}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Connect Button */}
          <div className="flex justify-center mb-4">
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
            <div className="p-3 bg-blue-50 rounded-lg mb-4">
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
                <span className="text-sm font-medium">
                  ✅ Wallet connected successfully! You can now proceed to the next step.
                </span>
              </div>
            </div>
          )}

          {/* Error/Warning Messages */}
          {isConnected && !isCorrectChain && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-800">
                <span className="text-sm">
                  ⚠️ Please switch to {preferredChain.name} network to continue.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Debug Info */}
        {address && (
          <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="text-sm font-medium mb-2">Debug Info:</h4>
            <div className="text-xs space-y-1">
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
              <div>Correct Chain: {isCorrectChain ? 'Yes' : 'No'}</div>
              <div>Chain ID: {chainId}</div>
              <div>Expected Chain: {preferredChain.name} ({preferredChain.id})</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Providers>
      <ConnectWalletDemo />
    </Providers>
  )
}
