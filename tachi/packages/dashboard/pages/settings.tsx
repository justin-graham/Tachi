import React, { useState } from 'react';
import { useRouter } from 'next/router';
import StandardButton from '../components/StandardButton';

// Mock data
const mockUserData = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: '/images/avatar.jpg',
  orgName: 'Acme Corp',
  defaultNetwork: 'Base Mainnet',
  timezone: 'UTC-8 (PST)',
  twoFactorEnabled: false,
  sessions: [
    { id: '1', device: 'MacBook Pro - Chrome', location: 'San Francisco, CA', lastActive: '2025-09-07T10:30:00Z', current: true },
    { id: '2', device: 'iPhone - Safari', location: 'San Francisco, CA', lastActive: '2025-09-06T18:45:00Z', current: false },
    { id: '3', device: 'iPad - Safari', location: 'Los Angeles, CA', lastActive: '2025-09-05T14:20:00Z', current: false }
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

// Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
  const [confirmText, setConfirmText] = useState('');
  const requiredText = 'DELETE MY ACCOUNT';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-red-600 mb-2" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            Delete Account
          </h2>
          <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
            <p className="text-sm text-red-800" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              ⚠️ <strong>This action is irreversible!</strong> All your data, domains, and organization settings will be permanently deleted and cannot be recovered.
            </p>
          </div>
          <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            To confirm, type <strong>{requiredText}</strong> in the box below:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={requiredText}
            className="w-full p-2 border border-gray-300 rounded text-sm"
            style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          />
        </div>
        <div className="flex space-x-2">
          <StandardButton
            onClick={onClose}
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
          >
            Cancel
          </StandardButton>
          <StandardButton
            onClick={onConfirm}
            disabled={confirmText !== requiredText}
            variant="danger"
            size="sm"
            style={{ 
              flex: 1,
              backgroundColor: confirmText === requiredText ? undefined : '#ccc',
              cursor: confirmText === requiredText ? 'pointer' : 'not-allowed'
            }}
          >
            Delete Account
          </StandardButton>
        </div>
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const [userData, setUserData] = useState(mockUserData);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [show2FADetails, setShow2FADetails] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    showToast(`${field} updated successfully!`);
  };

  const handleEmailChange = () => {
    if (newEmail && newEmail !== userData.email) {
      showToast('Verification email sent to ' + newEmail, 'info');
      setEditingEmail(false);
      setNewEmail('');
    }
  };

  const handleRevokeSession = (sessionId) => {
    setUserData(prev => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId)
    }));
    showToast('Session revoked successfully!');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    showToast('Account deletion initiated. Check your email for final confirmation.', 'info');
  };

  const handleMagicLink = () => {
    showToast('Magic link sent to ' + userData.email, 'success');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        
        {/* Grid layout for settings page */}
        <div className="grid" style={{
          gridTemplateColumns: '120px 1fr 1fr',
          gridTemplateRows: '120px 120px 120px 120px 120px',
          gridTemplateAreas: `
            "sidebar name twofa"
            "sidebar email twofa"
            "sidebar organization sessions"
            "sidebar network sessions"
            "sidebar delete sessions"
          `,
          gap: '0px'
        }}>
          
          {/* Sidebar Navigation */}
          <div style={{ gridArea: 'sidebar' }}>
            <GridBox title="Navigation" className="h-full">
              <Navigation activePage="Settings" />
            </GridBox>
          </div>

          {/* Name Row */}
          <div style={{ gridArea: 'name' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none' }}>
              <div className="h-full flex justify-center items-center">
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => handleSave('name', e.target.value)}
                  className="text-xl font-bold bg-transparent border-none outline-none text-center w-full"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: '#FF7043'
                  }}
                />
              </div>
            </GridBox>
          </div>

          {/* Email Row */}
          <div style={{ gridArea: 'email' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex justify-center items-center">
                {!editingEmail ? (
                  <div 
                    className="text-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
                    style={{ 
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                      color: '#FF7043'
                    }}
                    onClick={() => setEditingEmail(true)}
                  >
                    {userData.email}
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email"
                      className="w-full p-2 text-sm border border-gray-300 text-center"
                      style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    />
                    <div className="flex space-x-2 justify-center">
                      <button
                        onClick={handleEmailChange}
                        className="px-3 py-1 text-xs text-white"
                        style={{
                          fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: '#FF7043',
                          border: 'none'
                        }}
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => { setEditingEmail(false); setNewEmail(''); }}
                        className="px-3 py-1 text-xs border border-gray-300"
                        style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </GridBox>
          </div>

          {/* Organization Row */}
          <div style={{ gridArea: 'organization' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex justify-center items-center">
                <div 
                  className="text-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: '#FF7043'
                  }}
                  onClick={() => {
                    const newOrg = prompt('Enter organization name:', userData.orgName);
                    if (newOrg && newOrg !== userData.orgName) {
                      handleSave('orgName', newOrg);
                    }
                  }}
                >
                  {userData.orgName}
                </div>
              </div>
            </GridBox>
          </div>

          {/* Default Network Row */}
          <div style={{ gridArea: 'network' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex justify-center items-center">
                <select
                  value={userData.defaultNetwork}
                  onChange={(e) => handleSave('defaultNetwork', e.target.value)}
                  className="text-xl font-bold bg-transparent border-none outline-none text-center"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: '#FF7043',
                    backgroundColor: '#FAF9F6'
                  }}
                >
                  <option value="Base Mainnet">Base Mainnet</option>
                  <option value="Base Sepolia">Base Sepolia</option>
                  <option value="Ethereum Mainnet">Ethereum Mainnet</option>
                  <option value="Ethereum Sepolia">Ethereum Sepolia</option>
                </select>
              </div>
            </GridBox>
          </div>

          {/* Delete Account Row */}
          <div style={{ gridArea: 'delete' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex justify-center items-center">
                <div 
                  className="text-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
                  style={{ 
                    fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: '#dc2626'
                  }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  DELETE ACCOUNT
                </div>
              </div>
            </GridBox>
          </div>


          {/* Two-Factor Authentication Row */}
          <div style={{ gridArea: 'twofa' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none' }}>
              <div className="h-full flex justify-center items-center">
                {!show2FADetails ? (
                  <div 
                    className="text-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
                    style={{ 
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                      color: '#FF7043'
                    }}
                    onClick={() => setShow2FADetails(true)}
                  >
                    TWO-FACTOR IDENTIFICATION
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="text-sm font-medium" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                      Two-Factor Authentication
                    </div>
                    <div className="text-xs text-gray-500 mb-3" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                      Add extra security to your account
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => {
                          setUserData(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
                          showToast(`2FA ${userData.twoFactorEnabled ? 'disabled' : 'enabled'}!`);
                        }}
                        className="px-4 py-2 text-sm rounded transition-colors"
                        style={{
                          fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          backgroundColor: userData.twoFactorEnabled ? '#16a34a' : '#6b7280',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        {userData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => setShow2FADetails(false)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded"
                        style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </GridBox>
          </div>

          {/* Active Sessions Row */}
          <div style={{ gridArea: 'sessions' }}>
            <GridBox title="Active Sessions" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 p-2">
                  {userData.sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 p-3 rounded">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }}>
                              {session.device}
                            </span>
                            {session.current && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            {session.location}
                          </div>
                          <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            Last active: {formatTime(session.lastActive)}
                          </div>
                        </div>
                        {!session.current && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded"
                            style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GridBox>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />
      </div>
    </div>
  );
}