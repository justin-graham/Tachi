'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '../../components/ui/enhanced-card';
import { EnhancedButton } from '../../components/ui/enhanced-button';
import { EnhancedInput } from '../../components/ui/enhanced-input';
import { EnhancedBadge } from '../../components/ui/enhanced-badge';

const sidebarSections = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Quick Start', href: '#quick-start', active: true },
      { label: 'Installation', href: '#installation' },
      { label: 'First Request', href: '#first-request' }
    ]
  },
  {
    title: 'API Reference',
    items: [
      { label: 'Authentication', href: '#authentication' },
      { label: 'Crawl Endpoint', href: '#crawl-endpoint' },
      { label: 'Pricing API', href: '#pricing-api' },
      { label: 'Webhooks', href: '#webhooks' }
    ]
  },
  {
    title: 'SDKs & Tools',
    items: [
      { label: 'JavaScript', href: '#javascript' },
      { label: 'Python', href: '#python' },
      { label: 'Go', href: '#go' },
      { label: 'Rust', href: '#rust' }
    ]
  },
  {
    title: 'Examples',
    items: [
      { label: 'Blog CMS', href: '#blog-cms' },
      { label: 'News Site', href: '#news-site' },
      { label: 'API Gateway', href: '#api-gateway' },
      { label: 'E-commerce', href: '#e-commerce' }
    ]
  },
  {
    title: 'Support',
    items: [
      { label: 'FAQ', href: '#faq' },
      { label: 'Discord', href: '#discord' },
      { label: 'Contact', href: '#contact' }
    ]
  }
];

export default function DocsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('quick-start');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <div className="bg-white border-b-2 border-[#FF7043] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-bold text-[#1A1A1A] font-['Coinbase Display']">
                TACHI
              </div>
              <nav className="flex items-center space-x-6">
                <button className="text-[#FF7043] font-medium font-['Coinbase Display'] uppercase tracking-wide border-b-2 border-[#FF7043] pb-1">
                  DOCS
                </button>
                <button className="text-[#52796F] font-medium font-['Coinbase Display'] uppercase tracking-wide hover:text-[#FF7043] transition-colors">
                  API
                </button>
                <button className="text-[#52796F] font-medium font-['Coinbase Display'] uppercase tracking-wide hover:text-[#FF7043] transition-colors">
                  GUIDES
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <form onSubmit={handleSearch}>
                  <EnhancedInput
                    type="text"
                    placeholder="Search docs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-[#52796F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </form>
              </div>
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="font-['Coinbase Display'] uppercase tracking-wide"
              >
                DASHBOARD
              </EnhancedButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            {sidebarSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-8">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 uppercase tracking-wide font-['Coinbase Display']">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <button
                        onClick={() => setActiveTab(item.href.slice(1))}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          item.active || activeTab === item.href.slice(1)
                            ? 'bg-[#FF7043] text-white font-medium'
                            : 'text-[#52796F] hover:bg-gray-50 hover:text-[#1A1A1A]'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                TACHI PROTOCOL DOCS
              </h1>
              <p className="text-lg text-[#52796F] leading-relaxed">
                Fast, fair content monetization for the decentralized web.
              </p>
            </div>

            {/* Quick Start Card */}
            <EnhancedCard variant="elevated" className="mb-8 bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-[#FF7043]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>QUICK START</span>
                </EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#FF7043] rounded-full flex items-center justify-center text-white font-bold font-mono">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">Install SDK</h3>
                      <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 font-mono text-sm">
                        <div className="flex">
                          <div className="text-gray-400 mr-4 select-none">1</div>
                          <div>
                            <span className="text-[#52796F]">npm</span> <span className="text-[#FF7043]">install</span> <span className="text-[#1A1A1A]">@tachi/sdk</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#FF7043] rounded-full flex items-center justify-center text-white font-bold font-mono">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">Initialize client</h3>
                      <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 font-mono text-sm">
                        <div className="flex">
                          <div className="text-gray-400 mr-4 select-none">1</div>
                          <div>
                            <span className="text-[#52796F]">const</span> <span className="text-[#1A1A1A]">tachi</span> <span className="text-[#FF7043]">=</span> <span className="text-[#52796F]">new</span> <span className="text-[#1A1A1A]">TachiClient</span><span className="text-[#FF7043]">()</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#FF7043] rounded-full flex items-center justify-center text-white font-bold font-mono">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">Make request</h3>
                      <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 font-mono text-sm">
                        <div className="flex">
                          <div className="text-gray-400 mr-4 select-none">1</div>
                          <div>
                            <span className="text-[#52796F]">const</span> <span className="text-[#1A1A1A]">result</span> <span className="text-[#FF7043]">=</span> <span className="text-[#52796F]">await</span> <span className="text-[#1A1A1A]">tachi</span><span className="text-[#FF7043]">.</span><span className="text-[#1A1A1A]">crawl</span><span className="text-[#FF7043]">()</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <EnhancedButton
                    variant="primary"
                    onClick={() => router.push('/docs/tutorial')}
                  >
                    FULL TUTORIAL →
                  </EnhancedButton>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Live Examples Card */}
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-[#0052FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span>LIVE EXAMPLES</span>
                </EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <EnhancedButton variant="technical" size="sm">
                      TRY API
                    </EnhancedButton>
                    <EnhancedButton variant="outline" size="sm">
                      VIEW RESPONSE
                    </EnhancedButton>
                    <EnhancedButton variant="ghost" size="sm">
                      COPY
                    </EnhancedButton>
                  </div>
                  
                  <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                    <div className="mb-4">
                      <div className="text-xs font-medium text-[#FF7043] uppercase tracking-wide mb-2">Request URL:</div>
                      <div className="font-mono text-sm">
                        <div className="flex">
                          <div className="text-gray-400 mr-4 select-none">1</div>
                          <div>
                            <span className="text-[#1A1A1A]">https://api.tachi.network/v1/crawl</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-medium text-[#FF7043] uppercase tracking-wide mb-2">Headers:</div>
                      <div className="font-mono text-sm">
                        <div className="flex">
                          <div className="text-gray-400 mr-4 select-none">2</div>
                          <div>
                            <span className="text-[#52796F]">Authorization</span><span className="text-[#FF7043]">:</span> <span className="text-[#1A1A1A]">Bearer xxx</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          </div>
        </div>
      </div>
    </div>
  );
}