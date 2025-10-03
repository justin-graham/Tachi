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
    }} className="two-column-section">
      <div style={{
        flex: '0 0 400px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }} className="visual-column">
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
      }} className="text-column">
        <p style={{ margin: 0 }}>
          <span style={{ fontWeight: '500' }}>For Publishers & Creators</span>
          <br /><br />
          <span style={{ fontWeight: '500' }}>Monetize AI Traffic:</span> Currently 73% of publishers are blocking AI crawlers. Instead of blocking bots outright, you can charge per request. Every time an autonomous agent accesses your content, you earn USDC instantly with zero friction.
          <br /><br />
          <span style={{ fontWeight: '500' }}>Enforce Your Terms:</span> Tachi lets you define pricing and usage terms for your content. Only crawlers that agree get access – others are politely turned away with a 402 Payment Required. You maintain full control and can update rates or rules anytime. Terms of service can even be presented to crawlers as part of the payment requirement flow.
        </p>
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .two-column-section {
            flex-direction: column !important;
            gap: 3rem !important;
            padding: 3rem 1rem !important;
            text-align: center !important;
            min-height: auto !important;
          }
          
          .visual-column {
            flex: none !important;
            width: 100% !important;
            max-width: 280px !important;
            max-height: 280px !important;
            order: 1;
            overflow: hidden;
          }
          
          .text-column {
            flex: none !important;
            max-width: 100% !important;
            text-align: center !important;
            font-size: 17px !important;
            order: 2;
          }
        }
        
        @media (max-width: 480px) {
          .two-column-section {
            padding: 2rem 1rem !important;
            gap: 2rem !important;
          }
          
          .visual-column {
            max-width: 220px !important;
            max-height: 220px !important;
          }
          
          .text-column {
            font-size: 16px !important;
            line-height: 1.6 !important;
          }
        }
      `}</style>
    </section>
  );
}