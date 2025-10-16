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
    if (!isConnected) {
      router.push('/');
      return;
    }
    checkLicense();
  }, [address, isConnected]);

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
                Network
              </label>
              <div className="neo-input bg-paper font-mono text-sm">
                Base Mainnet
              </div>
              <p className="text-xs opacity-60 mt-1">Your gateway is deployed on Base L2</p>
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
            <h4 className="text-lg font-bold mb-3">Publisher Integration</h4>
            <p className="text-sm opacity-60 mb-4">Add this code to protect your content routes</p>
            <div className="neo-card">
              <div className="flex items-center gap-2 mb-4">
                <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F56'}}></div>
                <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FFBD2E'}}></div>
                <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27C93F'}}></div>
              </div>
              <pre style={{margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6, color: '#1A1A1A', whiteSpace: 'pre-wrap'}}>
                <code dangerouslySetInnerHTML={{__html: `<span style="color: #6A9955">// Protect your content with Tachi Gateway</span>
<span style="color: #FF7043">const</span> GATEWAY = <span style="color: #52796F">'https://gateway.tachi.workers.dev'</span>;
<span style="color: #FF7043">const</span> PUBLISHER = <span style="color: #52796F">'${address || '0x...'}'</span>;
<span style="color: #FF7043">const</span> TOKEN_ID = <span style="color: #52796F">'${tokenId || '1'}'</span>;

app.get(<span style="color: #52796F">'/api/protected'</span>, <span style="color: #FF7043">async</span> (req, res) => {
  <span style="color: #6A9955">// Verify payment via gateway</span>
  <span style="color: #FF7043">const</span> verified = <span style="color: #FF7043">await</span> fetch(\`\${GATEWAY}/verify\`, {
    method: <span style="color: #52796F">'POST'</span>,
    headers: { <span style="color: #52796F">'Content-Type'</span>: <span style="color: #52796F">'application/json'</span> },
    body: JSON.stringify({
      publisher: PUBLISHER,
      tokenId: TOKEN_ID,
      authorization: req.headers.authorization
    })
  });

  <span style="color: #FF7043">if</span> (!verified.ok) {
    <span style="color: #FF7043">return</span> res.status(<span style="color: #B5CEA8">402</span>).json({
      error: <span style="color: #52796F">'Payment Required'</span>,
      price: <span style="color: #52796F">'${price || '0.01'}'</span>,
      currency: <span style="color: #52796F">'USDC'</span>
    });
  }

  <span style="color: #6A9955">// Payment verified, return content</span>
  res.json({ data: <span style="color: #52796F">'Your protected content'</span> });
});`}}></code>
              </pre>
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
