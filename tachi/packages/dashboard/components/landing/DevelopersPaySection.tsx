import React from 'react';

const ContentTypesList = () => {
  const contentTypes = [
    'Agent Building',
    'Sub-Cent Costs', 
    'SDK',
    'CDN Agnostic',
    'Smart Contracts'
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#FAF9F6',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '4rem',
      lineHeight: '1.1'
    }} className="content-types-list">
      {contentTypes.map((content, index) => (
        <div
          key={content}
          style={{
            fontSize: '3.68rem',
            fontWeight: '900',
            color: '#111',
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            marginBottom: index === contentTypes.length - 1 ? '0' : '-0.8rem',
            textTransform: 'none',
            letterSpacing: '-0.02em'
          }}
          className="content-type-item"
        >
          {content}
        </div>
      ))}
      
      <style jsx>{`
        @media (max-width: 768px) {
          .content-types-list {
            padding: 2rem !important;
            align-items: center !important;
            text-align: center !important;
          }
          
          .content-type-item {
            font-size: 2.5rem !important;
            margin-bottom: -0.4rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .content-types-list {
            padding: 1.5rem !important;
          }
          
          .content-type-item {
            font-size: 2rem !important;
            margin-bottom: -0.2rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default function DevelopersPaySection() {
  return (
    <section style={{
      padding: '4rem 0 4rem 2rem',
      backgroundColor: '#FAF9F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: '100vh',
      gap: '4rem'
    }} className="developers-pay-section">
      <div style={{
        flex: '0 0 50%',
        minHeight: '600px',
        background: '#FAF9F6',
        borderRadius: '0 12px 12px 0',
        position: 'relative',
        overflow: 'hidden'
      }} className="dev-content-list-column">
        <ContentTypesList />
      </div>

      <div style={{ 
        flex: '1',
        maxWidth: '500px',
        textAlign: 'left',
        lineHeight: '1.7',
        fontSize: '19px',
        color: '#333',
        fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: '300',
        paddingRight: '2rem'
      }} className="dev-text-column">
        <p style={{ margin: '0 0 2rem 0' }}>
          <span style={{ fontWeight: '500' }}>Developers pay, fetch, and prove it</span>
          <br /><br />
          Scenario: You're shipping an agent that needs quality data in real time. Today you hit a wall (paywalls, ToS risk, brittle workarounds). With Tachi, your agent pays per page and gets the content in seconds—no custom deals, no scraping arms race.
        </p>

        <div style={{
          background: '#ffffff',
          border: '2px solid #000',
          borderRadius: '0',
          fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#000',
          position: 'relative'
        }}>
          <div style={{
            background: '#FAF9F6',
            padding: '8px 16px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              background: '#52796F',
              padding: '2px 6px',
              borderRadius: '2px',
              marginRight: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#ffffff'
            }}>
              &lt;/&gt;
            </div>
            <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
              tachi-acess.py
            </span>
          </div>

          <div style={{ padding: '16px 16px 32px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                <span style={{ color: '#888', marginRight: '16px', fontSize: '15px' }}>1</span>
                <span style={{ color: '#0066cc' }}>quote</span>
                <span style={{ color: '#333' }}> = tachi.</span>
                <span style={{ color: '#ff6600' }}>quote</span>
                <span style={{ color: '#333' }}>(</span>
                <span style={{ color: '#cc0000' }}>"hackernews.com"</span>
                <span style={{ color: '#333' }}>)</span>
              </div>
              <div>
                <span style={{ color: '#888', marginRight: '16px', fontSize: '15px' }}>2</span>
                <span style={{ color: '#0066cc' }}>tx</span>
                <span style={{ color: '#333' }}> = tachi.</span>
                <span style={{ color: '#ff6600' }}>pay</span>
                <span style={{ color: '#333' }}>(quote)</span>
              </div>
              <div>
                <span style={{ color: '#888', marginRight: '16px', fontSize: '15px' }}>3</span>
                <span style={{ color: '#0066cc' }}>html</span>
                <span style={{ color: '#333' }}> = tachi.</span>
                <span style={{ color: '#ff6600' }}>fetch</span>
                <span style={{ color: '#333' }}>(URL, </span>
                <span style={{ color: '#0066cc' }}>proof</span>
                <span style={{ color: '#333' }}>=tx.hash)</span>
              </div>
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: '#000'
          }}></div>
        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .developers-pay-section {
            flex-direction: column !important;
            padding: 3rem 1rem !important;
            gap: 3rem !important;
            min-height: auto !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          .dev-content-list-column {
            flex: none !important;
            width: 100% !important;
            max-width: 350px !important;
            min-height: 400px !important;
            border-radius: 12px !important;
            order: 1;
          }
          
          .dev-text-column {
            flex: none !important;
            max-width: 100% !important;
            text-align: center !important;
            font-size: 17px !important;
            padding-right: 0 !important;
            order: 2;
          }
        }
        
        @media (max-width: 480px) {
          .developers-pay-section {
            padding: 2rem 1rem !important;
            gap: 2rem !important;
          }
          
          .dev-content-list-column {
            max-width: 300px !important;
            min-height: 350px !important;
          }
          
          .dev-text-column {
            font-size: 16px !important;
            line-height: 1.6 !important;
          }
        }
      `}</style>
    </section>
  );
}