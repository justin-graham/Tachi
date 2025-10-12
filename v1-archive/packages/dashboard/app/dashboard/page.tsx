'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent, EnhancedCardTitle } from '../../components/ui/enhanced-card';
import { EnhancedButton } from '../../components/ui/enhanced-button';
import { EnhancedTable, EnhancedTableHeader, EnhancedTableBody, EnhancedTableRow, EnhancedTableCell } from '../../components/ui/enhanced-table';
import { EnhancedBadge } from '../../components/ui/enhanced-badge';
import { SimpleChart } from '../../components/ui/simple-chart';
import {
  useDashboardData,
  useWebhookConfig,
  useUpdateWebhookConfig,
  useTestWebhook,
  useCodeSnippet,
  usePlayground,
  useCreatePublisherApiKey,
} from '../../lib/hooks';
import { RealTimeUpdates } from '../../components/dashboard/RealTimeUpdates';
import { TransactionHandler } from '../../components/transactions/TransactionHandler';
import { useAuth } from '../../hooks/useAuth';
import { ApiKeysTab } from '@/components/dashboard/ApiKeysTab';
import { BillingTab } from '@/components/dashboard/BillingTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';
import toast from 'react-hot-toast';

export default function PublisherDashboard() {
  const router = useRouter();
  const { address } = useAccount();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartPeriod, setChartPeriod] = useState('7D');
  const [selectedLanguage, setSelectedLanguage] = useState('curl');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { logout } = useAuth();

  // Get real blockchain data
  const dashboardData = useDashboardData();
  const webhookConfigQuery = useWebhookConfig();
  const updateWebhookMutation = useUpdateWebhookConfig();
  const testWebhookMutation = useTestWebhook();
  const snippetQuery = useCodeSnippet(selectedLanguage);
  const playgroundMutation = usePlayground();
  const createApiKeyMutation = useCreatePublisherApiKey();

  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');
  const [lastGeneratedSecret, setLastGeneratedSecret] = useState<string | null>(null);
  const [playgroundForm, setPlaygroundForm] = useState({
    targetUrl: '',
    amount: '1.00',
    format: 'markdown',
    apiKey: '',
    maxWaitSeconds: 30,
  });
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);
  const [playgroundError, setPlaygroundError] = useState<string | null>(null);

  useEffect(() => {
    if (webhookConfigQuery.data) {
      setWebhookUrl(webhookConfigQuery.data.webhookUrl ?? '');
      setWebhookSecretInput('');
      setLastGeneratedSecret(null);
    }
  }, [webhookConfigQuery.data]);

  const handleCopyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSaveWebhook = () => {
    updateWebhookMutation.mutate(
      {
        webhookUrl: webhookUrl ? webhookUrl : null,
        secret: webhookSecretInput ? webhookSecretInput : null,
      },
      {
        onSuccess: (data) => {
          toast.success('Webhook configuration saved');
          if (data.rotatedSecret) {
            setLastGeneratedSecret(data.rotatedSecret);
          }
          setWebhookSecretInput('');
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handleRotateSecret = () => {
    updateWebhookMutation.mutate(
      {
        webhookUrl: webhookUrl ? webhookUrl : null,
        rotateSecret: true,
      },
      {
        onSuccess: (data) => {
          if (data.rotatedSecret) {
            setLastGeneratedSecret(data.rotatedSecret);
            toast.success('Generated a new webhook secret. Copy it now—it will not be shown again.');
          } else {
            toast.success('Webhook secret rotated');
          }
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  const handleTestWebhook = () => {
    testWebhookMutation.mutate(
      { payload: { url: webhookUrl || undefined } },
      {
        onSuccess: (data) => {
          if (data.status === 'success') {
            toast.success(`Webhook responded in ${data.latencyMs}ms (HTTP ${data.statusCode ?? '—'})`);
          } else {
            toast.error(data.error ?? 'Webhook test failed');
          }
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  const handleGeneratePlaygroundKey = async () => {
    try {
      const response = await createApiKeyMutation.mutateAsync({
        name: `Playground Key ${new Date().toISOString()}`,
      });
      if (response.plainKey) {
        setPlaygroundForm((prev) => ({ ...prev, apiKey: response.plainKey ?? '' }));
        toast.success('New API key generated for the playground');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate API key';
      toast.error(message);
    }
  };

  const handlePlaygroundSubmit = () => {
    setPlaygroundError(null);
    setPlaygroundResult(null);
    playgroundMutation.mutate(playgroundForm, {
      onSuccess: (data) => {
        setPlaygroundResult(data);
        if (data.status === 'completed') {
          toast.success('API request sent successfully');
        } else {
          toast.error(data.error ?? 'Playground request failed');
        }
      },
      onError: (error) => {
        setPlaygroundError(error.message);
        toast.error(error.message);
      },
    });
  };

  const languageLabel = useMemo(
    () => (selectedLanguage === 'curl' ? 'cURL' : `${selectedLanguage.charAt(0).toUpperCase()}${selectedLanguage.slice(1)}`),
    [selectedLanguage]
  );
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  // Show connection message if wallet not connected
  if (!address) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600">Please connect your wallet to view your publisher dashboard.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (dashboardData.isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (dashboardData.error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error loading dashboard data:</strong> {dashboardData.error.message}
          </div>
          <p className="text-gray-600">Please try refreshing the page or check your network connection.</p>
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    const csvContent = [
      ['Time', 'Crawler', 'Amount', 'Transaction Hash', 'Block Number'],
      ...dashboardData.recentCrawls.map(crawl => [
        crawl.time,
        crawl.crawler,
        crawl.amount.toString(),
        crawl.txHash,
        crawl.blockNumber
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

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await logout(false);
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsSigningOut(false);
    }
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
                {dashboardData.contractInfo.network}
              </EnhancedBadge>
              <EnhancedButton variant="ghost" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
                {isSigningOut ? 'SIGNING OUT...' : 'SIGN OUT'}
              </EnhancedButton>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'integration', label: 'Integration' },
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
        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
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

        {/* Real-time Updates and Transaction Center */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <RealTimeUpdates />
          <TransactionHandler />
        </div>

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
          </>
        )}

        {/* Integration Tab Content */}
        {activeTab === 'integration' && (
          <div className="space-y-8">
            {/* Integration Center Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                Integration Center
              </h2>
              <p className="text-[#52796F] text-lg max-w-2xl mx-auto">
                Everything you need to integrate Tachi's content crawling API into your application.
              </p>
            </div>

            {/* Quick Start Guide */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Quick Start Guide</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#FF7043] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                      1
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-2">Get API Key</h3>
                    <p className="text-[#52796F] text-sm">
                      Generate your API key from the API Keys tab to authenticate requests.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#FF7043] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                      2
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-2">Submit Request</h3>
                    <p className="text-[#52796F] text-sm">
                      Send crawl requests to our API with your target URLs and payment.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#FF7043] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                      3
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-2">Receive Content</h3>
                    <p className="text-[#52796F] text-sm">
                      Get structured content data delivered via webhook or API polling.
                    </p>
                  </div>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Code Generation Section */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <div className="flex justify-between items-center">
                  <EnhancedCardTitle>Code Generator</EnhancedCardTitle>
                  <div className="flex space-x-2">
                    {['curl', 'javascript', 'python', 'go', 'rust'].map((lang) => (
                      <EnhancedButton
                        key={lang}
                        variant={selectedLanguage === lang ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedLanguage(lang)}
                        className="font-mono capitalize"
                      >
                        {lang === 'curl' ? 'cURL' : lang}
                      </EnhancedButton>
                    ))}
                  </div>
                </div>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#52796F]">{languageLabel} Example</span>
                    {snippetQuery.isFetching && (
                      <span className="text-xs text-[#6B7280]">Refreshing…</span>
                    )}
                  </div>
                  {snippetQuery.isLoading ? (
                    <div className="bg-[#0F172A] text-green-300 p-4 rounded-lg text-sm font-mono">
                      Loading snippet…
                    </div>
                  ) : snippetQuery.isError ? (
                    <div className="p-4 border border-red-200 rounded-lg text-sm text-red-600">
                      Failed to load code snippet.{' '}
                      {snippetQuery.error instanceof Error ? snippetQuery.error.message : ''}
                    </div>
                  ) : (
                    <pre className="bg-[#0F172A] text-green-300 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                      {snippetQuery.data?.snippet ?? '// No snippet available'}
                    </pre>
                  )}
                  <div className="flex items-center gap-2">
                    <EnhancedButton
                      variant="outline"
                      size="sm"
                      className="font-mono"
                      disabled={!snippetQuery.data?.snippet}
                      onClick={() =>
                        snippetQuery.data?.snippet &&
                        handleCopyToClipboard(snippetQuery.data.snippet, 'Code copied to clipboard')
                      }
                    >
                      Copy Code
                    </EnhancedButton>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      className="font-mono"
                      onClick={() => snippetQuery.refetch()}
                      disabled={snippetQuery.isFetching}
                    >
                      Refresh Snippet
                    </EnhancedButton>
                  </div>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Snippets reflect your current pricing and webhook configuration. Update those settings to refresh the
                  examples.
                </p>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Publisher Configuration */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Your Publisher Configuration</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#52796F] mb-2">
                      Publisher Address
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                      {dashboardData.contractInfo.address}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#52796F] mb-2">
                      Network
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                      {dashboardData.contractInfo.network}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#52796F] mb-2">
                      Base Rate
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                      {formatCurrency(dashboardData.contractInfo.currentRate)} USDC
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#52796F] mb-2">
                      API Endpoint
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                      https://api.tachi.com/v1
                    </div>
                  </div>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Webhook Configuration */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Webhook Configuration</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <div className="space-y-4">
                  <p className="text-[#52796F]">
                    Configure webhooks to receive real-time notifications when crawl requests are completed.
                  </p>
                  {webhookConfigQuery.isError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Failed to load webhook settings.
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#52796F] mb-2">
                        Webhook URL
                      </label>
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(event) => setWebhookUrl(event.target.value)}
                        placeholder="https://your-app.com/webhook"
                        disabled={updateWebhookMutation.isPending || webhookConfigQuery.isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#52796F] mb-2">
                        Secret Key
                      </label>
                      <input
                        type="text"
                        value={webhookSecretInput}
                        onChange={(event) => setWebhookSecretInput(event.target.value)}
                        placeholder={webhookConfigQuery.data?.secretPreview ?? 'Enter a secret to sign webhook payloads'}
                        disabled={updateWebhookMutation.isPending || webhookConfigQuery.isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                      />
                      {webhookConfigQuery.data?.secretPreview && (
                        <p className="mt-2 text-xs text-[#6B7280]">
                          Current secret preview: <span className="font-mono">{webhookConfigQuery.data.secretPreview}</span>
                        </p>
                      )}
                      {webhookConfigQuery.data?.lastRotatedAt && (
                        <p className="mt-1 text-xs text-[#6B7280]">
                          Last rotated:{' '}
                          {new Date(webhookConfigQuery.data.lastRotatedAt).toLocaleString()}
                        </p>
                      )}
                      {lastGeneratedSecret && (
                        <div className="mt-3 bg-[#FFF3E8] border border-[#FF7043] rounded-lg p-3">
                          <p className="text-xs text-[#D35400] mb-2">
                            Copy this secret now—it will not be shown again.
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <code className="flex-1 font-mono text-sm break-all">{lastGeneratedSecret}</code>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              className="font-mono"
                              onClick={() => handleCopyToClipboard(lastGeneratedSecret, 'Webhook secret copied')}
                            >
                              Copy
                            </EnhancedButton>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <EnhancedButton
                      variant="primary"
                      size="sm"
                      className="font-mono"
                      loading={updateWebhookMutation.isPending}
                      onClick={handleSaveWebhook}
                    >
                      Save Configuration
                    </EnhancedButton>
                    <EnhancedButton
                      variant="outline"
                      size="sm"
                      className="font-mono"
                      loading={updateWebhookMutation.isPending}
                      disabled={(updateWebhookMutation.isPending || webhookConfigQuery.isLoading) || (!webhookUrl && !webhookConfigQuery.data?.webhookUrl)}
                      onClick={handleRotateSecret}
                    >
                      Rotate Secret
                    </EnhancedButton>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      className="font-mono"
                      loading={testWebhookMutation.isPending}
                      disabled={!webhookConfigQuery.data?.webhookUrl}
                      onClick={handleTestWebhook}
                    >
                      Send Test Event
                    </EnhancedButton>
                  </div>
                  {testWebhookMutation.data && (
                    <div
                      className={`rounded-lg border p-3 text-sm ${
                        testWebhookMutation.data.status === 'success'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      <p className="font-semibold">
                        Test Result: {testWebhookMutation.data.status.toUpperCase()} (HTTP{' '}
                        {testWebhookMutation.data.statusCode ?? '—'})
                      </p>
                      <p className="mt-1">
                        Latency: {testWebhookMutation.data.latencyMs}ms
                        {testWebhookMutation.data.error ? ` • ${testWebhookMutation.data.error}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Interactive API Testing */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>API Testing Playground</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <div className="space-y-4">
                  <p className="text-[#52796F]">
                    Test the Tachi API directly from your dashboard. Configure your request parameters and see the response.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Request Configuration */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#1A1A1A]">Request Configuration</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#52796F] mb-2">
                          Target URL
                        </label>
                        <input
                          type="url"
                          value={playgroundForm.targetUrl}
                          onChange={(event) =>
                            setPlaygroundForm((prev) => ({ ...prev, targetUrl: event.target.value }))
                          }
                          placeholder="https://example.com/article"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#52796F] mb-2">
                          Amount (USDC)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={playgroundForm.amount}
                          onChange={(event) =>
                            setPlaygroundForm((prev) => ({ ...prev, amount: event.target.value }))
                          }
                          placeholder="1.00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#52796F] mb-2">
                          Content Format
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                          value={playgroundForm.format}
                          onChange={(event) =>
                            setPlaygroundForm((prev) => ({
                              ...prev,
                              format: event.target.value as 'markdown' | 'html' | 'text' | 'json',
                            }))
                          }
                        >
                          <option value="markdown">Markdown</option>
                          <option value="html">HTML</option>
                          <option value="text">Plain Text</option>
                          <option value="json">Structured JSON</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#52796F] mb-2">
                          Max Wait (seconds)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={playgroundForm.maxWaitSeconds}
                          onChange={(event) =>
                            setPlaygroundForm((prev) => ({
                              ...prev,
                              maxWaitSeconds: Number(event.target.value),
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#52796F] mb-2">
                          API Key
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="password"
                            value={playgroundForm.apiKey}
                            onChange={(event) =>
                              setPlaygroundForm((prev) => ({ ...prev, apiKey: event.target.value }))
                            }
                            placeholder="Enter your API key"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                          />
                          <EnhancedButton
                            variant="outline"
                            size="sm"
                            loading={createApiKeyMutation.isPending}
                            onClick={handleGeneratePlaygroundKey}
                          >
                            Generate
                          </EnhancedButton>
                        </div>
                      </div>
                      
                      <EnhancedButton
                        variant="primary"
                        className="w-full font-mono"
                        onClick={handlePlaygroundSubmit}
                        loading={playgroundMutation.isPending}
                        disabled={!playgroundForm.targetUrl || !playgroundForm.apiKey}
                      >
                        Send Test Request
                      </EnhancedButton>
                      {playgroundError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          {playgroundError}
                        </div>
                      )}
                    </div>
                    
                    {/* Response Display */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#1A1A1A]">Response</h4>
                      
                      <div className="bg-[#0F172A] text-green-300 p-4 rounded-lg min-h-[300px] font-mono text-sm overflow-x-auto">
                        {playgroundResult ? (
                          <pre>
                            {JSON.stringify(playgroundResult.response ?? { message: 'No response body' }, null, 2)}
                          </pre>
                        ) : (
                          <div className="text-gray-400"># Click &quot;Send Test Request&quot; to see response</div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              playgroundResult
                                ? playgroundResult.status === 'completed'
                                  ? 'bg-green-500'
                                  : 'bg-yellow-500'
                                : 'bg-gray-300'
                            }`}
                          ></div>
                          <span className="text-[#52796F]">
                            Status:{' '}
                            {playgroundResult
                              ? `${playgroundResult.status.toUpperCase()} (HTTP ${playgroundResult.upstreamStatus})`
                              : 'Ready'}
                          </span>
                        </div>
                        <EnhancedButton
                          variant="ghost"
                          size="sm"
                          className="font-mono"
                          disabled={!playgroundResult?.response}
                          onClick={() =>
                            playgroundResult?.response &&
                            handleCopyToClipboard(
                              JSON.stringify(playgroundResult.response, null, 2),
                              'Response copied to clipboard'
                            )
                          }
                        >
                          Copy Response
                        </EnhancedButton>
                      </div>
                    </div>
                  </div>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Documentation Links */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Documentation & Resources</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-[#FF7043] transition-colors">
                    <div className="w-12 h-12 bg-[#0052FF] rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-[#1A1A1A] mb-2">API Reference</h4>
                    <p className="text-[#52796F] text-sm mb-3">
                      Complete API documentation with examples and response schemas.
                    </p>
                    <EnhancedButton variant="outline" size="sm" className="font-mono">
                      View Docs →
                    </EnhancedButton>
                  </div>
                  
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-[#FF7043] transition-colors">
                    <div className="w-12 h-12 bg-[#FF7043] rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-[#1A1A1A] mb-2">SDK Libraries</h4>
                    <p className="text-[#52796F] text-sm mb-3">
                      Official SDKs for JavaScript, Python, Go, and Rust.
                    </p>
                    <EnhancedButton variant="outline" size="sm" className="font-mono">
                      Browse SDKs →
                    </EnhancedButton>
                  </div>
                  
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-[#FF7043] transition-colors">
                    <div className="w-12 h-12 bg-[#52796F] rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-[#1A1A1A] mb-2">Support</h4>
                    <p className="text-[#52796F] text-sm mb-3">
                      Get help from our team and community forums.
                    </p>
                    <EnhancedButton variant="outline" size="sm" className="font-mono">
                      Get Help →
                    </EnhancedButton>
                  </div>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab === 'api-keys' && <ApiKeysTab />}

        {activeTab === 'billing' && <BillingTab />}

        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
