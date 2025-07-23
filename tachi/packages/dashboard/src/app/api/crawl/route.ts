import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

/**
 * Crawler Payment API Endpoint
 * 
 * This endpoint implements the Pay-Per-Crawl protocol:
 * 1. Initial request returns 402 Payment Required with payment details
 * 2. After payment verification, returns requested content
 */
export async function POST(request: NextRequest) {
  try {
    const { url, userAddress } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Check if payment was provided in headers
    const paymentTx = request.headers.get('x-payment-transaction')
    const userOperation = request.headers.get('x-user-operation')
    
    if (!paymentTx && !userOperation) {
      // First request - return 402 Payment Required
      const paymentDetails = {
        amount: ethers.parseUnits('1.0', 6).toString(), // 1 USDC (6 decimals)
        currency: 'USDC',
        recipient: '0x742d35Cc6634C0532925a3b8D4C7B5C4f9b4c4c4', // Publisher wallet
        network: 'base-goerli',
        crawlId: `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expires: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        priceUsd: '1.00'
      }

      return NextResponse.json(
        {
          error: 'Payment Required',
          message: 'This content requires payment to access',
          paymentDetails,
          supportedMethods: ['USDC', 'Account-Abstraction']
        },
        { 
          status: 402,
          headers: {
            'Payment-Required': 'true',
            'Supported-Methods': 'USDC,Account-Abstraction',
            'Price-USD': '1.00',
            'Currency': 'USDC',
            'Network': 'base-goerli'
          }
        }
      )
    }

    // Payment provided - simulate payment verification
    if (paymentTx || userOperation) {
      // In a real implementation, we would:
      // 1. Verify the transaction/UserOperation on-chain
      // 2. Check that payment amount matches required amount
      // 3. Confirm payment was sent to correct recipient
      // 4. Record payment in ProofOfCrawlLedger contract
      
      console.log('🔍 Verifying payment...', { paymentTx, userOperation })
      
      // Simulate crawler content for the requested URL
      const crawledContent = {
        url,
        title: 'Sample Crawled Content',
        content: 'This is the premium content that was unlocked after payment verification.',
        metadata: {
          crawlTime: new Date().toISOString(),
          paymentVerified: true,
          paymentTx: paymentTx || userOperation,
          contentHash: 'QmHash123...',
        },
        crawlId: request.headers.get('x-crawl-id')
      }

      return NextResponse.json(crawledContent, {
        headers: {
          'Payment-Verified': 'true',
          'Content-Type': 'application/json',
          'X-Crawl-ID': crawledContent.crawlId || 'unknown'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  } catch (error) {
    console.error('Crawler API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Tachi Crawler Payment API',
      version: '1.0.0',
      description: 'Pay-Per-Crawl protocol endpoint',
      methods: ['POST'],
      documentation: 'https://tachi.dev/docs/crawler-api'
    },
    { status: 200 }
  )
}
