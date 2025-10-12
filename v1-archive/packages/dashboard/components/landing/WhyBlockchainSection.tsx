import React from 'react';
import ParticleVessel from './ParticleVessel';

export default function WhyBlockchainSection() {
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
        <ParticleVessel />
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
          <span style={{ fontWeight: '500' }}>Why Blockchain</span>
          <br /><br />
          The web's current value layer is encumbered by T+2 settlement and 2.9% + $0.30 fees—great for shopping carts but not for bots paying per page. Layer 2 blockchains <span style={{ fontWeight: '500' }}>make frictionless, sub-cent payments viable</span>—a $0.000083 transfer fee arriving instantly makes access an actual commodity anywhere in the world.
          <br /><br />
          <span style={{ fontWeight: '500' }}>Smart contracts</span> turn "terms + price" into dynamically capable code-enforced rules: quote price, receive payment, settle to the publisher, log proof-of-crawl—automatically. No bespoke licensing cycles, no manual invoicing.
          <br /><br />
          Every paid access emits on <span style={{ fontWeight: '500' }}>audit trail for reporting and analytics</span> that you control. This is built for permissioned machine interaction with content at scale.
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