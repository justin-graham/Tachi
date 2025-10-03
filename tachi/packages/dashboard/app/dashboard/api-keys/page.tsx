'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent, EnhancedCardTitle } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';
import { EnhancedTable, EnhancedTableHeader, EnhancedTableBody, EnhancedTableRow, EnhancedTableCell } from '../../../components/ui/enhanced-table';
import { EnhancedBadge } from '../../../components/ui/enhanced-badge';
import { EnhancedInput } from '../../../components/ui/enhanced-input';

const apiKeysData = [
  {
    id: 'ak_1234567890abcdef',
    name: 'Production API Key',
    created: '2024-01-15',
    lastUsed: '2 hours ago',
    status: 'active',
    permissions: ['read', 'write'],
    requests: 1247
  },
  {
    id: 'ak_0987654321fedcba',
    name: 'Development Key',
    created: '2024-01-10',
    lastUsed: '5 days ago',
    status: 'active',
    permissions: ['read'],
    requests: 89
  },
  {
    id: 'ak_abcdef1234567890',
    name: 'Staging Environment',
    created: '2024-01-08',
    lastUsed: 'Never',
    status: 'inactive',
    permissions: ['read', 'write'],
    requests: 0
  }
];

export default function ApiKeysPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('api-keys');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read']);

  const formatKeyId = (keyId: string) => {
    return `${keyId.slice(0, 8)}...${keyId.slice(-8)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'revoked': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleCreateKey = () => {
    setShowCreateModal(false);
    setNewKeyName('');
    setSelectedPermissions(['read']);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
              API KEYS MANAGEMENT
            </h2>
            <p className="text-[#52796F] font-medium">
              Create and manage API keys for accessing Tachi Protocol
            </p>
          </div>
          <div className="flex space-x-3">
            <EnhancedButton
              variant="outline"
              onClick={() => setShowIntegrationModal(true)}
              className="font-mono"
            >
              ONE-CLICK INTEGRATION
            </EnhancedButton>
            <EnhancedButton
              onClick={() => setShowCreateModal(true)}
              className="font-mono"
            >
              CREATE NEW KEY
            </EnhancedButton>
          </div>
        </div>

        {/* Quick Integration Card */}
        <EnhancedCard variant="elevated" className="bg-white mb-8">
          <EnhancedCardHeader>
            <EnhancedCardTitle>
              QUICK INTEGRATION
            </EnhancedCardTitle>
          </EnhancedCardHeader>
          <EnhancedCardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-[#1A1A1A] mb-3 font-['Coinbase Display']">
                  JavaScript / Node.js
                </h4>
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 font-mono text-sm mb-4">
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">1</div>
                    <div><span className="text-[#52796F]">//</span> <span className="text-[#1A1A1A]">Install SDK</span></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">2</div>
                    <div><span className="text-[#52796F]">npm</span> <span className="text-[#FF7043]">install</span> <span className="text-[#1A1A1A]">@tachi/sdk</span></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">3</div>
                    <div></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">4</div>
                    <div><span className="text-[#52796F]">//</span> <span className="text-[#1A1A1A]">Initialize client</span></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">5</div>
                    <div><span className="text-[#52796F]">const</span> <span className="text-[#1A1A1A]">tachi</span> <span className="text-[#FF7043]">=</span> <span className="text-[#52796F]">new</span> <span className="text-[#1A1A1A]">TachiClient</span><span className="text-[#FF7043]">(</span><span className="text-[#1A1A1A]">&#123;</span></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">6</div>
                    <div className="ml-4"><span className="text-[#1A1A1A]">apiKey</span><span className="text-[#FF7043]">:</span> <span className="text-[#1A1A1A]">'YOUR_API_KEY'</span><span className="text-[#FF7043]">,</span></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">7</div>
                    <div className="ml-4"><span className="text-[#1A1A1A]">origin</span><span className="text-[#FF7043]">:</span> <span className="text-[#1A1A1A]">'your-domain.com'</span></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">8</div>
                    <div><span className="text-[#1A1A1A]">&#125;</span><span className="text-[#FF7043]">)</span></div>
                  </div>
                </div>
                <EnhancedButton
                  variant="technical"
                  size="sm"
                  onClick={() => copyToClipboard('npm install @tachi/sdk')}
                  className="font-mono"
                >
                  COPY CODE
                </EnhancedButton>
              </div>
              <div>
                <h4 className="font-bold text-[#1A1A1A] mb-3 font-['Coinbase Display']">
                  cURL Example
                </h4>
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 font-mono text-sm mb-4">
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">1</div>
                    <div><span className="text-[#52796F]">curl</span> <span className="text-[#FF7043]">-X</span> <span className="text-[#1A1A1A]">POST</span> <span className="text-[#FF7043]">\</span></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">2</div>
                    <div className="ml-4"><span className="text-[#1A1A1A]">https://api.tachi.network/v1/crawl</span> <span className="text-[#FF7043]">\</span></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">3</div>
                    <div className="ml-4"><span className="text-[#FF7043]">-H</span> <span className="text-[#1A1A1A]">"Authorization: Bearer YOUR_KEY"</span> <span className="text-[#FF7043]">\</span></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">4</div>
                    <div className="ml-4"><span className="text-[#FF7043]">-H</span> <span className="text-[#1A1A1A]">"Content-Type: application/json"</span> <span className="text-[#FF7043]">\</span></div>
                  </div>
                  <div className="flex">
                    <div className="text-gray-400 mr-4 select-none">5</div>
                    <div className="ml-4"><span className="text-[#FF7043]">-d</span> <span className="text-[#1A1A1A]">'&#123;"url": "your-content-url"&#125;'</span></div>
                  </div>
                </div>
                <EnhancedButton
                  variant="technical"
                  size="sm"
                  onClick={() => copyToClipboard('curl -X POST https://api.tachi.network/v1/crawl')}
                  className="font-mono"
                >
                  COPY CURL
                </EnhancedButton>
              </div>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        {/* API Keys Table */}
        <EnhancedCard variant="elevated" padding="none" className="bg-white">
          <EnhancedCardHeader className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <EnhancedCardTitle>Your API Keys</EnhancedCardTitle>
              <div className="text-sm text-[#52796F] font-mono">
                {apiKeysData.length} active keys
              </div>
            </div>
          </EnhancedCardHeader>

          <EnhancedCardContent className="p-0">
            <EnhancedTable>
              <EnhancedTableHeader>
                <EnhancedTableRow hover={false}>
                  <EnhancedTableCell header>Name</EnhancedTableCell>
                  <EnhancedTableCell header>Key ID</EnhancedTableCell>
                  <EnhancedTableCell header>Status</EnhancedTableCell>
                  <EnhancedTableCell header>Permissions</EnhancedTableCell>
                  <EnhancedTableCell header variant="numeric">Requests</EnhancedTableCell>
                  <EnhancedTableCell header>Last Used</EnhancedTableCell>
                  <EnhancedTableCell header>Actions</EnhancedTableCell>
                </EnhancedTableRow>
              </EnhancedTableHeader>
              <EnhancedTableBody>
                {apiKeysData.map((key) => (
                  <EnhancedTableRow key={key.id}>
                    <EnhancedTableCell className="font-medium">
                      {key.name}
                    </EnhancedTableCell>
                    <EnhancedTableCell variant="technical">
                      {formatKeyId(key.id)}
                    </EnhancedTableCell>
                    <EnhancedTableCell>
                      <EnhancedBadge variant={getStatusColor(key.status) as any} size="sm">
                        {key.status.toUpperCase()}
                      </EnhancedBadge>
                    </EnhancedTableCell>
                    <EnhancedTableCell className="font-mono text-sm">
                      {key.permissions.join(', ')}
                    </EnhancedTableCell>
                    <EnhancedTableCell variant="numeric" className="font-bold">
                      {key.requests.toLocaleString()}
                    </EnhancedTableCell>
                    <EnhancedTableCell className="text-[#52796F]">
                      {key.lastUsed}
                    </EnhancedTableCell>
                    <EnhancedTableCell>
                      <div className="flex space-x-2">
                        <EnhancedButton
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.id)}
                          className="font-mono text-xs"
                        >
                          COPY
                        </EnhancedButton>
                        <EnhancedButton
                          variant="ghost"
                          size="sm"
                          className="font-mono text-xs text-red-600 hover:text-red-700"
                        >
                          REVOKE
                        </EnhancedButton>
                      </div>
                    </EnhancedTableCell>
                  </EnhancedTableRow>
                ))}
              </EnhancedTableBody>
            </EnhancedTable>
          </EnhancedCardContent>
        </EnhancedCard>

        {/* Create Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <EnhancedCard variant="elevated" className="bg-white w-full max-w-md mx-4">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Create New API Key</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2 font-['Coinbase Display']">
                    Key Name
                  </label>
                  <EnhancedInput
                    type="text"
                    placeholder="e.g., Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-3 font-['Coinbase Display']">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {['read', 'write', 'admin'].map(permission => (
                      <label key={permission} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, permission]);
                            } else {
                              setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
                            }
                          }}
                          className="w-4 h-4 text-[#FF7043] border-gray-300 rounded focus:ring-[#FF7043]"
                        />
                        <span className="text-sm font-mono text-[#1A1A1A] capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <EnhancedButton
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    CANCEL
                  </EnhancedButton>
                  <EnhancedButton
                    onClick={handleCreateKey}
                    className="flex-1 font-mono"
                    disabled={!newKeyName.trim()}
                  >
                    CREATE KEY
                  </EnhancedButton>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          </div>
        )}

        {/* One-Click Integration Modal */}
        {showIntegrationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <EnhancedCard variant="elevated" className="bg-white w-full max-w-2xl mx-4">
              <EnhancedCardHeader>
                <EnhancedCardTitle className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-[#FF7043]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>ONE-CLICK INTEGRATION</span>
                </EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-6">
                <p className="text-[#52796F] leading-relaxed">
                  Deploy Tachi Protocol to your website instantly with our one-click integration.
                  Simply add the script tag below to your HTML and start earning immediately.
                </p>

                <div className="bg-[#1A1A1A] rounded-lg p-4 text-white font-mono text-sm">
                  <div className="text-green-400 mb-2">{'<!-- Add to your <head> tag -->'}</div>
                  <div>{'<script src="https://cdn.tachi.network/v1/tachi.js"'}</div>
                  <div className="ml-8">data-api-key="YOUR_API_KEY"</div>
                  <div className="ml-8">data-origin="your-domain.com"</div>
                  <div className="ml-8">data-rate="1.00"></div>
                  <div>{'></script>'}</div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold font-mono">1</span>
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">
                      Copy Script
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold font-mono">2</span>
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">
                      Add to HTML
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold font-mono">3</span>
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A] font-['Coinbase Display']">
                      Start Earning
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <EnhancedButton
                    variant="outline"
                    onClick={() => setShowIntegrationModal(false)}
                    className="flex-1"
                  >
                    CLOSE
                  </EnhancedButton>
                  <EnhancedButton
                    onClick={() => copyToClipboard('<script src="https://cdn.tachi.network/v1/tachi.js"></script>')}
                    className="flex-1 font-mono"
                  >
                    COPY SCRIPT
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