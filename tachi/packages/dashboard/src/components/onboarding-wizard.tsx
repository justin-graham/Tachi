"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConnectWalletStep } from '@/components/steps/connect-wallet'
import { SiteDetailsStep } from '@/components/steps/site-details'
import { PricingStep } from '@/components/steps/pricing'
import { LicenseCreationStep } from '@/components/steps/license-creation'
import { DeploymentStep } from '@/components/steps/deployment'
import { CheckCircle, Circle, Wallet, Globe, DollarSign, FileText, Rocket } from 'lucide-react'
import { SiteDetailsStepData } from '@/schemas/site-details'
import { PublisherDashboard } from '@/components/dashboard/publisher-dashboard'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

interface StepData {
  walletAddress?: string
  siteDetails?: SiteDetailsStepData
  pricingData?: { pricePerCrawl: number; priceUnits: string; workerConfig: any }
  licenseData?: { tokenId?: bigint; transactionHash: string }
  deploymentData?: { deployed: boolean }
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState('connect-wallet')
  const [stepData, setStepData] = useState<StepData>({})
  
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'connect-wallet',
      title: 'Connect Wallet',
      description: 'Connect your Ethereum wallet',
      icon: <Wallet className="h-4 w-4" />,
      completed: false
    },
    {
      id: 'site-details',
      title: 'Site Details',
      description: 'Configure your website details',
      icon: <Globe className="h-4 w-4" />,
      completed: false
    },
    {
      id: 'pricing',
      title: 'Pricing Setup',
      description: 'Set your crawl pricing',
      icon: <DollarSign className="h-4 w-4" />,
      completed: false
    },
    {
      id: 'license',
      title: 'Create License',
      description: 'Mint your CrawlNFT license',
      icon: <FileText className="h-4 w-4" />,
      completed: false
    },
    {
      id: 'deploy',
      title: 'Deploy Worker',
      description: 'Deploy your Cloudflare Worker',
      icon: <Rocket className="h-4 w-4" />,
      completed: false
    }
  ])

  const handleStepComplete = (stepId: string, data?: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ))

    // Store step data
    if (stepId === 'connect-wallet' && data) {
      setStepData(prev => ({ ...prev, walletAddress: data }))
      setCurrentStep('site-details')
    } else if (stepId === 'site-details' && data) {
      setStepData(prev => ({ ...prev, siteDetails: data }))
      setCurrentStep('pricing')
    } else if (stepId === 'pricing' && data) {
      setStepData(prev => ({ ...prev, pricingData: data }))
      setCurrentStep('license')
    } else if (stepId === 'license' && data) {
      setStepData(prev => ({ ...prev, licenseData: data }))
      setCurrentStep('deploy')
    } else if (stepId === 'deploy' && data) {
      setStepData(prev => ({ ...prev, deploymentData: data }))
      // Onboarding complete - show dashboard
      setCurrentStep('complete')
    }
  }

  const getStepStatus = (step: OnboardingStep) => {
    if (step.completed) return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, variant: "success" as const }
    if (step.id === currentStep) return { icon: <Circle className="h-4 w-4 text-blue-500" />, variant: "default" as const }
    return { icon: <Circle className="h-4 w-4 text-gray-400" />, variant: "outline" as const }
  }

  const isOnboardingComplete = () => {
    return currentStep === 'complete' && 
           stepData.walletAddress && 
           stepData.siteDetails && 
           stepData.pricingData && 
           stepData.licenseData &&
           stepData.deploymentData
  }

  const handleStartOver = () => {
    setCurrentStep('connect-wallet')
    setStepData({})
    setSteps(prev => prev.map(step => ({ ...step, completed: false })))
  }

  // Show dashboard if onboarding is complete
  if (isOnboardingComplete()) {
    return (
      <PublisherDashboard
        data={{
          walletAddress: stepData.walletAddress!,
          siteDetails: stepData.siteDetails!,
          pricingData: stepData.pricingData!,
          licenseData: stepData.licenseData!,
          deploymentData: stepData.deploymentData!
        }}
        onStartOver={handleStartOver}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Tachi
          </CardTitle>
          <CardDescription className="text-lg">
            Set up your pay-per-crawl website in just a few steps
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step)
              const isActive = step.id === currentStep
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center space-y-2 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step.completed 
                        ? 'border-green-500 bg-green-50' 
                        : isActive 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 bg-gray-50'
                    }`}>
                      {status.icon}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : ''}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 max-w-20">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      steps[index + 1].completed || step.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Tabs value={currentStep} onValueChange={setCurrentStep}>
        <TabsContent value="connect-wallet" className="mt-6">
          <ConnectWalletStep 
            onComplete={(address) => handleStepComplete('connect-wallet', address)}
            isComplete={steps.find(s => s.id === 'connect-wallet')?.completed || false}
          />
        </TabsContent>

        <TabsContent value="site-details" className="mt-6">
          <SiteDetailsStep 
            onComplete={(data) => handleStepComplete('site-details', data)}
            isComplete={steps.find(step => step.id === 'site-details')?.completed || false}
          />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <PricingStep 
            onComplete={(data) => handleStepComplete('pricing', data)}
            isComplete={steps.find(step => step.id === 'pricing')?.completed || false}
          />
        </TabsContent>

        <TabsContent value="license" className="mt-6">
          <LicenseCreationStep
            siteDetails={stepData.siteDetails}
            walletAddress={stepData.walletAddress}
            onComplete={(data) => handleStepComplete('license', data)}
            isComplete={steps.find(step => step.id === 'license')?.completed || false}
          />
        </TabsContent>

        <TabsContent value="deploy" className="mt-6">
          <DeploymentStep
            siteDetails={stepData.siteDetails}
            pricingData={stepData.pricingData}
            licenseData={stepData.licenseData}
            walletAddress={stepData.walletAddress}
            onComplete={(data) => handleStepComplete('deploy', data)}
            isComplete={steps.find(step => step.id === 'deploy')?.completed || false}
          />
        </TabsContent>
      </Tabs>

      {/* Debug Info (remove in production) */}
      {stepData.walletAddress && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">Connected Wallet:</h4>
            <code className="text-xs break-all">{stepData.walletAddress}</code>
          </CardContent>
        </Card>
      )}
      
      {stepData.siteDetails && (
        <Card className="bg-blue-50 mt-4">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">Site Configuration:</h4>
            <div className="text-xs space-y-1">
              <div>Domain: <code>{stepData.siteDetails.domain}</code></div>
              <div>Terms URI: <code>{stepData.siteDetails.termsURI}</code></div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {stepData.pricingData && (
        <Card className="bg-green-50 mt-4">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">Pricing Configuration:</h4>
            <div className="text-xs space-y-1">
              <div>Price: <code>${stepData.pricingData.pricePerCrawl} USDC per crawl</code></div>
              <div>USDC Units: <code>{stepData.pricingData.priceUnits}</code></div>
              <div>Worker Config: <code>PRICE_USDC="{stepData.pricingData.pricePerCrawl}"</code></div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {stepData.licenseData && (
        <Card className="bg-purple-50 mt-4">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">License Created:</h4>
            <div className="text-xs space-y-1">
              <div>Transaction: <code className="break-all">{stepData.licenseData.transactionHash}</code></div>
              {stepData.licenseData.tokenId && (
                <div>Token ID: <code>{stepData.licenseData.tokenId.toString()}</code></div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
