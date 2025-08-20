import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Wallet, Globe, DollarSign, Coins, Rocket, TestTube, CheckCircle } from 'lucide-react';

// Simple inline components to avoid import issues
const Button = ({ children, onClick, disabled, variant = 'default', className = '' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline';
  className?: string;
}) => {
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const Input = ({ className = '', onChange, ...props }: {
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: any;
}) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    onChange={onChange}
    {...props}
  />
);

const Label = ({ children, htmlFor, className = '' }: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
);

interface OnboardingStep {
  id: number;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
}

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    wallet: '',
    domain: '',
    pricing: '',
    mint: ''
  });

  console.log('OnboardingFlow rendering with step:', currentStep);

  const steps: OnboardingStep[] = [
    { id: 1, title: 'wallet', icon: <Wallet size={16} />, completed: currentStep > 1, current: currentStep === 1 },
    { id: 2, title: 'domain', icon: <Globe size={16} />, completed: currentStep > 2, current: currentStep === 2 },
    { id: 3, title: 'pricing', icon: <DollarSign size={16} />, completed: currentStep > 3, current: currentStep === 3 },
    { id: 4, title: 'mint', icon: <Coins size={16} />, completed: currentStep > 4, current: currentStep === 4 },
    { id: 5, title: 'deploy', icon: <Rocket size={16} />, completed: currentStep > 5, current: currentStep === 5 },
    { id: 6, title: 'test', icon: <TestTube size={16} />, completed: currentStep > 6, current: currentStep === 6 },
    { id: 7, title: 'success', icon: <CheckCircle size={16} />, completed: currentStep > 7, current: currentStep === 7 }
  ];

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Header */}
      <div className="w-full px-4 py-2">
        <div className="bg-white rounded-lg p-4 shadow-sm max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">Tachi Onboarding</h1>
        </div>
      </div>

      {/* Main Content */}
      <section className="w-full px-4 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Progress Stepper and Form */}
            <div className="flex-1 space-y-6">
              <div className="space-y-6">
                {/* Progress Stepper */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    {steps.map((step, index) => (
                      <React.Fragment key={step.id}>
                        {/* Step Container */}
                        <div className="flex flex-col items-center space-y-2 flex-1">
                          <div 
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                              ${step.current 
                                ? 'bg-blue-500 border-blue-500 text-white' 
                                : step.completed 
                                  ? 'bg-blue-500 border-blue-500 text-white'
                                  : 'bg-white border-gray-300 text-gray-400'
                              }
                            `}
                          >
                            {step.completed ? (
                              <CheckCircle size={16} />
                            ) : step.current ? (
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            ) : (
                              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            )}
                          </div>
                          <span 
                            className={`
                              text-xs font-medium transition-all duration-300 text-center
                              ${step.current 
                                ? 'text-blue-600' 
                                : step.completed 
                                  ? 'text-blue-500'
                                  : 'text-gray-400'
                              }
                            `}
                          >
                            {step.title}
                          </span>
                        </div>
                        
                        {/* Connecting Line */}
                        {index < steps.length - 1 && (
                          <div className="flex-1 mx-3 relative top-[-16px]">
                            <div 
                              className={`
                                h-0.5 w-full transition-all duration-300
                                ${step.completed ? 'bg-blue-500' : 'bg-gray-300'}
                              `}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </Card>

                {/* Form Card */}
                <Card className="p-8">
                  <div className="space-y-6">
                    {/* Step Content */}
                    <div className="transition-all duration-500 ease-in-out">
                      {currentStep === 1 && (
                        <div className="space-y-6">
                          <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Wallet</h2>
                            <p className="text-gray-600">Choose your preferred wallet to continue</p>
                          </div>
                          <div className="space-y-4">
                            {/* MetaMask Option */}
                            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Wallet size={24} className="text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">MetaMask</h3>
                                  <p className="text-sm text-gray-500">Connect with MetaMask wallet</p>
                                </div>
                              </div>
                              <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500" />
                            </div>
                            
                            {/* Coinbase Wallet Option */}
                            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Wallet size={24} className="text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">CoinBase Wallet</h3>
                                  <p className="text-sm text-gray-500">Connect with Coinbase wallet</p>
                                </div>
                              </div>
                              <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500" />
                            </div>
                            
                            {/* WalletConnect Option */}
                            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Wallet size={24} className="text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">WalletConnect</h3>
                                  <p className="text-sm text-gray-500">Connect with WalletConnect protocol</p>
                                </div>
                              </div>
                              <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500" />
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="space-y-6">
                          <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Domain Setup</h2>
                            <p className="text-gray-600">Enter the domain for your Tachi implementation</p>
                          </div>
                          <div className="space-y-4">
                            <Label htmlFor="domain" className="text-base font-semibold text-gray-900">Enter your domain</Label>
                            <Input
                              id="domain"
                              type="text"
                              placeholder="your-domain.com"
                              value={formData.domain}
                              onChange={(e: any) => handleInputChange('domain', e.target.value)}
                              className="w-full h-12 text-base"
                            />
                            <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                              💡 This domain will be used for your Tachi implementation.
                            </p>
                          </div>
                        </div>
                      )}

                      {currentStep === 3 && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-semibold text-gray-900">Pricing Plan</h2>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                              <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="font-medium">Starter</h3>
                                    <p className="text-sm text-gray-600">Perfect for small projects</p>
                                  </div>
                                  <span className="text-lg font-semibold">$10/mo</span>
                                </div>
                              </div>
                              <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="font-medium">Professional</h3>
                                    <p className="text-sm text-gray-600">For growing businesses</p>
                                  </div>
                                  <span className="text-lg font-semibold">$50/mo</span>
                                </div>
                              </div>
                              <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="font-medium">Enterprise</h3>
                                    <p className="text-sm text-gray-600">For large scale operations</p>
                                  </div>
                                  <span className="text-lg font-semibold">Custom</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 4 && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-semibold text-gray-900">Mint Tokens</h2>
                          <div className="space-y-3">
                            <Label htmlFor="mint-amount">Token Amount</Label>
                            <Input
                              id="mint-amount"
                              type="number"
                              placeholder="1000"
                              value={formData.mint}
                              onChange={(e) => handleInputChange('mint', e.target.value)}
                              className="w-full"
                            />
                            <p className="text-sm text-gray-600">
                              Specify the number of tokens to mint for your implementation.
                            </p>
                          </div>
                        </div>
                      )}

                      {currentStep === 5 && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-semibold text-gray-900">Deploy Contract</h2>
                          <div className="text-center py-8">
                            <Rocket size={48} className="mx-auto text-blue-500 mb-4" />
                            <p className="text-gray-600">Deploying your smart contract...</p>
                            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full w-3/4 transition-all duration-1000"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 6 && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-semibold text-gray-900">Test Integration</h2>
                          <div className="text-center py-8">
                            <TestTube size={48} className="mx-auto text-green-500 mb-4" />
                            <p className="text-gray-600">Running integration tests...</p>
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>✅ Contract deployment</span>
                                <span className="text-green-500">Passed</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>✅ Token functionality</span>
                                <span className="text-green-500">Passed</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>🔄 Domain integration</span>
                                <span className="text-blue-500">Testing...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-8 border-t border-gray-200">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="flex items-center space-x-2 px-6 py-3"
                      >
                        <ChevronLeft size={18} />
                        <span>Previous</span>
                      </Button>
                      
                      <Button
                        onClick={handleNext}
                        disabled={currentStep === 6}
                        className="flex items-center space-x-2 px-6 py-3"
                      >
                        <span>Next</span>
                        <ChevronRight size={18} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="flex-1 lg:max-w-lg">
              <Card className="h-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="h-[600px] w-full relative">
                  <img 
                    src="/plasmic/tachi_landing_page/images/tachiPitchDeck18Png.png"
                    alt="Tachi Onboarding Flow"
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      console.log('Primary image failed, trying fallback...');
                      e.currentTarget.src = "/plasmic/tachi_landing_page/images/heroImage.png";
                    }}
                    onLoad={() => console.log('Image loaded successfully')}
                  />
                  {/* Fallback content if image fails */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white opacity-0 hover:opacity-90 transition-opacity">
                    <div className="text-center p-8">
                      <h3 className="text-2xl font-bold mb-4">Tachi Protocol</h3>
                      <p className="text-lg opacity-90">Pay-Per-Crawl Implementation</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OnboardingFlow;
