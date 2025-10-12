'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent, EnhancedCardTitle } from '../../components/ui/enhanced-card';
import { EnhancedButton } from '../../components/ui/enhanced-button';

export default function TermsPage() {
  const router = useRouter();

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
                <button
                  onClick={() => router.push('/support')}
                  className="text-[#52796F] font-medium font-['Coinbase Display'] uppercase tracking-wide hover:text-[#FF7043] transition-colors"
                >
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

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
            TERMS OF SERVICE
          </h1>
          <p className="text-lg text-[#52796F] leading-relaxed">
            Last updated: January 15, 2024
          </p>
        </div>

        {/* Terms Content */}
        <EnhancedCard variant="elevated" className="bg-white">
          <EnhancedCardContent className="prose prose-gray max-w-none">
            <div className="space-y-8 text-[#1A1A1A] leading-relaxed">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  1. ACCEPTANCE OF TERMS
                </h2>
                <p className="mb-4">
                  Welcome to Tachi Protocol ("Service"), operated by Tachi Labs ("Company", "we", "our", or "us"). 
                  These Terms of Service ("Terms") govern your use of our Service, including our website, APIs, 
                  and related services.
                </p>
                <p>
                  By accessing or using our Service, you agree to be bound by these Terms. If you disagree 
                  with any part of these terms, then you may not access the Service.
                </p>
              </section>

              {/* Service Description */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  2. SERVICE DESCRIPTION
                </h2>
                <p className="mb-4">
                  Tachi Protocol is a decentralized content monetization platform that enables content 
                  publishers to earn revenue from content access requests through blockchain-based payments.
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Content publishers can integrate our SDK or API to monetize their content</li>
                  <li>Crawlers pay for content access using USDC on Base network</li>
                  <li>Revenue is distributed directly to publishers' wallets</li>
                  <li>All transactions are recorded on the blockchain for transparency</li>
                </ul>
              </section>

              {/* User Accounts */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  3. USER ACCOUNTS
                </h2>
                <p className="mb-4">
                  To use certain features of our Service, you must connect a compatible Web3 wallet. 
                  You are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Maintaining the security of your wallet and private keys</li>
                  <li>All activities that occur under your account</li>
                  <li>Ensuring your wallet has sufficient funds for transactions</li>
                  <li>Complying with all applicable laws and regulations</li>
                </ul>
              </section>

              {/* Publisher Responsibilities */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  4. PUBLISHER RESPONSIBILITIES
                </h2>
                <p className="mb-4">
                  As a content publisher using our Service, you represent and warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>You own or have the right to monetize the content you publish</li>
                  <li>Your content does not violate any third-party rights</li>
                  <li>You will not use the Service for illegal or fraudulent purposes</li>
                  <li>You will provide accurate information about your content and pricing</li>
                  <li>You will comply with data protection and privacy laws</li>
                </ul>
              </section>

              {/* Payment Terms */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  5. PAYMENT TERMS
                </h2>
                <p className="mb-4">
                  Payments are processed through smart contracts on Base network:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>All payments are made in USDC cryptocurrency</li>
                  <li>Minimum payout threshold is $50.00 USDC</li>
                  <li>Network fees apply to all blockchain transactions</li>
                  <li>Payouts are processed within 24 hours of request</li>
                  <li>We may charge a service fee of up to 5% of gross revenue</li>
                </ul>
              </section>

              {/* Prohibited Uses */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  6. PROHIBITED USES
                </h2>
                <p className="mb-4">
                  You may not use our Service to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Publish illegal, harmful, or offensive content</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Engage in market manipulation or fraudulent activities</li>
                  <li>Circumvent our security measures or rate limiting</li>
                  <li>Distribute malware or conduct phishing attacks</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </section>

              {/* Privacy and Data */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  7. PRIVACY AND DATA PROTECTION
                </h2>
                <p className="mb-4">
                  We are committed to protecting your privacy:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>We collect minimal data necessary for service operation</li>
                  <li>Wallet addresses and transaction data are public on the blockchain</li>
                  <li>We do not store or have access to your private keys</li>
                  <li>Analytics data is aggregated and anonymized</li>
                  <li>We comply with GDPR and other applicable privacy laws</li>
                </ul>
              </section>

              {/* Disclaimers */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  8. DISCLAIMERS AND LIMITATIONS
                </h2>
                <p className="mb-4">
                  Our Service is provided "as is" without warranties:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>We do not guarantee uninterrupted service availability</li>
                  <li>Blockchain networks may experience delays or congestion</li>
                  <li>Cryptocurrency values are volatile and may fluctuate</li>
                  <li>Smart contracts are immutable and cannot be reversed</li>
                  <li>We are not liable for losses due to network issues</li>
                </ul>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  9. TERMINATION
                </h2>
                <p className="mb-4">
                  We may terminate or suspend your access to our Service:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>For violation of these Terms</li>
                  <li>For fraudulent or illegal activity</li>
                  <li>At our sole discretion with reasonable notice</li>
                  <li>Upon request from legal authorities</li>
                </ul>
                <p>
                  Upon termination, you remain responsible for any outstanding obligations 
                  and may request payout of earned funds above the minimum threshold.
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  10. CHANGES TO TERMS
                </h2>
                <p className="mb-4">
                  We reserve the right to modify these Terms at any time. Changes will be 
                  effective immediately upon posting. Your continued use of the Service 
                  constitutes acceptance of the modified Terms.
                </p>
                <p>
                  We will notify users of material changes via email or dashboard notification 
                  at least 30 days before the changes take effect.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  11. CONTACT INFORMATION
                </h2>
                <p className="mb-4">
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm">
                  <div className="space-y-2">
                    <div><strong>Email:</strong> legal@tachi.network</div>
                    <div><strong>Support:</strong> support@tachi.network</div>
                    <div><strong>Discord:</strong> https://discord.gg/tachi</div>
                    <div><strong>GitHub:</strong> https://github.com/tachi-protocol</div>
                  </div>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  12. GOVERNING LAW
                </h2>
                <p>
                  These Terms are governed by and construed in accordance with the laws of 
                  the United States. Any disputes arising from these Terms or the use of 
                  our Service shall be resolved through binding arbitration in accordance 
                  with the rules of the American Arbitration Association.
                </p>
              </section>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        {/* Footer Actions */}
        <div className="mt-12 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <EnhancedButton
            variant="outline"
            onClick={() => router.push('/privacy')}
            className="font-mono"
          >
            PRIVACY POLICY
          </EnhancedButton>
          <EnhancedButton
            onClick={() => router.push('/auth/connect')}
            className="font-mono"
          >
            ACCEPT & GET STARTED
          </EnhancedButton>
        </div>
      </div>
    </div>
  );
}