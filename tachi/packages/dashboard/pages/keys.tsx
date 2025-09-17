import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StandardButton from '../components/StandardButton';

// Mock data
const mockApiKeys = [
  {
    id: '1',
    name: 'Production API',
    keyPrefix: 'tachi_live_abc123',
    scopes: ['fetch', 'pay'],
    lastUsed: '2025-09-07T10:30:00Z',
    createdAt: '2025-08-15T09:00:00Z',
    status: 'active'
  },
  {
    id: '2',
    name: 'Development Key',
    keyPrefix: 'tachi_test_def456',
    scopes: ['fetch'],
    lastUsed: '2025-09-06T14:20:00Z',
    createdAt: '2025-08-20T11:30:00Z',
    status: 'active'
  },
  {
    id: '3',
    name: 'Admin Dashboard',
    keyPrefix: 'tachi_live_ghi789',
    scopes: ['fetch', 'pay', 'admin'],
    lastUsed: null,
    createdAt: '2025-09-01T16:45:00Z',
    status: 'revoked'
  }
];

const mockWalletData = {
  network: 'Base Mainnet',
  payoutAddress: '0x742d35Cc6634C0532925a3b8D0B4e4e2Ff5EcE57',
  balances: {
    usdc: 2547.32,
    allowance: 5000.00,
    inflow24h: 127.45
  },
  statements: [
    {
      id: '1',
      date: '2025-09-07T08:30:00Z',
      type: 'inbound',
      amountUSDC: 45.67,
      txHash: '0xabc123...def456',
      memo: 'API usage payments'
    },
    {
      id: '2',
      date: '2025-09-06T16:15:00Z',
      type: 'payout',
      amountUSDC: -500.00,
      txHash: '0x789abc...123def',
      memo: 'Weekly payout to publisher'
    },
    {
      id: '3',
      date: '2025-09-05T12:45:00Z',
      type: 'inbound',
      amountUSDC: 81.78,
      txHash: '0xfed321...654cba',
      memo: 'Domain revenue'
    }
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
            className="transition-colors cursor-pointer"
            style={{
              borderRadius: '4px',
              fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '10px',
              padding: '6px 8px',
              backgroundColor: activePage === item ? '#52796F' : 'transparent',
              color: activePage === item ? 'white' : '#666',
              fontWeight: activePage === item ? '600' : 'normal'
            }}
            onMouseEnter={(e) => {
              if (activePage !== item) {
                (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== item) {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
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
    className="fixed top-4 right-4 z-50 px-4 py-2 rounded-sm shadow-lg transition-opacity"
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

// Create Key Modal
const CreateKeyModal = ({ isOpen, onClose, onCreateKey }) => {
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState(['fetch']);
  const [expiry, setExpiry] = useState('');

  const availableScopes = ['fetch', 'pay', 'admin'];

  const handleScopeToggle = (scope) => {
    setSelectedScopes(prev => 
      prev.includes(scope) 
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const handleCreate = () => {
    if (keyName.trim()) {
      onCreateKey({
        name: keyName,
        scopes: selectedScopes,
        expiry: expiry || null
      });
      setKeyName('');
      setSelectedScopes(['fetch']);
      setExpiry('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-sm-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
          Create API Key
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              Key Name
            </label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Production API"
              className="w-full p-2 border border-gray-300 rounded-sm"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              Scopes
            </label>
            <div className="space-y-2">
              {availableScopes.map(scope => (
                <label key={scope} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(scope)}
                    onChange={() => handleScopeToggle(scope)}
                    className="mr-2"
                  />
                  <span className="text-sm" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    {scope}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              Expiry (Optional)
            </label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-sm"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            />
          </div>
        </div>

        <div className="flex space-x-2 mt-6">
          <StandardButton
            onClick={onClose}
            variant="secondary"
            size="md"
            style={{ backgroundColor: '#f3f4f6', color: '#666' }}
          >
            Cancel
          </StandardButton>
          <StandardButton
            onClick={handleCreate}
            disabled={!keyName.trim()}
            variant="primary"
            size="md"
            style={{ flex: 1 }}
          >
            Create Key
          </StandardButton>
        </div>
      </div>
    </div>
  );
};

// Reveal Key Modal
const RevealKeyModal = ({ isOpen, onClose, apiKey }) => {
  if (!isOpen || !apiKey) return null;

  const fullKey = `${apiKey.keyPrefix}_abcdef123456789`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-sm-lg p-6 max-w-lg w-full mx-4">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
          API Key Created
        </h2>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-sm mb-4">
          <p className="text-sm text-yellow-800 mb-2" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            ⚠️ <strong>Important:</strong> This is the only time you'll see the full key. Store it securely!
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            Full API Key
          </label>
          <div className="bg-gray-100 p-3 rounded-sm font-mono text-sm break-all">
            {fullKey}
          </div>
          <div className="mt-2">
            <StandardButton
              onClick={() => {
                navigator.clipboard.writeText(fullKey);
                showToast('Full key copied!');
              }}
              variant="secondary"
              size="xs"
            >
              Copy Full Key
            </StandardButton>
          </div>
        </div>

        <StandardButton
          onClick={onClose}
          variant="primary"
          size="md"
          style={{ width: '100%' }}
        >
          I've Saved the Key
        </StandardButton>
      </div>
    </div>
  );
};

export default function KeysWalletsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('api-keys');
  const [apiKeys, setApiKeys] = useState(mockApiKeys);
  const [walletData, setWalletData] = useState(mockWalletData);
  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealingKey, setRevealingKey] = useState(null);
  const [editingPayout, setEditingPayout] = useState(false);
  const [newPayoutAddress, setNewPayoutAddress] = useState('');
  const [selectedKeyForSnippet, setSelectedKeyForSnippet] = useState(null);
  const [snippetTab, setSnippetTab] = useState('curl');
  const [isClient, setIsClient] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle tab state in URL
  useEffect(() => {
    if (!isClient) return;
    const tab = router.query.tab;
    if (tab && (tab === 'api-keys' || tab === 'wallets')) {
      setActiveTab(tab as string);
    }
  }, [router.query.tab, isClient]);

  const handleTabChange = (tab) => {
    if (!isClient) return;
    setActiveTab(tab);
    router.push(`/keys?tab=${tab}`, undefined, { shallow: true });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generateRandomId = () => {
    return Math.floor(Math.random() * 1000000).toString();
  };

  const generateKeyPrefix = () => {
    return `tachi_live_${Math.floor(Math.random() * 1000000).toString(36)}`;
  };

  const handleCreateKey = (keyData) => {
    const newKey = {
      id: generateRandomId(),
      name: keyData.name,
      keyPrefix: generateKeyPrefix(),
      scopes: keyData.scopes,
      lastUsed: null,
      createdAt: new Date().toISOString(),
      status: 'active',
      expiry: keyData.expiry
    };
    
    setApiKeys([...apiKeys, newKey]);
    setRevealingKey(newKey);
    setShowRevealModal(true);
    showToast('API key created successfully!');
  };

  const handleRotateKey = (keyId) => {
    const newPrefix = generateKeyPrefix();
    setApiKeys(prev => prev.map(key => 
      key.id === keyId 
        ? { ...key, keyPrefix: newPrefix, lastUsed: null }
        : key
    ));
    showToast('API key rotated successfully!');
  };

  const handleRevokeKey = (keyId) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId 
        ? { ...key, status: 'revoked' }
        : key
    ));
    showToast('API key revoked successfully!');
  };

  const handlePayoutAddressChange = () => {
    if (newPayoutAddress) {
      setWalletData(prev => ({ ...prev, payoutAddress: newPayoutAddress }));
      setEditingPayout(false);
      setNewPayoutAddress('');
      showToast('Payout address updated successfully!');
    }
  };

  const generateTxHash = () => {
    const randomHex1 = Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
    const randomHex2 = Math.floor(Math.random() * 0xFFFFFF).toString(16);
    return `0x${randomHex1}...${randomHex2}`;
  };

  const handleTestPayout = () => {
    const testStatement = {
      id: generateRandomId(),
      date: new Date().toISOString(),
      type: 'payout',
      amountUSDC: -100.00,
      txHash: generateTxHash(),
      memo: 'Test payout'
    };
    
    setWalletData(prev => ({
      ...prev,
      statements: [testStatement, ...prev.statements]
    }));
    showToast('Test payout executed successfully!');
  };

  const formatTime = (timestamp) => {
    if (!timestamp || !isClient) return 'Never';
    return new Date(timestamp).toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCodeSnippet = (language, keyPrefix) => {
    const baseUrl = 'https://api.tachi.dev';
    const fullKey = `${keyPrefix}_your_secret_suffix`;
    
    switch (language) {
      case 'curl':
        return `curl -X GET "${baseUrl}/v1/crawl" \\
  -H "Authorization: Bearer ${fullKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/api/data"}'`;
      
      case 'javascript':
        return `const response = await fetch('${baseUrl}/v1/crawl', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${fullKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com/api/data'
  })
});

const data = await response.json();`;
      
      case 'python':
        return `import requests

headers = {
    'Authorization': f'Bearer ${fullKey}',
    'Content-Type': 'application/json'
}

data = {
    'url': 'https://example.com/api/data'
}

response = requests.get('${baseUrl}/v1/crawl', 
                       headers=headers, json=data)
result = response.json()`;
      
      default:
        return '';
    }
  };

  // Prevent hydration issues by not rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen p-4 lg:p-8" style={{ backgroundColor: '#FAF9F6' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8" style={{ backgroundColor: '#FAF9F6' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Tachi, Docs and Home */}
        <div className="flex justify-between items-center mb-4" style={{ padding: '0 1rem' }}>
          {/* Left side - Tachi */}
          <div>
            <span style={{
              color: '#52796F',
              fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '24px',
              fontWeight: '700',
              letterSpacing: '0.5px',
            }}>
              tachi
            </span>
          </div>
          
          {/* Right side - Docs and Home */}
          <div className="flex space-x-6">
            <button
              onClick={() => window.open('https://docs.example.com', '_blank')}
              style={{
                background: 'none',
                border: 'none',
                color: '#52796F',
                fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '16px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                padding: '8px 16px',
                transition: 'opacity 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              DOCS
            </button>
            <button
              onClick={() => window.location.href = '/landing'}
              style={{
                background: 'none',
                border: 'none',
                color: '#52796F',
                fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '16px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                padding: '8px 16px',
                transition: 'opacity 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              HOME
            </button>
          </div>
        </div>
        
        {/* Grid layout */}
        <div className="grid" style={{
          gridTemplateColumns: '120px 1fr 1fr 1fr',
          gridTemplateRows: activeTab === 'api-keys' ? '120px 1fr' : '120px 120px 120px 1fr',
          gridTemplateAreas: activeTab === 'api-keys' ? `
            "sidebar apikeys wallets wallets"
            "sidebar content content content"
          ` : `
            "sidebar apikeys wallets wallets"
            "sidebar balance1 balance2 balance3"
            "sidebar network payout payout"
            "sidebar content content content"
          `,
          gap: '0px',
          height: activeTab === 'api-keys' ? '700px' : '940px'
        }}>
          
          {/* Sidebar Navigation */}
          <div style={{ gridArea: 'sidebar' }}>
            <GridBox title="Navigation" className="h-full">
              <Navigation activePage="Keys & Wallets" />
            </GridBox>
          </div>

          {/* API Keys Tab */}
          <div style={{ gridArea: 'apikeys' }}>
            <GridBox title="" className="h-full cursor-pointer transition-opacity hover:opacity-90" borderStyle={{ borderLeft: 'none' }}>
              <div 
                className="h-full flex justify-center items-center"
                onClick={() => handleTabChange('api-keys')}
                style={{
                  backgroundColor: activeTab === 'api-keys' ? '#FF7043' : '#FAF9F6'
                }}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: activeTab === 'api-keys' ? 'white' : '#FF7043'
                  }}
                >
                  API KEYS
                </div>
              </div>
            </GridBox>
          </div>

          {/* Wallets Tab */}
          <div style={{ gridArea: 'wallets' }}>
            <GridBox title="" className="h-full cursor-pointer transition-opacity hover:opacity-90" borderStyle={{ borderLeft: 'none' }}>
              <div 
                className="h-full flex justify-center items-center"
                onClick={() => handleTabChange('wallets')}
                style={{
                  backgroundColor: activeTab === 'wallets' ? '#FF7043' : '#FAF9F6'
                }}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: activeTab === 'wallets' ? 'white' : '#FF7043'
                  }}
                >
                  WALLETS
                </div>
              </div>
            </GridBox>
          </div>

          {/* Balance Box 1 - USDC Balance */}
          {activeTab === 'wallets' && (
            <div style={{ gridArea: 'balance1' }}>
              <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
                <div className="h-full flex flex-col justify-center items-center">
                  <div className="text-center">
                    <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ 
                      color: '#64748b', 
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
                    }}>
                      USDC BALANCE
                    </div>
                    <div className="text-2xl font-bold" style={{ 
                      color: '#FF7043',
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      ${walletData.balances.usdc.toLocaleString()}
                    </div>
                  </div>
                </div>
              </GridBox>
            </div>
          )}

          {/* Balance Box 2 - Allowance */}
          {activeTab === 'wallets' && (
            <div style={{ gridArea: 'balance2' }}>
              <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
                <div className="h-full flex flex-col justify-center items-center">
                  <div className="text-center">
                    <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ 
                      color: '#64748b', 
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
                    }}>
                      ALLOWANCE
                    </div>
                    <div className="text-2xl font-bold" style={{ 
                      color: '#FF7043',
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      ${walletData.balances.allowance.toLocaleString()}
                    </div>
                  </div>
                </div>
              </GridBox>
            </div>
          )}

          {/* Balance Box 3 - 24h Inflow */}
          {activeTab === 'wallets' && (
            <div style={{ gridArea: 'balance3' }}>
              <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
                <div className="h-full flex flex-col justify-center items-center">
                  <div className="text-center">
                    <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ 
                      color: '#64748b', 
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
                    }}>
                      24H INFLOW
                    </div>
                    <div className="text-2xl font-bold" style={{ 
                      color: '#FF7043',
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      ${walletData.balances.inflow24h.toLocaleString()}
                    </div>
                  </div>
                </div>
              </GridBox>
            </div>
          )}

          {/* Network Dropdown Box */}
          {activeTab === 'wallets' && (
            <div style={{ gridArea: 'network' }}>
              <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
                <div className="h-full flex justify-center items-center">
                  <select
                    value={walletData.network}
                    onChange={(e) => setWalletData(prev => ({ ...prev, network: e.target.value }))}
                    className="text-xl font-bold bg-transparent border-none outline-none text-center"
                    style={{ 
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                      color: '#FF7043',
                      backgroundColor: '#FAF9F6'
                    }}
                  >
                    <option value="Base Mainnet">Base Mainnet</option>
                    <option value="Base Sepolia">Base Sepolia</option>
                  </select>
                </div>
              </GridBox>
            </div>
          )}

          {/* Payout Settings Box */}
          {activeTab === 'wallets' && (
            <div style={{ gridArea: 'payout' }}>
              <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
                <div className="h-full flex justify-center items-center px-4">
                  {!editingPayout ? (
                    <div className="flex items-center space-x-6 w-full justify-center">
                      <div className="text-xl font-bold font-mono" style={{ 
                        fontFamily: 'monospace', 
                        color: '#FF7043' 
                      }}>
                        {walletData.payoutAddress}
                      </div>
                      <StandardButton
                        onClick={() => setEditingPayout(true)}
                        variant="primary"
                        size="sm"
                      >
                        Edit
                      </StandardButton>
                      <StandardButton
                        onClick={handleTestPayout}
                        variant="primary"
                        size="sm"
                      >
                        Test Payout
                      </StandardButton>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 w-full justify-center">
                      <input
                        type="text"
                        value={newPayoutAddress}
                        onChange={(e) => setNewPayoutAddress(e.target.value)}
                        placeholder="0x..."
                        className="text-lg font-mono border border-gray-300 rounded-sm px-3 py-2"
                        style={{ fontFamily: 'monospace', minWidth: '400px' }}
                      />
                      <StandardButton
                        onClick={handlePayoutAddressChange}
                        variant="primary"
                        size="sm"
                      >
                        Update
                      </StandardButton>
                      <StandardButton
                        onClick={() => { setEditingPayout(false); setNewPayoutAddress(''); }}
                        variant="secondary"
                        size="sm"
                        style={{ backgroundColor: '#f3f4f6', color: '#666' }}
                      >
                        Cancel
                      </StandardButton>
                    </div>
                  )}
                </div>
              </GridBox>
            </div>
          )}

          {/* Content Area */}
          <div style={{ gridArea: 'content' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col overflow-hidden">
                
                {activeTab === 'api-keys' ? (
                  <div className="h-full flex flex-col space-y-4 p-2">
                    
                    {/* API Keys Header & Create Button */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                        API Keys
                      </h3>
                      <StandardButton
                        onClick={() => setShowCreateModal(true)}
                        variant="primary"
                        size="sm"
                      >
                        Create Key
                      </StandardButton>
                    </div>

                    {/* API Keys Table */}
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0" style={{ backgroundColor: '#FAF9F6' }}>
                          <tr className="border-b border-gray-200">
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Name
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Key Prefix
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Scopes
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Last Used
                            </th>
                            <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Status
                            </th>
                            <th className="text-center font-medium text-gray-700 pb-2" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiKeys.map((key) => (
                            <tr key={key.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                                {key.name}
                              </td>
                              <td className="py-3 pr-4 font-mono" style={{ fontFamily: 'monospace', color: '#FF7043' }}>
                                {key.keyPrefix}
                              </td>
                              <td className="py-3 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                                {key.scopes.join(', ')}
                              </td>
                              <td className="py-3 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                                {formatTime(key.lastUsed)}
                              </td>
                              <td className="py-3 pr-4">
                                <span className={`px-2 py-0.5 rounded-sm text-xs ${key.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {key.status}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <div className="flex space-x-1 justify-center">
                                  <StandardButton
                                    onClick={() => {
                                      navigator.clipboard.writeText(key.keyPrefix);
                                      showToast('Prefix copied!');
                                    }}
                                    variant="secondary"
                                    size="xs"
                                  >
                                    Copy
                                  </StandardButton>
                                  <StandardButton
                                    onClick={() => setSelectedKeyForSnippet(key)}
                                    variant="primary"
                                    size="xs"
                                  >
                                    Snippet
                                  </StandardButton>
                                  {key.status === 'active' && (
                                    <>
                                      <StandardButton
                                        onClick={() => handleRotateKey(key.id)}
                                        variant="warning"
                                        size="xs"
                                      >
                                        Rotate
                                      </StandardButton>
                                      <StandardButton
                                        onClick={() => handleRevokeKey(key.id)}
                                        variant="danger"
                                        size="xs"
                                      >
                                        Revoke
                                      </StandardButton>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Quick Start Snippets */}
                    {selectedKeyForSnippet && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-md font-semibold mb-3" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                          Quick Start with {selectedKeyForSnippet.name}
                        </h4>
                        
                        {/* Snippet Tabs */}
                        <div className="flex space-x-2 mb-3">
                          {['curl', 'javascript', 'python'].map(lang => (
                            <StandardButton
                              key={lang}
                              onClick={() => setSnippetTab(lang)}
                              variant={snippetTab === lang ? 'secondary' : 'info'}
                              size="xs"
                              style={{
                                backgroundColor: snippetTab === lang ? '#52796F' : '#f3f4f6',
                                color: snippetTab === lang ? 'white' : '#666'
                              }}
                            >
                              {lang.toUpperCase()}
                            </StandardButton>
                          ))}
                        </div>

                        {/* Code Snippet */}
                        <div className="bg-gray-900 text-green-400 p-4 rounded-sm font-mono text-sm overflow-x-auto">
                          <pre>{getCodeSnippet(snippetTab, selectedKeyForSnippet.keyPrefix)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Wallets Tab Content
                  <div className="h-full flex flex-col space-y-6 p-4">

                    {/* Statements Table */}
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                        Transaction Statements
                      </h4>
                      <div className="overflow-y-auto h-64">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0" style={{ backgroundColor: '#FAF9F6' }}>
                            <tr className="border-b border-gray-200">
                              <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segue UI", Roboto, sans-serif' }}>
                                Date
                              </th>
                              <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                                Type
                              </th>
                              <th className="text-right font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                                Amount USDC
                              </th>
                              <th className="text-left font-medium text-gray-700 pb-2 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                                TX Hash
                              </th>
                              <th className="text-left font-medium text-gray-700 pb-2" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                                Memo
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {walletData.statements.map((statement) => (
                              <tr key={statement.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 pr-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                                  {formatTime(statement.date)}
                                </td>
                                <td className="py-3 pr-4">
                                  <span className={`px-2 py-0.5 rounded-sm text-xs ${statement.type === 'inbound' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {statement.type}
                                  </span>
                                </td>
                                <td className={`py-3 pr-4 text-right font-mono ${statement.amountUSDC > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${statement.amountUSDC.toFixed(2)}
                                </td>
                                <td className="py-3 pr-4 font-mono">
                                  <a
                                    href={`https://basescan.org/tx/${statement.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-80"
                                    style={{ fontFamily: 'monospace', color: '#FF7043' }}
                                  >
                                    {statement.txHash}
                                  </a>
                                </td>
                                <td className="py-3" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                                  {statement.memo}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
      <CreateKeyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateKey={handleCreateKey}
      />

      <RevealKeyModal
        isOpen={showRevealModal}
        onClose={() => setShowRevealModal(false)}
        apiKey={revealingKey}
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
  );
}