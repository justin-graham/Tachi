'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent, EnhancedCardTitle } from '../../components/ui/enhanced-card';
import { EnhancedButton } from '../../components/ui/enhanced-button';
import { EnhancedBadge } from '../../components/ui/enhanced-badge';
import { EnhancedInput } from '../../components/ui/enhanced-input';

const faqData = [
  {
    category: 'Getting Started',
    questions: [
      {
        question: 'How do I integrate Tachi Protocol into my website?',
        answer: 'You can integrate Tachi Protocol using our JavaScript SDK, API, or one-click script tag. Check out our documentation for detailed integration guides.'
      },
      {
        question: 'What is the minimum payout amount?',
        answer: 'The minimum payout amount is $50.00 USDC. Once your earnings reach this threshold, you can request a payout to your Base network wallet.'
      },
      {
        question: 'How quickly do payments process?',
        answer: 'Payments on Base network typically process within minutes. Payouts are sent directly to your connected wallet address.'
      }
    ]
  },
  {
    category: 'Technical',
    questions: [
      {
        question: 'What networks does Tachi Protocol support?',
        answer: 'Currently, Tachi Protocol operates on Base network, providing fast and low-cost transactions for content monetization.'
      },
      {
        question: 'How do I handle rate limiting?',
        answer: 'You can configure rate limiting in your dashboard settings. We recommend setting appropriate limits based on your content access patterns.'
      },
      {
        question: 'Can I use custom pricing for different content?',
        answer: 'Yes, you can set different pricing rates for various content types using our API. Contact support for advanced pricing configurations.'
      }
    ]
  },
  {
    category: 'Billing',
    questions: [
      {
        question: 'How are earnings calculated?',
        answer: 'Earnings are calculated based on successful content access requests at your configured rate. You can track all earnings in real-time on your dashboard.'
      },
      {
        question: 'Are there any fees for using Tachi Protocol?',
        answer: 'Tachi Protocol charges a small network fee for processing transactions. All fees are transparently displayed before payout requests.'
      },
      {
        question: 'Can I change my payout wallet address?',
        answer: 'Yes, you can update your payout wallet address in the billing settings. Changes require email verification for security.'
      }
    ]
  }
];

const supportChannels = [
  {
    title: 'Discord Community',
    description: 'Join our developer community for real-time support and discussions',
    action: 'JOIN DISCORD',
    href: 'https://discord.gg/tachi'
  },
  {
    title: 'Email Support',
    description: 'Send us a detailed message and get a response within 24 hours',
    action: 'SEND EMAIL',
    href: 'mailto:support@tachi.network'
  },
  {
    title: 'Documentation',
    description: 'Comprehensive guides and API references for integration',
    action: 'VIEW DOCS',
    href: '/docs'
  },
  {
    title: 'GitHub Issues',
    description: 'Report bugs or request features on our public repository',
    action: 'REPORT ISSUE',
    href: 'https://github.com/tachi-protocol/issues'
  }
];

export default function SupportPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });

  const filteredFaq = faqData.filter(category => 
    activeCategory === 'all' || 
    category.category.toLowerCase() === activeCategory.toLowerCase()
  ).map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Support form submitted:', supportForm);
    setSupportForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      priority: 'medium'
    });
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
                <button
                  onClick={() => router.push('/docs')}
                  className="text-[#52796F] font-medium font-['Coinbase Display'] uppercase tracking-wide hover:text-[#FF7043] transition-colors"
                >
                  DOCS
                </button>
                <button className="text-[#FF7043] font-medium font-['Coinbase Display'] uppercase tracking-wide border-b-2 border-[#FF7043] pb-1">
                  SUPPORT
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-[#52796F] font-medium font-['Coinbase Display'] uppercase tracking-wide hover:text-[#FF7043] transition-colors"
                >
                  DASHBOARD
                </button>
              </nav>
            </div>
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={() => router.push('/auth/connect')}
              className="font-['Coinbase Display'] uppercase tracking-wide"
            >
              GET STARTED
            </EnhancedButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
            TACHI SUPPORT CENTER
          </h1>
          <p className="text-lg text-[#52796F] leading-relaxed max-w-2xl mx-auto">
            Get help with integration, troubleshooting, and making the most of Tachi Protocol
          </p>
        </div>

        {/* Support Channels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {supportChannels.map((channel, index) => (
            <EnhancedCard key={index} variant="elevated" hover className="bg-white text-center">
              <EnhancedCardContent className="pt-8">
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">
                  {channel.title}
                </h3>
                <p className="text-sm text-[#FF7043] mb-6 leading-relaxed">
                  {channel.description}
                </p>
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(channel.href, '_blank')}
                  className="font-mono"
                >
                  {channel.action}
                </EnhancedButton>
              </EnhancedCardContent>
            </EnhancedCard>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <EnhancedCardTitle>Frequently Asked Questions</EnhancedCardTitle>
                  <div className="flex space-x-2">
                    <EnhancedButton
                      variant={activeCategory === 'all' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveCategory('all')}
                      className="font-mono"
                    >
                      ALL
                    </EnhancedButton>
                    {faqData.map(category => (
                      <EnhancedButton
                        key={category.category}
                        variant={activeCategory === category.category.toLowerCase() ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveCategory(category.category.toLowerCase())}
                        className="font-mono text-xs"
                      >
                        {category.category.toUpperCase()}
                      </EnhancedButton>
                    ))}
                  </div>
                </div>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <EnhancedInput
                      type="text"
                      placeholder="Search FAQ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-10"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-4 h-4 text-[#52796F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* FAQ Items */}
                <div className="space-y-6">
                  {filteredFaq.map((category) => (
                    <div key={category.category}>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display'] uppercase tracking-wide">
                        {category.category}
                      </h3>
                      <div className="space-y-3">
                        {category.questions.map((faq, index) => {
                          const faqId = `${category.category}-${index}`;
                          const isExpanded = expandedFaq === faqId;
                          
                          return (
                            <div key={index} className="border border-gray-200 rounded-lg">
                              <button
                                onClick={() => setExpandedFaq(isExpanded ? null : faqId)}
                                className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex justify-between items-center"
                              >
                                <span className="font-medium text-[#1A1A1A] pr-4">
                                  {faq.question}
                                </span>
                                <svg
                                  className={`w-5 h-5 text-[#52796F] transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {isExpanded && (
                                <div className="px-4 pb-4 text-[#52796F] leading-relaxed">
                                  {faq.answer}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredFaq.length === 0 && (
                  <div className="text-center py-8 text-[#52796F]">
                    No FAQ items found matching your search.
                  </div>
                )}
              </EnhancedCardContent>
            </EnhancedCard>
          </div>

          {/* Contact Form */}
          <div>
            <EnhancedCard variant="elevated" className="bg-white">
              <EnhancedCardHeader>
                <EnhancedCardTitle>Contact Support</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <form onSubmit={handleSubmitSupport} className="space-y-6">
                  <div>
                    <EnhancedInput
                      type="text"
                      value={supportForm.name}
                      onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                      placeholder="Name"
                      required
                    />
                  </div>

                  <div>
                    <EnhancedInput
                      type="email"
                      value={supportForm.email}
                      onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                      placeholder="Email"
                      required
                    />
                  </div>

                  <div>
                    <select
                      value={supportForm.priority}
                      onChange={(e) => setSupportForm({ ...supportForm, priority: e.target.value })}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-[#FF7043] text-[#1A1A1A] font-mono text-sm focus:outline-none focus:border-[#FF7043]"
                    >
                      <option value="low">Priority: Low</option>
                      <option value="medium">Priority: Medium</option>
                      <option value="high">Priority: High</option>
                      <option value="urgent">Priority: Urgent</option>
                    </select>
                  </div>

                  <div>
                    <EnhancedInput
                      type="text"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                      placeholder="Subject"
                      required
                    />
                  </div>

                  <div>
                    <textarea
                      value={supportForm.message}
                      onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                      rows={6}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-[#FF7043] text-[#1A1A1A] text-sm focus:outline-none focus:border-[#FF7043] resize-none placeholder:text-[#A0A0A0] placeholder:font-medium"
                      placeholder="Message"
                      required
                    />
                  </div>

                  <EnhancedButton
                    type="submit"
                    className="w-full font-mono"
                    disabled={!supportForm.name || !supportForm.email || !supportForm.subject || !supportForm.message}
                  >
                    SEND MESSAGE
                  </EnhancedButton>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-[#52796F]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono">Typical response time: 24 hours</span>
                  </div>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>

            {/* Status Card */}
            <EnhancedCard variant="elevated" className="bg-white mt-6">
              <EnhancedCardHeader>
                <EnhancedCardTitle>System Status</EnhancedCardTitle>
              </EnhancedCardHeader>
              <EnhancedCardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#1A1A1A] font-medium">API Status</span>
                    <EnhancedBadge variant="success" size="sm">OPERATIONAL</EnhancedBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#1A1A1A] font-medium">Base Network</span>
                    <EnhancedBadge variant="success" size="sm">HEALTHY</EnhancedBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#1A1A1A] font-medium">Dashboard</span>
                    <EnhancedBadge variant="success" size="sm">ONLINE</EnhancedBadge>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('https://status.tachi.network', '_blank')}
                    className="w-full font-mono"
                  >
                    VIEW STATUS PAGE
                  </EnhancedButton>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          </div>
        </div>
      </div>
    </div>
  );
}