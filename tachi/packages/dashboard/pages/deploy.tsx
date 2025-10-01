import React from 'react';
import Head from 'next/head';
import CloudflareDeployment from '../components/CloudflareDeployment';

export default function DeployPage() {
  return (
    <>
      <Head>
        <title>Deploy Gateway - Tachi Protocol</title>
        <meta name="description" content="Deploy your Tachi Protocol gateway to Cloudflare Workers" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <style jsx global>{`
        * {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>
      
      <div className="min-h-screen bg-white">
        {/* Header Navigation */}
        <div className="border-b-2 border-[#FF7043]">
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

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-0 items-stretch">
            {/* Left Column - Description */}
            <div className="border-2 border-[#FF7043] bg-white p-8 flex flex-col justify-center text-center lg:text-left">
              <p className="text-[#FF7043] text-sm font-medium tracking-wider mb-4">
                GATEWAY TO COMPENSATION
              </p>
              
              <div className="text-[#FF7043] text-lg leading-relaxed">
                <p>
                  Deploy Gateway is a tool for
                  connecting content publishers to 
                  fair compensation, to their
                  communities, and to one
                  another.
                </p>
              </div>
            </div>

            {/* Right Column - Deployment Form */}
            <div className="space-y-8 border-t-2 border-r-2 border-b-2 border-[#FF7043]">
              <CloudflareDeployment />
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-20 border-t-2 border-[#FF7043] pt-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="text-[#FF7043] font-medium mb-4">Quick Start Guide</h3>
                <ul className="text-[#FF7043] text-sm space-y-2">
                  <li>1. Get your Cloudflare API token</li>
                  <li>2. Set your pricing and wallet address</li>
                  <li>3. Click deploy and wait 2-3 minutes</li>
                  <li>4. Test your new gateway endpoint</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-[#FF7043] font-medium mb-4">Troubleshooting</h3>
                <ul className="text-[#FF7043] text-sm space-y-2">
                  <li>• Make sure you have ETH on Base for gas</li>
                  <li>• API token needs Workers:Edit permissions</li>
                  <li>• Worker name must be unique globally</li>
                  <li>• Contact support if deployment fails</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-[#FF7043] font-medium mb-4">Resources</h3>
                <div className="space-y-2">
                  <a 
                    href="/docs/TROUBLESHOOTING.md" 
                    className="text-[#FF7043] underline text-sm hover:no-underline block"
                  >
                    Troubleshooting Guide
                  </a>
                  <a 
                    href="/docs/FAQ.md" 
                    className="text-[#FF7043] underline text-sm hover:no-underline block"
                  >
                    FAQ
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}