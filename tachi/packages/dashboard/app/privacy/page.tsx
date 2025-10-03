'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedCard, EnhancedCardHeader, EnhancedCardContent, EnhancedCardTitle } from '../../components/ui/enhanced-card';
import { EnhancedButton } from '../../components/ui/enhanced-button';

export default function PrivacyPage() {
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
            PRIVACY POLICY
          </h1>
          <p className="text-lg text-[#52796F] leading-relaxed">
            Last updated: January 15, 2024
          </p>
        </div>

        {/* Privacy Content */}
        <EnhancedCard variant="elevated" className="bg-white">
          <EnhancedCardContent className="prose prose-gray max-w-none">
            <div className="space-y-8 text-[#1A1A1A] leading-relaxed">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  1. INFORMATION WE COLLECT
                </h2>
                <p className="mb-4">
                  Tachi Protocol is designed with privacy by default. We collect minimal information 
                  necessary to provide our content monetization service:
                </p>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3 font-['Coinbase Display']">
                  Wallet Information
                </h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Public wallet addresses for payment processing</li>
                  <li>Transaction history on Base network (publicly available)</li>
                  <li>We never access or store your private keys</li>
                </ul>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3 font-['Coinbase Display']">
                  Service Usage Data
                </h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>API requests and response times</li>
                  <li>Content access patterns and pricing</li>
                  <li>Dashboard usage analytics</li>
                  <li>Error logs for service improvement</li>
                </ul>
              </section>

              {/* How We Use Information */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  2. HOW WE USE YOUR INFORMATION
                </h2>
                <p className="mb-4">
                  We use collected information solely to provide and improve our service:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Process payments and revenue distribution</li>
                  <li>Provide real-time analytics and reporting</li>
                  <li>Detect and prevent fraudulent activity</li>
                  <li>Improve service performance and reliability</li>
                  <li>Provide customer support</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  3. DATA SHARING AND DISCLOSURE
                </h2>
                <p className="mb-4">
                  We do not sell, trade, or rent your personal information. We may share data in 
                  limited circumstances:
                </p>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3 font-['Coinbase Display']">
                  Public Blockchain Data
                </h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>All transactions are publicly recorded on Base network</li>
                  <li>Wallet addresses and transaction amounts are visible</li>
                  <li>This is inherent to blockchain technology</li>
                </ul>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3 font-['Coinbase Display']">
                  Service Providers
                </h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Cloud infrastructure providers (AWS, Vercel)</li>
                  <li>Analytics services (anonymized data only)</li>
                  <li>Legal compliance when required by law</li>
                </ul>
              </section>

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  4. DATA SECURITY
                </h2>
                <p className="mb-4">
                  We implement industry-standard security measures:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>End-to-end encryption for all data transmission</li>
                  <li>Secure API authentication with rate limiting</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and monitoring systems</li>
                  <li>No storage of private keys or sensitive wallet data</li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-bold text-blue-800 font-['Coinbase Display']">
                        Your Keys, Your Control
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Tachi Protocol never has access to your private keys. You maintain full 
                        control of your wallet and funds at all times.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  5. YOUR PRIVACY RIGHTS
                </h2>
                <p className="mb-4">
                  Under GDPR and other privacy laws, you have the following rights:
                </p>
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">Access</h4>
                    <p className="text-sm text-[#52796F]">Request a copy of your personal data</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">Correction</h4>
                    <p className="text-sm text-[#52796F]">Update inaccurate information</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">Deletion</h4>
                    <p className="text-sm text-[#52796F]">Request deletion of your data</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2 font-['Coinbase Display']">Portability</h4>
                    <p className="text-sm text-[#52796F]">Export your data in a standard format</p>
                  </div>
                </div>
                <p className="text-sm text-[#52796F] mb-4">
                  Note: Blockchain transactions cannot be deleted as they are permanently recorded 
                  on the decentralized network.
                </p>
              </section>

              {/* Cookies and Tracking */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  6. COOKIES AND TRACKING
                </h2>
                <p className="mb-4">
                  We use minimal tracking technologies:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Essential cookies for service functionality</li>
                  <li>Local storage for user preferences</li>
                  <li>Analytics cookies (anonymized, opt-out available)</li>
                  <li>No third-party advertising trackers</li>
                </ul>
                <p className="text-sm text-[#52796F]">
                  You can disable cookies in your browser settings, though this may affect 
                  service functionality.
                </p>
              </section>

              {/* International Transfers */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  7. INTERNATIONAL DATA TRANSFERS
                </h2>
                <p className="mb-4">
                  Our services operate globally with data processing in:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>United States (primary infrastructure)</li>
                  <li>European Union (GDPR compliance)</li>
                  <li>Base blockchain network (decentralized)</li>
                </ul>
                <p className="text-sm text-[#52796F]">
                  We ensure adequate protection through standard contractual clauses and 
                  privacy frameworks.
                </p>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  8. CHILDREN'S PRIVACY
                </h2>
                <p className="mb-4">
                  Tachi Protocol is not intended for users under 18 years of age. We do not 
                  knowingly collect personal information from children. If you believe we have 
                  collected information from a minor, please contact us immediately.
                </p>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  9. DATA RETENTION
                </h2>
                <p className="mb-4">
                  We retain data for the following periods:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Account data: Until account closure + 7 years (legal requirement)</li>
                  <li>Transaction records: Permanently on blockchain</li>
                  <li>Analytics data: 2 years maximum</li>
                  <li>Support communications: 3 years</li>
                  <li>Error logs: 1 year</li>
                </ul>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  10. CONTACT US
                </h2>
                <p className="mb-4">
                  For privacy-related questions or to exercise your rights:
                </p>
                <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm">
                  <div className="space-y-2">
                    <div><strong>Privacy Officer:</strong> privacy@tachi.network</div>
                    <div><strong>Data Protection:</strong> dpo@tachi.network</div>
                    <div><strong>General Support:</strong> support@tachi.network</div>
                    <div><strong>Response Time:</strong> 30 days maximum</div>
                  </div>
                </div>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-['Coinbase Display']">
                  11. CHANGES TO THIS POLICY
                </h2>
                <p className="mb-4">
                  We may update this Privacy Policy to reflect changes in our practices or 
                  legal requirements. We will notify you of material changes via:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Email notification to registered users</li>
                  <li>Dashboard notification banner</li>
                  <li>Updates to this page with revision date</li>
                </ul>
                <p className="text-sm text-[#52796F]">
                  Continued use of our service after changes constitutes acceptance of the 
                  updated policy.
                </p>
              </section>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        {/* Footer Actions */}
        <div className="mt-12 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <EnhancedButton
            variant="outline"
            onClick={() => router.push('/terms')}
            className="font-mono"
          >
            TERMS OF SERVICE
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