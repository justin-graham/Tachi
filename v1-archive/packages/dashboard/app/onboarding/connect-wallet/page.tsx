'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useConnect } from 'wagmi';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent, EnhancedCardTitle } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';
import { EnhancedBadge } from '../../../components/ui/enhanced-badge';
import { EnhancedInput } from '../../../components/ui/enhanced-input';

const onboardingSteps = [
  { id: 1, label: 'Connect Wallet', active: true, completed: false },
  { id: 2, label: 'Configure Settings', active: false, completed: false },
  { id: 3, label: 'Deploy Integration', active: false, completed: false },
  { id: 4, label: 'Go Live', active: false, completed: false }
];

export default function OnboardingConnectWallet() {
  const router = useRouter();
  const { connectors, connect } = useConnect();
  const [formData, setFormData] = useState({
    domain: '',
    contentType: 'blog',
    expectedTraffic: 'low',
    monetizationGoal: 'revenue'
  });
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress] = useState('0x1234567890abcdef1234567890abcdef12345678');

  const handleNext = () => {
    router.push('/onboarding/configure');
  };

  const handleSkipSetup = () => {
    router.push('/onboarding/quick-deploy');
  };

  const handleWalletConnect = (connector: any) => {
    connect({ connector });
    setIsConnected(true);
  };

  // Define wallet configurations with proper logos
  const walletConfigs = [
    {
      name: 'MetaMask',
      image: '/images/metamask.png',
      connector: connectors.find(c => c.name.toLowerCase().includes('metamask'))
    },
    {
      name: 'WalletConnect',
      image: '/images/Walletconnect-logo.png',
      connector: connectors.find(c => c.name.toLowerCase().includes('walletconnect'))
    },
    {
      name: 'Coinbase',
      image: '/images/coinbase.svg',
      connector: connectors.find(c => c.name.toLowerCase().includes('coinbase'))
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <div className="bg-white border-b-2 border-[#FF7043] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-[#1A1A1A] font-['Coinbase Display']">
              TACHI SETUP
            </div>
            <EnhancedButton
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="font-mono"
            >
              SKIP TO DASHBOARD
            </EnhancedButton>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <EnhancedCard variant="elevated" className="bg-white">
              {/* Progress Steps - moved inside the card */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  {onboardingSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold ${
                          step.completed 
                            ? 'bg-[#52796F] text-white'
                            : step.active 
                              ? 'bg-[#FF7043] text-white'
                              : 'bg-gray-200 text-[#52796F]'
                        }`}>
                          {step.completed ? '✓' : step.id}
                        </div>
                        <div className={`mt-2 text-sm font-medium font-['Coinbase Display'] ${
                          step.active ? 'text-[#FF7043]' : step.completed ? 'text-[#52796F]' : 'text-[#52796F]'
                        }`}>
                          {step.label}
                        </div>
                      </div>
                      {index < onboardingSteps.length - 1 && (
                        <div className={`flex-1 h-1 mx-4 ${
                          step.completed ? 'bg-[#52796F]' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <EnhancedCardHeader>
                <EnhancedCardTitle>
                  Connect Wallet
                </EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-8">
                {/* Wallet Connection Section */}
                <div className="text-center">
                  {!isConnected ? (
                    <div>
                      <p className="text-[#1A1A1A] mb-8">
                        Connect your wallet to get started with Tachi Protocol
                      </p>
                      
                      {/* Wallet Logo Grid */}
                      <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-8">
                        {walletConfigs.map((wallet) => (
                          <button
                            key={wallet.name}
                            onClick={() => wallet.connector && handleWalletConnect(wallet.connector)}
                            className="group flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-[#FF7043] transition-all duration-200 hover:shadow-lg"
                            disabled={!wallet.connector}
                          >
                            <div className="w-16 h-16 mb-3 flex items-center justify-center">
                              <Image
                                src={wallet.image}
                                alt={wallet.name}
                                width={64}
                                height={64}
                                className="object-contain"
                              />
                            </div>
                            <span className="text-sm font-medium text-[#1A1A1A] font-['Coinbase Display'] group-hover:text-[#FF7043]">
                              {wallet.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                        <h3 className="text-xl font-bold text-green-600 mb-2 font-['Coinbase Display']">
                          Wallet Connected Successfully
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#52796F]">Address:</span>
                            <span className="font-mono text-[#1A1A1A]">{walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#52796F]">Network:</span>
                            <span className="font-mono text-[#1A1A1A]">Base Mainnet</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#52796F]">Balance:</span>
                            <span className="font-mono text-[#1A1A1A]">125.43 USDC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Website Information Form */}
                {isConnected && (
                  <div className="border-t border-gray-200 pt-8">
                    <h4 className="text-lg font-bold text-[#1A1A1A] mb-6 font-['Coinbase Display']">
                      Tell us about your website
                    </h4>
                    <div className="space-y-6">
                      <div>
                        <EnhancedInput
                          type="url"
                          value={formData.domain}
                          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                          placeholder="Your Domain"
                          className="font-mono"
                        />
                        <p className="text-xs text-[#FF7043] mt-1 font-mono">
                          The website where you'll be implementing Tachi Protocol
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <select
                            value={formData.contentType}
                            onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                            className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-[#FF7043] text-[#1A1A1A] font-mono text-sm focus:outline-none focus:border-[#FF7043]"
                          >
                            <option value="blog">Content Type: Blog / Articles</option>
                            <option value="news">Content Type: News Site</option>
                            <option value="documentation">Content Type: Documentation</option>
                            <option value="api">Content Type: API / Data</option>
                            <option value="media">Content Type: Media / Downloads</option>
                            <option value="other">Content Type: Other</option>
                          </select>
                        </div>

                        <div>
                          <select
                            value={formData.expectedTraffic}
                            onChange={(e) => setFormData({ ...formData, expectedTraffic: e.target.value })}
                            className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-[#FF7043] text-[#1A1A1A] font-mono text-sm focus:outline-none focus:border-[#FF7043]"
                          >
                            <option value="low">Expected Traffic: &lt; 10K requests/month</option>
                            <option value="medium">Expected Traffic: 10K - 100K requests/month</option>
                            <option value="high">Expected Traffic: 100K - 1M requests/month</option>
                            <option value="enterprise">Expected Traffic: 1M+ requests/month</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#FF7043] uppercase tracking-wide mb-4 font-['Coinbase Display']">
                          Primary Goal
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'revenue', label: 'Generate Revenue' },
                            { value: 'protection', label: 'Content Protection' },
                            { value: 'analytics', label: 'Usage Analytics' },
                            { value: 'monetization', label: 'API Monetization' }
                          ].map(goal => (
                            <button
                              key={goal.value}
                              onClick={() => setFormData({ ...formData, monetizationGoal: goal.value })}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                formData.monetizationGoal === goal.value
                                  ? 'border-[#FF7043] bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">{goal.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6">
                  <EnhancedButton
                    variant="outline"
                    onClick={() => router.push('/auth/connect')}
                    className="flex-1"
                  >
                    BACK
                  </EnhancedButton>
                  <EnhancedButton
                    onClick={handleNext}
                    disabled={!isConnected || !formData.domain}
                    className="flex-1 font-mono"
                  >
                    CONTINUE SETUP
                  </EnhancedButton>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Deploy Option */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle className="flex items-center space-x-2">
                  <span>Quick Deploy</span>
                </EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <p className="text-sm text-[#52796F] mb-4">
                  Skip the detailed setup and deploy Tachi Protocol with default settings in under 2 minutes.
                </p>
                <EnhancedButton
                  variant="technical"
                  size="sm"
                  onClick={handleSkipSetup}
                  className="w-full font-mono"
                  disabled={!isConnected}
                >
                  QUICK DEPLOY
                </EnhancedButton>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* What's Next */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>What's Next</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-[#FF7043] rounded-full flex items-center justify-center text-white font-bold font-mono text-xs">
                      2
                    </div>
                    <div>
                      <div className="font-medium text-[#1A1A1A] font-['Coinbase Display']">Configure Settings</div>
                      <div className="text-[#52796F]">Set pricing, rate limits, and content rules</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[#52796F] font-bold font-mono text-xs">
                      3
                    </div>
                    <div>
                      <div className="font-medium text-[#52796F] font-['Coinbase Display']">Deploy Integration</div>
                      <div className="text-[#52796F]">Add Tachi to your website with one line of code</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[#52796F] font-bold font-mono text-xs">
                      4
                    </div>
                    <div>
                      <div className="font-medium text-[#52796F] font-['Coinbase Display']">Go Live</div>
                      <div className="text-[#52796F]">Start earning from content crawlers immediately</div>
                    </div>
                  </div>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Support */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Need Help?</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <div className="space-y-3">
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/docs')}
                    className="w-full justify-start font-mono"
                  >
                    VIEW DOCUMENTATION
                  </EnhancedButton>
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/support')}
                    className="w-full justify-start font-mono"
                  >
                    CONTACT SUPPORT
                  </EnhancedButton>
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('https://discord.gg/tachi', '_blank')}
                    className="w-full justify-start font-mono"
                  >
                    JOIN DISCORD
                  </EnhancedButton>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          </div>
        </div>
      </div>
    </div>
  );
}