"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Copy, ExternalLink, Activity, DollarSign, FileText, Globe, Wallet, CreditCard, Zap } from 'lucide-react'
import { useState } from 'react'
import { GaslessPayment, QuickPayButton } from '@/components/payments/gasless-payment'
import { type Address } from 'viem'

interface DashboardData {
  walletAddress: string
  siteDetails: {
    domain: string
    websiteName: string
    description: string
    termsURI?: string
  }
  pricingData: {
    pricePerCrawl: number
    priceUnits: string
  }
  licenseData: {
    tokenId?: bigint
    transactionHash: string
  }
  deploymentData: {
    deployed: boolean
  }
}

interface PublisherDashboardProps {
  data: DashboardData
  onStartOver?: () => void
}

export function PublisherDashboard({ data, onStartOver }: PublisherDashboardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-800">
            🎉 Setup Complete!
          </CardTitle>
          <CardDescription className="text-lg text-green-700">
            Your pay-per-crawl website is now configured and ready to protect your content
          </CardDescription>
        </CardHeader>
      </Card>

      {/* License Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CrawlNFT License Details
          </CardTitle>
          <CardDescription>
            Your unique license that grants access to your protected content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.licenseData.tokenId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">NFT Token ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                    #{data.licenseData.tokenId.toString()}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(data.licenseData.tokenId!.toString(), 'tokenId')}
                  >
                    {copiedField === 'tokenId' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Transaction Hash</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">
                  {data.licenseData.transactionHash}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(data.licenseData.transactionHash, 'txHash')}
                >
                  {copiedField === 'txHash' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Terms of Service</label>
            {data.siteDetails.termsURI ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">
                  {data.siteDetails.termsURI}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(data.siteDetails.termsURI, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Terms stored locally (IPFS upload may have failed)</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Site Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Site Configuration
          </CardTitle>
          <CardDescription>
            Your website details and protection settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Domain</label>
                <p className="text-lg font-mono">{data.siteDetails.domain}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Site Title</label>
                <p className="text-gray-900">{data.siteDetails.websiteName}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-700 text-sm">{data.siteDetails.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Badge variant="success" className="ml-2">Protected</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Configuration
          </CardTitle>
          <CardDescription>
            How much you charge for each content crawl
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                ${data.pricingData.pricePerCrawl} USDC
              </div>
              <div className="text-sm text-blue-700 mt-1">
                per crawl request
              </div>
              <div className="text-xs text-gray-600 mt-2">
                ({data.pricingData.priceUnits} USDC units on-chain)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crawl Logs Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Crawl Activity
          </CardTitle>
          <CardDescription>
            Monitor who's accessing your protected content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No crawl activity yet</h3>
            <p className="text-sm">
              Once crawlers start accessing your content, you'll see detailed logs here including:
            </p>
            <ul className="text-sm mt-3 space-y-1">
              <li>• Timestamp of each crawl request</li>
              <li>• Payment received (in USDC)</li>
              <li>• Crawler identity and user agent</li>
              <li>• Pages accessed</li>
            </ul>
            <p className="text-xs text-gray-400 mt-4">
              Logs are fetched from ProofOfCrawlLedger events for your token ID #{data.licenseData.tokenId?.toString() || 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connected Wallet
          </CardTitle>
          <CardDescription>
            The wallet that owns your CrawlNFT license
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">
              {data.walletAddress}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(data.walletAddress, 'wallet')}
            >
              {copiedField === 'wallet' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => window.open('https://dash.cloudflare.com/', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Manage Cloudflare Workers
            </Button>
            {onStartOver && (
              <Button variant="outline" onClick={onStartOver}>
                Configure Another Site
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gasless Payment Demo */}
      <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Zap className="h-5 w-5" />
            Gasless Payment Demo
          </CardTitle>
          <CardDescription className="text-purple-600">
            Test how AI crawlers will pay for access to your content without gas fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="demo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="demo" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Demo
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Payment Stats
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="demo" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Component */}
                <div>
                  <GaslessPayment
                    publisherAddress={data.walletAddress as Address}
                    tokenId={data.licenseData.tokenId || BigInt(0)}
                    defaultAmount={data.pricingData.pricePerCrawl}
                    onPaymentSuccess={(txHash) => {
                      console.log('Payment successful:', txHash)
                      // You could track this payment or update UI
                    }}
                    onPaymentError={(error) => {
                      console.error('Payment failed:', error)
                    }}
                  />
                </div>

                {/* Info Panel */}
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      How It Works
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">1.</span>
                        AI crawler connects using Account Abstraction
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">2.</span>
                        Payment is processed without gas fees
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">3.</span>
                        You receive USDC directly in your wallet
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">4.</span>
                        Crawler gains access to protected content
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-semibold mb-2 text-amber-800">Demo Mode</h4>
                    <p className="text-sm text-amber-700">
                      This is a demonstration using testnet tokens. In production, 
                      crawlers will use real USDC on Base network.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <QuickPayButton
                      publisherAddress={data.walletAddress as Address}
                      crawlNFTAddress={'0x1234567890123456789012345678901234567890' as Address}
                      tokenId={data.licenseData.tokenId || BigInt(0)}
                      usdcAddress={'0xA0b86a33E6417c3B1C9642dA2c5b4B0d7E3fF4e5' as Address}
                      amount={data.pricingData.pricePerCrawl}
                      className="flex-1"
                      onSuccess={(txHash) => console.log('Quick payment:', txHash)}
                      onError={(error) => console.error('Quick payment error:', error)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Payments</p>
                        <p className="text-2xl font-bold">$0.00</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Crawl Requests</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Gas Saved</p>
                        <p className="text-2xl font-bold">$0.00</p>
                      </div>
                      <Zap className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  Payment statistics will appear here once crawlers start accessing your content.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">🚀 What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              Deploy your Cloudflare Worker using the generated script
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              Update your website's DNS to route traffic through the worker
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">3.</span>
              Monitor this dashboard for crawl activity and earnings
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">4.</span>
              Share your terms of service URL with legitimate crawlers
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
