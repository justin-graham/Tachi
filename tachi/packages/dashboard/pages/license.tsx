import React, { useState } from 'react';
import { useRouter } from 'next/router';

// Type definitions
interface LicenseData {
  tokenId: number | null;
  network: string;
  owner: string | null;
  paused: boolean;
  lastUpdated: string | null;
  terms: {
    termsCID: string;
    defaultPriceUSDC: number;
    policyURL: string;
    allowedAgents: string[];
    notes: string;
  };
  pendingChanges: {
    effectiveFrom: string;
    terms: any;
  } | null;
}

// Sample license data
const mockLicenseData: LicenseData = {
  tokenId: null,
  network: 'Base Mainnet',
  owner: null,
  paused: false,
  lastUpdated: null,
  terms: {
    termsCID: '',
    defaultPriceUSDC: 0.001000,
    policyURL: '',
    allowedAgents: [],
    notes: ''
  },
  pendingChanges: null
};

// GridBox Component
const GridBox = ({ title, children, className = '', borderStyle = {} }: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  borderStyle?: React.CSSProperties;
}) => (
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
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
const Navigation = ({ activePage }: { activePage: string }) => {
  const router = useRouter();
  
  const navItems = [
    'Dashboard', 'Domains', 'License', 'Keys & Wallets', 'Monitoring', 'Team', 'Settings'
  ];

  const handleNavClick = (item: string) => {
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
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

// Token Spinner Component
const TokenSpinner = ({ licenseData }: { licenseData: LicenseData }) => {
  const cx = 150;
  const cy = 150;
  const r = 120;
  const tokenText = Array(18).fill("TOKEN").join("   ");

  return (
    <div className="h-full w-full flex items-center justify-center p-2">
      <style>{`
        @keyframes tokenRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .token-rotate {
          transform-origin: ${cx}px ${cy}px;
          animation: tokenRotate 30s linear infinite;
        }
      `}</style>
      
      <svg viewBox="0 0 300 300" className="w-full h-full max-w-full max-h-full">
        <defs>
          <path id="tokenPath" d={`M ${cx},${cy} m -${r},0 a ${r},${r} 0 1,1 ${2*r},0 a ${r},${r} 0 1,1 -${2*r},0`} />
        </defs>

        <g className="token-rotate">
          <text fill="#FF7043" fontSize="16" fontWeight="600" letterSpacing="1px">
            <textPath href="#tokenPath" startOffset="0%">
              {tokenText}
            </textPath>
          </text>
        </g>

        <text x={cx} y={cy - 12} textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="600">
          TOKEN
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="#0f172a" fontSize="32" fontWeight="700">
          {licenseData.tokenId || "---"}
        </text>
      </svg>
    </div>
  );
};

// Detail Box Components
const DetailBox = ({ title, value, color = '#FF7043' }: { title: string; value: string; color?: string }) => (
  <div className="h-full w-full flex flex-col justify-center items-center">
    <div className="text-center">
      <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ 
        color: '#64748b', 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
      }}>
        {title}
      </div>
      <div className="text-2xl font-bold" style={{ 
        color: color,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {value}
      </div>
    </div>
  </div>
);

// Single Line Button Component
const SingleLineButton = ({ text, color = '#FF7043' }: { text: string; color?: string }) => (
  <div className="h-full w-full flex justify-center items-center">
    <div className="text-xl font-bold" style={{ 
      color: color,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {text}
    </div>
  </div>
);

export default function LicensePage() {
  const [licenseData, setLicenseData] = useState<LicenseData>(mockLicenseData);
  const [showPreview, setShowPreview] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleTermsChange = (field: keyof LicenseData['terms'], value: any) => {
    setLicenseData(prev => ({
      ...prev,
      terms: {
        ...prev.terms,
        [field]: value
      }
    }));
  };

  const handleMintLicense = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockTokenId = Math.floor(Math.random() * 10000);
      setLicenseData(prev => ({
        ...prev,
        tokenId: mockTokenId,
        owner: '0x742d35Cc6634C0532925a3b8D0B4e4e2Ff5EcE57',
        lastUpdated: new Date().toISOString()
      }));
      alert(`License minted successfully! Token ID: ${mockTokenId}`);
    } catch (error) {
      alert('Failed to mint license');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseToggle = () => {
    setLicenseData(prev => ({
      ...prev,
      paused: !prev.paused,
      lastUpdated: new Date().toISOString()
    }));
    alert(`License ${licenseData.paused ? 'unpaused' : 'paused'} successfully!`);
  };

  const handleScheduleChange = () => {
    if (!scheduleDate) {
      alert('Please select an effective date');
      return;
    }
    setLicenseData(prev => ({
      ...prev,
      pendingChanges: {
        effectiveFrom: scheduleDate,
        terms: { ...prev.terms }
      }
    }));
    alert(`Change scheduled for ${new Date(scheduleDate).toLocaleDateString()}`);
    setScheduleDate('');
  };

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
        
        {/* Main layout with navigation spanning full height */}
        <div style={{ display: 'flex', gap: '0px', height: '700px' }}>
          
          {/* Navigation spanning all rows */}
          <div style={{ width: '120px' }}>
            <GridBox title="Navigation">
              <Navigation activePage="License" />
            </GridBox>
          </div>
          
          {/* Content area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0px' }}>
            
            {/* Top row with token and details */}
            <div style={{ display: 'flex', gap: '0px', height: '200px' }}>
              {/* Token */}
              <div style={{ flex: 1 }}>
                <GridBox title="" borderStyle={{ borderLeft: 'none' }}>
                  <TokenSpinner licenseData={licenseData} />
                </GridBox>
              </div>
              
              {/* Network */}
              <div style={{ flex: 1 }}>
                <GridBox title="" borderStyle={{ borderLeft: 'none' }}>
                  <DetailBox title="NETWORK" value={licenseData.network} />
                </GridBox>
              </div>
              
              {/* Status */}
              <div style={{ flex: 1 }}>
                <GridBox title="" borderStyle={{ borderLeft: 'none' }}>
                  <DetailBox 
                    title="STATUS" 
                    value={licenseData.paused ? "PAUSED" : (licenseData.tokenId ? "ACTIVE" : "INACTIVE")} 
                  />
                </GridBox>
              </div>
              
              {/* Last Updated */}
              <div style={{ flex: 1 }}>
                <GridBox title="" borderStyle={{ borderLeft: 'none' }}>
                  <DetailBox 
                    title="LAST UPDATED" 
                    value={licenseData.lastUpdated ? new Date(licenseData.lastUpdated).toLocaleDateString() : "Never"} 
                  />
                </GridBox>
              </div>
              
              {/* Owner */}
              <div style={{ flex: 1 }}>
                <GridBox title="" borderStyle={{ borderLeft: 'none' }}>
                  <DetailBox 
                    title="OWNER" 
                    value={licenseData.owner ? `${licenseData.owner.slice(0, 6)}...${licenseData.owner.slice(-4)}` : "Not assigned"} 
                  />
                </GridBox>
              </div>
            </div>
            
            {/* Second row with forms and action buttons */}
            <div style={{ display: 'flex', gap: '0px', height: '400px' }}>
              {/* Terms Form */}
              <div style={{ flex: 2 }}>
                <GridBox title="Terms & Pricing" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
                  <div className="space-y-3 h-full overflow-y-auto">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Terms CID (IPFS)
                      </label>
                      <input
                        type="text"
                        placeholder="bafybeigdyrzt5sfp7udm7hu76uh7y26nf3..."
                        value={licenseData.terms.termsCID}
                        onChange={(e) => handleTermsChange('termsCID', e.target.value)}
                        className="w-full p-2 text-xs outline-none transition-all"
                        style={{
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: '#f0f0f0',
                          border: 'none'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Default Price (USDC)
                      </label>
                      <input
                        type="number"
                        min="0.000001"
                        max="1000"
                        step="0.000001"
                        value={licenseData.terms.defaultPriceUSDC}
                        onChange={(e) => handleTermsChange('defaultPriceUSDC', parseFloat(e.target.value))}
                        className="w-full p-2 text-xs outline-none transition-all"
                        style={{
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: '#f0f0f0',
                          border: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Policy URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/policy"
                        value={licenseData.terms.policyURL}
                        onChange={(e) => handleTermsChange('policyURL', e.target.value)}
                        className="w-full p-2 text-xs outline-none transition-all"
                        style={{
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: '#f0f0f0',
                          border: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Allowed Agents (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="agent1.com, agent2.com (leave blank for all)"
                        value={licenseData.terms.allowedAgents.join(', ')}
                        onChange={(e) => handleTermsChange('allowedAgents', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full p-2 text-xs outline-none transition-all"
                        style={{
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: '#f0f0f0',
                          border: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        Notes
                      </label>
                      <textarea
                        placeholder="Additional notes about this license..."
                        value={licenseData.terms.notes}
                        onChange={(e) => handleTermsChange('notes', e.target.value)}
                        rows={3}
                        className="w-full p-2 text-xs outline-none transition-all resize-none"
                        style={{
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: '#f0f0f0',
                          border: 'none'
                        }}
                      />
                    </div>
                  </div>
                </GridBox>
              </div>
              
              {/* Action Buttons Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0px' }}>
                
                {/* Preview Button */}
                <div 
                  style={{ flex: 1, cursor: 'pointer' }}
                  className="transition-opacity hover:opacity-90"
                  onClick={() => setShowPreview(true)}
                >
                  <GridBox title="" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
                    <SingleLineButton text="PREVIEW JSON" color="#FF7043" />
                  </GridBox>
                </div>
                
                {/* Mint Button */}
                <div 
                  style={{ 
                    flex: 1, 
                    cursor: isLoading ? 'not-allowed' : 'pointer' 
                  }}
                  className={`transition-opacity ${isLoading ? 'opacity-50' : 'hover:opacity-90'}`}
                  onClick={isLoading ? undefined : handleMintLicense}
                >
                  <GridBox title="" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
                    <SingleLineButton 
                      text={isLoading ? "MINTING LICENSE" : (licenseData.tokenId ? "REMINT LICENSE" : "MINT LICENSE")} 
                      color={isLoading ? "#ccc" : "#FF7043"} 
                    />
                  </GridBox>
                </div>
                
                {/* Pause Button */}
                {licenseData.tokenId && (
                  <div 
                    style={{ flex: 1, cursor: 'pointer' }}
                    className="transition-opacity hover:opacity-90"
                    onClick={handlePauseToggle}
                  >
                    <GridBox title="" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
                      <SingleLineButton 
                        text={licenseData.paused ? "RESUME LICENSE" : "PAUSE LICENSE"} 
                        color="#FF7043" 
                      />
                    </GridBox>
                  </div>
                )}
              </div>
            </div>
            
            {/* Third row - Schedule Change */}
            <div style={{ display: 'flex', gap: '0px', height: '100px' }}>
              <div style={{ flex: 1 }}>
                <GridBox title="Schedule Change" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div 
                        className="text-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
                        style={{ 
                          color: '#FF7043',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'datetime-local';
                          input.value = scheduleDate;
                          input.style.position = 'absolute';
                          input.style.left = '-9999px';
                          input.style.opacity = '0';
                          input.style.pointerEvents = 'none';
                          document.body.appendChild(input);
                          
                          const changeHandler = (e: Event) => {
                            const newValue = (e.target as HTMLInputElement).value;
                            if (newValue) {
                              setScheduleDate(newValue);
                            }
                            document.body.removeChild(input);
                          };
                          
                          input.addEventListener('change', changeHandler);
                          input.addEventListener('blur', () => {
                            if (document.body.contains(input)) {
                              document.body.removeChild(input);
                            }
                          });
                          
                          setTimeout(() => {
                            if (input.showPicker) {
                              input.showPicker();
                            } else {
                              input.click();
                            }
                          }, 0);
                        }}
                      >
                        EFFECTIVE FROM: {new Date(scheduleDate).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={handleScheduleChange}
                      className="px-4 py-2 text-sm transition-opacity"
                      style={{
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        backgroundColor: '#FF7043',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      Schedule Change
                    </button>
                  </div>
                </GridBox>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">License JSON Preview</h2>
              <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
            </div>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({
                version: "1.0",
                tokenId: licenseData.tokenId,
                network: licenseData.network,
                owner: licenseData.owner,
                terms: licenseData.terms,
                status: { paused: licenseData.paused, lastUpdated: licenseData.lastUpdated }
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}