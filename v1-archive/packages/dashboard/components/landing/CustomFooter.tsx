import React, { useState } from 'react';

export default function CustomFooter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thank you! Now go get some sun on your skin.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };
  return (
    <footer id="signup-section" style={{
      backgroundColor: '#E5E5E5',
      padding: '4rem 2rem',
      position: 'relative',
      minHeight: '80vh'
    }} className="footer-section">
      {/* Large background text */}
      <div style={{
        position: 'absolute',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 'clamp(13rem, 30vw, 38rem)',
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.4)',
        fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        letterSpacing: '-0.02em',
        lineHeight: '0.8',
        textAlign: 'center',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 1
      }} className="footer-background-text">
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
      }} className="footer-content">
        {/* Left side - Pre-Release signup */}
        <div style={{
          maxWidth: '400px'
        }} className="signup-section">
          <h3 style={{
            fontSize: '1.8rem',
            fontWeight: '400',
            color: '#333',
            marginBottom: '2rem',
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }} className="signup-title">
            Pre-Release Sign Up
          </h3>
          
          <form onSubmit={handleSubmit} style={{
            fontSize: '1.8rem',
            fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: '400',
            lineHeight: '1.2',
            color: '#333',
            letterSpacing: '-0.02em'
          }}>
            <div style={{ display: 'block' }}>
              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
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
                  margin: '0 0 1.5rem 0',
                  display: 'block',
                  minWidth: '300px',
                  color: '#FF7043',
                  opacity: status === 'loading' ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  e.target.style.borderBottomWidth = '4px';
                  e.target.style.borderBottomColor = '#E5633A';
                }}
                onBlur={(e) => {
                  e.target.style.borderBottomWidth = '3px';
                  e.target.style.borderBottomColor = '#FF7043';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  fontFamily: 'inherit',
                  fontWeight: 'inherit',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  borderRadius: '0',
                  transition: 'all 0.2s ease',
                  padding: '0',
                  margin: '0',
                  color: '#333',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: status === 'loading' ? 0.6 : 1,
                  letterSpacing: '-0.02em'
                }}
              >
                {status === 'loading' ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            {message && (
              <div style={{
                marginTop: '1rem',
                fontSize: '1rem',
                color: status === 'success' ? '#52796F' : '#E5633A',
                fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {message}
              </div>
            )}
          </form>
        </div>

        {/* Right side - Navigation links (disabled for pre-release) */}
        <div style={{
          display: 'flex',
          gap: '2.5rem'
        }}>
          <div>
            <span style={{
              color: '#999',
              textDecoration: 'none',
              fontSize: '1rem',
              fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              cursor: 'not-allowed',
              opacity: 0.5
            }}>
              Docs
            </span>
          </div>

          <div>
            <span style={{
              color: '#999',
              textDecoration: 'none',
              fontSize: '1rem',
              fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              cursor: 'not-allowed',
              opacity: 0.5
            }}>
              Terms
            </span>
          </div>

          <div>
            <span style={{
              color: '#999',
              textDecoration: 'none',
              fontSize: '1rem',
              fontFamily: '"Coinbase Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              cursor: 'not-allowed',
              opacity: 0.5
            }}>
              Privacy Policy
            </span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .footer-section {
            padding: 4rem 1rem 6rem 1rem !important;
            min-height: 80vh !important;
            text-align: center;
          }
          
          .footer-background-text {
            top: 70% !important;
            font-size: clamp(9rem, 24vw, 14rem) !important;
            opacity: 0.4 !important;
            z-index: 1 !important;
          }
          
          .footer-content {
            flex-direction: column !important;
            gap: 4rem !important;
            text-align: center !important;
            align-items: center !important;
            justify-content: flex-start !important;
            position: relative !important;
            z-index: 10 !important;
          }
          
          .signup-section {
            max-width: 100% !important;
            width: 100% !important;
            margin-top: 2rem !important;
          }
          
          .signup-title {
            font-size: 1.5rem !important;
            margin-bottom: 2rem !important;
            text-align: center !important;
          }
          
          .signup-section input {
            text-align: center !important;
          }
        }
        
        @media (max-width: 480px) {
          .footer-section {
            padding: 3rem 1rem 5rem 1rem !important;
            min-height: 70vh !important;
          }
          
          .footer-background-text {
            font-size: clamp(7rem, 20vw, 11rem) !important;
            top: 75% !important;
            opacity: 0.35 !important;
          }
          
          .footer-content {
            gap: 3rem !important;
            margin-top: 1rem !important;
          }
          
          .signup-title {
            font-size: 1.3rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          .signup-section input {
            text-align: center !important;
          }
        }
      `}</style>
    </footer>
  );
}