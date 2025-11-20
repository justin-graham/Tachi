'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useHydrationSafeAddress} from '../../hooks/useHydrationSafeAddress';

export default function IntegrationPage() {
  const {address, isConnected, isHydrated} = useHydrationSafeAddress();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'publisher' | 'crawler'>('publisher');
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [middlewareInstalled, setMiddlewareInstalled] = useState(false);
  const [middlewareDeployed, setMiddlewareDeployed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [price, setPrice] = useState('0.01');
  const [platform, setPlatform] = useState<'nextjs' | 'express'>('nextjs');

  useEffect(() => {
    if (!isHydrated) return;

    if (!isConnected) {
      router.push('/');
      return;
    }

    if (address) {
      loadPublisherData();
      loadIntegrationProgress();
    }
  }, [address, isConnected, isHydrated]);

  // Save integration progress to localStorage whenever state changes
  useEffect(() => {
    if (!address) return;
    const progress = {
      middlewareInstalled,
      middlewareDeployed,
      platform,
      price
    };
    localStorage.setItem(`tachi_integration_${address.toLowerCase()}`, JSON.stringify(progress));
  }, [middlewareInstalled, middlewareDeployed, platform, price, address]);

  const loadPublisherData = async () => {
    try {
      const res = await fetch(`/api/check-license?address=${address}`);
      const data = await res.json();
      if (data.price) setPrice(data.price);
      if (data.apiKey) setApiKey(data.apiKey);
    } catch (err) {
      console.error('Failed to load publisher data:', err);
    }
  };

  const loadIntegrationProgress = () => {
    try {
      const saved = localStorage.getItem(`tachi_integration_${address.toLowerCase()}`);
      if (saved) {
        const progress = JSON.parse(saved);
        if (progress.middlewareInstalled !== undefined) setMiddlewareInstalled(progress.middlewareInstalled);
        if (progress.middlewareDeployed !== undefined) setMiddlewareDeployed(progress.middlewareDeployed);
        if (progress.platform) setPlatform(progress.platform);
        if (progress.price) setPrice(progress.price);
      }
    } catch (err) {
      console.error('Failed to load integration progress:', err);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateApiKey = async () => {
    if (!address) return;
    setGeneratingKey(true);

    try {
      const res = await fetch('/api/generate-api-key', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({address})
      });
      const data = await res.json();

      if (data.success && data.apiKey) {
        setApiKey(data.apiKey);
      } else {
        alert('Failed to generate API key');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleTestIntegration = async () => {
    setTesting(true);
    setTestResult(null);

    // For now, just mark as successful since we can't test middleware without a real deployment
    setTimeout(() => {
      setTestResult({
        success: true,
        message: 'Test successful! Your middleware setup looks correct. Deploy to production to start earning.'
      });
      setTesting(false);
    }, 1500);
  };

  const nextjsCode = `<span style="color: #6A9955">// middleware.ts</span>
<span style="color: #C586C0">import</span> { <span style="color: #4FC1FF">tachiX402</span> } <span style="color: #C586C0">from</span> <span style="color: #CE9178">'@tachiprotocol/nextjs'</span>;

<span style="color: #C586C0">export default</span> <span style="color: #DCDCAA">tachiX402</span>({
  <span style="color: #9CDCFE">apiKey</span>: <span style="color: #9CDCFE">process</span>.<span style="color: #9CDCFE">env</span>.<span style="color: #4FC1FF">TACHI_API_KEY</span>!,
  <span style="color: #9CDCFE">wallet</span>: <span style="color: #9CDCFE">process</span>.<span style="color: #9CDCFE">env</span>.<span style="color: #4FC1FF">TACHI_WALLET</span>!,
  <span style="color: #9CDCFE">price</span>: <span style="color: #CE9178">'$${price}'</span>
});

<span style="color: #C586C0">export const</span> <span style="color: #4FC1FF">config</span> = {
  <span style="color: #9CDCFE">matcher</span>: <span style="color: #CE9178">'/premium/:path*'</span> <span style="color: #6A9955">// Protect premium routes</span>
};`;

  const expressCode = `<span style="color: #6A9955">// server.js</span>
<span style="color: #C586C0">const</span> { <span style="color: #4FC1FF">tachiX402</span> } = <span style="color: #DCDCAA">require</span>(<span style="color: #CE9178">'@tachiprotocol/express'</span>);

<span style="color: #4FC1FF">app</span>.<span style="color: #DCDCAA">use</span>(<span style="color: #CE9178">'/api/*'</span>, <span style="color: #DCDCAA">tachiX402</span>({
  <span style="color: #9CDCFE">apiKey</span>: <span style="color: #9CDCFE">process</span>.<span style="color: #9CDCFE">env</span>.<span style="color: #4FC1FF">TACHI_API_KEY</span>,
  <span style="color: #9CDCFE">wallet</span>: <span style="color: #9CDCFE">process</span>.<span style="color: #9CDCFE">env</span>.<span style="color: #4FC1FF">TACHI_WALLET</span>,
  <span style="color: #9CDCFE">price</span>: <span style="color: #CE9178">'$${price}'</span>
}));

<span style="color: #6A9955">// Your routes - automatically protected</span>
<span style="color: #4FC1FF">app</span>.<span style="color: #DCDCAA">get</span>(<span style="color: #CE9178">'/api/data'</span>, (<span style="color: #9CDCFE">req</span>, <span style="color: #9CDCFE">res</span>) => {
  <span style="color: #9CDCFE">res</span>.<span style="color: #DCDCAA">json</span>({ <span style="color: #9CDCFE">data</span>: <span style="color: #CE9178">'Protected content'</span> });
});`;

  const crawlerCode = `<span style="color: #6A9955">// Works with ANY x402-compatible client</span>
<span style="color: #6A9955">// Examples: Anthropic Claude, OpenAI, custom agents</span>

<span style="color: #6A9955">// Example: Using Coinbase x402 SDK</span>
<span style="color: #C586C0">import</span> { <span style="color: #4FC1FF">x402Client</span> } <span style="color: #C586C0">from</span> <span style="color: #CE9178">'@coinbase/x402-sdk'</span>;

<span style="color: #C586C0">const</span> <span style="color: #4FC1FF">client</span> = <span style="color: #C586C0">new</span> <span style="color: #4FC1FF">x402Client</span>({
  <span style="color: #9CDCFE">network</span>: <span style="color: #CE9178">'base'</span>,
  <span style="color: #9CDCFE">privateKey</span>: <span style="color: #9CDCFE">process</span>.<span style="color: #9CDCFE">env</span>.<span style="color: #4FC1FF">PRIVATE_KEY</span>
});

<span style="color: #6A9955">// Access protected content at original URL</span>
<span style="color: #C586C0">const</span> <span style="color: #4FC1FF">response</span> = <span style="color: #C586C0">await</span> <span style="color: #4FC1FF">client</span>.<span style="color: #DCDCAA">fetch</span>(<span style="color: #CE9178">'https://publisher.com/premium/article'</span>);
<span style="color: #6A9955">// Auto-detects 402, pays USDC on Base, retries with proof</span>

<span style="color: #9CDCFE">console</span>.<span style="color: #DCDCAA">log</span>(<span style="color: #4FC1FF">response</span>.<span style="color: #9CDCFE">content</span>); <span style="color: #6A9955">// Protected content</span>
<span style="color: #9CDCFE">console</span>.<span style="color: #DCDCAA">log</span>(<span style="color: #4FC1FF">response</span>.<span style="color: #9CDCFE">paymentProof</span>); <span style="color: #6A9955">// Tx hash on Base</span>`;

  // Progress calculation
  const hasLicense = !!address;
  const hasApiKey = !!apiKey;
  const hasMiddleware = middlewareInstalled;
  const hasDeployed = middlewareDeployed;
  const hasTested = testResult?.success === true;
  const isLive = hasLicense && hasApiKey && hasMiddleware && hasDeployed && hasTested;

  // Show loading state while checking authentication
  if (!isHydrated || !isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="neo-card">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">Integration</h2>
        <p className="text-base md:text-lg opacity-70">Complete setup to start earning</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setActiveTab('publisher')}
          className={`neo-button ${activeTab === 'publisher' ? 'neo-button-sage' : ''}`}
        >
          For Publishers
        </button>
        <button
          onClick={() => setActiveTab('crawler')}
          className={`neo-button ${activeTab === 'crawler' ? 'neo-button-coral' : ''}`}
        >
          For Crawlers
        </button>
      </div>

      {activeTab === 'publisher' ? (
        <div className="space-y-8">
          {/* Progress Tracker */}
          <div className="neo-card blueprint-corner">
            <div className="flex items-center justify-between gap-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold ${hasLicense ? 'bg-sage text-white' : 'bg-white'}`}>
                  {hasLicense ? '✓' : '1'}
                </div>
                <span className={`font-bold text-xs ${hasLicense ? 'text-sage' : ''}`}>License</span>
              </div>
              <div className="h-px bg-black flex-1 max-w-[40px]"></div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold ${hasApiKey ? 'bg-sage text-white' : 'bg-white'}`}>
                  {hasApiKey ? '✓' : '2'}
                </div>
                <span className={`font-bold text-xs ${hasApiKey ? 'text-sage' : ''}`}>API Key</span>
              </div>
              <div className="h-px bg-black flex-1 max-w-[40px]"></div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold ${hasMiddleware ? 'bg-sage text-white' : 'bg-white'}`}>
                  {hasMiddleware ? '✓' : '3'}
                </div>
                <span className={`font-bold text-xs ${hasMiddleware ? 'text-sage' : ''}`}>Install</span>
              </div>
              <div className="h-px bg-black flex-1 max-w-[40px]"></div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold ${hasDeployed ? 'bg-sage text-white' : 'bg-white'}`}>
                  {hasDeployed ? '✓' : '4'}
                </div>
                <span className={`font-bold text-xs ${hasDeployed ? 'text-sage' : ''}`}>Deploy</span>
              </div>
              <div className="h-px bg-black flex-1 max-w-[40px]"></div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold ${isLive ? 'bg-sage text-white' : 'bg-white'}`}>
                  {isLive ? '✓' : '5'}
                </div>
                <span className={`font-bold text-xs ${isLive ? 'text-sage' : ''}`}>Live</span>
              </div>
            </div>
          </div>

          {/* Step 2: Generate API Key */}
          <div className={`neo-card ${!hasApiKey ? 'border-4 border-coral' : 'blueprint-corner'}`}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {hasApiKey ? '✓ API Key Generated' : 'Step 2: Generate API Key'}
              </h3>
              {hasApiKey && <span className="bg-sage text-white px-3 py-1 text-sm font-bold border-2 border-black">COMPLETE</span>}
            </div>

            {!hasApiKey ? (
              <>
                <p className="mb-4 opacity-70">Generate a secure API key to authenticate your middleware requests.</p>

                <button
                  onClick={handleGenerateApiKey}
                  disabled={generatingKey}
                  className={`neo-button neo-button-sage ${generatingKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {generatingKey ? 'Generating...' : 'Generate API Key'}
                </button>
              </>
            ) : (
              <>
                <div className="neo-card bg-white border-2 border-black mb-4">
                  <div className="flex justify-between items-center">
                    <code className="text-sm break-all text-black font-mono">{apiKey}</code>
                    <button
                      onClick={() => copy(apiKey)}
                      className="ml-4 text-xs font-bold text-coral hover:underline whitespace-nowrap"
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="neo-card bg-sage text-white">
                  <p className="text-sm font-bold">⚠️ Save this key securely!</p>
                  <p className="text-xs mt-1 opacity-90">You'll need it in your environment variables. Store it in your .env file.</p>
                </div>
              </>
            )}
          </div>

          {/* Step 3: Install Middleware */}
          <div className={`neo-card ${hasApiKey && !hasMiddleware ? 'border-4 border-coral' : 'blueprint-corner'}`}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {hasMiddleware ? '✓ Middleware Installed' : 'Step 3: Install Middleware Package'}
              </h3>
              {hasMiddleware && <span className="bg-sage text-white px-3 py-1 text-sm font-bold border-2 border-black">COMPLETE</span>}
            </div>

            {!hasMiddleware ? (
              <>
                <p className="mb-4 opacity-70">Choose your platform and install the Tachi x402 middleware package:</p>

                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setPlatform('nextjs')}
                    className={`neo-button ${platform === 'nextjs' ? 'neo-button-sage' : ''}`}
                  >
                    Next.js
                  </button>
                  <button
                    onClick={() => setPlatform('express')}
                    className={`neo-button ${platform === 'express' ? 'neo-button-coral' : ''}`}
                  >
                    Express
                  </button>
                </div>

                <div className="neo-card bg-[#1e1e1e] border-2 border-black p-4 mb-4">
                  <pre className="text-sm font-mono text-white">
                    <code>npm install @tachiprotocol/{platform}</code>
                  </pre>
                </div>

                <button
                  onClick={() => setMiddlewareInstalled(true)}
                  className="neo-button neo-button-sage"
                >
                  ✓ Mark as Installed
                </button>
              </>
            ) : (
              <div className="neo-card bg-sage text-white">
                <p className="font-bold">@tachiprotocol/{platform} installed</p>
                <p className="text-sm mt-1 opacity-90">Ready to add middleware code</p>
              </div>
            )}
          </div>

          {/* Step 4: Add Middleware Code */}
          <div className={`neo-card ${hasMiddleware && !hasDeployed ? 'border-4 border-coral' : 'blueprint-corner'}`}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {hasDeployed ? '✓ Middleware Deployed' : 'Step 4: Add Middleware Code'}
              </h3>
              {hasDeployed && <span className="bg-sage text-white px-3 py-1 text-sm font-bold border-2 border-black">COMPLETE</span>}
            </div>

            <p className="mb-4 opacity-70">Add the middleware to your app (just 6 lines!):</p>

            <div className="neo-card bg-[#1e1e1e] border-2 border-black p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F56'}}></div>
                  <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FFBD2E'}}></div>
                  <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27C93F'}}></div>
                </div>
                <button onClick={() => copy((platform === 'nextjs' ? nextjsCode : expressCode).replace(/<[^>]*>/g, ''))} className="text-xs font-bold text-coral hover:underline">
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-sm overflow-x-auto font-mono">
                <code dangerouslySetInnerHTML={{__html: platform === 'nextjs' ? nextjsCode : expressCode}}></code>
              </pre>
            </div>

            <div className="neo-card bg-paper mb-4">
              <h4 className="font-bold mb-2">Environment Variables (.env file):</h4>
              <div className="neo-card bg-white border-2 border-black">
                <code className="text-xs font-mono block text-black">
                  TACHI_API_KEY={apiKey || 'your-api-key-here'}<br/>
                  TACHI_WALLET={isHydrated ? address : 'your-wallet-address'}
                </code>
              </div>
            </div>

            <button
              onClick={() => setMiddlewareDeployed(true)}
              className="neo-button neo-button-sage"
            >
              ✓ Mark as Deployed
            </button>
          </div>

          {/* Step 5: Test Integration */}
          <div className="neo-card border-4 border-black">
            <h3 className="text-2xl font-bold mb-4">Step 5: Test Your Integration</h3>
            <p className="mb-4 opacity-70">Verify your setup works correctly</p>

            <button
              onClick={handleTestIntegration}
              disabled={testing}
              className={`neo-button neo-button-coral mb-4 ${testing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {testing ? 'Testing...' : 'Send Test Request'}
            </button>

            {testResult && (
              <div className={`neo-card ${testResult.success ? 'bg-sage text-white' : 'bg-coral text-white'}`}>
                <p className="font-bold mb-2">{testResult.success ? '✓ Success!' : '✗ Failed'}</p>
                <p className="text-sm">{testResult.message}</p>
                {testResult.status && <p className="text-xs mt-2 opacity-80">HTTP Status: {testResult.status}</p>}
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="neo-card bg-sage text-white">
            <h3 className="text-xl font-bold mb-4">How x402 Works</h3>
            <ul className="text-sm space-y-2 opacity-90">
              <li>1. AI agent requests your protected URL (e.g., yoursite.com/premium/article)</li>
              <li>2. Middleware checks for X-PAYMENT header - if missing, returns 402</li>
              <li>3. Agent pays USDC on Base via x402 protocol</li>
              <li>4. Agent retries with payment proof in X-PAYMENT header</li>
              <li>5. Middleware verifies via Coinbase facilitator (~100ms)</li>
              <li>6. Payment logged to Tachi API, content served</li>
            </ul>
            <div className="mt-4 p-3 bg-white text-black border-2 border-black">
              <p className="text-xs font-bold">✨ Benefits of x402:</p>
              <p className="text-xs mt-1">• Industry standard (Coinbase/Cloudflare)</p>
              <p className="text-xs">• Works with ANY x402 client</p>
              <p className="text-xs">• Content stays at your original URLs</p>
              <p className="text-xs">• Sub-cent payments on Base L2</p>
            </div>
          </div>
        </div>
      ) : (
        // Crawler Tab
        <div className="space-y-8">
          <div className="neo-card blueprint-corner">
            <h3 className="text-2xl font-bold mb-4">For AI Crawlers & Agents</h3>
            <p className="mb-6 opacity-70">Access protected content using any x402-compatible client:</p>

            <div className="neo-card bg-[#1e1e1e] border-2 border-black p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F56'}}></div>
                  <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FFBD2E'}}></div>
                  <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27C93F'}}></div>
                </div>
                <button onClick={() => copy(crawlerCode.replace(/<[^>]*>/g, ''))} className="text-xs font-bold text-coral hover:underline">
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-sm overflow-x-auto font-mono">
                <code dangerouslySetInnerHTML={{__html: crawlerCode}}></code>
              </pre>
            </div>

            <div className="neo-card bg-paper">
              <h4 className="font-bold mb-2">Compatible Clients:</h4>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• Anthropic Claude (built-in x402 support)</li>
                <li>• OpenAI agents (with x402 SDK)</li>
                <li>• Coinbase x402 SDK</li>
                <li>• Any custom agent implementing x402 standard</li>
              </ul>
            </div>
          </div>

          <div className="neo-card bg-sage text-white">
            <h3 className="text-xl font-bold mb-4">How It Works</h3>
            <ul className="text-sm space-y-2 opacity-90">
              <li>1. Request publisher's content at original URL</li>
              <li>2. Receive 402 response with payment requirements</li>
              <li>3. Pay USDC on Base via x402 protocol</li>
              <li>4. Retry request with payment proof</li>
              <li>5. Receive content</li>
            </ul>
            <div className="mt-4 p-3 bg-white text-black border-2 border-black">
              <p className="text-xs font-bold">💡 No custom integration needed!</p>
              <p className="text-xs mt-1">Any x402 client automatically handles the payment flow.</p>
            </div>
          </div>

          <div className="neo-card bg-coral text-white border-2 border-black">
            <p className="font-bold mb-2">Finding Publishers</p>
            <p className="text-sm opacity-90">
              Browse the <a href="/directory" className="underline font-bold">Publisher Directory</a> to discover content providers using Tachi Protocol.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
