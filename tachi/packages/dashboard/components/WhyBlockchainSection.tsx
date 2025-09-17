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
    }}>
      <div style={{
        flex: '0 0 400px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
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
      }}>
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
    </section>
  );
}