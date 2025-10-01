import React, { useState } from 'react';

interface DeploymentConfig {
  cloudflareApiToken: string;
  zoneId: string;
  workerName: string;
  publisherAddress: string;
  crawlTokenId: string;
  priceUsdc: string;
  publisherPrivateKey: string;
  baseRpcUrl: string;
}

interface DeploymentStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  error?: string;
}

interface FormErrors {
  [key: string]: string;
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 w-64 p-2 text-xs text-white rounded-lg shadow-lg -top-2 left-full ml-2" style={{ backgroundColor: '#52796F' }}>
          {content}
          <div className="absolute top-3 left-0 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent -ml-1" style={{ borderRightColor: '#52796F' }}></div>
        </div>
      )}
    </div>
  );
};

export default function CloudflareDeployment() {
  const [config, setConfig] = useState<DeploymentConfig>({
    cloudflareApiToken: '',
    zoneId: '',
    workerName: '',
    publisherAddress: '',
    crawlTokenId: '',
    priceUsdc: '',
    publisherPrivateKey: '',
    baseRpcUrl: 'https://mainnet.base.org',
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([
    { id: 'validate', title: 'Validate Configuration', description: 'Check all required fields and credentials', status: 'pending' },
    { id: 'kv', title: 'Create KV Namespace', description: 'Set up storage for worker configuration', status: 'pending' },
    { id: 'worker', title: 'Deploy Worker', description: 'Upload and configure the Cloudflare Worker', status: 'pending' },
    { id: 'routes', title: 'Configure Routes', description: 'Set up custom domain routing', status: 'pending' },
    { id: 'secrets', title: 'Set Environment Variables', description: 'Configure sensitive environment variables', status: 'pending' },
  ]);

  const [deployedWorkerUrl, setDeployedWorkerUrl] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showCloudflareHelp, setShowCloudflareHelp] = useState(false);

  const updateStepStatus = (stepId: string, status: DeploymentStep['status'], error?: string) => {
    setDeploymentSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status, error } : step
      )
    );
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'workerName':
        if (!value.trim()) return 'Worker name is required';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Worker name must contain only lowercase letters, numbers, and hyphens';
        if (value.length < 3) return 'Worker name must be at least 3 characters';
        if (value.length > 63) return 'Worker name must be less than 64 characters';
        return '';
      
      case 'cloudflareApiToken':
        if (!value.trim()) return 'Cloudflare API token is required';
        if (value.length < 40) return 'API token appears to be invalid (too short)';
        return '';
      
      case 'publisherAddress':
        if (!value.trim()) return 'Wallet address is required';
        if (!value.startsWith('0x')) return 'Wallet address must start with 0x';
        if (value.length !== 42) return 'Wallet address must be exactly 42 characters';
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return 'Invalid wallet address format';
        return '';
      
      case 'crawlTokenId':
        if (!value.trim()) return 'CrawlNFT token ID is required';
        if (!/^\d+$/.test(value)) return 'Token ID must be a number';
        if (parseInt(value) < 0) return 'Token ID must be positive';
        return '';
      
      case 'priceUsdc':
        if (!value.trim()) return 'Price is required';
        const price = parseFloat(value);
        if (isNaN(price)) return 'Price must be a valid number';
        if (price <= 0) return 'Price must be greater than 0';
        if (price > 1000) return 'Price seems unusually high (max 1000 USDC)';
        if (price < 0.0001) return 'Price must be at least 0.0001 USDC';
        return '';
      
      case 'publisherPrivateKey':
        if (!value.trim()) return 'Private key is required';
        if (!value.startsWith('0x')) return 'Private key must start with 0x';
        if (value.length !== 66) return 'Private key must be exactly 66 characters';
        if (!/^0x[a-fA-F0-9]{64}$/.test(value)) return 'Invalid private key format';
        return '';
      
      case 'baseRpcUrl':
        if (value && !/^https?:\/\/.+/.test(value)) return 'RPC URL must be a valid HTTP/HTTPS URL';
        return '';
      
      case 'zoneId':
        if (value && !/^[a-f0-9]{32}$/.test(value)) return 'Zone ID must be a 32-character hex string';
        return '';
      
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation for immediate feedback
    const error = validateField(field, value);
    if (error) {
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateAllFields = (): string[] => {
    const errors: string[] = [];
    const newFormErrors: FormErrors = {};
    
    const requiredFields = ['workerName', 'cloudflareApiToken', 'publisherAddress', 'crawlTokenId', 'priceUsdc', 'publisherPrivateKey'];
    
    requiredFields.forEach(field => {
      const value = config[field as keyof DeploymentConfig];
      const error = validateField(field, value);
      if (error) {
        errors.push(error);
        newFormErrors[field] = error;
      }
    });
    
    // Validate optional fields if they have values
    ['baseRpcUrl', 'zoneId'].forEach(field => {
      const value = config[field as keyof DeploymentConfig];
      if (value) {
        const error = validateField(field, value);
        if (error) {
          errors.push(error);
          newFormErrors[field] = error;
        }
      }
    });
    
    setFormErrors(newFormErrors);
    return errors;
  };

  const deployToCloudflare = async () => {
    // Validate all fields before starting deployment
    const validationErrors = validateAllFields();
    if (validationErrors.length > 0) {
      updateStepStatus('validate', 'error', `Validation failed: ${validationErrors.join(', ')}`);
      return;
    }

    setIsDeploying(true);
    
    try {
      // Step 1: Validate Configuration
      updateStepStatus('validate', 'in_progress');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      updateStepStatus('validate', 'completed');
      
      // Step 2: Create KV Namespace
      updateStepStatus('kv', 'in_progress');
      try {
        const kvNamespace = await createKVNamespace(config);
        updateStepStatus('kv', 'completed');
        
        // Step 3: Deploy Worker
        updateStepStatus('worker', 'in_progress');
        const workerScript = generateWorkerScript(config, kvNamespace.id);
        const workerResult = await deployWorker(config, workerScript);
        updateStepStatus('worker', 'completed');
        
        // Step 4: Configure Routes (if custom domain provided)
        updateStepStatus('routes', 'in_progress');
        if (config.zoneId) {
          await configureRoutes(config, workerResult.subdomain);
        }
        updateStepStatus('routes', 'completed');
        
        // Step 5: Set Environment Variables
        updateStepStatus('secrets', 'in_progress');
        await setWorkerSecrets(config);
        updateStepStatus('secrets', 'completed');
        
        setDeployedWorkerUrl(workerResult.url);
      } catch (error) {
        const currentStep = deploymentSteps.find(step => step.status === 'in_progress');
        if (currentStep) {
          let errorMessage = 'Unknown error occurred';
          
          if (error instanceof Error) {
            errorMessage = error.message;
            
            // Provide more helpful error messages based on common issues
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
              errorMessage = 'Invalid Cloudflare API token. Please check your token has Workers:Edit permissions.';
            } else if (error.message.includes('404')) {
              errorMessage = 'Resource not found. Please check your account ID and zone ID are correct.';
            } else if (error.message.includes('10000')) {
              errorMessage = 'Worker name already exists. Please choose a different name.';
            } else if (error.message.includes('network')) {
              errorMessage = 'Network error. Please check your internet connection and try again.';
            }
          }
          
          updateStepStatus(currentStep.id, 'error', errorMessage);
        }
      }
      
    } catch (error) {
      console.error('Deployment failed:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  // Mock API functions with better error handling
  const createKVNamespace = async (config: DeploymentConfig) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate potential errors
    if (Math.random() < 0.1) { // 10% chance of error for demo
      throw new Error('Failed to create KV namespace: Insufficient permissions');
    }
    
    return { id: 'mock-kv-namespace-id' };
  };

  const generateWorkerScript = (config: DeploymentConfig, kvNamespaceId: string): string => {
    return `
import { handleRequest } from '@tachi/gateway-core';

export default {
  async fetch(request, env, ctx) {
    const config = {
      baseRpcUrl: env.BASE_RPC_URL,
      paymentProcessorAddress: env.PAYMENT_PROCESSOR_ADDRESS,
      proofOfCrawlLedgerAddress: env.PROOF_OF_CRAWL_LEDGER_ADDRESS,
      usdcAddress: env.USDC_ADDRESS,
      privateKey: env.PRIVATE_KEY,
      crawlTokenId: env.CRAWL_TOKEN_ID,
      priceUsdc: env.PRICE_USDC,
      publisherAddress: env.PUBLISHER_ADDRESS,
    };
    
    return handleRequest(request, config, env.KV_NAMESPACE);
  },
};`.trim();
  };

  const deployWorker = async (config: DeploymentConfig, script: string) => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (Math.random() < 0.05) {
      throw new Error('Worker deployment failed: Name already exists');
    }
    
    const subdomain = `${config.workerName}.your-account.workers.dev`;
    return {
      subdomain,
      url: `https://${subdomain}`,
    };
  };

  const configureRoutes = async (config: DeploymentConfig, subdomain: string) => {
    if (!config.zoneId) return;
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (Math.random() < 0.05) {
      throw new Error('Route configuration failed: Invalid zone ID');
    }
  };

  const setWorkerSecrets = async (config: DeploymentConfig) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (Math.random() < 0.05) {
      throw new Error('Failed to set environment variables: API rate limit exceeded');
    }
  };

  const getStatusColor = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in_progress': return '⏳';
      case 'error': return '✗';
      default: return '○';
    }
  };

  if (deployedWorkerUrl) {
    return (
      <div className="bg-white">
        <div className="border-b-2 border-[#FF7043] p-4">
          <h2 className="text-[#FF7043] font-medium text-lg">🎉 Deployment Successful!</h2>
          <p className="text-[#FF7043] text-sm">Your Tachi Protocol gateway is now live on Cloudflare Workers.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="border border-[#FF7043] p-4">
            <p className="text-[#FF7043] text-sm">
              <strong>Worker URL:</strong> <a href={deployedWorkerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">{deployedWorkerUrl}</a>
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-[#FF7043] font-medium">Next Steps:</h3>
            <div className="space-y-3 text-[#FF7043] text-sm">
              <div className="flex items-start space-x-2">
                <span className="font-bold">1.</span>
                <div>
                  <p>Test your gateway:</p>
                  <code className="bg-orange-50 px-2 py-1 border border-orange-200 text-xs">curl "{deployedWorkerUrl}/test"</code>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold">2.</span>
                <p>Update your website to use this gateway URL for protected content</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold">3.</span>
                <p>Monitor your dashboard for incoming crawl requests</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold">4.</span>
                <p>Check your wallet ({config.publisherAddress}) for USDC payments</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <button 
              onClick={() => {
                setDeployedWorkerUrl('');
                setDeploymentSteps(prev => prev.map(step => ({ ...step, status: 'pending', error: undefined })));
                setFormErrors({});
              }}
              className="border-2 border-[#FF7043] text-[#FF7043] px-4 py-2 hover:bg-orange-50 font-medium text-sm"
            >
              DEPLOY ANOTHER WORKER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="border-b-2 border-[#FF7043] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#FF7043] text-sm">
              Deploy your Tachi Protocol gateway to Cloudflare Workers in minutes
            </p>
          </div>
          <button
            onClick={() => setShowCloudflareHelp(!showCloudflareHelp)}
            className="text-[#FF7043] text-xs underline hover:no-underline"
          >
            Need help with Cloudflare? {showCloudflareHelp ? 'Hide' : 'Show'} setup guide
          </button>
        </div>
        
        {showCloudflareHelp && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="text-blue-800 font-medium text-sm mb-2">🔧 Cloudflare Setup Guide</h4>
            <div className="text-blue-700 text-xs space-y-2">
              <p><strong>Don't have Cloudflare?</strong> <a href="https://dash.cloudflare.com/sign-up" target="_blank" rel="noopener noreferrer" className="underline">Create a free account</a></p>
              <p><strong>Get API Token:</strong> Go to <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer" className="underline">API Tokens</a> → Create Token → Custom Token</p>
              <p><strong>Required permissions:</strong> Zone:Read, Workers Scripts:Edit, Workers KV Storage:Edit</p>
              <p><strong>Zone ID:</strong> Found in your domain's Cloudflare dashboard sidebar (optional for custom domain)</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="space-y-8">
          {/* Configuration Form */}
          <div className="space-y-6">
            {/* Worker Name Input */}
            <div className="pb-4">
              <div className="relative">
                {!config.workerName && (
                  <label 
                    className="absolute left-0 top-2 text-[#FF7043] text-lg font-medium cursor-text transition-all duration-200"
                    onClick={() => document.getElementById('workerNameInput')?.focus()}
                  >
                    What's your gateway name?
                    <Tooltip content="A unique name for your Cloudflare Worker. Use lowercase letters, numbers, and hyphens only. This will be part of your worker URL.">
                      <span className="ml-1" style={{ fontSize: '12px', color: '#FF7043' }}>*</span>
                    </Tooltip>
                  </label>
                )}
                <input
                  id="workerNameInput"
                  type="text"
                  className={`w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 ${formErrors.workerName ? 'border-red-500' : 'border-[#FF7043]'}`}
                  value={config.workerName}
                  onChange={(e) => handleFieldChange('workerName', e.target.value)}
                />
                {formErrors.workerName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.workerName}</p>
                )}
              </div>
            </div>

            {/* Cloudflare API Token Input */}
            <div className="pb-4">
              <div className="relative">
                {!config.cloudflareApiToken && (
                  <label 
                    className="absolute left-0 top-2 text-[#FF7043] text-lg font-medium cursor-text transition-all duration-200"
                    onClick={() => document.getElementById('apiTokenInput')?.focus()}
                  >
                    What's your Cloudflare API token?
                    <Tooltip content="API token with Workers:Edit permissions. Get this from Cloudflare dashboard → API Tokens. This is kept secure and only used for deployment.">
                      <span className="ml-1" style={{ fontSize: '12px', color: '#FF7043' }}>*</span>
                    </Tooltip>
                  </label>
                )}
                <input
                  id="apiTokenInput"
                  type="password"
                  className={`w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 ${formErrors.cloudflareApiToken ? 'border-red-500' : 'border-[#FF7043]'}`}
                  value={config.cloudflareApiToken}
                  onChange={(e) => handleFieldChange('cloudflareApiToken', e.target.value)}
                />
                {formErrors.cloudflareApiToken && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.cloudflareApiToken}</p>
                )}
              </div>
            </div>

            {/* Publisher Address Input */}
            <div className="pb-4">
              <div className="relative">
                {!config.publisherAddress && (
                  <label 
                    className="absolute left-0 top-2 text-[#FF7043] text-lg font-medium cursor-text transition-all duration-200"
                    onClick={() => document.getElementById('publisherAddressInput')?.focus()}
                  >
                    What's your wallet address?
                    <Tooltip content="Your Ethereum wallet address where you'll receive USDC payments. Must start with 0x. This is your public address, not your private key.">
                      <span className="ml-1" style={{ fontSize: '12px', color: '#FF7043' }}>*</span>
                    </Tooltip>
                  </label>
                )}
                <input
                  id="publisherAddressInput"
                  type="text"
                  className={`w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 ${formErrors.publisherAddress ? 'border-red-500' : 'border-[#FF7043]'}`}
                  value={config.publisherAddress}
                  onChange={(e) => handleFieldChange('publisherAddress', e.target.value)}
                />
                {formErrors.publisherAddress && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.publisherAddress}</p>
                )}
              </div>
            </div>

            {/* Crawl Token ID Input */}
            <div className="pb-4">
              <div className="relative">
                {!config.crawlTokenId && (
                  <label 
                    className="absolute left-0 top-2 text-[#FF7043] text-lg font-medium cursor-text transition-all duration-200"
                    onClick={() => document.getElementById('crawlTokenInput')?.focus()}
                  >
                    What's your CrawlNFT token ID?
                    <Tooltip content="Your License NFT token ID that proves you have the right to monetize your content. You can find this in your wallet or on the license page.">
                      <span className="ml-1" style={{ fontSize: '12px', color: '#FF7043' }}>*</span>
                    </Tooltip>
                  </label>
                )}
                <input
                  id="crawlTokenInput"
                  type="text"
                  className={`w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 ${formErrors.crawlTokenId ? 'border-red-500' : 'border-[#FF7043]'}`}
                  value={config.crawlTokenId}
                  onChange={(e) => handleFieldChange('crawlTokenId', e.target.value)}
                />
                {formErrors.crawlTokenId && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.crawlTokenId}</p>
                )}
              </div>
            </div>

            {/* Pricing Input */}
            <div className="pb-4">
              <div className="relative">
                {!config.priceUsdc && (
                  <label 
                    className="absolute left-0 top-2 text-[#FF7043] text-lg font-medium cursor-text transition-all duration-200"
                    onClick={() => document.getElementById('priceInput')?.focus()}
                  >
                    What's your price per crawl (USDC)?
                    <Tooltip content="How much to charge per crawl request in USDC. Typical range is $0.001 to $10. You can change this later.">
                      <span className="ml-1" style={{ fontSize: '12px', color: '#FF7043' }}>*</span>
                    </Tooltip>
                  </label>
                )}
                <input
                  id="priceInput"
                  type="text"
                  className={`w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 ${formErrors.priceUsdc ? 'border-red-500' : 'border-[#FF7043]'}`}
                  value={config.priceUsdc}
                  onChange={(e) => handleFieldChange('priceUsdc', e.target.value)}
                />
                {formErrors.priceUsdc && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.priceUsdc}</p>
                )}
              </div>
            </div>

            {/* Private Key Input */}
            <div className="pb-4">
              <div className="relative">
                {!config.publisherPrivateKey && (
                  <label 
                    className="absolute left-0 top-2 text-[#FF7043] text-lg font-medium cursor-text transition-all duration-200"
                    onClick={() => document.getElementById('privateKeyInput')?.focus()}
                  >
                    What's your wallet private key?
                    <Tooltip content="⚠️ Your wallet's private key for signing transactions. This is stored securely as a Cloudflare secret and never logged. Only use a dedicated wallet for this service.">
                      <span className="ml-1" style={{ fontSize: '12px', color: '#FF7043' }}>*</span>
                    </Tooltip>
                  </label>
                )}
                <input
                  id="privateKeyInput"
                  type="password"
                  className={`w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 ${formErrors.publisherPrivateKey ? 'border-red-500' : 'border-[#FF7043]'}`}
                  value={config.publisherPrivateKey}
                  onChange={(e) => handleFieldChange('publisherPrivateKey', e.target.value)}
                />
                {formErrors.publisherPrivateKey && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.publisherPrivateKey}</p>
                )}
              </div>
            </div>

            {/* Optional configuration fields */}
            <div className="space-y-4 pb-6">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[#FF7043] text-sm underline hover:no-underline"
              >
                {showAdvanced ? 'Hide' : 'Show'} optional settings (custom domain, RPC)
              </button>
            </div>
            
            {/* Full-width border line */}
            <div className="border-b-2 border-[#FF7043] -mx-6"></div>
            
            <div className="space-y-4 pt-6">
              {showAdvanced && (
                <div className="space-y-6">
                  {/* Zone ID Input */}
                  <div className="pb-4">
                    <div className="relative">
                      {!config.zoneId && (
                        <label 
                          className="absolute left-0 top-2 text-[#FF7043] text-lg font-medium cursor-text transition-all duration-200"
                          onClick={() => document.getElementById('zoneIdInput')?.focus()}
                        >
                          What's your Cloudflare Zone ID? (optional)
                          <Tooltip content="Required only if you want to use a custom domain. Found in your Cloudflare dashboard sidebar for your domain.">
                            <span className="ml-1" style={{ fontSize: '12px', color: '#FF7043' }}>*</span>
                          </Tooltip>
                        </label>
                      )}
                      <input
                        id="zoneIdInput"
                        type="text"
                        className={`w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 ${formErrors.zoneId ? 'border-red-500' : 'border-[#FF7043]'}`}
                        value={config.zoneId}
                        onChange={(e) => handleFieldChange('zoneId', e.target.value)}
                      />
                      {formErrors.zoneId && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.zoneId}</p>
                      )}
                    </div>
                  </div>

                  {/* Base RPC URL Input */}
                  <div className="pb-4">
                    <div className="relative">
                      {!config.baseRpcUrl && (
                        <label 
                          className="absolute left-0 top-2 text-[#FF7043] text-lg font-medium cursor-text transition-all duration-200"
                          onClick={() => document.getElementById('rpcUrlInput')?.focus()}
                        >
                          What's your Base RPC URL? (optional)
                          <Tooltip content="Custom Base network RPC endpoint. Leave empty to use the default public RPC. Use a dedicated RPC like Alchemy or Infura for better reliability.">
                            <span className="ml-1" style={{ fontSize: '12px', color: '#FF7043' }}>*</span>
                          </Tooltip>
                        </label>
                      )}
                      <input
                        id="rpcUrlInput"
                        type="text"
                        className={`w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 ${formErrors.baseRpcUrl ? 'border-red-500' : 'border-[#FF7043]'}`}
                        value={config.baseRpcUrl}
                        onChange={(e) => handleFieldChange('baseRpcUrl', e.target.value)}
                      />
                      {formErrors.baseRpcUrl && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.baseRpcUrl}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Deployment Section */}
            <div>
              <div className="space-y-3">
                {/* Deployment Progress */}
                {isDeploying && (
                  <div className="space-y-4">
                    <h3 className="text-[#FF7043] font-medium">Deployment Progress</h3>
                    
                    <div className="space-y-3">
                      {deploymentSteps.map((step, index) => (
                        <div key={step.id} className="flex items-center space-x-3 p-3 border border-[#FF7043]">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${getStatusColor(step.status)}`}>
                            {getStatusIcon(step.status)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[#FF7043] font-medium">{step.title}</h4>
                            <p className="text-[#FF7043] text-sm">{step.description}</p>
                            {step.error && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-red-600 text-sm">{step.error}</p>
                              </div>
                            )}
                          </div>
                          <span className="text-[#FF7043] text-xs font-medium">
                            {step.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Deploy Button */}
                <div className="text-center pt-4">
                  <button 
                    onClick={deployToCloudflare}
                    disabled={isDeploying}
                    className="border-2 border-[#FF7043] text-[#FF7043] px-8 py-3 hover:bg-orange-50 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeploying ? 'DEPLOYING...' : 'DEPLOY TO CLOUDFLARE'}
                  </button>
                </div>
                
                {!isDeploying && (
                  <div className="border border-[#FF7043] p-4" style={{ backgroundColor: '#F8F4E6' }}>
                    <h4 className="text-[#FF7043] font-medium text-sm mb-2">Before you deploy:</h4>
                    <ul className="text-[#FF7043] text-sm space-y-1">
                      <li>✓ Have a Cloudflare account (free tier works)</li>
                      <li>✓ API token with Workers:Edit permissions</li>
                      <li>✓ Your wallet has some ETH on Base for gas fees</li>
                      <li>✓ You own the CrawlNFT token you specified</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}