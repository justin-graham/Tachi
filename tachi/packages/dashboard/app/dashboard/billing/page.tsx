'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent, EnhancedCardTitle } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';
import { EnhancedTable, EnhancedTableHeader, EnhancedTableBody, EnhancedTableRow, EnhancedTableCell } from '../../../components/ui/enhanced-table';
import { EnhancedBadge } from '../../../components/ui/enhanced-badge';

const billingData = {
  currentBalance: 127.50,
  pendingEarnings: 45.20,
  totalEarned: 892.75,
  nextPayout: '2024-02-01',
  payoutFrequency: 'Monthly',
  minimumPayout: 50.00,
  payoutMethod: 'Base Network Wallet',
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678'
};

const transactionHistory = [
  {
    id: 'tx_001',
    date: '2024-01-15',
    type: 'payout',
    amount: 127.50,
    status: 'completed',
    txHash: '0xabc123def456789'
  },
  {
    id: 'tx_002',
    date: '2024-01-14',
    type: 'earnings',
    amount: 15.75,
    status: 'completed',
    txHash: '0xdef456abc123789'
  },
  {
    id: 'tx_003',
    date: '2024-01-13',
    type: 'earnings',
    amount: 22.30,
    status: 'completed',
    txHash: '0x789abc123def456'
  },
  {
    id: 'tx_004',
    date: '2024-01-12',
    type: 'payout',
    amount: 85.00,
    status: 'pending',
    txHash: null
  }
];

const pricingTiers = [
  {
    name: 'Starter',
    price: 0,
    features: ['Up to 1,000 requests/month', 'Basic analytics', 'Email support'],
    current: true
  },
  {
    name: 'Professional',
    price: 29,
    features: ['Up to 50,000 requests/month', 'Advanced analytics', 'Priority support', 'Custom integration'],
    current: false
  },
  {
    name: 'Enterprise',
    price: 99,
    features: ['Unlimited requests', 'White-label solution', 'Dedicated support', 'Custom contracts'],
    current: false
  }
];

export default function BillingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('billing');
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'payout': return 'info';
      case 'earnings': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleRequestPayout = () => {
    setShowPayoutModal(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Enhanced Header with Navigation */}
      <div className="bg-white border-b-2 border-[#FF7043] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-[#1A1A1A] font-['Coinbase Display']">
              Publisher Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <EnhancedBadge variant="info" size="md">
                <span className="w-2 h-2 bg-[#0052FF] rounded-full mr-2 animate-pulse"></span>
                Base Network
              </EnhancedBadge>
              <EnhancedButton variant="ghost" size="sm">
                PROFILE
              </EnhancedButton>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', href: '/dashboard' },
              { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics' },
              { id: 'api-keys', label: 'API Keys', href: '/dashboard/api-keys' },
              { id: 'billing', label: 'Billing', href: '/dashboard/billing' },
              { id: 'settings', label: 'Settings', href: '/dashboard/settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => tab.href ? router.push(tab.href) : setActiveTab(tab.id)}
                className={`pb-3 px-1 font-medium text-sm uppercase tracking-wide transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-[#FF7043] border-[#FF7043]'
                    : 'text-[#52796F] border-transparent hover:text-[#1A1A1A] hover:border-gray-300'
                } font-['Coinbase Display']`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] font-['Coinbase Display'] mb-2">
              BILLING & PAYMENTS
            </h2>
            <p className="text-[#52796F] font-medium">
              Manage your earnings, payouts, and subscription
            </p>
          </div>
          <EnhancedButton
            onClick={() => setShowPayoutModal(true)}
            className="font-mono"
            disabled={billingData.currentBalance < billingData.minimumPayout}
          >
            REQUEST PAYOUT
          </EnhancedButton>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <EnhancedCard variant="elevated" hover className="bg-white">
            <EnhancedCardContent>
              <div className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mb-2">
                {formatCurrency(billingData.currentBalance)}
              </div>
              <div className="text-[#52796F] text-sm font-medium uppercase tracking-wide font-['Coinbase Display']">
                Current Balance
              </div>
            </EnhancedCardContent>
          </EnhancedCard>

          <EnhancedCard variant="elevated" hover className="bg-white">
            <EnhancedCardContent>
              <div className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mb-2">
                {formatCurrency(billingData.pendingEarnings)}
              </div>
              <div className="text-[#52796F] text-sm font-medium uppercase tracking-wide font-['Coinbase Display']">
                Pending Earnings
              </div>
            </EnhancedCardContent>
          </EnhancedCard>

          <EnhancedCard variant="elevated" hover className="bg-white">
            <EnhancedCardContent>
              <div className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mb-2">
                {formatCurrency(billingData.totalEarned)}
              </div>
              <div className="text-[#52796F] text-sm font-medium uppercase tracking-wide font-['Coinbase Display']">
                Total Earned
              </div>
            </EnhancedCardContent>
          </EnhancedCard>

          <EnhancedCard variant="elevated" hover className="bg-white">
            <EnhancedCardContent>
              <div className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mb-2">
                {billingData.nextPayout}
              </div>
              <div className="text-[#52796F] text-sm font-medium uppercase tracking-wide font-['Coinbase Display']">
                Next Payout
              </div>
            </EnhancedCardContent>
          </EnhancedCard>
        </div>

        {/* Payout Settings */}
        <EnhancedCard variant="elevated" className="bg-white mb-8">
          <EnhancedCardHeader>
            <EnhancedCardTitle>Payout Settings</EnhancedCardTitle>
          </EnhancedCardHeader>
          <EnhancedCardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#52796F] uppercase tracking-wide mb-2 font-['Coinbase Display']">
                    Payout Method
                  </label>
                  <div className="text-lg font-medium text-[#1A1A1A]">
                    {billingData.payoutMethod}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#52796F] uppercase tracking-wide mb-2 font-['Coinbase Display']">
                    Wallet Address
                  </label>
                  <div className="text-lg font-mono text-[#1A1A1A]">
                    {formatAddress(billingData.walletAddress)}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#52796F] uppercase tracking-wide mb-2 font-['Coinbase Display']">
                    Payout Frequency
                  </label>
                  <div className="text-lg font-medium text-[#1A1A1A]">
                    {billingData.payoutFrequency}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#52796F] uppercase tracking-wide mb-2 font-['Coinbase Display']">
                    Minimum Payout
                  </label>
                  <div className="text-lg font-mono text-[#1A1A1A]">
                    {formatCurrency(billingData.minimumPayout)}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <EnhancedButton variant="outline" className="font-mono">
                UPDATE SETTINGS
              </EnhancedButton>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        {/* Transaction History */}
        <EnhancedCard variant="elevated" padding="none" className="bg-white mb-8">
          <EnhancedCardHeader className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <EnhancedCardTitle>Transaction History</EnhancedCardTitle>
              <EnhancedButton variant="outline" size="sm" className="font-mono">
                EXPORT CSV
              </EnhancedButton>
            </div>
          </EnhancedCardHeader>
          <EnhancedCardContent className="p-0">
            <EnhancedTable>
              <EnhancedTableHeader>
                <EnhancedTableRow hover={false}>
                  <EnhancedTableCell header>Date</EnhancedTableCell>
                  <EnhancedTableCell header>Type</EnhancedTableCell>
                  <EnhancedTableCell header variant="numeric">Amount</EnhancedTableCell>
                  <EnhancedTableCell header>Status</EnhancedTableCell>
                  <EnhancedTableCell header>Transaction</EnhancedTableCell>
                </EnhancedTableRow>
              </EnhancedTableHeader>
              <EnhancedTableBody>
                {transactionHistory.map((transaction) => (
                  <EnhancedTableRow key={transaction.id}>
                    <EnhancedTableCell className="font-medium">
                      {transaction.date}
                    </EnhancedTableCell>
                    <EnhancedTableCell>
                      <EnhancedBadge variant={getTransactionTypeColor(transaction.type) as any} size="sm">
                        {transaction.type.toUpperCase()}
                      </EnhancedBadge>
                    </EnhancedTableCell>
                    <EnhancedTableCell variant="numeric" className="font-bold">
                      {formatCurrency(transaction.amount)}
                    </EnhancedTableCell>
                    <EnhancedTableCell>
                      <EnhancedBadge variant={getStatusColor(transaction.status) as any} size="sm">
                        {transaction.status.toUpperCase()}
                      </EnhancedBadge>
                    </EnhancedTableCell>
                    <EnhancedTableCell>
                      {transaction.txHash ? (
                        <a
                          href={`https://basescan.org/tx/${transaction.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0052FF] hover:text-[#FF7043] font-medium transition-colors duration-200 font-mono text-sm"
                        >
                          View Transaction →
                        </a>
                      ) : (
                        <span className="text-[#52796F] text-sm">Pending</span>
                      )}
                    </EnhancedTableCell>
                  </EnhancedTableRow>
                ))}
              </EnhancedTableBody>
            </EnhancedTable>
          </EnhancedCardContent>
        </EnhancedCard>

        {/* Pricing Plans */}
        <EnhancedCard variant="elevated" className="bg-white">
          <EnhancedCardHeader>
            <EnhancedCardTitle>Subscription Plans</EnhancedCardTitle>
          </EnhancedCardHeader>
          <EnhancedCardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`rounded-lg border-2 p-6 transition-all duration-200 ${
                    tier.current
                      ? 'border-[#FF7043] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">
                      {tier.name}
                    </h3>
                    <div className="text-4xl font-bold text-[#FF7043] font-mono tabular-nums mb-1">
                      ${tier.price}
                    </div>
                    <div className="text-sm text-[#52796F] font-mono">per month</div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-[#1A1A1A]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <EnhancedButton
                    variant={tier.current ? 'secondary' : 'primary'}
                    className="w-full font-mono"
                    disabled={tier.current}
                  >
                    {tier.current ? 'CURRENT PLAN' : 'UPGRADE'}
                  </EnhancedButton>
                </div>
              ))}
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        {/* Payout Request Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <EnhancedCard variant="elevated" className="bg-white w-full max-w-md mx-4">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Request Payout</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#FF7043] font-mono tabular-nums mb-2">
                    {formatCurrency(billingData.currentBalance)}
                  </div>
                  <p className="text-[#52796F]">Available for payout</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#52796F]">Payout to:</span>
                      <span className="font-mono text-[#1A1A1A]">{formatAddress(billingData.walletAddress)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#52796F]">Network:</span>
                      <span className="font-mono text-[#1A1A1A]">Base Mainnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#52796F]">Est. fee:</span>
                      <span className="font-mono text-[#1A1A1A]">$0.02</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <EnhancedButton
                    variant="outline"
                    onClick={() => setShowPayoutModal(false)}
                    className="flex-1"
                  >
                    CANCEL
                  </EnhancedButton>
                  <EnhancedButton
                    onClick={handleRequestPayout}
                    className="flex-1 font-mono"
                  >
                    CONFIRM PAYOUT
                  </EnhancedButton>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          </div>
        )}
      </div>
    </div>
  );
}