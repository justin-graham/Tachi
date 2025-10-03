'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent, EnhancedCardTitle } from '../../components/ui/enhanced-card';
import { EnhancedButton } from '../../components/ui/enhanced-button';
import { EnhancedTable, EnhancedTableHeader, EnhancedTableBody, EnhancedTableRow, EnhancedTableCell } from '../../components/ui/enhanced-table';
import { EnhancedBadge } from '../../components/ui/enhanced-badge';
import { SimpleChart } from '../../components/ui/simple-chart';

// Sample data for Tachi publisher dashboard
const dashboardData = {
  revenue: 127.50,
  requests: 43,
  avgPerRequest: 2.97,
  uptime: 94.2,
  last7DaysRevenue: [8, 12, 15, 18, 22, 25, 18],
  revenueChange: 12.5,
  requestsChange: 8.3,
  avgChange: 2.1,
  uptimeChange: 0.1,
  avgRevenue: 18.2,
  recentCrawls: [
    { time: '2:34 PM', crawler: '0x1234...ab', amount: 1.00, txHash: '0xabc123' },
    { time: '2:31 PM', crawler: '0x5678...cd', amount: 1.00, txHash: '0xdef456' },
    { time: '2:28 PM', crawler: '0x9abc...ef', amount: 1.00, txHash: '0x789abc' },
    { time: '2:25 PM', crawler: '0xdef1...23', amount: 1.00, txHash: '0x456def' },
    { time: '2:22 PM', crawler: '0x4567...89', amount: 1.00, txHash: '0x123456' }
  ],
  contractInfo: {
    address: '0xabc...123',
    network: 'Base Mainnet',
    currentRate: 1.00,
    origin: 'api.example.com'
  }
};

export default function PublisherDashboard() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartPeriod, setChartPeriod] = useState('7D');

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const handleExportCSV = () => {
    const csvContent = [
      ['Time', 'Crawler', 'Amount', 'Transaction Hash'],
      ...dashboardData.recentCrawls.map(crawl => [
        crawl.time,
        crawl.crawler,
        crawl.amount.toString(),
        crawl.txHash
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tachi-crawls.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
              { id: 'overview', label: 'Overview' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'api-keys', label: 'API Keys' },
              { id: 'billing', label: 'Billing' },
              { id: 'settings', label: 'Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
        {/* Enhanced Stats Grid with Layered Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Revenue Card */}
          <EnhancedCard variant="elevated" hover className="bg-white">
            <EnhancedCardContent>
              <div className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mb-2">
                {formatCurrency(dashboardData.revenue)}
              </div>
              <div className="text-[#52796F] text-sm font-medium uppercase tracking-wide mb-2 font-['Coinbase Display']">
                Total Revenue
              </div>
              <div className={`text-xs font-mono ${dashboardData.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.revenueChange >= 0 ? '+' : ''}{dashboardData.revenueChange}% from last month
              </div>
            </EnhancedCardContent>
          </EnhancedCard>

          {/* Requests Card */}
          <EnhancedCard variant="elevated" hover className="bg-white">
            <EnhancedCardContent>
              <div className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mb-2">
                {dashboardData.requests}
              </div>
              <div className="text-[#52796F] text-sm font-medium uppercase tracking-wide mb-2 font-['Coinbase Display']">
                Total Requests
              </div>
              <div className={`text-xs font-mono ${dashboardData.requestsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.requestsChange >= 0 ? '+' : ''}{dashboardData.requestsChange}% from last month
              </div>
            </EnhancedCardContent>
          </EnhancedCard>

          {/* Avg Per Request Card */}
          <EnhancedCard variant="elevated" hover className="bg-white">
            <EnhancedCardContent>
              <div className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mb-2">
                {formatCurrency(dashboardData.avgPerRequest)}
              </div>
              <div className="text-[#52796F] text-sm font-medium uppercase tracking-wide mb-2 font-['Coinbase Display']">
                Avg Per Request
              </div>
              <div className={`text-xs font-mono ${dashboardData.avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.avgChange >= 0 ? '+' : ''}{dashboardData.avgChange}% from last month
              </div>
            </EnhancedCardContent>
          </EnhancedCard>

          {/* Uptime Card */}
          <EnhancedCard variant="elevated" hover className="bg-white">
            <EnhancedCardContent>
              <div className="text-3xl font-bold text-[#FF7043] font-mono tabular-nums mb-2">
                {dashboardData.uptime}%
              </div>
              <div className="text-[#52796F] text-sm font-medium uppercase tracking-wide mb-2 font-['Coinbase Display']">
                Uptime
              </div>
              <div className={`text-xs font-mono ${dashboardData.uptimeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.uptimeChange >= 0 ? '+' : ''}{dashboardData.uptimeChange}% from last month
              </div>
            </EnhancedCardContent>
          </EnhancedCard>
        </div>

        {/* Revenue Analytics Chart */}
        <EnhancedCard variant="elevated" className="bg-white mb-12">
          <EnhancedCardHeader className="flex justify-between items-center">
            <EnhancedCardTitle>Revenue Analytics</EnhancedCardTitle>
            <div className="flex space-x-2">
              {['7D', '30D', '90D', '1Y'].map(period => (
                <EnhancedButton
                  key={period}
                  variant={chartPeriod === period ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setChartPeriod(period)}
                  className="font-mono"
                >
                  {period}
                </EnhancedButton>
              ))}
            </div>
          </EnhancedCardHeader>
          <EnhancedCardContent>
            <div className="h-64 mb-4">
              <SimpleChart 
                data={dashboardData.last7DaysRevenue} 
                height={256}
                color="#FF7043"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FF7043] font-mono tabular-nums mb-1">
                {formatCurrency(dashboardData.avgRevenue)} avg daily
              </div>
              <div className="text-[#52796F] text-sm font-['Coinbase Display']">
                Based on {chartPeriod} period
              </div>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        {/* Enhanced Recent Crawls Table */}
        <EnhancedCard variant="elevated" padding="none" className="bg-white">
          <EnhancedCardHeader className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <EnhancedCardTitle variant="default">Recent Requests</EnhancedCardTitle>
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="font-mono"
              >
                Export CSV ↓
              </EnhancedButton>
            </div>
          </EnhancedCardHeader>

          <EnhancedCardContent className="p-0">
            <EnhancedTable>
              <EnhancedTableHeader>
                <EnhancedTableRow hover={false}>
                  <EnhancedTableCell header>Time</EnhancedTableCell>
                  <EnhancedTableCell header>Crawler Address</EnhancedTableCell>
                  <EnhancedTableCell header variant="numeric">Amount</EnhancedTableCell>
                  <EnhancedTableCell header>Transaction</EnhancedTableCell>
                </EnhancedTableRow>
              </EnhancedTableHeader>
              <EnhancedTableBody>
                {dashboardData.recentCrawls.map((crawl, index) => (
                  <EnhancedTableRow key={index}>
                    <EnhancedTableCell className="font-medium">
                      {crawl.time}
                    </EnhancedTableCell>
                    <EnhancedTableCell variant="technical">
                      {crawl.crawler}
                    </EnhancedTableCell>
                    <EnhancedTableCell variant="numeric" className="font-bold">
                      {formatCurrency(crawl.amount)}
                    </EnhancedTableCell>
                    <EnhancedTableCell>
                      <a
                        href={`https://basescan.org/tx/${crawl.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0052FF] hover:text-[#FF7043] font-medium transition-colors duration-200 font-mono text-sm"
                      >
                        View Transaction →
                      </a>
                    </EnhancedTableCell>
                  </EnhancedTableRow>
                ))}
              </EnhancedTableBody>
            </EnhancedTable>

            {/* Enhanced Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end items-center space-x-2">
                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="font-mono"
                >
                  ← Previous
                </EnhancedButton>
                <EnhancedButton
                  variant={currentPage === 1 ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  className="font-mono"
                >
                  1
                </EnhancedButton>
                <EnhancedButton variant="ghost" size="sm" className="font-mono">2</EnhancedButton>
                <EnhancedButton variant="ghost" size="sm" className="font-mono">3</EnhancedButton>
                <span className="px-2 text-[#52796F] font-mono">...</span>
                <EnhancedButton variant="ghost" size="sm" className="font-mono">8</EnhancedButton>
                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="font-mono"
                >
                  Next →
                </EnhancedButton>
              </div>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      </div>
    </div>
  );
}