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
    }} className="text-only-section">
      <div style={{
        maxWidth: '600px',
        textAlign: 'left',
        lineHeight: '1.7',
        fontSize: '19px',
        color: '#333',
        fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: '300'
      }} className="text-content">
        <p style={{ margin: 0 }}>
          <span style={{ fontWeight: '500' }}>The Web's Value Layer is Leaking.</span> Tachi lets content publishers get paid when AI agents crawl their sites, and enables developers to pay per access. It's a web infrastructure upgrade that turns web agents from free riders into fair participants. Publishers monetize AI traffic in real time, and developers gain on-demand access to content under clear terms, with every request settled in stablecoin on-chain.
        </p>
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .text-only-section {
            padding: 3rem 1rem !important;
            min-height: auto !important;
            text-align: center !important;
          }
          
          .text-content {
            text-align: center !important;
            font-size: 17px !important;
            max-width: 100% !important;
          }
        }
        
        @media (max-width: 480px) {
          .text-only-section {
            padding: 2rem 1rem !important;
          }
          
          .text-content {
            font-size: 16px !important;
            line-height: 1.6 !important;
          }
        }
      `}</style>
    </section>
  );
}