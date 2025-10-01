import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StandardButton from '../components/StandardButton';

// Mock data
const mockEvents = [
  {
    id: '1',
    ts: '2025-09-08T15:30:00Z',
    domain: 'example.com',
    url: 'https://example.com/api/data',
    crawler: 'crawler-abc123',
    amount: 0.05,
    status: 'paid',
    tx_hash: '0xabc123...def456',
    ledger_tx: 'ledger_789xyz',
    contentHash: 'QmX4Fy2dGEHYjNwA'
  },
  {
    id: '2',
    ts: '2025-09-08T15:25:00Z',
    domain: 'test.org',
    url: 'https://test.org/content',
    crawler: 'crawler-def456',
    amount: 0.03,
    status: '402',
    tx_hash: undefined,
    ledger_tx: undefined,
    contentHash: undefined
  },
  {
    id: '3',
    ts: '2025-09-08T15:20:00Z',
    domain: 'blog.site',
    url: 'https://blog.site/posts/123',
    crawler: 'crawler-ghi789',
    amount: 0.08,
    status: '200',
    tx_hash: '0x789abc...123def',
    ledger_tx: 'ledger_456abc',
    contentHash: 'QmY8Bz3cGFJYkOwB'
  }
];

const mockRules = {
  payConversionBelow: 85,
  verifyP95AboveMs: 2000,
  errorRateAbove: 5,
  perDomain: {
    'example.com': { payConversionBelow: 90 },
    'critical.site': { verifyP95AboveMs: 1000, errorRateAbove: 2 }
  }
};

const mockWebhooks = [
  {
    id: '1',
    url: 'https://api.example.com/webhooks/tachi',
    secretPreview: 'wh_secret_abc123...',
    active: true,
    lastDelivery: {
      ts: '2025-09-08T15:00:00Z',
      status: 200,
      ms: 142
    }
  },
  {
    id: '2',
    url: 'https://hooks.slack.com/services/...',
    secretPreview: 'wh_secret_def456...',
    active: false,
    lastDelivery: {
      ts: '2025-09-07T09:30:00Z',
      status: 404,
      ms: 1205
    }
  }
];

const mockStatus = {
  services: [
    { name: 'RPC', status: 'healthy', uptime: 99.9, lastError: null, lastUpdated: '2025-09-08T15:35:00Z' },
    { name: 'Bundler', status: 'healthy', uptime: 99.5, lastError: '2025-09-07T14:20:00Z', lastUpdated: '2025-09-08T15:34:00Z' },
    { name: 'Paymaster', status: 'degraded', uptime: 97.2, lastError: '2025-09-08T14:45:00Z', lastUpdated: '2025-09-08T15:33:00Z' },
    { name: 'Worker', status: 'healthy', uptime: 99.8, lastError: null, lastUpdated: '2025-09-08T15:35:00Z' }
  ],
  errorChart: [
    { time: '12:00', errors: 2 },
    { time: '13:00', errors: 1 },
    { time: '14:00', errors: 5 },
    { time: '15:00', errors: 3 }
  ]
};

// GridBox Component
const GridBox = ({ title, children, className = '', borderStyle = {} }) => (
  <div className={`p-3 lg:p-4 h-full ${className}`} style={{ 
    backgroundColor: '#FAF9F6',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#FF7043',
    boxSizing: 'border-box',
    ...borderStyle
  }}>
    {title && (
      <h3 style={{ 
        fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#52796F',
        letterSpacing: '0.02em'
      }} className="text-xs font-bold uppercase tracking-wider mb-3">
        {title}
      </h3>
    )}
    <div className="h-full">
      {children}
    </div>
  </div>
);

// Navigation Component
const Navigation = ({ activePage }) => {
  const router = useRouter();
  
  const navItems = [
    'Dashboard', 'Domains', 'License', 'Keys & Wallets', 'Monitoring', 'Team', 'Settings'
  ];

  const handleNavClick = (item) => {
    let route;
    if (item === 'Keys & Wallets') {
      route = '/keys';
    } else if (item === 'Monitoring') {
      route = '/monitoring';
    } else {
      route = item.toLowerCase() === 'dashboard' ? '/dashboard' : `/${item.toLowerCase()}`;
    }
    router.push(route);
  };

  return (
    <div className="h-full flex flex-col justify-start" style={{ padding: '8px 0' }}>
      <div className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <div
            key={item}
            onClick={() => handleNavClick(item)}
            className="transition-colors rounded cursor-pointer"
            style={{
              fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '10px',
              padding: '6px 8px',
              backgroundColor: activePage === item ? '#52796F' : 'transparent',
              color: activePage === item ? 'white' : '#666',
              fontWeight: activePage === item ? '600' : 'normal'
            }}
            onMouseEnter={(e) => {
              if (activePage !== item) {
                e.target.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== item) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

// Toast Component
const Toast = ({ message, type, onClose }) => (
  <div 
    className="fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg transition-opacity"
    style={{
      backgroundColor: type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : '#fef3c7',
      color: type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#d97706',
      border: `1px solid ${type === 'success' ? '#bbf7d0' : type === 'error' ? '#fecaca' : '#fde68a'}`,
      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}
  >
    <div className="flex items-center justify-between">
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-3 text-lg font-bold">&times;</button>
    </div>
  </div>
);

// Event Detail Modal
const EventDetailModal = ({ isOpen, onClose, event }) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
          Event Details
        </h2>
        
        <div className="bg-gray-100 p-4 rounded font-mono text-sm">
          <pre>{JSON.stringify(event, null, 2)}</pre>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 px-4 text-white rounded"
          style={{
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            backgroundColor: '#FF7043',
            border: 'none'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Webhook Modal
const WebhookModal = ({ isOpen, onClose, webhook, onSave }) => {
  const [url, setUrl] = useState('');
  const [active, setActive] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState('');

  useEffect(() => {
    if (webhook) {
      setUrl(webhook.url);
      setActive(webhook.active);
    } else {
      setUrl('');
      setActive(true);
      setGeneratedSecret('wh_secret_' + Math.random().toString(36).substr(2, 9));
    }
  }, [webhook, isOpen]);

  const handleSave = () => {
    onSave({
      id: webhook?.id || Date.now().toString(),
      url,
      active,
      secretPreview: webhook ? webhook.secretPreview : `${generatedSecret.substr(0, 15)}...`
    });
    if (!webhook) {
      setShowSecret(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
          {webhook ? 'Edit Webhook' : 'Add Webhook'}
        </h2>
        
        {showSecret && !webhook && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
            <p className="text-sm text-yellow-800 mb-2" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              ⚠️ <strong>Secret Generated:</strong> Save this secret securely!
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
              {generatedSecret}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              Webhook URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/webhooks/tachi"
              className="w-full p-2 border border-gray-300 rounded"
              style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              Active
            </label>
          </div>
        </div>

        <div className="flex space-x-2 mt-6">
          <StandardButton
            onClick={onClose}
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
          >
            Cancel
          </StandardButton>
          <StandardButton
            onClick={handleSave}
            disabled={!url.trim()}
            variant="primary"
            size="sm"
            style={{ 
              flex: 1,
              backgroundColor: url.trim() ? undefined : '#ccc',
              cursor: url.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            {webhook ? 'Update' : 'Create'}
          </StandardButton>
        </div>
      </div>
    </div>
  );
};

export default function MonitoringPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState(mockEvents);
  const [rules, setRules] = useState(mockRules);
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [toast, setToast] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [eventFilters, setEventFilters] = useState({
    timeRange: 'today',
    domain: '',
    status: '',
    crawler: '',
    search: ''
  });
  const [isClient, setIsClient] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle tab state in URL
  useEffect(() => {
    if (!isClient) return;
    const tab = router.query.tab;
    if (tab && ['events', 'rules', 'webhooks', 'slack', 'status'].includes(tab as string)) {
      setActiveTab(tab as string);
    }
  }, [router.query.tab, isClient]);

  const handleTabChange = (tab) => {
    if (!isClient) return;
    setActiveTab(tab);
    router.push(`/monitoring?tab=${tab}`, undefined, { shallow: true });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatTime = (timestamp) => {
    if (!timestamp || !isClient) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case '200': return 'bg-blue-100 text-blue-800';
      case '402': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Time', 'Domain', 'URL', 'Crawler', 'Amount', 'Status', 'TX Hash', 'Ledger TX'],
      ...events.map(event => [
        event.ts,
        event.domain,
        event.url,
        event.crawler,
        event.amount,
        event.status,
        event.tx_hash || '',
        event.ledger_tx || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monitoring-events.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('CSV exported successfully!');
  };

  const handleRulesSave = () => {
    // Mock save
    showToast('Rules saved successfully!');
  };

  const handleRulesTest = () => {
    // Mock test
    showToast('Test completed: 3 rules would have fired in the last 24h', 'warning');
  };

  const handleWebhookSave = (webhookData) => {
    if (editingWebhook) {
      setWebhooks(prev => prev.map(w => w.id === editingWebhook.id ? { ...editingWebhook, ...webhookData } : w));
      showToast('Webhook updated successfully!');
    } else {
      setWebhooks(prev => [...prev, { ...webhookData, lastDelivery: null }]);
      showToast('Webhook created successfully!');
    }
    setShowWebhookModal(false);
    setEditingWebhook(null);
  };

  const handleWebhookTest = (webhook) => {
    // Mock test
    const newDelivery = {
      ts: new Date().toISOString(),
      status: Math.random() > 0.8 ? 500 : 200,
      ms: Math.floor(Math.random() * 1000) + 100
    };
    
    setWebhooks(prev => prev.map(w => 
      w.id === webhook.id 
        ? { ...w, lastDelivery: newDelivery }
        : w
    ));
    
    showToast(`Test webhook sent: ${newDelivery.status} (${newDelivery.ms}ms)`);
  };

  // Simulate SSE streaming
  useEffect(() => {
    if (activeTab !== 'events') return;
    
    const interval = setInterval(() => {
      const newEvent = {
        id: Date.now().toString(),
        ts: new Date().toISOString(),
        domain: ['example.com', 'test.org', 'blog.site'][Math.floor(Math.random() * 3)],
        url: 'https://streamed.example.com/api/new',
        crawler: 'crawler-' + Math.random().toString(36).substr(2, 6),
        amount: Math.random() * 0.1,
        status: ['paid', '200', '402', 'error'][Math.floor(Math.random() * 4)],
        tx_hash: Math.random() > 0.5 ? '0x' + Math.random().toString(16).substr(2, 8) + '...' + Math.random().toString(16).substr(2, 6) : undefined,
        ledger_tx: Math.random() > 0.5 ? 'ledger_' + Math.random().toString(36).substr(2, 6) : undefined,
        contentHash: Math.random() > 0.5 ? 'Qm' + Math.random().toString(36).substr(2, 13) : undefined
      };
      setEvents(prev => [newEvent, ...prev.slice(0, 99)]); // Keep last 100
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Prevent hydration issues
  if (!isClient) {
    return (
      <div className="min-h-screen p-4 lg:p-8" style={{ backgroundColor: '#FAF9F6' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Navigation */}
      <div className="border-b-2 border-[#FF7043]" style={{ backgroundColor: '#FAF9F6' }}>
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <div className="text-[#52796F] font-medium text-lg">
              tachi
            </div>
            <div className="hidden md:flex space-x-8 text-[#52796F] font-medium uppercase">
              <a href="/docs" className="hover:underline">DOCS</a>
              <a href="/dashboard" className="hover:underline">DASHBOARD</a>
            </div>
          </nav>
        </div>
      </div>
      
      <div className="min-h-screen p-4 lg:p-8" style={{ backgroundColor: '#FAF9F6' }}>
        <div className="max-w-7xl mx-auto">
        
        {/* Grid layout */}
        <div className="grid" style={{
          gridTemplateColumns: '120px 1fr 1fr 1fr 1fr 1fr',
          gridTemplateRows: '120px 1fr',
          gridTemplateAreas: `
            "sidebar events rules webhooks slack status"
            "sidebar content content content content content"
          `,
          gap: '0px',
          height: '700px'
        }}>
          
          {/* Sidebar Navigation */}
          <div style={{ gridArea: 'sidebar' }}>
            <GridBox title="Navigation" className="h-full">
              <Navigation activePage="Monitoring" />
            </GridBox>
          </div>

          {/* Events Tab */}
          <div style={{ gridArea: 'events' }}>
            <GridBox title="" className="h-full cursor-pointer transition-opacity hover:opacity-90" borderStyle={{ borderLeft: 'none' }}>
              <div 
                className="h-full flex justify-center items-center"
                onClick={() => handleTabChange('events')}
                style={{
                  backgroundColor: activeTab === 'events' ? '#FF7043' : '#FAF9F6'
                }}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: activeTab === 'events' ? 'white' : '#FF7043'
                  }}
                >
                  EVENTS
                </div>
              </div>
            </GridBox>
          </div>

          {/* Rules Tab */}
          <div style={{ gridArea: 'rules' }}>
            <GridBox title="" className="h-full cursor-pointer transition-opacity hover:opacity-90" borderStyle={{ borderLeft: 'none' }}>
              <div 
                className="h-full flex justify-center items-center"
                onClick={() => handleTabChange('rules')}
                style={{
                  backgroundColor: activeTab === 'rules' ? '#FF7043' : '#FAF9F6'
                }}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: activeTab === 'rules' ? 'white' : '#FF7043'
                  }}
                >
                  RULES
                </div>
              </div>
            </GridBox>
          </div>

          {/* Webhooks Tab */}
          <div style={{ gridArea: 'webhooks' }}>
            <GridBox title="" className="h-full cursor-pointer transition-opacity hover:opacity-90" borderStyle={{ borderLeft: 'none' }}>
              <div 
                className="h-full flex justify-center items-center"
                onClick={() => handleTabChange('webhooks')}
                style={{
                  backgroundColor: activeTab === 'webhooks' ? '#FF7043' : '#FAF9F6'
                }}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: activeTab === 'webhooks' ? 'white' : '#FF7043'
                  }}
                >
                  WEBHOOKS
                </div>
              </div>
            </GridBox>
          </div>

          {/* Slack Tab */}
          <div style={{ gridArea: 'slack' }}>
            <GridBox title="" className="h-full cursor-pointer transition-opacity hover:opacity-90" borderStyle={{ borderLeft: 'none' }}>
              <div 
                className="h-full flex justify-center items-center"
                onClick={() => handleTabChange('slack')}
                style={{
                  backgroundColor: activeTab === 'slack' ? '#FF7043' : '#FAF9F6'
                }}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: activeTab === 'slack' ? 'white' : '#FF7043'
                  }}
                >
                  SLACK
                </div>
              </div>
            </GridBox>
          </div>

          {/* Status Tab */}
          <div style={{ gridArea: 'status' }}>
            <GridBox title="" className="h-full cursor-pointer transition-opacity hover:opacity-90" borderStyle={{ borderLeft: 'none' }}>
              <div 
                className="h-full flex justify-center items-center"
                onClick={() => handleTabChange('status')}
                style={{
                  backgroundColor: activeTab === 'status' ? '#FF7043' : '#FAF9F6'
                }}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: activeTab === 'status' ? 'white' : '#FF7043'
                  }}
                >
                  STATUS
                </div>
              </div>
            </GridBox>
          </div>

          {/* Content Area */}
          <div style={{ gridArea: 'content' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col overflow-hidden">
                
                {activeTab === 'events' && (
                  <div className="h-full flex flex-col space-y-4 p-2">
                    
                    {/* Events Header & Filters */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                        Events ({events.length})
                      </h3>
                      <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 text-sm text-white rounded"
                        style={{
                          fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: '#52796F',
                          border: 'none'
                        }}
                      >
                        Export CSV
                      </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <select
                        value={eventFilters.timeRange}
                        onChange={(e) => setEventFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                        className="p-1 border border-gray-300 rounded"
                        style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        <option value="today">Today</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="custom">Custom</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Domain filter"
                        value={eventFilters.domain}
                        onChange={(e) => setEventFilters(prev => ({ ...prev, domain: e.target.value }))}
                        className="p-1 border border-gray-300 rounded"
                        style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      />
                      <select
                        value={eventFilters.status}
                        onChange={(e) => setEventFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="p-1 border border-gray-300 rounded"
                        style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        <option value="">All statuses</option>
                        <option value="paid">Paid</option>
                        <option value="200">Success</option>
                        <option value="402">Payment required</option>
                        <option value="blocked">Blocked</option>
                        <option value="error">Error</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Search URL or TX"
                        value={eventFilters.search}
                        onChange={(e) => setEventFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="p-1 border border-gray-300 rounded"
                        style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      />
                    </div>

                    {/* Events Table */}
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0" style={{ backgroundColor: '#FAF9F6' }}>
                          <tr className="border-b border-gray-200">
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Time
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Domain/URL
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Crawler
                            </th>
                            <th className="text-right font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Amount
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Status
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              TX Hash
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {events
                            .filter(event => 
                              (!eventFilters.domain || event.domain.includes(eventFilters.domain)) &&
                              (!eventFilters.status || event.status === eventFilters.status) &&
                              (!eventFilters.search || event.url.includes(eventFilters.search) || event.tx_hash?.includes(eventFilters.search))
                            )
                            .map((event) => (
                            <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleEventClick(event)}>
                              <td className="py-3 pr-4" title={event.ts} style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                                {formatTime(event.ts)}
                              </td>
                              <td className="py-3 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                                <div className="font-medium">{event.domain}</div>
                                <div className="text-xs text-gray-500 truncate max-w-32">{event.url}</div>
                              </td>
                              <td className="py-3 pr-4 font-mono" style={{ fontFamily: 'monospace', color: '#FF7043' }}>
                                {event.crawler.slice(-6)}
                              </td>
                              <td className="py-3 pr-4 text-right font-mono" style={{ fontFamily: 'monospace', color: '#FF7043' }}>
                                {event.amount.toFixed(4)}
                              </td>
                              <td className="py-3 pr-4">
                                <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(event.status)}`}>
                                  {event.status}
                                </span>
                              </td>
                              <td className="py-3 pr-4 font-mono">
                                {event.tx_hash ? (
                                  <a
                                    href={`https://basescan.org/tx/${event.tx_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-80"
                                    style={{ fontFamily: 'monospace', color: '#FF7043' }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {event.tx_hash} ↗
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'rules' && (
                  <div className="h-full flex flex-col space-y-6 p-4">
                    <h3 className="text-lg font-bold" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                      Monitoring Rules
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          Pay Conversion Below (%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={rules.payConversionBelow}
                          onChange={(e) => setRules(prev => ({ ...prev, payConversionBelow: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-600" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          {rules.payConversionBelow}%
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          Verify P95 Above (ms)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          step="100"
                          value={rules.verifyP95AboveMs}
                          onChange={(e) => setRules(prev => ({ ...prev, verifyP95AboveMs: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-600" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          {rules.verifyP95AboveMs}ms
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          Error Rate Above (%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={rules.errorRateAbove}
                          onChange={(e) => setRules(prev => ({ ...prev, errorRateAbove: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-600" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          {rules.errorRateAbove}%
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleRulesTest}
                        className="px-4 py-2 text-sm border border-gray-300 rounded"
                        style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        Test against last 24h
                      </button>
                      <button
                        onClick={handleRulesSave}
                        className="px-4 py-2 text-sm text-white rounded"
                        style={{
                          fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: '#FF7043',
                          border: 'none'
                        }}
                      >
                        Save Rules
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'webhooks' && (
                  <div className="h-full flex flex-col space-y-4 p-2">
                    
                    {/* Webhooks Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                        Webhooks
                      </h3>
                      <button
                        onClick={() => {
                          setEditingWebhook(null);
                          setShowWebhookModal(true);
                        }}
                        className="px-4 py-2 text-sm text-white rounded"
                        style={{
                          fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: '#FF7043',
                          border: 'none'
                        }}
                      >
                        Add Webhook
                      </button>
                    </div>

                    {/* Webhooks Table */}
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0" style={{ backgroundColor: '#FAF9F6' }}>
                          <tr className="border-b border-gray-200">
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              URL
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Secret
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Status
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Last Delivery
                            </th>
                            <th className="text-center font-medium text-gray-700 pb-2" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {webhooks.map((webhook) => (
                            <tr key={webhook.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                                <div className="truncate max-w-48">{webhook.url}</div>
                              </td>
                              <td className="py-3 pr-4 font-mono" style={{ fontFamily: 'monospace', color: '#FF7043' }}>
                                {webhook.secretPreview}
                              </td>
                              <td className="py-3 pr-4">
                                <span className={`px-2 py-0.5 rounded text-xs ${webhook.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {webhook.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3 pr-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                                {webhook.lastDelivery ? (
                                  <div>
                                    <div>{formatTime(webhook.lastDelivery.ts)}</div>
                                    <div className={`text-xs ${webhook.lastDelivery.status === 200 ? 'text-green-600' : 'text-red-600'}`}>
                                      {webhook.lastDelivery.status} ({webhook.lastDelivery.ms}ms)
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Never</span>
                                )}
                              </td>
                              <td className="py-3 text-center">
                                <div className="flex space-x-1 justify-center">
                                  <button
                                    onClick={() => {
                                      setEditingWebhook(webhook);
                                      setShowWebhookModal(true);
                                    }}
                                    className="px-2 py-1 text-xs text-white rounded"
                                    style={{
                                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                      backgroundColor: '#52796F',
                                      border: 'none'
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleWebhookTest(webhook)}
                                    className="px-2 py-1 text-xs text-white rounded"
                                    style={{
                                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                      backgroundColor: '#d97706',
                                      border: 'none'
                                    }}
                                  >
                                    Test
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'slack' && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-bold mb-2" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                        Slack Integration
                      </div>
                      <p className="text-gray-600" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Coming soon...
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'status' && (
                  <div className="h-full flex flex-col space-y-6 p-4">
                    <h3 className="text-lg font-bold" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                      System Status
                    </h3>

                    {/* Service Status */}
                    <div className="grid grid-cols-2 gap-4">
                      {mockStatus.services.map((service) => (
                        <div key={service.name} className="p-4 border border-gray-200 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                              {service.name}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs ${
                              service.status === 'healthy' ? 'bg-green-100 text-green-800' : 
                              service.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {service.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            <div>Uptime: {service.uptime}%</div>
                            <div>Last error: {service.lastError ? formatTime(service.lastError) : 'None'}</div>
                            <div>Updated: {formatTime(service.lastUpdated)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Error Chart Placeholder */}
                    <div className="border border-gray-200 rounded p-4">
                      <h4 className="font-medium mb-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                        Errors Over Time
                      </h4>
                      <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-500" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          Chart placeholder (would use Recharts)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </GridBox>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EventDetailModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        event={selectedEvent}
      />

      <WebhookModal
        isOpen={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
        webhook={editingWebhook}
        onSave={handleWebhookSave}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      </div>
    </div>
  );
}