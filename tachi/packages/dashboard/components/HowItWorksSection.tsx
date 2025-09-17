import React from 'react';
import LayeredSineWaves from './LayeredSineWaves';

export default function HowItWorksSection() {
  return (
    <section style={{ 
      padding: '4rem 2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#FAF9F6',
      gap: '10rem'
    }}>
      <div style={{
        flex: '0 0 400px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <LayeredSineWaves />
      </div>
      
      <div style={{
        flex: '1',
        maxWidth: '500px',
        textAlign: 'left',
        lineHeight: '1.7',
        fontSize: '19px',
        color: '#333',
        fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: '300'
      }}>
        <p style={{ margin: 0 }}>
          <span style={{ fontWeight: '500' }}>How It Works</span>
          <br /><br />
          <span style={{ fontWeight: '500' }}>1. Publisher Setup:</span> A website owner installs the Tachi gateway with a few oboarding clicks. They configure their pricing and usage terms, then mint a crawl license on-chain for their domain.
          <br /><br />
          <span style={{ fontWeight: '500' }}>2. Crawler Integration:</span> An AI developer registers their crawler through the Tachi API and obtains credentials. The developer simply replaces direct HTTP requests with SDK calls.
          <br /><br />
          <span style={{ fontWeight: '500' }}>3. Payment Handshake:</span> When the crawler requests a page, it checks the crawl license to get the price and terms. If payment is required, the gateway sends a USDC quote and address, then verifies the on-chain payment and unlocks the content.
          <br /><br />
          <span style={{ fontWeight: '500' }}>4. On-Chain Logging:</span> Every completed crawl triggers an on-chain log entry including crawler ID, publisher, content ID, and timestamp. This provides both parties a verifiable record of rich data.
        </p>
      </div>
    </section>
  );
}