import React from 'react';

function OnboardingStep6() {
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
        padding: '16px'
      }}>
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start'
        }}>
          
          {/* Left Column */}
          <div style={{ flex: 1 }}>
            
            {/* Progress Stepper */}
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
                {/* Step 1 - Completed */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#066D5A',
                  border: '2px solid #066D5A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                </div>
                
                {/* Line - Active */}
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: '#066D5A',
                  margin: '0 8px'
                }} />
                
                {/* Step 2 - Completed */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#066D5A',
                  border: '2px solid #066D5A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                </div>
                
                {/* Line - Active */}
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: '#066D5A',
                  margin: '0 8px'
                }} />
                
                {/* Step 3 - Completed */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#066D5A',
                  border: '2px solid #066D5A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                </div>
                
                {/* Line - Active */}
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: '#066D5A',
                  margin: '0 8px'
                }} />
                
                {/* Step 4 - Completed */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#066D5A',
                  border: '2px solid #066D5A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                </div>
                
                {/* Line - Active */}
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: '#066D5A',
                  margin: '0 8px'
                }} />
                
                {/* Step 5 - Completed */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#066D5A',
                  border: '2px solid #066D5A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                </div>
                
                {/* Line - Active */}
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: '#066D5A',
                  margin: '0 8px'
                }} />
                
                {/* Step 6 - Active */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#066D5A',
                  border: '2px solid #066D5A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'white'
                  }} />
                </div>
                
                {/* Line */}
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: '#CABB9D',
                  margin: '0 8px'
                }} />
                
                {/* Step 7 - Inactive */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  border: '2px solid #CABB9D'
                }} />
              </div>
              
              {/* Step Labels */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                <span style={{ color: '#066D5A' }}>wallet</span>
                <span style={{ color: '#066D5A' }}>domain</span>
                <span style={{ color: '#066D5A' }}>pricing</span>
                <span style={{ color: '#066D5A' }}>mint</span>
                <span style={{ color: '#066D5A' }}>deploy</span>
                <span style={{ color: '#066D5A' }}>test</span>
                <span style={{ color: '#CABB9D' }}>success</span>
              </div>
            </div>
            
            {/* Testing & Verification Card */}
            <div style={{
              background: '#FAF9F6',
              padding: '32px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#066D5A',
                textAlign: 'left'
              }}>
                testing & verification
              </h2>
              
              {/* Gateway Protection Test */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                  margin: 0
                }}>
                  Gateway Protection Test
                </h4>
                <div style={{ marginTop: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Test URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://your-domain.com/test-page"
                    style={{
                      width: 'calc(100% - 24px)',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      marginBottom: '12px'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#066D5A'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  
                  <button style={{
                    padding: '8px 16px',
                    background: '#066D5A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#054d42'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#066D5A'}
                  >
                    Run Protection Test
                  </button>
                </div>
              </div>
              
              {/* Test Results */}
              <div style={{
                background: '#e8f5e8',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #4ade80'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>Protection Status:</strong> ✅ Active
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      Tachi gateway is protecting your content
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '14px' }}>Response Time:</strong> 120ms
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      Payment flow: Working
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Payment Flow Verification */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                  margin: 0
                }}>
                  Payment Flow Verification
                </h4>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', marginTop: '12px' }}>
                  <button style={{
                    padding: '8px 16px',
                    background: '#0082B2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#006a94'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#0082B2'}
                  >
                    Test Payment
                  </button>
                  <button style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: '#0082B2',
                    border: '1px solid #0082B2',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
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
                    View Transaction
                  </button>
                </div>
                
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  background: '#f8f9fa',
                  padding: '8px',
                  borderRadius: '4px'
                }}>
                  Last test payment: $0.01 USDC • Block #12345678 • 30 seconds ago
                </div>
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '24px'
            }}>
              <button style={{
                padding: '12px 24px',
                border: '2px solid #0082B2',
                borderRadius: '8px',
                background: 'transparent',
                color: '#0082B2',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
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
                back
              </button>
              <button style={{
                padding: '12px 24px',
                border: '2px solid #0082B2',
                borderRadius: '8px',
                background: '#0082B2',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#006a94';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#0082B2';
              }}
              >
                continue
              </button>
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

export default OnboardingStep6;
