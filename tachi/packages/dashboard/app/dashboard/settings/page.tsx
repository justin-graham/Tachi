'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent, EnhancedCardTitle } from '../../../components/ui/enhanced-card';
import { EnhancedButton } from '../../../components/ui/enhanced-button';
import { EnhancedBadge } from '../../../components/ui/enhanced-badge';
import { EnhancedInput } from '../../../components/ui/enhanced-input';

const publisherSettings = {
  domain: 'api.example.com',
  currentRate: 1.00,
  rateLimitRequests: 1000,
  rateLimitWindow: '1 hour',
  allowedOrigins: ['https://example.com', 'https://app.example.com'],
  webhookUrl: 'https://api.example.com/webhooks/tachi',
  enableAnalytics: true,
  enableRateLimiting: true,
  enableCORS: true,
  enableWebhooks: false
};

const securitySettings = {
  twoFactorEnabled: false,
  lastLogin: '2024-01-15 14:30:00 UTC',
  apiKeyRotation: 'Manual',
  sessionTimeout: '24 hours'
};

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState(publisherSettings);
  const [security, setSecurity] = useState(securitySettings);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
  };

  const handleAddOrigin = () => {
    if (newOrigin.trim() && !settings.allowedOrigins.includes(newOrigin.trim())) {
      setSettings({
        ...settings,
        allowedOrigins: [...settings.allowedOrigins, newOrigin.trim()]
      });
      setNewOrigin('');
    }
  };

  const handleRemoveOrigin = (origin: string) => {
    setSettings({
      ...settings,
      allowedOrigins: settings.allowedOrigins.filter(o => o !== origin)
    });
  };

  const handleRegenerateApiKeys = () => {
    setShowRegenerateModal(false);
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
              PUBLISHER SETTINGS
            </h2>
            <p className="text-[#52796F] font-medium">
              Configure your content monetization and security preferences
            </p>
          </div>
          <EnhancedButton
            onClick={handleSaveSettings}
            className="font-mono"
          >
            SAVE CHANGES
          </EnhancedButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Publisher Configuration */}
          <div className="space-y-8">
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Publisher Configuration</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-6">
                <div>
                  <EnhancedInput
                    type="text"
                    value={settings.domain}
                    onChange={(e) => setSettings({ ...settings, domain: e.target.value })}
                    placeholder="Domain Origin"
                    className="font-mono"
                  />
                  <p className="text-xs text-[#FF7043] mt-1 font-mono">
                    Primary domain for content crawling requests
                  </p>
                </div>

                <div>
                  <EnhancedInput
                    type="number"
                    value={settings.currentRate}
                    onChange={(e) => setSettings({ ...settings, currentRate: parseFloat(e.target.value) })}
                    step="0.01"
                    min="0"
                    placeholder="Content Access Rate (USDC)"
                    className="font-mono"
                  />
                  <p className="text-xs text-[#FF7043] mt-1 font-mono">
                    Price per content access request
                  </p>
                </div>

                <div>
                  <EnhancedInput
                    type="url"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    placeholder="Webhook Endpoint"
                    className="font-mono"
                  />
                  <p className="text-xs text-[#FF7043] mt-1 font-mono">
                    Receive real-time notifications for crawl events
                  </p>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Rate Limiting */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Rate Limiting</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#1A1A1A] font-['Coinbase Display']">
                      Enable Rate Limiting
                    </div>
                    <div className="text-sm text-[#52796F] font-mono">
                      Protect against excessive requests
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, enableRateLimiting: !settings.enableRateLimiting })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableRateLimiting ? 'bg-[#FF7043]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableRateLimiting ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {settings.enableRateLimiting && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <EnhancedInput
                        type="number"
                        value={settings.rateLimitRequests}
                        onChange={(e) => setSettings({ ...settings, rateLimitRequests: parseInt(e.target.value) })}
                        placeholder="Max Requests"
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <select
                        value={settings.rateLimitWindow}
                        onChange={(e) => setSettings({ ...settings, rateLimitWindow: e.target.value })}
                        className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-[#FF7043] text-[#1A1A1A] font-mono text-sm focus:outline-none focus:border-[#FF7043]"
                      >
                        <option value="1 minute">Time Window: 1 minute</option>
                        <option value="5 minutes">Time Window: 5 minutes</option>
                        <option value="1 hour">Time Window: 1 hour</option>
                        <option value="1 day">Time Window: 1 day</option>
                      </select>
                    </div>
                  </div>
                )}
              </EnhancedCardContent>
            </EnhancedCard>
          </div>

          {/* Security & Access */}
          <div className="space-y-8">
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Allowed Origins</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-6">
                <div>
                  <div className="flex space-x-2">
                    <EnhancedInput
                      type="url"
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      placeholder="Add New Origin"
                      className="flex-1 font-mono"
                    />
                    <EnhancedButton
                      onClick={handleAddOrigin}
                      size="sm"
                      className="font-mono"
                      disabled={!newOrigin.trim()}
                    >
                      ADD
                    </EnhancedButton>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#52796F] uppercase tracking-wide mb-3 font-['Coinbase Display']">
                    Current Origins
                  </label>
                  <div className="space-y-2">
                    {settings.allowedOrigins.map((origin, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <span className="font-mono text-sm text-[#1A1A1A]">{origin}</span>
                        <EnhancedButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOrigin(origin)}
                          className="text-red-600 hover:text-red-700 font-mono"
                        >
                          REMOVE
                        </EnhancedButton>
                      </div>
                    ))}
                  </div>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Security Settings */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Security Settings</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#1A1A1A] font-['Coinbase Display']">
                      Two-Factor Authentication
                    </div>
                    <div className="text-sm text-[#52796F] font-mono">
                      Add extra security to your account
                    </div>
                  </div>
                  <EnhancedButton
                    variant={security.twoFactorEnabled ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled })}
                    className="font-mono"
                  >
                    {security.twoFactorEnabled ? 'ENABLED' : 'ENABLE'}
                  </EnhancedButton>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[#52796F] font-['Coinbase Display'] uppercase tracking-wide">Last Login</div>
                      <div className="font-mono text-[#1A1A1A]">{security.lastLogin}</div>
                    </div>
                    <div>
                      <div className="text-[#52796F] font-['Coinbase Display'] uppercase tracking-wide">Session Timeout</div>
                      <div className="font-mono text-[#1A1A1A]">{security.sessionTimeout}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <EnhancedButton
                    variant="outline"
                    onClick={() => setShowRegenerateModal(true)}
                    className="w-full font-mono"
                  >
                    REGENERATE ALL API KEYS
                  </EnhancedButton>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Feature Toggles */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Feature Settings</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#1A1A1A] font-['Coinbase Display']">
                      Analytics Tracking
                    </div>
                    <div className="text-sm text-[#52796F] font-mono">
                      Collect usage analytics and insights
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, enableAnalytics: !settings.enableAnalytics })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableAnalytics ? 'bg-[#FF7043]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableAnalytics ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#1A1A1A] font-['Coinbase Display']">
                      CORS Headers
                    </div>
                    <div className="text-sm text-[#52796F] font-mono">
                      Enable cross-origin resource sharing
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, enableCORS: !settings.enableCORS })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableCORS ? 'bg-[#FF7043]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableCORS ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#1A1A1A] font-['Coinbase Display']">
                      Webhook Notifications
                    </div>
                    <div className="text-sm text-[#52796F] font-mono">
                      Real-time event notifications
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, enableWebhooks: !settings.enableWebhooks })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableWebhooks ? 'bg-[#FF7043]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableWebhooks ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          </div>
        </div>

        {/* Regenerate API Keys Modal */}
        {showRegenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <EnhancedCard variant="elevated" className="bg-white w-full max-w-md mx-4">
              <EnhancedCardHeader>
                <EnhancedCardTitle className="text-red-600">Regenerate API Keys</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L2.732 15.5C1.962 16.333 2.924 18 4.464 18z" />
                    </svg>
                    <div>
                      <h4 className="font-bold text-red-800 font-['Coinbase Display']">
                        Warning: This action cannot be undone
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        All existing API keys will be invalidated immediately. You will need to update all integrations with new keys.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <EnhancedButton
                    variant="outline"
                    onClick={() => setShowRegenerateModal(false)}
                    className="flex-1"
                  >
                    CANCEL
                  </EnhancedButton>
                  <EnhancedButton
                    onClick={handleRegenerateApiKeys}
                    className="flex-1 font-mono bg-red-600 hover:bg-red-700"
                  >
                    REGENERATE
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