'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useHydrationSafeAddress} from '../../hooks/useHydrationSafeAddress';

export default function SettingsPage() {
  const {address, isConnected, isHydrated} = useHydrationSafeAddress();
  const router = useRouter();
  const [price, setPrice] = useState('0.01');
  const [saved, setSaved] = useState(false);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string>('');

  useEffect(() => {
    if (!isHydrated) return;
    if (!isConnected) {
      router.push('/');
      return;
    }
    checkLicense();
  }, [address, isConnected, isHydrated]);

  const checkLicense = async () => {
    try {
      const res = await fetch(`/api/check-license?address=${address}`);
      const data = await res.json();
      if (data.hasLicense) {
        setTokenId(data.tokenId);
        setDomain(data.domain || 'example.com');
        setPrice(data.price || '0.01');
      } else {
        router.push('/onboard');
      }
    } catch (err) {
      console.error('Failed to check license:', err);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/update-price', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({address, price})
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to update price: ${error.error}`);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(`Error updating price: ${err.message}`);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Settings</h2>
        <p className="text-lg opacity-70">Configure your publisher account</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pricing Settings */}
        <div className="neo-card blueprint-corner">
          <h3 className="text-2xl font-bold mb-6">Pricing Configuration</h3>

          <div className="mb-6">
            <label className="block text-sm uppercase tracking-wide font-bold mb-2">
              Price Per Request
            </label>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">$</span>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="neo-input flex-1"
              />
              <span className="text-sm opacity-60">USDC</span>
            </div>
            <p className="text-xs opacity-60 mt-2">
              Minimum: $0.001 • Recommended: $0.01 - $0.10
            </p>
          </div>

          <div className="mb-6">
            <div className="neo-card bg-paper">
              <div className="text-sm font-bold mb-2">PRICE PREVIEW</div>
              <div className="space-y-1 text-sm font-mono">
                <div>1 request = ${price}</div>
                <div>100 requests = ${(parseFloat(price) * 100).toFixed(2)}</div>
                <div>1000 requests = ${(parseFloat(price) * 1000).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className={`neo-button w-full ${saved ? 'bg-sage text-white' : ''}`}
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Account Info */}
        <div className="neo-card">
          <h3 className="text-2xl font-bold mb-6">Account Information</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm uppercase tracking-wide font-bold mb-2 text-sage">
                Publisher Address
              </label>
              <div className="neo-input bg-paper font-mono text-sm break-all">
                {isHydrated ? (address || 'Not connected') : 'Loading...'}
              </div>
              <p className="text-xs opacity-60 mt-1">Your wallet address for receiving payments</p>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wide font-bold mb-2 text-sage">
                License NFT ID
              </label>
              <div className="neo-input bg-paper font-mono text-sm">
                #{tokenId || 'Loading...'}
              </div>
              <p className="text-xs opacity-60 mt-1">Your Crawl License NFT token ID</p>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wide font-bold mb-2 text-sage">
                Domain
              </label>
              <div className="neo-input bg-paper font-mono text-sm">
                {domain || 'Not set'}
              </div>
              <p className="text-xs opacity-60 mt-1">Your registered domain</p>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wide font-bold mb-2 text-sage">
                Network
              </label>
              <div className="neo-input bg-paper font-mono text-sm">
                Base Mainnet
              </div>
              <p className="text-xs opacity-60 mt-1">Your gateway is deployed on Base L2</p>
            </div>
          </div>
        </div>

        {/* Integration Link */}
        <div className="neo-card lg:col-span-2 bg-sage text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need Integration Help?</h3>
              <p className="text-sm opacity-90">
                Visit the Integration page for domain verification, code examples, and testing tools.
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/integration')}
              className="neo-button bg-white text-black whitespace-nowrap"
            >
              Go to Integration →
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="neo-card border-coral lg:col-span-2">
          <h3 className="text-2xl font-bold mb-4 text-coral">Danger Zone</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold mb-1">Deactivate License</div>
              <p className="text-sm opacity-60">
                Temporarily disable your publisher license. You can reactivate it anytime.
              </p>
            </div>
            <button className="neo-button bg-white text-coral border-coral whitespace-nowrap">
              Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
