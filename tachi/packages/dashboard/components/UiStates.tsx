import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon = '📋', 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>
        {title}
      </h3>
      <p className="text-sm mb-4 max-w-md mx-auto" style={{ color: '#52796F' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          style={{ backgroundColor: '#FF7043', color: 'white', border: 'none' }}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export function LoadingState({ 
  message = 'Loading...', 
  subMessage 
}: LoadingStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#FF7043' }}></div>
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>
        {message}
      </h3>
      {subMessage && (
        <p className="text-sm" style={{ color: '#52796F' }}>
          {subMessage}
        </p>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  actionLabel = 'Try Again', 
  onAction 
}: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
        <span className="text-2xl">❌</span>
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>
        {title}
      </h3>
      <p className="text-sm mb-4 max-w-md mx-auto" style={{ color: '#52796F' }}>
        {message}
      </p>
      {onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          style={{ color: '#FF7043', borderColor: '#FF7043' }}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface SuccessStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SuccessState({ 
  title, 
  message, 
  actionLabel, 
  onAction 
}: SuccessStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
        <span className="text-2xl">✅</span>
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>
        {title}
      </h3>
      <p className="text-sm mb-4 max-w-md mx-auto" style={{ color: '#52796F' }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          style={{ backgroundColor: '#52796F', color: 'white', border: 'none' }}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="shadow-lg border-0 animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="h-8 bg-gray-100 rounded flex-1 animate-pulse"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Status Toast Messages (for use with toast library)
export const StatusMessages = {
  // Loading states
  CONNECTING_WALLET: "Connecting to your wallet...",
  MINTING_LICENSE: "Minting your license... This may take 30 seconds.",
  DEPLOYING_GATEWAY: "Deploying your gateway to Cloudflare Workers...",
  UPDATING_PRICE: "Updating your crawl price...",
  
  // Success states
  WALLET_CONNECTED: "Wallet connected successfully!",
  LICENSE_MINTED: "License minted successfully!",
  GATEWAY_DEPLOYED: "Gateway deployed! Your test URL: ",
  PRICE_UPDATED: "Price updated successfully!",
  
  // Error states
  WALLET_REJECTED: "Transaction rejected. Please try again.",
  INSUFFICIENT_FUNDS: "Insufficient ETH for gas fees. Add more ETH to your wallet.",
  NETWORK_ERROR: "Please switch to Base network to continue.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  
  // Empty states
  NO_CRAWLS: "No crawls yet. Test your gateway with the button below.",
  NO_REVENUE: "No revenue data available. Complete your first paid crawl to see analytics.",
  NO_LOGS: "No crawl logs found. Share your gateway URL with crawler developers.",
} as const;