'use client';

import {useRouter} from 'next/navigation';
import {useEffect, useState, Suspense} from 'react';
import {useHydrationSafeAddress} from '../hooks/useHydrationSafeAddress';

function SetupCompleteContent() {
  const {address, isConnected, isHydrated} = useHydrationSafeAddress();
  const router = useRouter();
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://tachi-gateway.jgrahamsport16.workers.dev';
  const publisherGatewayUrl = `${gatewayUrl}?publisher=${isHydrated && address ? address : '0x...'}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const curlExample = `curl -H "Authorization: Bearer <tx_hash>" \\
  "${publisherGatewayUrl}/article/ai-training"`;

  const sdkExample = `import {TachiSDK} from '@tachi/sdk';

const sdk = new TachiSDK({
  network: 'base',
  rpcUrl: 'https://mainnet.base.org',
  privateKey: process.env.PRIVATE_KEY,
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  paymentProcessorAddress: '${process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS}'
});

const result = await sdk.fetch('${publisherGatewayUrl}/your-content');`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="inline-block mb-6">
          <div className="stat-badge bg-sage text-white text-2xl px-8 py-4">
            ✓ SETUP COMPLETE
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4">You're All Set!</h1>
        <p className="text-xl opacity-70">
          Your publisher license is active. Here's how to protect your content.
        </p>
      </div>

      {/* Gateway URL */}
      <div className="neo-card blueprint-corner mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Gateway URL</h2>
        <p className="text-sm opacity-70 mb-4">
          AI crawlers will use this URL to access your protected content
        </p>
        <div className="flex items-center gap-3">
          <div className="neo-input bg-paper font-mono text-sm break-all flex-1">
            {publisherGatewayUrl}
          </div>
          <button
            onClick={() => copyToClipboard(publisherGatewayUrl, 'url')}
            className="neo-button neo-button-sage whitespace-nowrap"
          >
            {copied === 'url' ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="lab-divider"></div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6">How It Works</h2>
        <div className="space-y-4">
          <div className="neo-card">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-coral border-[3px] border-black flex items-center justify-center text-2xl font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Crawler Requests Content</h3>
                <p className="opacity-70 text-sm">
                  AI crawlers send a GET request to your gateway URL with a content path
                </p>
              </div>
            </div>
          </div>

          <div className="neo-card">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-coral border-[3px] border-black flex items-center justify-center text-2xl font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Gateway Returns 402 Payment Required</h3>
                <p className="opacity-70 text-sm">
                  The gateway responds with pricing info and payment instructions
                </p>
              </div>
            </div>
          </div>

          <div className="neo-card">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-coral border-[3px] border-black flex items-center justify-center text-2xl font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Crawler Pays & Retries</h3>
                <p className="opacity-70 text-sm">
                  Crawler sends USDC payment on Base, then retries with transaction hash
                </p>
              </div>
            </div>
          </div>

          <div className="neo-card">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-sage border-[3px] border-black flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Content Delivered</h3>
                <p className="opacity-70 text-sm">
                  Gateway verifies payment, logs the crawl, and returns your content
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="lab-divider"></div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6">Integration Examples</h2>

        <div className="neo-card mb-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold">Using cURL</h3>
            <button
              onClick={() => copyToClipboard(curlExample, 'curl')}
              className="neo-button text-sm py-2 px-4"
            >
              {copied === 'curl' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="bg-black text-white p-4 overflow-x-auto text-sm font-mono">
            {curlExample}
          </pre>
        </div>

        <div className="neo-card">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold">Using Tachi SDK</h3>
            <button
              onClick={() => copyToClipboard(sdkExample, 'sdk')}
              className="neo-button text-sm py-2 px-4"
            >
              {copied === 'sdk' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="bg-black text-white p-4 overflow-x-auto text-sm font-mono">
            {sdkExample}
          </pre>
        </div>
      </div>

      {/* Next Steps */}
      <div className="lab-divider"></div>

      <div className="neo-card blueprint-corner">
        <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
        <div className="space-y-3 text-sm mb-6">
          <div className="flex gap-3">
            <span className="text-coral font-bold">→</span>
            <span>Test your gateway with the demo script or cURL</span>
          </div>
          <div className="flex gap-3">
            <span className="text-coral font-bold">→</span>
            <span>Share your gateway URL with AI companies and crawlers</span>
          </div>
          <div className="flex gap-3">
            <span className="text-coral font-bold">→</span>
            <span>Monitor earnings in your dashboard</span>
          </div>
        </div>
        <a href="/dashboard" className="neo-button neo-button-sage inline-block">
          Go to Dashboard →
        </a>
      </div>
    </div>
  );
}

export default function SetupCompletePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-6 py-12 text-center"><div className="spinner"></div></div>}>
      <SetupCompleteContent />
    </Suspense>
  );
}
