import React from 'react';

export default function TextSection() {
  return (
    <section style={{ 
      padding: '4rem 2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#FAF9F6'
    }}>
      <div style={{
        maxWidth: '600px',
        textAlign: 'left',
        lineHeight: '1.7',
        fontSize: '19px',
        color: '#333',
        fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: '300'
      }}>
        <p style={{ margin: 0 }}>
          <span style={{ fontWeight: '500' }}>The Web's Value Layer is Leaking.</span> Tachi lets content publishers get paid when AI agents crawl their sites, and enables developers to pay per access. It's a web infrastructure upgrade that turns web agents from free riders into fair participants. Publishers monetize AI traffic in real time, and developers gain on-demand access to content under clear terms, with every request settled in stablecoin on-chain.
        </p>
      </div>
    </section>
  );
}