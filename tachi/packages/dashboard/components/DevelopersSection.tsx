import React from 'react';
import VerticalBarsNoise from './VerticalBarsNoise';

export default function DevelopersSection() {
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
        <VerticalBarsNoise />
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
          <span style={{ fontWeight: '500' }}>For AI Developers</span>
          <br /><br />
          <span style={{ fontWeight: '500' }}>On-Demand Access:</span> No more anti-bot measures or legal uncertainties about scraping. If you need data, you can get it instantly by paying the small fee the publisher has set. Every request's price is transparent upfront, so you know exactly what each crawl will cost.
          <br /><br />
          <span style={{ fontWeight: '500' }}>Audit Trail:</span> Every access is recorded on-chain, creating an immutable log of what data was retrieved, when, and by whom. This audit trail means you can prove exactly which content you've accessed and paid for.
          <br /><br />
          <span style={{ fontWeight: '500' }}>Simple SDK, Low Latency:</span> You can integrate Tachi in minutes using simple SDKs. Built as a serverless edge gateway, Tachi adds negligible latency to your requests. In practice, an autonomous agent can pay and get the content as fast as a normal request.
        </p>
      </div>
    </section>
  );
}