// Step 7: Success Page - Celebration and Dashboard Launch

function OnboardingStep7() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf9f6',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px'
      }}>
        <div style={{
          background: '#faf9f6',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <img 
            src="/plasmic/tachi_landing_page/images/image2.svg"
            alt="Tachi Logo"
            style={{
              height: '32px',
              width: 'auto'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start'
        }}>
          
          {/* Left Column */}
          <div style={{ flex: 1 }}>
            
            {/* Progress Stepper - All Complete */}
            <div style={{
              background: '#faf9f6',
              padding: '24px',
              marginBottom: '24px'
            }}>
              
              {/* Step Indicators */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                {/* All steps completed */}
                {[1, 2, 3, 4, 5, 6, 7].map((step, index) => (
                  <div key={step}>
                    {/* Step Circle */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: step === 7 ? '#066D5A' : '#4ade80',
                      border: `2px solid ${step === 7 ? '#066D5A' : '#4ade80'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {step === 7 ? (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'white'
                        }} />
                      ) : (
                        <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>✓</span>
                      )}
                    </div>
                    
                    {/* Line after each step except the last */}
                    {index < 6 && (
                      <div style={{
                        width: '100px',
                        height: '2px',
                        background: '#4ade80',
                        position: 'absolute',
                        marginTop: '-13px',
                        marginLeft: '24px'
                      }} />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Step Labels */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                <span style={{ color: '#4ade80' }}>wallet</span>
                <span style={{ color: '#4ade80' }}>domain</span>
                <span style={{ color: '#4ade80' }}>pricing</span>
                <span style={{ color: '#4ade80' }}>mint</span>
                <span style={{ color: '#4ade80' }}>deploy</span>
                <span style={{ color: '#4ade80' }}>test</span>
                <span style={{ color: '#066D5A' }}>success</span>
              </div>
            </div>
            
            {/* Success Card */}
            <div style={{
              background: '#FAF9F6',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '24px',
                textAlign: 'left',
                color: '#066D5A'
              }}>
                congratulations!
              </h2>
              
              {/* Main Success Message */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '24px',
                padding: '24px',
                background: '#e8f5e8',
                borderRadius: '12px',
                border: '2px solid #4ade80'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                <h3 style={{ 
                  fontSize: '24px', 
                  fontWeight: '600', 
                  color: '#066D5A',
                  marginBottom: '8px',
                  margin: 0
                }}>
                  Your Tachi Protection is Live!
                </h3>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#666', 
                  lineHeight: '1.5',
                  margin: '8px 0 0 0'
                }}>
                  Your content is now protected by the Tachi protocol. 
                  Crawlers will need to pay to access your valuable content.
                </p>
              </div>

              {/* Setup Summary Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ 
                  background: '#e3f2fd', 
                  padding: '16px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔗</div>
                  <div style={{ fontWeight: '600', color: '#066D5A', fontSize: '14px' }}>Connected</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Wallet & Domain</div>
                </div>
                
                <div style={{ 
                  background: '#e8f5e8', 
                  padding: '16px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
                  <div style={{ fontWeight: '600', color: '#066D5A', fontSize: '14px' }}>$0.01</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Per Crawl (USDC)</div>
                </div>
                
                <div style={{ 
                  background: '#fff3cd', 
                  padding: '16px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚀</div>
                  <div style={{ fontWeight: '600', color: '#066D5A', fontSize: '14px' }}>Live</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Gateway Deployed</div>
                </div>
              </div>

              {/* Protection Stats */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h4 style={{ 
                  marginBottom: '16px', 
                  color: '#066D5A',
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: 0
                }}>Your Protection Stats</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px',
                  marginTop: '16px'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      color: '#066D5A',
                      lineHeight: '1.2'
                    }}>
                      Token ID: #12345
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>CrawlNFT License</div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      color: '#066D5A',
                      lineHeight: '1.2'
                    }}>
                      100% Uptime
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Gateway Status</div>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ 
                  marginBottom: '16px', 
                  color: '#066D5A',
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: 0
                }}>What's Next?</h4>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '16px' }}>📊</span>
                    <span style={{ fontSize: '14px', color: '#374151' }}>Monitor your earnings and crawl activity</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '16px' }}>⚙️</span>
                    <span style={{ fontSize: '14px', color: '#374151' }}>Adjust pricing based on demand</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '16px' }}>🔗</span>
                    <span style={{ fontSize: '14px', color: '#374151' }}>Share your protected content links</span>
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <button style={{
                  padding: '16px 48px',
                  fontSize: '18px',
                  fontWeight: '600',
                  background: '#066D5A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(6, 109, 90, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#055a4a';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#066D5A';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  Launch Dashboard →
                </button>
              </div>

              {/* Secondary Actions */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '12px',
                fontSize: '14px'
              }}>
                <button style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#0082B2',
                  border: '1px solid #0082B2',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#0082B2';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#0082B2';
                }}
                >
                  View Documentation
                </button>
                <button style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#0082B2',
                  border: '1px solid #0082B2',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#0082B2';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#0082B2';
                }}
                >
                  Download Summary
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div style={{ flex: 1 }}>
            <img 
              src="/plasmic/tachi_landing_page/images/tachiPitchDeck18Png.png"
              alt="Tachi Onboarding"
              style={{
                width: '100%',
                height: '550px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingStep7;
