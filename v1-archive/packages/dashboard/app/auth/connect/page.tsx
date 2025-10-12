'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';
import { EnhancedBadge } from '../../../components/ui/enhanced-badge';
import { useAuth } from '../../../hooks/useAuth';

export default function AuthConnectPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { connectWallet, isAuthenticated, user, isLoading } = useAuth();

  // Expected chain ID (Base Mainnet)
  const expectedChainId = 8453;
  const isWrongNetwork = isConnected && chainId !== expectedChainId;

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Redirect if wallet already connected
    if (user && user.walletConnected) {
      if (user.onboardingCompleted) {
        // Fully set up user - go to dashboard
        if (user.userType === 'publisher') {
          router.push('/dashboard');
        } else {
          router.push('/dashboard/analytics');
        }
      } else {
        // Has wallet but needs onboarding
        router.push('/onboarding/connect-wallet');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleConnectWallet = async () => {
    if (!isConnected || !address) {
      setConnectError('Please connect your wallet first');
      return;
    }

    if (isWrongNetwork) {
      setConnectError('Please switch to Base network first');
      return;
    }

    setIsConnecting(true);
    setConnectError(null);

    try {
      const result = await connectWallet();
      
      if (result.success) {
        // Redirect to onboarding
        router.push('/onboarding/connect-wallet');
      } else {
        setConnectError(result.error || 'Wallet connection failed');
      }
    } catch (error: any) {
      setConnectError(error.message || 'Wallet connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: expectedChainId });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF7043] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-6 py-8">
      <div className="w-full max-w-lg">
        <EnhancedCard variant="elevated" className="bg-white shadow-xl">
          <EnhancedCardHeader className="text-center pb-8 pt-10">
            <EnhancedCardTitle className="text-4xl font-bold mb-4 text-[#1A1A1A] font-['Coinbase Display'] tracking-tight">
              Connect Your Wallet
            </EnhancedCardTitle>
            <p className="text-lg leading-relaxed text-[#52796F] max-w-md mx-auto">
              {user?.email ? `Hi ${user.profile?.name || user.email.split('@')[0]}! ` : ''}Connect your wallet to complete your account setup
            </p>
          </EnhancedCardHeader>
          
          <EnhancedCardContent className="space-y-8">
            {/* Account Info */}
            {user && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-800 font-['Coinbase Display']">
                      Account Type: {user.userType === 'publisher' ? 'Publisher' : 'Crawler'}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {user.userType === 'publisher' ? 'You can monetize your content' : 'You can access premium content'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Network Warning */}
            {isWrongNetwork && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L2.732 15.5C1.962 16.333 2.924 18 4.464 18z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-800 font-['Coinbase Display']">
                      Wrong Network
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please switch to Base network to continue.
                    </p>
                  </div>
                </div>
                <EnhancedButton
                  onClick={handleSwitchNetwork}
                  variant="technical"
                  className="bg-yellow-600 hover:bg-yellow-700 border-yellow-600"
                >
                  Switch to Base Network
                </EnhancedButton>
              </div>
            )}

            {/* Error Message */}
            {connectError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-800 font-['Coinbase Display']">
                      Connection Failed
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      {connectError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Status */}
            {isConnected && address && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800 font-['Coinbase Display']">
                        Wallet Connected
                      </h4>
                      <p className="text-sm text-green-700 font-mono">
                        {formatAddress(address)}
                      </p>
                    </div>
                  </div>
                  <EnhancedButton
                    onClick={() => disconnect()}
                    variant="ghost"
                    size="sm"
                    className="text-green-700 hover:bg-green-100"
                  >
                    Disconnect
                  </EnhancedButton>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="space-y-4">
              {!isConnected ? (
                <div className="space-y-3">
                  {connectors.map((connector) => (
                    <EnhancedButton
                      key={connector.uid}
                      onClick={() => connect({ connector })}
                      className="w-full font-mono"
                      variant="primary"
                    >
                      Connect {connector.name}
                    </EnhancedButton>
                  ))}
                </div>
              ) : (
                <EnhancedButton
                  onClick={handleConnectWallet}
                  disabled={isConnecting || isWrongNetwork}
                  className="w-full font-mono"
                  variant="primary"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Connecting Wallet...
                    </>
                  ) : (
                    'Connect Wallet to Continue'
                  )}
                </EnhancedButton>
              )}
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="text-sm text-[#52796F]">
                By connecting, you agree to our{' '}
                <a href="/terms" className="text-[#FF7043] hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-[#FF7043] hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      </div>
    </div>
  );
}