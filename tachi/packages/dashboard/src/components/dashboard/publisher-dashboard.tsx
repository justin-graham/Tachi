"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Copy, ExternalLink, Activity, DollarSign, FileText, Globe, Wallet } from 'lucide-react'
import { useState } from 'react'

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
