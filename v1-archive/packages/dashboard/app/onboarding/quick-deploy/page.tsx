'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent, EnhancedCardTitle } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';
import { EnhancedBadge } from '../../../components/ui/enhanced-badge';
import { useAuth } from '@/hooks/useAuth';

const deploymentSteps = [
  { id: 1, label: 'Generate API Key', completed: false, active: true },
  { id: 2, label: 'Create Script Tag', completed: false, active: false },
  { id: 3, label: 'Deploy to Website', completed: false, active: false },
  { id: 4, label: 'Verify Integration', completed: false, active: false }
];

export default function QuickDeployPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [deploymentData, setDeploymentData] = useState({
    apiKey: '',
    domain: 'example.com',
    rate: '1.00',
    scriptTag: ''
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentComplete, setDeploymentComplete] = useState(false);

  // Simulate API key generation
  useEffect(() => {
    if (currentStep === 1) {
      setTimeout(() => {
        const newApiKey = 'tachi_live_' + Math.random().toString(36).substr(2, 24);
        setDeploymentData(prev => ({ ...prev, apiKey: newApiKey }));
        updateStep(1, true);
        setCurrentStep(2);
      }, 2000);
    }
  }, [currentStep]);

  const updateStep = (stepId: number, completed: boolean) => {
    deploymentSteps.find(step => step.id === stepId)!.completed = completed;
    deploymentSteps.find(step => step.id === stepId)!.active = false;
    if (stepId < deploymentSteps.length) {
      deploymentSteps.find(step => step.id === stepId + 1)!.active = true;
    }
  };

  const generateScriptTag = () => {
    const scriptTag = `<script src="https://cdn.tachi.network/v1/tachi.js"
        data-api-key="${deploymentData.apiKey}"
        data-origin="${deploymentData.domain}"
        data-rate="${deploymentData.rate}">
</script>`;
    setDeploymentData(prev => ({ ...prev, scriptTag }));
    updateStep(2, true);
    setCurrentStep(3);
  };

  const simulateDeployment = async () => {
    setIsDeploying(true);
    updateStep(3, true);
    setCurrentStep(4);
    
    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    updateStep(4, true);
    setIsDeploying(false);
    setDeploymentComplete(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const goToDashboard = async () => {
    try {
      // Mark onboarding as complete
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        try {
          await refreshAuth();
        } catch (authError) {
          console.error('Failed to refresh auth state:', authError);
        }
        router.push('/dashboard');
      } else {
        console.error('Failed to complete onboarding');
        // Still redirect but user might be redirected back to onboarding
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <div className="bg-white border-b-2 border-[#FF7043] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-[#1A1A1A] font-['Coinbase Display']">
              TACHI QUICK DEPLOY
            </div>
            <EnhancedButton
              variant="ghost"
              size="sm"
              onClick={() => router.push('/onboarding/connect-wallet')}
              className="font-mono"
            >
              BACK TO SETUP
            </EnhancedButton>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {!deploymentComplete ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <EnhancedCard variant="elevated" className="bg-white">
                {/* Progress Steps - moved inside the card */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    {deploymentSteps.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold transition-all duration-300 ${
                            step.completed 
                              ? 'bg-[#52796F] text-white'
                              : step.active 
                                ? 'bg-[#FF7043] text-white animate-pulse'
                                : 'bg-gray-200 text-[#52796F]'
                          }`}>
                            {step.completed ? '✓' : step.active ? '⟳' : step.id}
                          </div>
                          <div className={`mt-2 text-sm font-medium font-['Coinbase Display'] transition-colors ${
                            step.active ? 'text-[#FF7043]' : step.completed ? 'text-[#52796F]' : 'text-[#52796F]'
                          }`}>
                            {step.label}
                          </div>
                        </div>
                        {index < deploymentSteps.length - 1 && (
                          <div className={`flex-1 h-1 mx-4 transition-all duration-500 ${
                            step.completed ? 'bg-[#52796F]' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <EnhancedCardHeader>
                  <EnhancedCardTitle>
                    Quick Deploy
                  </EnhancedCardTitle>
                </EnhancedCardHeader>
                <EnhancedCardContent className="space-y-8">
                  {/* Step 1: API Key Generation */}
                  {currentStep >= 1 && (
                    <div className={`transition-all duration-500 ${currentStep === 1 ? 'opacity-100' : 'opacity-75'}`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold font-mono">
                          ✓
                        </div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] font-['Coinbase Display']">
                          API Key Generated
                        </h3>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <div className="text-sm text-[#52796F] mb-2 font-['Coinbase Display'] uppercase tracking-wide">
                          Your API Key
                        </div>
                        <div className="font-mono text-[#1A1A1A] break-all bg-white p-3 rounded border">
                          {deploymentData.apiKey || 'Generating...'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Script Tag Generation */}
                  {currentStep >= 2 && (
                    <div className={`transition-all duration-500 ${currentStep === 2 ? 'opacity-100' : 'opacity-75'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono ${
                            deploymentSteps[1].completed ? 'bg-green-500 text-white' : 'bg-[#FF7043] text-white'
                          }`}>
                            {deploymentSteps[1].completed ? '✓' : '2'}
                          </div>
                          <h3 className="text-lg font-bold text-[#1A1A1A] font-['Coinbase Display']">
                            Integration Script
                          </h3>
                        </div>
                        {!deploymentSteps[1].completed && (
                          <EnhancedButton
                            onClick={generateScriptTag}
                            size="sm"
                            className="font-mono"
                          >
                            GENERATE SCRIPT
                          </EnhancedButton>
                        )}
                      </div>
                      {deploymentData.scriptTag && (
                        <div className="bg-[#1A1A1A] rounded-lg p-4 text-white font-mono text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-[#52796F] text-xs">HTML</div>
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(deploymentData.scriptTag)}
                              className="text-white hover:text-[#FF7043] font-mono text-xs"
                            >
                              COPY
                            </EnhancedButton>
                          </div>
                          <pre className="whitespace-pre-wrap break-all">{deploymentData.scriptTag}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Deployment Instructions */}
                  {currentStep >= 3 && (
                    <div className={`transition-all duration-500 ${currentStep === 3 ? 'opacity-100' : 'opacity-75'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono ${
                            deploymentSteps[2].completed ? 'bg-green-500 text-white' : 'bg-[#FF7043] text-white'
                          }`}>
                            {deploymentSteps[2].completed ? '✓' : '3'}
                          </div>
                          <h3 className="text-lg font-bold text-[#1A1A1A] font-['Coinbase Display']">
                            Deploy to Website
                          </h3>
                        </div>
                        {!deploymentSteps[2].completed && (
                          <EnhancedButton
                            onClick={simulateDeployment}
                            disabled={isDeploying}
                            size="sm"
                            className="font-mono"
                          >
                            {isDeploying ? 'DEPLOYING...' : 'DEPLOY NOW'}
                          </EnhancedButton>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg text-center">
                            <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-white font-bold font-mono">1</span>
                            </div>
                            <div className="text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">
                              Copy Script
                            </div>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg text-center">
                            <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-white font-bold font-mono">2</span>
                            </div>
                            <div className="text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">
                              Add to HTML
                            </div>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg text-center">
                            <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-white font-bold font-mono">3</span>
                            </div>
                            <div className="text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">
                              Start Earning
                            </div>
                          </div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div>
                            <h4 className="font-bold text-yellow-800 font-['Coinbase Display'] mb-2">
                              Quick Tip
                            </h4>
                            <p className="text-sm text-yellow-700">
                              Add the script tag to your website's &lt;head&gt; section for best performance. 
                              The integration will start working immediately.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Verification */}
                  {currentStep >= 4 && (
                    <div className="transition-all duration-500">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono ${
                          deploymentSteps[3].completed ? 'bg-green-500 text-white' : 'bg-[#FF7043] text-white animate-pulse'
                        }`}>
                          {deploymentSteps[3].completed ? '✓' : '⟳'}
                        </div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] font-['Coinbase Display']">
                          {deploymentSteps[3].completed ? 'Integration Verified' : 'Verifying Integration...'}
                        </h3>
                      </div>
                      {isDeploying && (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF7043] border-t-transparent mx-auto mb-4"></div>
                          <p className="text-[#52796F] font-mono">Checking your website integration...</p>
                        </div>
                      )}
                    </div>
                  )}
                </EnhancedCardContent>
              </EnhancedCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Configuration Preview */}
              <EnhancedCard variant="elevated" className="bg-white">
                <EnhancedCardHeader>
                  <EnhancedCardTitle>Configuration</EnhancedCardTitle>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#52796F]">Domain:</span>
                      <span className="font-mono text-[#1A1A1A]">{deploymentData.domain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#52796F]">Rate:</span>
                      <span className="font-mono text-[#1A1A1A]">${deploymentData.rate} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#52796F]">Network:</span>
                      <span className="font-mono text-[#1A1A1A]">Base Mainnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#52796F]">Type:</span>
                      <span className="font-mono text-[#1A1A1A]">Quick Deploy</span>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>

              {/* What Happens Next */}
              <EnhancedCard variant="elevated" className="bg-white">
                <EnhancedCardHeader>
                  <EnhancedCardTitle>What Happens Next</EnhancedCardTitle>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-[#FF7043] rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-[#1A1A1A]">Immediate Activation</div>
                        <div className="text-[#52796F]">Your monetization starts working instantly</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-[#FF7043] rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-[#1A1A1A]">Real-time Analytics</div>
                        <div className="text-[#52796F]">Track earnings and requests in your dashboard</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-[#FF7043] rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-[#1A1A1A]">Automatic Payouts</div>
                        <div className="text-[#52796F]">Receive payments directly to your wallet</div>
                      </div>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </div>
          </div>
        ) : (
          /* Success State */
          <div className="text-center max-w-2xl mx-auto">
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardContent className="py-12">
                <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  Deployment Successful!
                </h2>
                <p className="text-lg text-[#52796F] mb-8 leading-relaxed">
                  Tachi Protocol is now live on your website. You'll start earning from content 
                  crawlers immediately. Check your dashboard for real-time analytics and earnings.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-8 text-sm">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="font-bold text-green-800 mb-1 font-['Coinbase Display']">
                      Integration Status
                    </div>
                    <div className="text-green-700">✓ Active and monitoring</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="font-bold text-blue-800 mb-1 font-['Coinbase Display']">
                      First Payment
                    </div>
                    <div className="text-blue-700">Ready to process</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <EnhancedButton
                    onClick={goToDashboard}
                    size="lg"
                    className="font-mono"
                  >
                    VIEW DASHBOARD
                  </EnhancedButton>
                  <EnhancedButton
                    variant="outline"
                    onClick={() => router.push('/docs')}
                    size="lg"
                    className="font-mono"
                  >
                    VIEW DOCS
                  </EnhancedButton>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          </div>
        )}
      </div>
    </div>
  );
}
