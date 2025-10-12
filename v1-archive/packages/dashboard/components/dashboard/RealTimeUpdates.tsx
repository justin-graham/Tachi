'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '../ui/enhanced-card'
import { EnhancedBadge } from '../ui/enhanced-badge'
import { useCrawlRequestEvents, usePaymentProcessedEvents } from '../../lib/hooks/useContractEvents'
import { formatUnits } from 'viem'
import { toast } from 'react-hot-toast'

interface RealtimeNotification {
  id: string
  type: 'crawl_request' | 'payment_processed'
  message: string
  amount?: number
  timestamp: number
  txHash: string
}

export function RealTimeUpdates() {
  const { address } = useAccount()
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [lastEventCount, setLastEventCount] = useState({ crawls: 0, payments: 0 })

  // Listen to real-time events for this publisher
  const { events: crawlEvents, isLoading: crawlLoading } = useCrawlRequestEvents({
    publisher: address,
    enabled: !!address
  })

  const { events: paymentEvents, isLoading: paymentLoading } = usePaymentProcessedEvents({
    publisher: address,
    enabled: !!address
  })

  // Process new crawl requests
  useEffect(() => {
    try {
      if (crawlEvents.length > lastEventCount.crawls) {
        const newEvents = crawlEvents.slice(0, crawlEvents.length - lastEventCount.crawls)
        
        newEvents.forEach(event => {
          try {
            const amountValue = parseFloat(formatUnits(event.publisherAmount, 6))
            const notification: RealtimeNotification = {
              id: `crawl-${event.transactionHash}:${event.logIndex}`,
              type: 'crawl_request',
              message: `New crawl request for ${amountValue.toFixed(2)} USDC`,
              amount: amountValue,
              timestamp: event.timestamp || Date.now(),
              txHash: event.transactionHash
            }
            
            setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10
            
            // Show toast notification
            toast.success(`New crawl request: $${notification.amount?.toFixed(2)}`, {
              duration: 4000,
              icon: '🔍'
            })
          } catch (error) {
            console.error('Error processing crawl request event:', error)
            toast.error('Error processing crawl request notification')
          }
        })
        
        setLastEventCount(prev => ({ ...prev, crawls: crawlEvents.length }))
      }
    } catch (error) {
      console.error('Error in crawl events effect:', error)
    }
  }, [crawlEvents, lastEventCount.crawls])

  // Process new payments
  useEffect(() => {
    try {
      if (paymentEvents.length > lastEventCount.payments) {
        const newEvents = paymentEvents.slice(0, paymentEvents.length - lastEventCount.payments)

        newEvents.forEach(event => {
          try {
            const publisherAmount = parseFloat(formatUnits(event.amount, 6))
            
            const notification: RealtimeNotification = {
              id: `payment-${event.transactionHash}:${event.logIndex}`,
              type: 'payment_processed',
              message: `Payment received: ${publisherAmount.toFixed(2)} USDC`,
              amount: publisherAmount,
              timestamp: event.timestamp || Date.now(),
              txHash: event.transactionHash
            }
            
            setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10
            
            // Show toast notification
            toast.success(`Payment received: $${publisherAmount.toFixed(2)}`, {
              duration: 4000,
              icon: '💰'
            })
          } catch (error) {
            console.error('Error processing payment event:', error)
            toast.error('Error processing payment notification')
          }
        })
        
        setLastEventCount(prev => ({ ...prev, payments: paymentEvents.length }))
      }
    } catch (error) {
      console.error('Error in payment events effect:', error)
    }
  }, [paymentEvents, lastEventCount.payments])

  if (!address) {
    return null
  }

  if (crawlLoading || paymentLoading) {
    return (
      <EnhancedCard variant="elevated" className="bg-white">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Real-time Updates</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7043]"></div>
            <span className="ml-3 text-[#52796F]">Loading real-time data...</span>
          </div>
        </EnhancedCardContent>
      </EnhancedCard>
    )
  }

  return (
    <EnhancedCard variant="elevated" className="bg-white">
      <EnhancedCardHeader>
        <div className="flex justify-between items-center">
          <EnhancedCardTitle>Real-time Updates</EnhancedCardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-[#52796F]">Live</span>
          </div>
        </div>
      </EnhancedCardHeader>
      <EnhancedCardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📡</div>
            <p className="text-[#52796F]">Waiting for new activity...</p>
            <p className="text-xs text-gray-500 mt-2">
              New crawl requests and payments will appear here in real-time
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-[#FF7043] transition-all duration-300 hover:bg-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    notification.type === 'crawl_request' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {notification.type === 'crawl_request' ? '🔍' : '💰'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {notification.message}
                    </p>
                    <p className="text-xs text-[#52796F]">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {notification.amount && (
                    <EnhancedBadge variant="success" size="sm">
                      ${notification.amount.toFixed(2)}
                    </EnhancedBadge>
                  )}
                  <a
                    href={`https://basescan.org/tx/${notification.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0052FF] hover:text-[#FF7043] text-xs font-mono transition-colors"
                  >
                    View TX
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </EnhancedCardContent>
    </EnhancedCard>
  )
}
