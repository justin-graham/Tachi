// Step 4: Mint Tokens - Exact copy of Plasmic UI
import * as React from "react";

function OnboardingStep4() {
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
                
                {/* Step 4 - Active */}
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
                
                {/* Step 5 - Inactive */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  border: '2px solid #CABB9D'
                }} />
                
                {/* Line */}
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: '#CABB9D',
                  margin: '0 8px'
                }} />
                
                {/* Step 6 - Inactive */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  border: '2px solid #CABB9D'
                }} />
                
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
                <span style={{ color: '#CABB9D' }}>deploy</span>
                <span style={{ color: '#CABB9D' }}>test</span>
                <span style={{ color: '#CABB9D' }}>success</span>
              </div>
            </div>
            
            {/* Mint Tokens Card */}
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
                license creation
              </h2>
              
              {/* Content Usage Rights */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                  margin: 0
                }}>
                  Content Usage Rights
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px 16px',
                  marginTop: '12px'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#066D5A'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Allow AI training</span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#066D5A'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Allow commercial use</span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#066D5A'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Require attribution</span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#066D5A'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Allow derivative works</span>
                  </label>
                </div>
              </div>
              
              {/* License Summary Button */}
              <button
                style={{
                  width: '100%',
                  background: '#f8f9fa',
                  border: '2px solid #066D5A',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#066D5A';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.color = 'inherit';
                }}
                onClick={() => {
                  // Show modal - you can implement modal state management here
                  alert('Terms of Service Modal would open here');
                }}
              >
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'inherit',
                  margin: 0,
                  marginBottom: '8px'
                }}>
                  View License Terms →
                </h4>
                <div style={{ fontSize: '14px', lineHeight: '1.3', color: 'inherit', opacity: 0.8 }}>
                  CrawlNFT grants access to [domain] content at $0.01 USDC per page.
                  <br />
                  AI training & commercial use permitted, attribution not required.
                </div>
              </button>
              
              {/* Combined Gas Fee & Status */}
              <div style={{
                background: '#e3f2fd',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #90caf9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>Status:</strong> Ready to mint
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      Click "Continue" to create your CrawlNFT
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '14px' }}>Gas Fee:</strong> ~$2.50 USD
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      Base network deployment
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Advanced Settings */}
              <details style={{ marginBottom: '24px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: '500', color: '#374151' }}>
                  Advanced Settings
                </summary>
                <div style={{ padding: '12px 0' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      License Duration
                    </label>
                    <select
                      defaultValue="unlimited"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        background: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#066D5A'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                      <option value="1year">1 Year</option>
                      <option value="unlimited">Unlimited</option>
                    </select>
                  </div>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    marginBottom: '16px'
                  }}>
                    <input
                      type="checkbox"
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#066D5A'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Enable license transfers</span>
                  </label>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Maximum crawlers
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      defaultValue="10"
                      style={{
                        width: 'calc(100% - 24px)',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#066D5A'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>
              </details>
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

export default OnboardingStep4;
