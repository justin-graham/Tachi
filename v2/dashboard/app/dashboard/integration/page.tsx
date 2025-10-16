'use client';

import {useState} from 'react';
import {useHydrationSafeAddress} from '../../hooks/useHydrationSafeAddress';

export default function IntegrationPage() {
  const {address, isHydrated} = useHydrationSafeAddress();
  const [activeTab, setActiveTab] = useState<'publisher' | 'crawler'>('publisher');
  const [copied, setCopied] = useState(false);

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://tachi-gateway.jgrahamsport16.workers.dev';

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publisherCode = `// Protect your content with Tachi Gateway
const GATEWAY = '${gatewayUrl}?publisher=${address || '0x...'}';

// Option 1: Proxy your entire site (easiest)
// Gateway URL format:
// ${gatewayUrl}?publisher=${address || '0x...'}&target=https://yoursite.com/page

// Crawlers access:
const protectedUrl = GATEWAY + '&target=https://yoursite.com/api/data';
// Gateway verifies payment, fetches your content, returns to crawler

// Option 2: Verify payments in your API
app.get('/api/data', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(402).json({
    error: 'Payment required',
    price: '0.01',
    publisher: '${address || '0x...'}'
  });

  // Verify tx hash on-chain
  const verified = await verifyPayment(auth.replace('Bearer ', ''));
  if (!verified) return res.status(402).json({error: 'Invalid payment'});

  res.json({data: 'Your protected content'});
});`;

  const crawlerCode = `// Install SDK
npm install @tachiprotocol/sdk

// Use in your code
import {TachiSDK} from '@tachiprotocol/sdk';

const sdk = new TachiSDK({
  network: 'base',
  rpcUrl: 'https://mainnet.base.org',
  privateKey: process.env.PRIVATE_KEY,
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  paymentProcessorAddress: '${process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS}',
  debug: true
});

// Fetch with auto-payment
// Gateway proxies the target URL after verifying payment
const publisherGateway = '${gatewayUrl}?publisher=0xABC&target=https://site.com/data';
const result = await sdk.fetch(publisherGateway);

console.log(result.content); // Real content from publisher's site
console.log(result.transactionHash); // Payment proof`;

  const curlExample = `# First request (402 Payment Required)
curl ${gatewayUrl}/article/ai-training

# Pay via PaymentProcessor contract, get tx hash
# Then retry with Authorization header
curl -H "Authorization: Bearer 0x[tx_hash]" \\
  ${gatewayUrl}/article/ai-training`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">Integration</h2>
        <p className="text-base md:text-lg opacity-70">Start protecting or accessing content in minutes</p>
      </div>

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
        <div className="neo-card blueprint-corner">
          <h3 className="text-2xl font-bold mb-4">Protect Your Content</h3>
          <p className="mb-6 opacity-70">Two options to protect your content with Tachi:</p>

          <div className="neo-card mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm">Your Gateway URL</span>
              <button
                onClick={() => copy(`${gatewayUrl}?publisher=${address || '0x...'}`)}
                className="text-xs font-bold text-coral hover:underline"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <code className="block bg-paper p-3 rounded font-mono text-sm break-all">
              {gatewayUrl}?publisher={isHydrated ? (address || '0x...') : '0x...'}
            </code>
          </div>

          <div className="neo-card">
            <pre className="text-sm overflow-x-auto">
              <code>{publisherCode}</code>
            </pre>
          </div>

          <div className="mt-6 p-4 bg-sage text-white border-2 border-black">
            <p className="font-bold mb-2">How It Works</p>
            <ul className="text-sm space-y-1 opacity-90">
              <li>1. Gateway checks for payment proof.</li>
              <li>2. If missing, returns 402 Payment Required.</li>
              <li>3. Crawler pays via PaymentProcessor contract.</li>
              <li>4. Crawler retries with tx hash in Authorization header.</li>
              <li>5. Gateway verifies payment on-chain and serves content.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="neo-card blueprint-corner">
          <h3 className="text-2xl font-bold mb-4">Access Protected Content</h3>
          <p className="mb-6 opacity-70">Use the Tachi SDK for automatic payment handling:</p>

          <div className="neo-card mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm">SDK Integration</span>
              <button onClick={() => copy(crawlerCode)} className="text-xs font-bold text-coral hover:underline">
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="text-sm overflow-x-auto">
              <code>{crawlerCode}</code>
            </pre>
          </div>

          <div className="lab-divider"></div>

          <div className="neo-card">
            <p className="font-bold text-sm mb-2">Alternative: cURL / Manual Payment</p>
            <pre className="text-sm overflow-x-auto">
              <code>{curlExample}</code>
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
