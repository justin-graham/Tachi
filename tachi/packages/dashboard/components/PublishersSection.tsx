import React from 'react';
import BouncingPointCloud from './BouncingPointCloud';

export default function PublishersSection() {
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
        <BouncingPointCloud />
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
          <span style={{ fontWeight: '500' }}>For Publishers & Creators</span>
          <br /><br />
          <span style={{ fontWeight: '500' }}>Monetize AI Traffic:</span> Currently 73% of publishers are blocking AI crawlers. Instead of blocking bots outright, you can charge per request. Every time an autonomous agent accesses your content, you earn USDC instantly with zero friction.
          <br /><br />
          <span style={{ fontWeight: '500' }}>Enforce Your Terms:</span> Tachi lets you define pricing and usage terms for your content. Only crawlers that agree get access – others are politely turned away with a 402 Payment Required. You maintain full control and can update rates or rules anytime. Terms of service can even be presented to crawlers as part of the payment requirement flow.
        </p>
      </div>
    </section>
  );
}