import React from 'react';

export default function CustomFooter() {
  return (
    <footer style={{
      backgroundColor: '#E5E5E5',
      padding: '4rem 2rem',
      position: 'relative',
      minHeight: '80vh'
    }}>
      {/* Large background text */}
      <div style={{
        position: 'absolute',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 'clamp(11.5rem, 27.6vw, 34.5rem)',
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.4)',
        fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        letterSpacing: '-0.02em',
        lineHeight: '0.8',
        textAlign: 'center',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        tachi
      </div>

      {/* Content overlay */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        maxWidth: '1200px',
        margin: '0 auto',
        height: '100%'
      }}>
        {/* Left side - Pre-Release signup */}
        <div style={{
          maxWidth: '400px'
        }}>
          <h3 style={{
            fontSize: '1.8rem',
            fontWeight: '400',
            color: '#333',
            marginBottom: '2rem',
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }}>
            Pre-Release Sign Up
          </h3>
          
          <div style={{
            fontSize: '1.8rem',
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: '400',
            lineHeight: '1.2',
            color: '#333',
            letterSpacing: '-0.02em'
          }}>
            <input
              type="email"
              placeholder="E-Mail"
              style={{
                fontSize: 'inherit',
                lineHeight: 'inherit',
                fontFamily: 'inherit',
                fontWeight: 'inherit',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                borderBottom: '3px solid #FF7043',
                borderRadius: '0',
                transition: 'all 0.2s ease',
                padding: '0 0 4px 0',
                margin: '0',
                display: 'inline',
                verticalAlign: 'baseline',
                minWidth: '300px',
                color: '#FF7043',
              }}
              onFocus={(e) => {
                e.target.style.borderBottomWidth = '4px';
                e.target.style.borderBottomColor = '#E5633A';
              }}
              onBlur={(e) => {
                e.target.style.borderBottomWidth = '3px';
                e.target.style.borderBottomColor = '#FF7043';
              }}
            />
          </div>
        </div>

        {/* Right side - Navigation links */}
        <div style={{
          display: 'flex',
          gap: '4rem'
        }}>
          <div>
            <a href="/docs" style={{
              color: '#333',
              textDecoration: 'none',
              fontSize: '1rem',
              fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#52796F'}
            onMouseOut={(e) => e.currentTarget.style.color = '#333'}>
              Docs
            </a>
          </div>

          <div>
            <a href="/terms" style={{
              color: '#333',
              textDecoration: 'none',
              fontSize: '1rem',
              fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#52796F'}
            onMouseOut={(e) => e.currentTarget.style.color = '#333'}>
              Terms
            </a>
          </div>

          <div>
            <a href="/privacy" style={{
              color: '#333',
              textDecoration: 'none',
              fontSize: '1rem',
              fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#52796F'}
            onMouseOut={(e) => e.currentTarget.style.color = '#333'}>
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}