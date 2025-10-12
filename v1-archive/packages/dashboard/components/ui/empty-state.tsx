'use client'

import React from 'react'
import { EnhancedButton } from './enhanced-button'
import { EnhancedCard, EnhancedCardContent } from './enhanced-card'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  variant?: 'default' | 'compact'
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
}: EmptyStateProps) {
  const content = (
    <div className={`text-center ${variant === 'default' ? 'py-12' : 'py-6'}`}>
      {/* Icon */}
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            {icon}
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center justify-center space-x-3">
          {actionLabel && (
            <EnhancedButton
              onClick={onAction}
              variant="default"
              size="md"
            >
              {actionLabel}
            </EnhancedButton>
          )}
          {secondaryActionLabel && (
            <EnhancedButton
              onClick={onSecondaryAction}
              variant="ghost"
              size="md"
            >
              {secondaryActionLabel}
            </EnhancedButton>
          )}
        </div>
      )}
    </div>
  )

  if (variant === 'compact') {
    return content
  }

  return (
    <EnhancedCard variant="elevated" className="bg-white">
      <EnhancedCardContent>{content}</EnhancedCardContent>
    </EnhancedCard>
  )
}

// Pre-built empty states for common scenarios

export function NoDataEmpty({
  title = 'No data yet',
  description = 'Data will appear here once available.',
  actionLabel,
  onAction,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  )
}

export function NoTransactionsEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      }
      title="No transactions yet"
      description="Your transaction history will appear here once you start earning from crawls."
      actionLabel={onAction ? 'View Integration Guide' : undefined}
      onAction={onAction}
    />
  )
}

export function NoApiKeysEmpty({ onAction }: { onAction: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      }
      title="No API keys"
      description="Create an API key to start accepting requests from crawlers."
      actionLabel="Create API Key"
      onAction={onAction}
    />
  )
}

export function NoBalanceEmpty() {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="No earnings yet"
      description="Your balance will appear here once crawlers start requesting your content."
      variant="compact"
    />
  )
}

export function NoSearchResultsEmpty({
  searchQuery,
  onClear,
}: {
  searchQuery: string
  onClear: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description={`No results for "${searchQuery}". Try adjusting your search.`}
      actionLabel="Clear search"
      onAction={onClear}
      variant="compact"
    />
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this data.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L2.732 15.5C1.962 16.333 2.924 18 4.464 18z"
          />
        </svg>
      }
      title={title}
      description={description}
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
      variant="compact"
    />
  )
}

export function WalletNotConnectedEmpty({ onConnect }: { onConnect: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      }
      title="Wallet not connected"
      description="Connect your wallet to view your balance and make withdrawals."
      actionLabel="Connect Wallet"
      onAction={onConnect}
    />
  )
}

export function OnboardingIncompleteEmpty({ onComplete }: { onComplete: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="Complete setup to continue"
      description="Finish setting up your publisher profile to start accepting requests."
      actionLabel="Complete Setup"
      onAction={onComplete}
    />
  )
}
