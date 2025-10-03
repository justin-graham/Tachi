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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'publisher' | 'crawler'>('publisher');
  
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { login, isAuthenticated, user, isLoading } = useAuth();

  // Expected chain ID (Base Mainnet)
  const expectedChainId = 8453;
  const isWrongNetwork = isConnected && chainId !== expectedChainId;

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      if (user.userType === 'publisher') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard/analytics');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleAuthenticate = async () => {
    if (!isConnected || !address) {
      setAuthError('Please connect your wallet first');
      return;
    }

    if (isWrongNetwork) {
      setAuthError('Please switch to Base network first');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await login(userType);
      
      if (result.success) {
        // Redirect to appropriate dashboard or onboarding
        if (userType === 'publisher') {
          router.push('/onboarding/connect-wallet');
        } else {
          router.push('/dashboard/analytics');
        }
      } else {
        setAuthError(result.error || 'Authentication failed');
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
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
            <div className="w-24 h-24 mx-auto mb-8 rounded-lg bg-gradient-to-br from-[#FF7043] to-[#e55a35] flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-105">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <EnhancedCardTitle className="text-4xl font-bold mb-4 text-[#1A1A1A] font-['Coinbase Display'] tracking-tight">
              Welcome to Tachi
            </EnhancedCardTitle>
            <p className="text-lg leading-relaxed text-[#52796F] max-w-md mx-auto">
              Connect your wallet to start earning from content crawlers
            </p>
          </EnhancedCardHeader>
          
          <EnhancedCardContent className="space-y-8">
            {/* User Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#1A1A1A] font-['Coinbase Display']">
                I am a...
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setUserType('publisher')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    userType === 'publisher'
                      ? 'border-[#FF7043] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-bold text-[#1A1A1A] font-['Coinbase Display']">Publisher</div>
                  <div className="text-sm text-[#52796F] mt-1">I want to monetize my content</div>
                </button>
                <button
                  onClick={() => setUserType('crawler')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    userType === 'crawler'
                      ? 'border-[#FF7043] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-bold text-[#1A1A1A] font-['Coinbase Display']">Crawler</div>
                  <div className="text-sm text-[#52796F] mt-1">I want to access premium content</div>
                </button>
              </div>
            </div>

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
            {authError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-800 font-['Coinbase Display']">
                      Authentication Failed
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      {authError}
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
                  onClick={handleAuthenticate}
                  disabled={isAuthenticating || isWrongNetwork}
                  className="w-full font-mono"
                  variant="primary"
                >
                  {isAuthenticating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Authenticating...
                    </>
                  ) : (
                    `Sign In as ${userType === 'publisher' ? 'Publisher' : 'Crawler'}`
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