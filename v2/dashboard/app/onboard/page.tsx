'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useHydrationSafeAddress} from '../hooks/useHydrationSafeAddress';

export default function OnboardPage() {
  const {address, isConnected, isHydrated} = useHydrationSafeAddress();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasLicense, setHasLicense] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    domain: '',
    price: '0.01'
  });

  // Check if user already has a license
  useEffect(() => {
    if (address) {
      checkLicense();
    }
  }, [address]);

  const checkLicense = async () => {
    try {
      const res = await fetch(`/api/check-license?address=${address}`);
      const data = await res.json();
      setHasLicense(data.hasLicense);
      if (data.hasLicense) {
        // Redirect to dashboard if already has license
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Failed to check license:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/mint-license', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          publisher: address,
          domain: formData.domain,
          price: formData.price
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to mint license');
      }

      // Success! Redirect to setup complete page
      router.push('/setup-complete');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold mb-6">Get Started with Tachi</h1>
        <div className="neo-card bg-paper">
          <p className="text-lg mb-4">Connect your wallet in the top right corner</p>
        </div>
      </div>
    );
  }

  if (hasLicense === null) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="neo-card">
          <p className="text-lg">Checking your license status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">Protect Your Content</h1>
        <p className="text-lg md:text-xl opacity-70">
          Get your license and start earning from AI crawlers in minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="neo-card blueprint-corner">
        <h2 className="text-2xl font-bold mb-6">Publisher Registration</h2>

        {/* Wallet Address */}
        <div className="mb-6">
          <label className="block text-sm uppercase tracking-wide font-bold mb-2 text-sage">
            Your Wallet Address
          </label>
          <div className="neo-input bg-paper font-mono text-sm break-all">
            {isHydrated ? address : 'Loading...'}
          </div>
          <p className="text-xs opacity-60 mt-1">This address will receive all payments</p>
        </div>

        {/* Domain */}
        <div className="mb-6">
          <label className="block text-sm uppercase tracking-wide font-bold mb-2">
            Domain <span className="text-coral">*</span>
          </label>
          <input
            type="text"
            placeholder="example.com"
            value={formData.domain}
            onChange={(e) => setFormData({...formData, domain: e.target.value})}
            className="neo-input w-full"
            required
          />
          <p className="text-xs opacity-60 mt-1">
            The domain where you'll serve protected content
          </p>
        </div>

        {/* Price */}
        <div className="mb-8">
          <label className="block text-sm uppercase tracking-wide font-bold mb-2">
            Price Per Request (USDC)
          </label>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">$</span>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="neo-input flex-1"
              required
            />
          </div>
          <p className="text-xs opacity-60 mt-1">
            Recommended: $0.01 - $0.10 per request
          </p>
        </div>

        {/* Preview */}
        <div className="neo-card bg-paper mb-6">
          <div className="text-sm font-bold mb-3">PRICING PREVIEW</div>
          <div className="space-y-1 text-sm font-mono">
            <div>1 request = ${formData.price}</div>
            <div>100 requests = ${(parseFloat(formData.price || '0') * 100).toFixed(2)}</div>
            <div>1,000 requests = ${(parseFloat(formData.price || '0') * 1000).toFixed(2)}</div>
          </div>
        </div>

        {error && (
          <div className="neo-card bg-coral text-white mb-6">
            <p className="font-bold">Error: {error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`neo-button w-full text-lg ${loading ? 'bg-gray-300 cursor-not-allowed' : 'neo-button-sage'}`}
        >
          {loading ? 'Minting License NFT...' : 'Create Publisher License →'}
        </button>

        <p className="text-xs opacity-60 mt-4 text-center">
          This will mint a Crawl License NFT to your wallet on Base Mainnet
        </p>
      </form>

      {/* What Happens Next */}
      <div className="mt-12 neo-card">
        <h3 className="text-xl font-bold mb-4">What happens next?</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="text-coral font-bold">1.</span>
            <span>We'll mint a Crawl License NFT to your wallet (free, we cover gas fees).</span>
          </div>
          <div className="flex gap-3">
            <span className="text-coral font-bold">2.</span>
            <span>You'll get access to your content dashboard with real-time stats.</span>
          </div>
          <div className="flex gap-3">
            <span className="text-coral font-bold">3.</span>
            <span>Our gateway will protect your content so you can start earning.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
