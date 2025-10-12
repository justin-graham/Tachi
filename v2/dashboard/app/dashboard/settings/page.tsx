'use client';

import {useState} from 'react';

export default function SettingsPage() {
  const [price, setPrice] = useState('0.01');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Mock save - replace with actual API call
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
                0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
              </div>
              <p className="text-xs opacity-60 mt-1">Your wallet address for receiving payments</p>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wide font-bold mb-2 text-sage">
                Domain
              </label>
              <div className="neo-input bg-paper font-mono text-sm">
                example.com
              </div>
              <p className="text-xs opacity-60 mt-1">Your registered domain</p>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wide font-bold mb-2 text-sage">
                License NFT ID
              </label>
              <div className="neo-input bg-paper font-mono text-sm">
                #1234
              </div>
              <p className="text-xs opacity-60 mt-1">Your Crawl License NFT token ID</p>
            </div>
          </div>
        </div>

        {/* Gateway Configuration */}
        <div className="neo-card lg:col-span-2">
          <h3 className="text-2xl font-bold mb-6">Gateway Integration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm uppercase tracking-wide font-bold mb-2">
                Gateway URL
              </label>
              <div className="neo-input bg-paper font-mono text-sm break-all">
                https://gateway.tachi.workers.dev
              </div>
              <p className="text-xs opacity-60 mt-1">Your Cloudflare Worker endpoint</p>
            </div>

            <div>
              <label className="block text-sm uppercase tracking-wide font-bold mb-2">
                API Key
              </label>
              <div className="neo-input bg-paper font-mono text-sm">
                sk_live_••••••••••••1234
              </div>
              <button className="text-xs text-coral font-bold mt-1 hover:underline">
                Regenerate Key →
              </button>
            </div>
          </div>

          <div className="lab-divider"></div>

          <div>
            <h4 className="text-lg font-bold mb-3">Sample Code</h4>
            <div className="neo-card bg-black text-white font-mono text-sm overflow-x-auto">
              <pre>{`// Example protected content route
app.get('/api/data', async (req, res) => {
  const gateway = 'https://gateway.tachi.workers.dev';
  const auth = req.headers.authorization;

  const response = await fetch(gateway + '/dataset', {
    headers: { Authorization: auth }
  });

  if (response.status === 402) {
    return res.status(402).json(await response.json());
  }

  const data = await response.json();
  res.json(data);
});`}</pre>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="neo-card border-coral lg:col-span-2">
          <h3 className="text-2xl font-bold mb-4 text-coral">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold mb-1">Deactivate License</div>
              <p className="text-sm opacity-60">
                Temporarily disable your publisher license. You can reactivate it anytime.
              </p>
            </div>
            <button className="neo-button bg-white text-coral border-coral">
              Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
