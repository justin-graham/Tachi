import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

// Sample data
const mockDomains = [
  {
    id: '1',
    domain: 'news.example.com',
    status: 'active',
    priceUSDC: 0.0019,
    lastSeen: '2025-09-06T14:05:00Z',
    requests24h: 1247
  },
  {
    id: '2', 
    domain: 'blog.mysite.io',
    status: 'verifying',
    priceUSDC: 0.0025,
    lastSeen: null,
    requests24h: 0
  },
  {
    id: '3',
    domain: 'api.company.com',
    status: 'paused',
    priceUSDC: 0.0015,
    lastSeen: '2025-09-05T22:30:00Z',
    requests24h: 89
  }
];


// GridBox Component (reused from dashboard)
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

// Status Ticker Component
const StatusTicker = ({ status }) => {
  const statusText = status.toUpperCase();
  
  return (
    <div className="ticker" style={{ 
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '150px',
      height: '20px'
    }}>
      <style jsx>{`
        .ticker__track {
          display: flex;
          width: max-content;
          animation: ticker 20s linear infinite;
          will-change: transform;
        }
        .ticker__content {
          display: inline-flex;
          gap: 2rem;
          padding-inline: 1rem;
        }
        .ticker:hover .ticker__track {
          animation-play-state: paused;
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker__track { animation: none; }
        }
      `}</style>
      <div className="ticker__track">
        <div className="ticker__content">
          <span style={{
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            color: '#52796F',
            backgroundColor: '#FAF9F6'
          }}>
            {statusText}
          </span>
          <span style={{
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            color: '#52796F',
            backgroundColor: '#FAF9F6'
          }}>
            {statusText}
          </span>
          <span style={{
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            color: '#52796F',
            backgroundColor: '#FAF9F6'
          }}>
            {statusText}
          </span>
          <span style={{
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            color: '#52796F',
            backgroundColor: '#FAF9F6'
          }}>
            {statusText}
          </span>
        </div>
        <div className="ticker__content" aria-hidden="true">
          <span style={{
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            color: '#52796F',
            backgroundColor: '#FAF9F6'
          }}>
            {statusText}
          </span>
          <span style={{
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            color: '#52796F',
            backgroundColor: '#FAF9F6'
          }}>
            {statusText}
          </span>
          <span style={{
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            color: '#52796F',
            backgroundColor: '#FAF9F6'
          }}>
            {statusText}
          </span>
          <span style={{
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            color: '#52796F',
            backgroundColor: '#FAF9F6'
          }}>
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function DomainsPage() {
  const [domains, setDomains] = useState(mockDomains);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [showVerificationDrawer, setShowVerificationDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('cloudflare');
  const [newDomain, setNewDomain] = useState({
    domain: '',
    cdn: 'cloudflare',
    defaultPrice: 0.001000
  });
  const addFormRef = useRef(null);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!'); // Simple feedback - could be replaced with toast
  };

  // Check if form fields are empty
  const isFormEmpty = () => {
    return !newDomain.domain.trim() && newDomain.defaultPrice === 0.001000 && newDomain.cdn === 'cloudflare';
  };

  // Handle click outside to collapse form if empty
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addFormRef.current && !addFormRef.current.contains(event.target) && showAddForm && isFormEmpty()) {
        setShowAddForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddForm, newDomain]);

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
        
        {/* Grid layout for domains page */}
        <div className="grid" style={{
          gridTemplateColumns: '120px 1fr 1fr',
          gridTemplateRows: '300px 380px 220px',
          gridTemplateAreas: `
            "sidebar domains add-domain"
            "sidebar verification verification"
            "sidebar pricing pricing"
          `,
          gap: '0px'
        }}>
          
          {/* Sidebar Navigation */}
          <div style={{ gridArea: 'sidebar' }}>
            <GridBox title="Navigation" className="h-full">
              <Navigation activePage="Domains" />
            </GridBox>
          </div>

          {/* Domains List */}
          <div style={{ gridArea: 'domains' }}>
            <GridBox title="Your Domains" className="h-full" borderStyle={{ borderLeft: 'none' }}>
              <div className="h-full flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  {domains.map((domain) => (
                    <div
                      key={domain.id}
                      className="cursor-pointer transition-all"
                      style={{
                        fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                      onClick={() => {
                        console.log('Clicking domain:', domain);
                        // Toggle expand/collapse
                        if (expandedDomain?.id === domain.id) {
                          setExpandedDomain(null);
                          setSelectedDomain(null);
                        } else {
                          setExpandedDomain(domain);
                          setSelectedDomain(domain);
                          setShowVerificationDrawer(true);
                        }
                      }}
                    >
                      {/* Button-style header (always visible) */}
                      <div
                        className="p-3 transition-all"
                        style={{
                          backgroundColor: selectedDomain?.id === domain.id ? '#FF7043' : 'transparent',
                          color: selectedDomain?.id === domain.id ? 'white' : '#FF7043',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontSize: '14px',
                          border: 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedDomain?.id !== domain.id) {
                            e.currentTarget.style.backgroundColor = '#e0e0e0';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedDomain?.id !== domain.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span>{domain.domain}</span>
                          <StatusTicker status={domain.status} />
                        </div>
                      </div>

                      {/* Expanded details (only show when expanded) */}
                      {expandedDomain?.id === domain.id && (
                        <div className="px-3 py-3 rounded-b flex items-center justify-center" style={{ backgroundColor: '#52796F' }}>
                          <div className="grid grid-cols-2 gap-4 w-full">
                            <div style={{
                              fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              color: 'white',
                              textAlign: 'center'
                            }}>
                              Price: ${domain.priceUSDC.toFixed(4)}
                            </div>
                            <div style={{
                              fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              color: 'white',
                              textAlign: 'center'
                            }}>
                              24h Requests: {domain.requests24h.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </GridBox>
          </div>

          {/* Add Domain */}
          <div style={{ gridArea: 'add-domain' }} ref={addFormRef}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none' }}>
              {!showAddForm ? (
                // Large centered button to show add form
                <div 
                  className="h-full flex items-center justify-center cursor-pointer transition-all"
                  onClick={() => setShowAddForm(true)}
                  style={{
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!showAddForm) {
                      e.currentTarget.style.backgroundColor = '#FF7043';
                      e.currentTarget.querySelector('span').style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showAddForm) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.querySelector('span').style.color = '#FF7043';
                    }
                  }}
                >
                  <span style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#FF7043',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                  }}>
                    Add New Domain
                  </span>
                </div>
              ) : (
                // Full add domain form
                <div className="h-full flex flex-col space-y-4" style={{ backgroundColor: '#FAF9F6' }}>
                  <input
                    type="text"
                    placeholder="Enter domain (e.g., api.example.com)"
                    value={newDomain.domain}
                    onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                    className="w-full p-3 text-sm outline-none transition-all"
                    style={{
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      border: 'none',
                      backgroundColor: '#f0f0f0'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 112, 67, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
                      CDN Provider
                    </label>
                    <select
                      value={newDomain.cdn}
                      onChange={(e) => setNewDomain({ ...newDomain, cdn: e.target.value })}
                      className="w-full p-3 text-sm outline-none transition-all"
                      style={{
                        fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        border: 'none',
                        backgroundColor: '#f0f0f0',
                        appearance: 'none',
                        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 4 5\'><path fill=\'%23666\' d=\'M2,0L0,2H4ZM2,5L0,3H4Z\'/></svg>")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '12px',
                        paddingRight: '40px'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 112, 67, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <option value="cloudflare">Cloudflare</option>
                      <option value="vercel">Vercel</option>
                      <option value="fastly">Fastly</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
                      Default Price (USDC)
                    </label>
                    <input
                      type="number"
                      min="0.000001"
                      max="1000"
                      step="0.000001"
                      value={newDomain.defaultPrice}
                      onChange={(e) => setNewDomain({ ...newDomain, defaultPrice: parseFloat(e.target.value) })}
                      className="w-full p-3 text-sm outline-none transition-all"
                      style={{
                        fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        border: 'none',
                        backgroundColor: '#f0f0f0'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 112, 67, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 py-3 px-4 text-sm font-bold transition-all outline-none"
                      style={{
                        fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        backgroundColor: '#F8F4E6',
                        color: 'black',
                        border: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#e0e0e0';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#F8F4E6';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (newDomain.domain && newDomain.defaultPrice >= 0.0001) {
                          const newDomainObj = {
                            id: (domains.length + 1).toString(),
                            domain: newDomain.domain,
                            status: 'unverified',
                            priceUSDC: newDomain.defaultPrice,
                            lastSeen: null,
                            requests24h: 0
                          };
                          
                          setDomains([...domains, newDomainObj]);
                          setNewDomain({ domain: '', cdn: 'cloudflare', defaultPrice: 0.001000 });
                          setShowAddForm(false);
                          console.log('Domain added:', newDomainObj);
                        }
                      }}
                      disabled={!newDomain.domain || newDomain.defaultPrice < 0.0001}
                      className="flex-1 py-3 px-4 text-sm font-bold transition-all outline-none"
                      style={{
                        fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        backgroundColor: (!newDomain.domain || newDomain.defaultPrice < 0.0001) ? '#ccc' : '#FF7043',
                        color: (!newDomain.domain || newDomain.defaultPrice < 0.0001) ? '#888' : 'white',
                        cursor: (!newDomain.domain || newDomain.defaultPrice < 0.0001) ? 'not-allowed' : 'pointer',
                        border: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                      onMouseOver={(e) => {
                        if (newDomain.domain && newDomain.defaultPrice >= 0.0001) {
                          e.currentTarget.style.backgroundColor = '#e55a37';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (newDomain.domain && newDomain.defaultPrice >= 0.0001) {
                          e.currentTarget.style.backgroundColor = '#FF7043';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      Add Domain
                    </button>
                  </div>
                </div>
              )}
            </GridBox>
          </div>

          {/* Verification/Management Drawer */}
          <div style={{ gridArea: 'verification' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              {selectedDomain ? (
                <div className="h-full flex flex-col space-y-3 overflow-hidden">
                  {selectedDomain.status === 'verifying' || selectedDomain.status === 'unverified' ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          Add this TXT record to your DNS:
                        </p>
                        <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                          <div><strong>Name:</strong> _tachi</div>
                          <div><strong>Value:</strong> tachi-org123-{selectedDomain.domain.replace(/\./g, '')}</div>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => copyToClipboard(`_tachi\ttachi-org123-${selectedDomain.domain.replace(/\./g, '')}`)}
                            className="px-3 py-1 text-xs transition-colors"
                            style={{
                              fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              backgroundColor: '#52796F',
                              color: 'white',
                              border: 'none'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            Copy TXT
                          </button>
                          <button
                            onClick={() => {
                              // Mock verification success for demo
                              console.log('Verifying domain:', selectedDomain.domain);
                              const updatedDomain = { ...selectedDomain, status: 'active' };
                              setSelectedDomain(updatedDomain);
                              
                              // Update the domain in the state
                              const updatedDomains = domains.map(d => 
                                d.id === selectedDomain.id ? updatedDomain : d
                              );
                              setDomains(updatedDomains);
                              console.log('Domain verified successfully!');
                            }}
                            className="px-3 py-1 text-xs text-white transition-opacity"
                            style={{
                              fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              backgroundColor: '#52796F',
                              border: 'none'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            Check Verification
                          </button>
                          <button
                            onClick={() => console.log('Refreshing DNS')}
                            className="px-3 py-1 text-xs transition-colors"
                            style={{
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segue UI", Roboto, sans-serif',
                              backgroundColor: '#52796F',
                              color: 'white',
                              border: 'none'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            Refresh DNS
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1 overflow-hidden">
                      {/* Gateway Code Snippets */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#374151' }}>
                          Gateway Snippets
                        </h4>
                        <div className="rounded-2xl overflow-hidden shadow-lg border" style={{ backgroundColor: 'rgba(248, 244, 230, 0.7)' }}>
                          <div className="px-4 py-2 flex items-center justify-between border-b" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setActiveTab('cloudflare')}
                                className="px-2 py-1 text-xs rounded transition-colors"
                                style={{
                                  fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  backgroundColor: activeTab === 'cloudflare' ? '#FF7043' : 'transparent',
                                  color: activeTab === 'cloudflare' ? 'white' : '#6b7280'
                                }}
                              >
                                Cloudflare
                              </button>
                              <button
                                onClick={() => setActiveTab('generic')}
                                className="px-2 py-1 text-xs rounded transition-colors"
                                style={{
                                  fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  backgroundColor: activeTab === 'generic' ? '#FF7043' : 'transparent',
                                  color: activeTab === 'generic' ? 'white' : '#6b7280'
                                }}
                              >
                                Generic
                              </button>
                              <div className="text-gray-700 text-sm font-medium">
                                {activeTab === 'cloudflare' ? 'cloudflare-worker.js' : 'middleware.js'}
                              </div>
                              <button
                                onClick={() => copyToClipboard(activeTab === 'cloudflare' ? `// Cloudflare Worker\nexport default {\n  async fetch(request) {\n    const tachi = await import('@tachi/worker');\n    return tachi.handle(request, {\n      domain: '${selectedDomain.domain}',\n      orgId: 'org123'\n    });\n  }\n}` : `// Generic Edge Middleware\nimport { tachi } from '@tachi/middleware';\n\napp.use(tachi({\n  domain: '${selectedDomain.domain}',\n  orgId: 'org123',\n  defaultPrice: ${selectedDomain.priceUSDC}\n}));`)}
                                className="px-2 py-1 text-xs rounded text-gray-600 hover:bg-gray-200 transition-colors"
                                style={{
                                  fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <div className="p-4 overflow-auto" style={{ maxHeight: '200px' }}>
                            <div className="font-mono text-gray-800 text-xs whitespace-pre-wrap">
                              {activeTab === 'cloudflare' ? `// Cloudflare Worker
export default {
  async fetch(request) {
    const tachi = await import('@tachi/worker');
    return tachi.handle(request, {
      domain: '${selectedDomain.domain}',
      orgId: 'org123'
    });
  }
}` : `// Generic Edge Middleware
import { tachi } from '@tachi/middleware';

app.use(tachi({
  domain: '${selectedDomain.domain}',
  orgId: 'org123',
  defaultPrice: ${selectedDomain.priceUSDC}
}));`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Domain Controls */}
                      <div className="flex justify-center space-x-2 pt-2">
                        <button
                          onClick={() => console.log('Toggle pause/resume')}
                          className="px-3 py-1 text-xs text-white transition-opacity"
                          style={{
                            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            backgroundColor: selectedDomain.status === 'paused' ? '#16a34a' : '#6b7280',
                            border: 'none'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          {selectedDomain.status === 'paused' ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${selectedDomain.domain}?`)) {
                              console.log('Deleting domain');
                            }
                          }}
                          className="px-3 py-1 text-xs text-white transition-opacity"
                          style={{
                            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            backgroundColor: '#dc2626',
                            border: 'none'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span style={{
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#FF7043',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                  }}>
                    Domain Management
                  </span>
                </div>
              )}
            </GridBox>
          </div>

          {/* Pricing Configuration */}
          <div style={{ gridArea: 'pricing' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              {selectedDomain ? (
                <div className="h-full flex flex-col space-y-3 overflow-hidden">
                  {/* Default Price */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <label className="text-xs font-medium" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#374151' }}>
                        Default Price (USDC):
                      </label>
                      <input
                        type="number"
                        min="0.0001"
                        max="1000"
                        step="0.0001"
                        defaultValue={selectedDomain.priceUSDC}
                        className="flex-1 p-1 text-xs outline-none"
                        style={{
                          fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: '#FAF9F6',
                          border: 'none',
                          maxWidth: '120px'
                        }}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value >= 0.0001) {
                            console.log('Updating default price:', value);
                          }
                        }}
                      />
                    </div>
                    
                    {/* Path Rules */}
                    <div className="space-y-2 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#374151' }}>
                          Path Override Rules
                        </h4>
                        <button
                          onClick={() => console.log('Add path rule')}
                          className="px-2 py-1 text-xs text-white transition-opacity"
                          style={{
                            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            backgroundColor: '#FF7043',
                            border: 'none'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          + Add Rule
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0" style={{ backgroundColor: '#FAF9F6' }}>
                            <tr className="border-b border-gray-200">
                              <th style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                                  className="text-left font-medium text-gray-700 pb-1 text-xs">Pattern</th>
                              <th style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                                  className="text-left font-medium text-gray-700 pb-1 text-xs">Price</th>
                              <th style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                                  className="text-center font-medium text-gray-700 pb-1 text-xs">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-100">
                              <td style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                                  className="py-1 text-xs font-mono">/api/*</td>
                              <td style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                                  className="py-1 text-xs">$0.0050</td>
                              <td className="py-1 text-center">
                                <button
                                  onClick={() => console.log('Delete rule')}
                                  className="px-1 py-0.5 text-xs text-red-600 hover:bg-red-50 rounded"
                                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                                  className="py-1 text-xs font-mono">/premium/*</td>
                              <td style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                                  className="py-1 text-xs">$0.0075</td>
                              <td className="py-1 text-center">
                                <button
                                  onClick={() => console.log('Delete rule')}
                                  className="px-1 py-0.5 text-xs text-red-600 hover:bg-red-50 rounded"
                                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span style={{
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#FF7043',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                  }}>
                    Domain Pricing
                  </span>
                </div>
              )}
            </GridBox>
          </div>
        </div>
      </div>
    </div>
  );
}