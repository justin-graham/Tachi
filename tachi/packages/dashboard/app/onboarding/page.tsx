'use client'

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '../../components/ui/enhanced-card';
import { EnhancedButton } from '../../components/ui/enhanced-button';
import { EnhancedInput } from '../../components/ui/enhanced-input';
import { EnhancedBadge } from '../../components/ui/enhanced-badge';

type OnboardingStep = 'connect-wallet' | 'terms-pricing' | 'deploy-contract' | 'complete';

interface OnboardingState {
  currentStep: OnboardingStep;
  stepNumber: number;
  walletConnected: boolean;
  walletAddress: string | null;
  crawlPrice: string;
  originUrl: string;
  termsAccepted: boolean;
  contractDeployed: boolean;
}

const STEP_TITLES = {
  'connect-wallet': 'Connect Wallet',
  'terms-pricing': 'Terms & Pricing',
  'deploy-contract': 'Deploy Contract',
  'complete': 'Setup Complete'
};

export default function TachiOnboarding() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'connect-wallet',
    stepNumber: 1,
    walletConnected: false,
    walletAddress: null,
    crawlPrice: '1.00',
    originUrl: 'https://api.example.com',
    termsAccepted: false,
    contractDeployed: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const goToNextStep = useCallback(() => {
    const stepOrder: OnboardingStep[] = ['connect-wallet', 'terms-pricing', 'deploy-contract', 'complete'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      updateState({ 
        currentStep: nextStep, 
        stepNumber: currentIndex + 2 
      });
    }
  }, [state.currentStep, updateState]);

  const goToPreviousStep = useCallback(() => {
    const stepOrder: OnboardingStep[] = ['connect-wallet', 'terms-pricing', 'deploy-contract', 'complete'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    
    if (currentIndex > 0) {
      const prevStep = stepOrder[currentIndex - 1];
      updateState({ 
        currentStep: prevStep, 
        stepNumber: currentIndex 
      });
    }
  }, [state.currentStep, updateState]);

  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
      updateState({
        walletConnected: true,
        walletAddress: mockAddress
      });
      setTimeout(goToNextStep, 1000);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsSubmit = () => {
    if (state.termsAccepted && state.crawlPrice && state.originUrl) {
      goToNextStep();
    }
  };

  const handleDeployContract = async () => {
    setIsLoading(true);
    try {
      // Simulate contract deployment
      await new Promise(resolve => setTimeout(resolve, 3000));
      updateState({ contractDeployed: true });
      goToNextStep();
    } catch (error) {
      console.error('Contract deployment failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  const renderProgressHeader = () => (
    <div className="text-center mb-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center space-x-4 mb-4">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold
                ${stepNum === state.stepNumber 
                  ? 'bg-[#FF7043] text-white' 
                  : stepNum < state.stepNumber 
                  ? 'bg-[#52796F] text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  stepNum < state.stepNumber ? 'bg-[#52796F]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] font-['Coinbase Display']">
          Step {state.stepNumber}/4: {STEP_TITLES[state.currentStep]}
        </h1>
      </div>
    </div>
  );

  const renderConnectWallet = () => (
    <EnhancedCard variant="elevated" className="max-w-2xl mx-auto bg-white">
      <EnhancedCardContent className="p-8">
        <div className="text-center space-y-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF7043] to-[#e55a35] rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">
              Connect Your Wallet
            </h3>
            <p className="text-[#52796F] leading-relaxed">
              Connect your wallet to get started with Tachi Protocol
            </p>
          </div>

          {state.walletConnected ? (
            <div className="space-y-6">
              <EnhancedBadge variant="success" size="lg" className="inline-flex">
                Wallet Connected Successfully!
              </EnhancedBadge>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-xs text-[#52796F] uppercase tracking-wide font-medium mb-1">Connected Address</p>
                <p className="font-mono text-[#1A1A1A] font-medium">
                  {state.walletAddress?.slice(0, 6)}...{state.walletAddress?.slice(-4)}
                </p>
              </div>
              <EnhancedButton 
                onClick={goToNextStep}
                className="w-full"
                size="lg"
              >
                Continue →
              </EnhancedButton>
            </div>
          ) : (
            <div className="space-y-6">
              <EnhancedButton
                onClick={handleConnectWallet}
                loading={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </EnhancedButton>
              
              <div className="text-center">
                <p className="text-sm text-[#52796F] mb-3">
                  Supported wallets:
                </p>
                <div className="flex justify-center space-x-4 text-xs text-[#1A1A1A] font-medium">
                  <span>MetaMask</span>
                  <span className="text-gray-300">•</span>
                  <span>WalletConnect</span>
                  <span className="text-gray-300">•</span>
                  <span>Coinbase</span>
                </div>
              </div>

              <div className="flex justify-end">
                <EnhancedButton variant="ghost" onClick={() => router.push('/')}>
                  Skip for now
                </EnhancedButton>
              </div>
            </div>
          )}
        </div>
      </EnhancedCardContent>
    </EnhancedCard>
  );

  const renderTermsPricing = () => (
    <EnhancedCard variant="elevated" className="max-w-2xl mx-auto bg-white">
      <EnhancedCardHeader>
        <EnhancedCardTitle>Configuration & Terms</EnhancedCardTitle>
        <p className="text-[#52796F] mt-2">Set your pricing and content settings</p>
      </EnhancedCardHeader>
      <EnhancedCardContent className="space-y-8">
        <div className="grid gap-6">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-3 font-['Coinbase Display']">
              Crawl Price (per request)
            </label>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={state.crawlPrice}
                  onChange={(e) => updateState({ crawlPrice: e.target.value })}
                  className="w-28 px-3 py-2 border-2 border-gray-300 rounded-lg bg-white focus:border-[#FF7043] focus:ring-2 focus:ring-[#FF7043] focus:outline-none font-mono text-lg font-bold tabular-nums transition-colors"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#52796F] font-medium">$</span>
              </div>
              <EnhancedBadge variant="technical">USDC</EnhancedBadge>
              <span className="text-sm text-[#52796F] font-mono">(≈ ${state.crawlPrice})</span>
            </div>
          </div>

          <EnhancedInput
            label="Origin URL"
            type="url"
            value={state.originUrl}
            onChange={(e) => updateState({ originUrl: e.target.value })}
            placeholder="https://api.example.com"
            helperText="The base URL where your content is hosted"
          />

          <div className="bg-gray-50 rounded-lg p-4 border">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={state.termsAccepted}
                onChange={(e) => updateState({ termsAccepted: e.target.checked })}
                className="w-5 h-5 mt-0.5 text-[#FF7043] border-2 border-gray-300 rounded focus:ring-[#FF7043] focus:ring-2"
              />
              <div className="text-sm">
                <span className="text-[#1A1A1A] font-medium">
                  I agree to the publisher terms and conditions
                </span>
                <p className="text-[#52796F] mt-1">
                  By accepting, you agree to Tachi Protocol's publisher guidelines and payment terms.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-between space-x-4 pt-4">
          <EnhancedButton
            variant="outline"
            onClick={goToPreviousStep}
          >
            ← Back
          </EnhancedButton>
          <EnhancedButton
            onClick={handleTermsSubmit}
            disabled={!state.termsAccepted || !state.crawlPrice || !state.originUrl}
          >
            Continue →
          </EnhancedButton>
        </div>
      </EnhancedCardContent>
    </EnhancedCard>
  );

  const renderDeployContract = () => (
    <EnhancedCard variant="elevated" className="max-w-2xl mx-auto bg-white">
      <EnhancedCardContent className="p-8">
        <div className="text-center space-y-8">
          {state.contractDeployed ? (
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <EnhancedBadge variant="success" size="lg" className="mb-4">
                  Contract Deployed Successfully!
                </EnhancedBadge>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-xs text-[#52796F] uppercase tracking-wide font-medium mb-1">Contract Address</p>
                  <p className="font-mono text-[#1A1A1A] font-medium text-sm">
                    0xAbC...123
                  </p>
                </div>
              </div>
              <EnhancedButton 
                onClick={goToNextStep}
                className="w-full"
                size="lg"
              >
                Continue →
              </EnhancedButton>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF7043] to-[#e55a35] rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">
                  Deploy Publisher Contract
                </h3>
                <p className="text-[#52796F]">
                  Deploy your smart contract to the Base network
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border text-left">
                <h4 className="font-semibold text-[#1A1A1A] mb-4 font-['Coinbase Display']">Contract Configuration:</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[#52796F]">Crawl Price:</span>
                    <span className="font-mono font-bold text-[#1A1A1A]">${state.crawlPrice} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#52796F]">Origin URL:</span>
                    <span className="font-mono text-[#1A1A1A] truncate max-w-48">{state.originUrl}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#52796F]">Network:</span>
                    <EnhancedBadge variant="info" size="sm">Base Mainnet</EnhancedBadge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#52796F]">Features:</span>
                    <span className="text-[#1A1A1A] text-xs">Payment Processing • Access Control</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <EnhancedButton
                  onClick={handleDeployContract}
                  loading={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Deploying Contract...' : 'Deploy Contract'}
                </EnhancedButton>

                <div className="flex justify-start">
                  <EnhancedButton
                    variant="outline"
                    onClick={goToPreviousStep}
                  >
                    ← Back
                  </EnhancedButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </EnhancedCardContent>
    </EnhancedCard>
  );

  const renderComplete = () => (
    <EnhancedCard variant="elevated" className="max-w-2xl mx-auto bg-white">
      <EnhancedCardContent className="p-8">
        <div className="text-center space-y-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3 font-['Coinbase Display']">
              Setup Complete!
            </h2>
            <p className="text-lg text-[#52796F] leading-relaxed">
              Your Tachi publisher account is ready. Start earning from content crawlers now.
            </p>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border text-left">
            <h3 className="font-semibold text-[#1A1A1A] mb-4 font-['Coinbase Display']">Your Configuration Summary:</h3>
            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                <span className="text-[#52796F] font-medium">Crawl Price:</span>
                <span className="font-mono font-bold text-[#1A1A1A]">${state.crawlPrice} USDC</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                <span className="text-[#52796F] font-medium">Origin URL:</span>
                <span className="font-mono text-[#1A1A1A] text-sm truncate max-w-48">{state.originUrl}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                <span className="text-[#52796F] font-medium">Wallet:</span>
                <span className="font-mono text-[#1A1A1A]">{state.walletAddress?.slice(0, 6)}...{state.walletAddress?.slice(-4)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#52796F] font-medium">Network:</span>
                <EnhancedBadge variant="info" size="sm">Base Mainnet</EnhancedBadge>
              </div>
            </div>
          </div>

          <EnhancedButton
            onClick={handleComplete}
            variant="secondary"
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            Go to Dashboard
          </EnhancedButton>
        </div>
      </EnhancedCardContent>
    </EnhancedCard>
  );

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'connect-wallet':
        return renderConnectWallet();
      case 'terms-pricing':
        return renderTermsPricing();
      case 'deploy-contract':
        return renderDeployContract();
      case 'complete':
        return renderComplete();
      default:
        return renderConnectWallet();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-8">
      <div className="max-w-4xl mx-auto px-6">
        {renderProgressHeader()}
        {renderCurrentStep()}
      </div>
    </div>
  );
}