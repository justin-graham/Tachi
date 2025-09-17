import React from 'react';
import { useRouter } from 'next/router';

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

export default function TeamPage() {
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
        
      </div>
      <div className="h-screen grid grid-cols-7 grid-rows-4 gap-0">
        {/* Navigation */}
        <div style={{ gridArea: '1 / 1 / 5 / 2' }}>
          <GridBox title="Navigation" className="h-full">
            <Navigation activePage="Team" />
          </GridBox>
        </div>

        {/* Main Content */}
        <div style={{ gridArea: '1 / 2 / 5 / 8' }}>
          <GridBox title="Team Management" className="h-full" borderStyle={{ borderLeft: 'none' }}>
            <div className="h-full flex flex-col justify-center items-center">
              <div style={{ 
                fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#FF7043',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '16px'
              }}>
                Team Management
              </div>
              <div style={{ 
                fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#666',
                fontSize: '16px',
                textAlign: 'center'
              }}>
                Team management features coming soon.
              </div>
            </div>
          </GridBox>
        </div>
      </div>
    </div>
  );
}