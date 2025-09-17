import React from 'react';

const ContentTypesList = () => {
  const contentTypes = [
    'Newsrooms',
    'Video Content',
    'Research Libraries',
    'Legal Notes',
    'Developer Docs',
    'Social Media',
    'Your Content'
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
    }}>
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
        >
          {content}
        </div>
      ))}
    </div>
  );
};

export default function CreatorsSection() {
  return (
    <section style={{
      padding: '4rem 0 4rem 2rem',
      backgroundColor: '#FAF9F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: '100vh',
      gap: '4rem'
    }}>
      <div style={{
        flex: '0 0 50%',
        minHeight: '600px',
        background: '#FAF9F6',
        borderRadius: '0 12px 12px 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
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
      }}>
        <p style={{ margin: '0 0 2rem 0' }}>
          <span style={{ fontWeight: '500' }}>Creator & Publisher Example Use</span>
          <br /><br />
          Scenario: you run your content and AI crawlers arrive daily. Blocking them protects value but loses opportunity. 
          With Tachi, you keep humans frictionless and charge bots per request, with instant USDC settlement.
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
              tachi-protect.tsx
            </span>
          </div>

          <div style={{ padding: '16px 16px 32px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                <span style={{ color: '#888', marginRight: '16px', fontSize: '15px' }}>1</span>
                <span style={{ color: '#0066cc' }}>const</span>
                <span style={{ color: '#333' }}> gw = </span>
                <span style={{ color: '#ff6600' }}>createGateway</span>
                <span style={{ color: '#333' }}>({'{'}</span>
                <span style={{ color: '#0066cc' }}>domain</span>
                <span style={{ color: '#333' }}>:</span>
                <span style={{ color: '#cc0000' }}>"carrywater.com"</span>
                <span style={{ color: '#333' }}>, </span>
                <span style={{ color: '#0066cc' }}>price</span>
                <span style={{ color: '#333' }}>:</span>
                <span style={{ color: '#663399' }}>0.01</span>
                <span style={{ color: '#333' }}> {'}'});</span>
              </div>
              <div>
                <span style={{ color: '#888', marginRight: '16px', fontSize: '15px' }}>2</span>
                <span style={{ color: '#0066cc' }}>await</span>
                <span style={{ color: '#333' }}> gw.</span>
                <span style={{ color: '#ff6600' }}>mintLicense</span>
                <span style={{ color: '#333' }}>({'{'} </span>
                <span style={{ color: '#0066cc' }}>terms</span>
                <span style={{ color: '#333' }}>:</span>
                <span style={{ color: '#cc0000' }}>"ipfs://QmCID"</span>
                <span style={{ color: '#333' }}> {'}'})</span>
              </div>
              <div>
                <span style={{ color: '#888', marginRight: '16px', fontSize: '15px' }}>3</span>
                <span style={{ color: '#888' }}># serving content to agent</span>
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
    </section>
  );
}