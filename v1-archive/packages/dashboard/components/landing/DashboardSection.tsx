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
    }} className="two-column-section">
      <div style={{
        flex: '0 0 400px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }} className="visual-column">
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
      }} className="text-column">
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