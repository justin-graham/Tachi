import React from 'react';
import HashArchitecture from './HashArchitecture';

export default function DashboardSection() {
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
        <div className="shadow-lg">
          <HashArchitecture />
        </div>
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
          <span style={{ fontWeight: '500' }}>Dashboard</span>
          <br /><br />
          Once you're on board, Tachi's dashboard puts creators and developers in control with live data and rich insights. Examples include:
          <br /><br />
          <span style={{ fontWeight: '500' }}>Revenue at a Glance:</span> See your earnings accrue in real time.
          <br /><br />
          <span style={{ fontWeight: '500' }}>Live Crawl Feed:</span> Monitor AI activity on your content as it happens. A feed lists recent crawl requests including which agent accessed which URL, when, and how much was paid.
          <br /><br />
          <span style={{ fontWeight: '500' }}>Network Health & Control:</span> Manage multiple websites and gateways in one place like adjusting pricing or pause protection for maintenance.
        </p>
      </div>
    </section>
  );
}