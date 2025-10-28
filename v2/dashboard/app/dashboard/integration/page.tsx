'use client';

import {useState, useEffect} from 'react';
import {useHydrationSafeAddress} from '../../hooks/useHydrationSafeAddress';

export default function IntegrationPage() {
  const {address, isHydrated} = useHydrationSafeAddress();
  const [activeTab, setActiveTab] = useState<'publisher' | 'crawler'>('publisher');
  const [copied, setCopied] = useState(false);
  const [domain, setDomain] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [protectionDeployed, setProtectionDeployed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [price, setPrice] = useState('0.01');

  useEffect(() => {
    if (address) {
      loadPublisherData();
      loadIntegrationProgress();
    }
  }, [address]);

  // Save integration progress to localStorage whenever state changes
  useEffect(() => {
    if (!address) return;
    const progress = {
      domainVerified,
      protectionDeployed,
      domain,
      price
    };
    localStorage.setItem(`tachi_integration_${address.toLowerCase()}`, JSON.stringify(progress));
  }, [domainVerified, protectionDeployed, domain, price, address]);

  const loadPublisherData = async () => {
    try {
      const res = await fetch(`/api/check-license?address=${address}`);
      const data = await res.json();
      if (data.domain) setDomain(data.domain);
      if (data.price) setPrice(data.price);
      if (data.domainVerified) setDomainVerified(true);
    } catch (err) {
      console.error('Failed to load publisher data:', err);
    }
  };

  const loadIntegrationProgress = () => {
    try {
      const saved = localStorage.getItem(`tachi_integration_${address.toLowerCase()}`);
      if (saved) {
        const progress = JSON.parse(saved);
        if (progress.domainVerified !== undefined) setDomainVerified(progress.domainVerified);
        if (progress.protectionDeployed !== undefined) setProtectionDeployed(progress.protectionDeployed);
        if (progress.domain) setDomain(progress.domain);
        if (progress.price) setPrice(progress.price);
      }
    } catch (err) {
      console.error('Failed to load integration progress:', err);
    }
  };

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://tachi-gateway.jgrahamsport16.workers.dev';

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyDomain = async () => {
    if (!domainInput || !address) return;
    setVerifying(true);
    setVerifyError('');

    try {
      const res = await fetch('/api/verify-domain', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({domain: domainInput, address})
      });
      const data = await res.json();

      if (data.verified) {
        setDomainVerified(true);
        setDomain(domainInput);
        setVerifyError('');
      } else {
        setVerifyError(data.message || data.error || 'Verification failed. Please check your DNS records.');
      }
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleTestIntegration = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simulate test request to gateway
      const testUrl = `${gatewayUrl}/article/ai-training?publisher=${address}`;
      const res = await fetch(testUrl);
      const data = await res.json();

      setTestResult({
        success: res.status === 402, // Expected for no payment
        status: res.status,
        message: res.status === 402 ? 'Gateway is working! Returns 402 Payment Required as expected.' : 'Unexpected response',
        data
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Test failed: ${err.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const txtRecord = `tachi-verify=${address?.toLowerCase()}`;

  const publisherCode = `<span style="color: #6A9955">// Protect your content with Tachi Gateway</span>
<span style="color: #C586C0">const</span> <span style="color: #4FC1FF">GATEWAY</span> = <span style="color: #CE9178">'${gatewayUrl}?publisher=${address || '0x...'}'</span>;

<span style="color: #6A9955">// Option 1: Proxy your entire site (easiest)</span>
<span style="color: #6A9955">// Gateway URL format:</span>
<span style="color: #6A9955">// ${gatewayUrl}?publisher=${address || '0x...'}&target=https://yoursite.com/page</span>

<span style="color: #6A9955">// Crawlers access:</span>
<span style="color: #C586C0">const</span> <span style="color: #4FC1FF">protectedUrl</span> = <span style="color: #4FC1FF">GATEWAY</span> + <span style="color: #CE9178">'&target=https://yoursite.com/api/data'</span>;
<span style="color: #6A9955">// Gateway verifies payment, fetches your content, returns to crawler</span>

<span style="color: #6A9955">// Option 2: Verify payments in your API</span>
<span style="color: #4FC1FF">app</span>.<span style="color: #DCDCAA">get</span>(<span style="color: #CE9178">'/api/data'</span>, <span style="color: #C586C0">async</span> (<span style="color: #9CDCFE">req</span>, <span style="color: #9CDCFE">res</span>) => {
  <span style="color: #C586C0">const</span> <span style="color: #4FC1FF">auth</span> = <span style="color: #9CDCFE">req</span>.<span style="color: #9CDCFE">headers</span>.<span style="color: #9CDCFE">authorization</span>;
  <span style="color: #C586C0">if</span> (!<span style="color: #4FC1FF">auth</span>) <span style="color: #C586C0">return</span> <span style="color: #9CDCFE">res</span>.<span style="color: #DCDCAA">status</span>(<span style="color: #B5CEA8">402</span>).<span style="color: #DCDCAA">json</span>({
    <span style="color: #9CDCFE">error</span>: <span style="color: #CE9178">'Payment required'</span>,
    <span style="color: #9CDCFE">price</span>: <span style="color: #CE9178">'${price}'</span>,
    <span style="color: #9CDCFE">publisher</span>: <span style="color: #CE9178">'${address || '0x...'}'</span>
  });

  <span style="color: #6A9955">// Verify tx hash on-chain</span>
  <span style="color: #C586C0">const</span> <span style="color: #4FC1FF">verified</span> = <span style="color: #C586C0">await</span> <span style="color: #DCDCAA">verifyPayment</span>(<span style="color: #4FC1FF">auth</span>.<span style="color: #DCDCAA">replace</span>(<span style="color: #CE9178">'Bearer '</span>, <span style="color: #CE9178">''</span>));
  <span style="color: #C586C0">if</span> (!<span style="color: #4FC1FF">verified</span>) <span style="color: #C586C0">return</span> <span style="color: #9CDCFE">res</span>.<span style="color: #DCDCAA">status</span>(<span style="color: #B5CEA8">402</span>).<span style="color: #DCDCAA">json</span>({<span style="color: #9CDCFE">error</span>: <span style="color: #CE9178">'Invalid payment'</span>});

  <span style="color: #9CDCFE">res</span>.<span style="color: #DCDCAA">json</span>({<span style="color: #9CDCFE">data</span>: <span style="color: #CE9178">'Your protected content'</span>});
});`;

  const crawlerCode = `<span style="color: #6A9955">// Install SDK</span>
<span style="color: #4FC1FF">npm</span> <span style="color: #4FC1FF">install</span> <span style="color: #CE9178">@tachiprotocol/sdk</span>

<span style="color: #6A9955">// Use in your code</span>
<span style="color: #C586C0">import</span> {<span style="color: #4FC1FF">TachiSDK</span>} <span style="color: #C586C0">from</span> <span style="color: #CE9178">'@tachiprotocol/sdk'</span>;

<span style="color: #C586C0">const</span> <span style="color: #4FC1FF">sdk</span> = <span style="color: #C586C0">new</span> <span style="color: #4FC1FF">TachiSDK</span>({
  <span style="color: #9CDCFE">network</span>: <span style="color: #CE9178">'base'</span>,
  <span style="color: #9CDCFE">rpcUrl</span>: <span style="color: #CE9178">'https://mainnet.base.org'</span>,
  <span style="color: #9CDCFE">privateKey</span>: <span style="color: #9CDCFE">process</span>.<span style="color: #9CDCFE">env</span>.<span style="color: #4FC1FF">PRIVATE_KEY</span>,
  <span style="color: #9CDCFE">usdcAddress</span>: <span style="color: #CE9178">'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'</span>,
  <span style="color: #9CDCFE">paymentProcessorAddress</span>: <span style="color: #CE9178">'${process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS}'</span>,
  <span style="color: #9CDCFE">debug</span>: <span style="color: #569CD6">true</span>
});

<span style="color: #6A9955">// Fetch with auto-payment</span>
<span style="color: #6A9955">// Gateway proxies the target URL after verifying payment</span>
<span style="color: #C586C0">const</span> <span style="color: #4FC1FF">publisherGateway</span> = <span style="color: #CE9178">'${gatewayUrl}?publisher=0xABC&target=https://site.com/data'</span>;
<span style="color: #C586C0">const</span> <span style="color: #4FC1FF">result</span> = <span style="color: #C586C0">await</span> <span style="color: #4FC1FF">sdk</span>.<span style="color: #DCDCAA">fetch</span>(<span style="color: #4FC1FF">publisherGateway</span>);

<span style="color: #9CDCFE">console</span>.<span style="color: #DCDCAA">log</span>(<span style="color: #4FC1FF">result</span>.<span style="color: #9CDCFE">content</span>); <span style="color: #6A9955">// Real content from publisher's site</span>
<span style="color: #9CDCFE">console</span>.<span style="color: #DCDCAA">log</span>(<span style="color: #4FC1FF">result</span>.<span style="color: #9CDCFE">transactionHash</span>); <span style="color: #6A9955">// Payment proof</span>`;

  const curlExample = `<span style="color: #6A9955"># First request (402 Payment Required)</span>
<span style="color: #4FC1FF">curl</span> <span style="color: #CE9178">${gatewayUrl}/article/ai-training</span>

<span style="color: #6A9955"># Pay via PaymentProcessor contract, get tx hash</span>
<span style="color: #6A9955"># Then retry with Authorization header</span>
<span style="color: #4FC1FF">curl</span> <span style="color: #C586C0">-H</span> <span style="color: #CE9178">"Authorization: Bearer 0x[tx_hash]"</span> <span style="color: #D4D4D4">\\</span>
  <span style="color: #CE9178">${gatewayUrl}/article/ai-training</span>`;

  // Progress calculation
  const hasLicense = !!address;
  const hasDomain = domainVerified;
  const hasProtection = protectionDeployed;
  const hasTested = testResult?.success === true;
  const isLive = hasLicense && hasDomain && hasProtection && hasTested;

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
                <span className={`font-bold text-xs ${hasLicense ? 'text-sage' : ''}`}>Register</span>
              </div>
              <div className="h-px bg-black flex-1 max-w-[40px]"></div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold ${hasDomain ? 'bg-sage text-white' : domainVerified === false && domainInput ? 'bg-coral text-white' : 'bg-white'}`}>
                  {hasDomain ? '✓' : '2'}
                </div>
                <span className={`font-bold text-xs ${hasDomain ? 'text-sage' : ''}`}>Verify</span>
              </div>
              <div className="h-px bg-black flex-1 max-w-[40px]"></div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold ${hasProtection ? 'bg-sage text-white' : 'bg-white'}`}>
                  {hasProtection ? '✓' : '3'}
                </div>
                <span className={`font-bold text-xs ${hasProtection ? 'text-sage' : ''}`}>Protect</span>
              </div>
              <div className="h-px bg-black flex-1 max-w-[40px]"></div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold ${hasTested ? 'bg-sage text-white' : 'bg-white'}`}>
                  {hasTested ? '✓' : '4'}
                </div>
                <span className={`font-bold text-xs ${hasTested ? 'text-sage' : ''}`}>Test</span>
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

          {/* Section A: Domain Verification */}
          <div className={`neo-card ${!domainVerified ? 'border-4 border-coral' : 'blueprint-corner'}`}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {domainVerified ? '✓ Domain Verified' : 'Step 2: Verify Your Domain'}
              </h3>
              {domainVerified && <span className="bg-sage text-white px-3 py-1 text-sm font-bold border-2 border-black">COMPLETE</span>}
            </div>

            {!domainVerified ? (
              <>
                <p className="mb-4 opacity-70">Add this TXT record to your DNS to verify domain ownership:</p>

                <div className="neo-card bg-white border-2 border-black mb-4">
                  <div className="flex justify-between items-center">
                    <code className="text-sm break-all text-black">{txtRecord}</code>
                    <button
                      onClick={() => copy(txtRecord)}
                      className="ml-4 text-xs font-bold text-coral hover:underline whitespace-nowrap"
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Domain Name</label>
                  <input
                    type="text"
                    placeholder="example.com"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    className="neo-input w-full"
                  />
                </div>

                {verifyError && (
                  <div className="neo-card bg-coral text-white mb-4">
                    <p className="text-sm">{verifyError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleVerifyDomain}
                    disabled={verifying || !domainInput}
                    className={`neo-button neo-button-sage ${verifying || !domainInput ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {verifying ? 'Checking DNS...' : 'Check Status'}
                  </button>
                  <button
                    onClick={() => setDomainVerified(true)}
                    className="neo-button"
                  >
                    Skip for Now
                  </button>
                </div>

                <p className="text-xs opacity-60 mt-4">
                  💡 DNS changes can take 5-60 minutes to propagate. Click "Check Status" to verify.
                </p>
              </>
            ) : (
              <div className="neo-card bg-sage text-white">
                <p className="font-bold">Domain: {domain || domainInput}</p>
                <p className="text-sm mt-1 opacity-90">Your domain is verified and ready for integration</p>
              </div>
            )}
          </div>

          {/* Section B: Deploy Protection */}
          <div className={`neo-card ${domainVerified && !protectionDeployed ? 'border-4 border-coral' : 'blueprint-corner'}`}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {protectionDeployed ? '✓ Protection Deployed' : 'Step 3: Deploy AI Crawler Protection'}
              </h3>
              {protectionDeployed && <span className="bg-sage text-white px-3 py-1 text-sm font-bold border-2 border-black">COMPLETE</span>}
            </div>

            {!protectionDeployed ? (
              <>
                <p className="mb-4 opacity-70">Deploy a Cloudflare Worker to enforce payment for AI crawlers accessing your domain.</p>

                <div className="neo-card bg-paper mb-4">
                  <h4 className="font-bold mb-2">What This Does:</h4>
                  <ul className="text-sm space-y-1 opacity-90">
                    <li>• Detects AI crawlers (GPTBot, Claude, Perplexity, etc.)</li>
                    <li>• Returns 402 Payment Required if no payment proof</li>
                    <li>• Validates payments via Tachi before serving content</li>
                    <li>• Regular users access your site normally</li>
                  </ul>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="text-sm font-bold">Quick Setup (2 minutes):</div>
                  <ol className="text-sm space-y-2 opacity-90">
                    <li>1. Download worker template: <a href="/cloudflare-worker-template.js" download className="text-coral font-bold underline">cloudflare-worker-template.js</a></li>
                    <li>2. Go to <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-coral font-bold underline">Cloudflare Dashboard</a></li>
                    <li>3. Create new Worker, paste template code</li>
                    <li>4. Set environment variables:
                      <div className="neo-card bg-white mt-2 font-mono text-xs">
                        TACHI_PUBLISHER_ADDRESS = {isHydrated ? address : 'your-address'}<br/>
                        TACHI_PRICE_PER_REQUEST = {price}
                      </div>
                    </li>
                    <li>5. Add route:
                      <div className="neo-card bg-white mt-2 font-mono text-xs">
                        {domain || 'yourdomain.com'}/*
                      </div>
                    </li>
                    <li>6. Click Deploy</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setProtectionDeployed(true)}
                    className="neo-button neo-button-sage"
                  >
                    ✓ Mark as Deployed
                  </button>
                  <button
                    onClick={() => setProtectionDeployed(true)}
                    className="neo-button"
                  >
                    Skip for Now
                  </button>
                </div>

                <p className="text-xs opacity-60 mt-4">
                  💡 Without protection, AI crawlers can bypass payment by accessing your site directly. Deploy the worker to enforce payment.
                </p>
              </>
            ) : (
              <div className="neo-card bg-sage text-white">
                <p className="font-bold">Protection is active on {domain || domainInput}</p>
                <p className="text-sm mt-1 opacity-90">AI crawlers are now required to pay via Tachi gateway</p>
              </div>
            )}
          </div>

          {/* Section C: Gateway URL */}
          <div className="neo-card">
            <h3 className="text-2xl font-bold mb-4">Your Gateway URL</h3>
            <p className="mb-4 opacity-70">AI crawlers will use this URL to access your protected content</p>

            <div className="neo-card bg-paper">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">Gateway Endpoint</span>
                <button
                  onClick={() => copy(`${gatewayUrl}?publisher=${address || '0x...'}`)}
                  className="text-xs font-bold text-coral hover:underline"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <code className="block bg-white p-3 rounded font-mono text-sm break-all border-2 border-black">
                {gatewayUrl}?publisher={isHydrated ? (address || '0x...') : '0x...'}
              </code>
            </div>
          </div>

          {/* Section C: Integration Code */}
          <div className="neo-card blueprint-corner">
            <h3 className="text-2xl font-bold mb-4">Integration Code</h3>
            <p className="mb-6 opacity-70">Choose how to protect your content:</p>

            <div className="neo-card bg-[#1e1e1e] border-2 border-black p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F56'}}></div>
                  <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FFBD2E'}}></div>
                  <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27C93F'}}></div>
                </div>
                <button onClick={() => copy(publisherCode.replace(/<[^>]*>/g, ''))} className="text-xs font-bold text-coral hover:underline">
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-sm overflow-x-auto font-mono">
                <code dangerouslySetInnerHTML={{__html: publisherCode}}></code>
              </pre>
            </div>
          </div>

          {/* Section D: Test Integration */}
          <div className="neo-card border-4 border-black">
            <h3 className="text-2xl font-bold mb-4">Step 4: Test Your Setup</h3>
            <p className="mb-4 opacity-70">Verify your gateway is configured correctly</p>

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

          {/* Section E: How It Works */}
          <div className="neo-card bg-sage text-white">
            <h3 className="text-xl font-bold mb-4">How It Works</h3>
            <ul className="text-sm space-y-2 opacity-90">
              <li>1. Gateway checks for payment proof in request</li>
              <li>2. If missing, returns 402 Payment Required with payment details</li>
              <li>3. Crawler pays via PaymentProcessor contract on Base</li>
              <li>4. Crawler retries request with transaction hash in Authorization header</li>
              <li>5. Gateway verifies payment on-chain and serves your content</li>
            </ul>
          </div>
        </div>
      ) : (
        // Crawler Tab
        <div className="neo-card blueprint-corner">
          <h3 className="text-2xl font-bold mb-4">Access Protected Content</h3>
          <p className="mb-6 opacity-70">Use the Tachi SDK for automatic payment handling:</p>

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

          <div className="lab-divider"></div>

          <div className="neo-card bg-[#1e1e1e] border-2 border-black p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F56'}}></div>
                <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FFBD2E'}}></div>
                <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27C93F'}}></div>
              </div>
              <span className="text-xs font-bold text-[#d4d4d4]">Alternative: cURL</span>
            </div>
            <pre className="text-sm overflow-x-auto font-mono">
              <code dangerouslySetInnerHTML={{__html: curlExample}}></code>
            </pre>
          </div>

          <div className="mt-6 p-4 bg-coral text-white border-2 border-black">
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
