"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Rocket, Copy, Check, FileCode, Settings, Terminal, ExternalLink, Download } from 'lucide-react'
import { SiteDetailsStepData } from '@/schemas/site-details'
import { 
  generateWorkerScript, 
  generateWranglerConfig, 
  generateDeploymentInstructions,
  getNetworkConfig,
  type WorkerConfig 
} from '@/utils/worker-generator'
import { getCrawlNftAddress } from '@/contracts/crawl-nft'
import { useChainId } from 'wagmi'

interface DeploymentStepProps {
  siteDetails?: SiteDetailsStepData
  pricingData?: { pricePerCrawl: number; priceUnits: string; workerConfig: any }
  licenseData?: { tokenId?: bigint; transactionHash: string }
  walletAddress?: string
  onComplete: (data: { deployed: boolean }) => void
  isComplete: boolean
}

export function DeploymentStep({ 
  siteDetails, 
  pricingData, 
  licenseData, 
  walletAddress,
  onComplete, 
  isComplete 
}: DeploymentStepProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const chainId = useChainId()

  // Generate worker configuration
  const generateConfig = (): WorkerConfig | null => {
    if (!siteDetails || !pricingData || !walletAddress) return null
    
    const networkConfig = getNetworkConfig(chainId)
    if (!networkConfig) return null

    const crawlNftAddress = getCrawlNftAddress(chainId)
    if (!crawlNftAddress) return null

    return {
      domain: siteDetails.domain,
      publisherAddress: walletAddress as `0x${string}`,
      crawlTokenId: licenseData?.tokenId?.toString() || '1',
      priceUSDC: pricingData.pricePerCrawl.toString(),
      priceUnits: pricingData.priceUnits,
      paymentProcessorAddress: networkConfig.paymentProcessorAddress,
      proofOfCrawlLedgerAddress: networkConfig.proofOfCrawlLedgerAddress,
      usdcAddress: networkConfig.usdcAddress,
      crawlNftAddress,
      chainId,
      rpcUrl: networkConfig.rpcUrl,
      networkName: networkConfig.name,
      termsURI: siteDetails.termsURI,
    }
  }

  const config = generateConfig()

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleMarkComplete = () => {
    onComplete({ deployed: true })
  }

  if (isComplete) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-green-200">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">✅ Deployment Ready</CardTitle>
          <CardDescription>
            Your Cloudflare Worker configuration has been generated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Successfully Configured</p>
                <p className="text-sm text-green-700">Your worker script is ready for deployment to Cloudflare</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!config) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-yellow-200">
        <CardHeader className="text-center">
          <CardTitle className="text-yellow-600">⚠️ Configuration Incomplete</CardTitle>
          <CardDescription>
            Please complete all previous steps before generating your worker script
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {siteDetails ? <Check className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
              <span className={siteDetails ? 'text-green-700' : 'text-gray-500'}>Site Details</span>
            </div>
            <div className="flex items-center gap-2">
              {pricingData ? <Check className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
              <span className={pricingData ? 'text-green-700' : 'text-gray-500'}>Pricing Configuration</span>
            </div>
            <div className="flex items-center gap-2">
              {licenseData ? <Check className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
              <span className={licenseData ? 'text-green-700' : 'text-gray-500'}>License Creation</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const workerScript = generateWorkerScript(config)
  const wranglerConfig = generateWranglerConfig(config)
  const instructions = generateDeploymentInstructions(config)

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Rocket className="h-5 w-5" />
          Deploy Cloudflare Worker
        </CardTitle>
        <CardDescription>
          Your customized worker script is ready for deployment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Configuration Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">📋 Configuration Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Domain:</span> {config.domain}
              </div>
              <div>
                <span className="text-blue-600 font-medium">Price:</span> ${config.priceUSDC} USDC
              </div>
              <div>
                <span className="text-blue-600 font-medium">Network:</span> {config.networkName}
              </div>
              <div>
                <span className="text-blue-600 font-medium">Token ID:</span> {config.crawlTokenId}
              </div>
            </div>
          </div>

          {/* Tabs for different files */}
          <Tabs defaultValue="worker" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="worker" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Worker Script
              </TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="instructions" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Instructions
              </TabsTrigger>
            </TabsList>

            {/* Worker Script Tab */}
            <TabsContent value="worker" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">src/index.ts</Badge>
                  <span className="text-sm text-gray-600">Main worker script</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(workerScript, 'index.ts')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(workerScript, 'worker')}
                  >
                    {copiedStates.worker ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedStates.worker ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap">
                  <code>{workerScript}</code>
                </pre>
              </div>
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="config" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">wrangler.toml</Badge>
                  <span className="text-sm text-gray-600">Cloudflare Workers configuration</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(wranglerConfig, 'wrangler.toml')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(wranglerConfig, 'config')}
                  >
                    {copiedStates.config ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedStates.config ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap">
                  <code>{wranglerConfig}</code>
                </pre>
              </div>
            </TabsContent>

            {/* Instructions Tab */}
            <TabsContent value="instructions" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">README.md</Badge>
                  <span className="text-sm text-gray-600">Step-by-step deployment guide</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(instructions.join('\n'), 'deployment-instructions.md')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(instructions.join('\n'), 'instructions')}
                  >
                    {copiedStates.instructions ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedStates.instructions ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4 max-h-96 overflow-auto">
                <div className="prose prose-sm max-w-none">
                  {instructions.map((line, index) => {
                    if (line.startsWith('##')) {
                      return <h2 key={index} className="text-lg font-bold mt-4 mb-2">{line.replace('## ', '')}</h2>
                    } else if (line.startsWith('###')) {
                      return <h3 key={index} className="text-md font-semibold mt-3 mb-1">{line.replace('### ', '')}</h3>
                    } else if (line.startsWith('```')) {
                      return <div key={index} /> // Code blocks handled separately
                    } else if (line.trim() === '') {
                      return <br key={index} />
                    } else if (line.startsWith('- ')) {
                      return <li key={index} className="ml-4">{line.replace('- ', '')}</li>
                    } else if (/^\d+\./.test(line)) {
                      return <div key={index} className="font-medium">{line}</div>
                    } else if (line.includes('curl') || line.includes('wrangler') || line.includes('npm')) {
                      return (
                        <code key={index} className="bg-gray-100 px-2 py-1 rounded text-sm block my-1">
                          {line}
                        </code>
                      )
                    } else {
                      return <p key={index} className="my-1">{line}</p>
                    }
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Links */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-3">🔗 Quick Links</h4>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://dash.cloudflare.com/workers"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900"
              >
                <ExternalLink className="h-4 w-4" />
                Cloudflare Workers Dashboard
              </a>
              <a
                href="https://developers.cloudflare.com/workers/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900"
              >
                <ExternalLink className="h-4 w-4" />
                Workers Documentation
              </a>
              <a
                href="https://developers.cloudflare.com/workers/wrangler/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900"
              >
                <ExternalLink className="h-4 w-4" />
                Wrangler CLI Guide
              </a>
              <a
                href={`https://basescan.org/address/${config.paymentProcessorAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900"
              >
                <ExternalLink className="h-4 w-4" />
                View PaymentProcessor
              </a>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={handleMarkComplete} className="px-8">
              <Rocket className="h-4 w-4 mr-2" />
              Mark as Deployed
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
