import React from 'react';

function OnboardingStep5() {
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
                
                {/* Step 5 - Active */}
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
                <span style={{ color: '#066D5A' }}>deploy</span>
                <span style={{ color: '#CABB9D' }}>test</span>
                <span style={{ color: '#CABB9D' }}>success</span>
              </div>
            </div>
            
            {/* Gateway Deployment Card */}
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
                gateway deployment
              </h2>
              
              {/* Cloudflare Account */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                  margin: 0
                }}>
                  Cloudflare Account
                </h4>
                <div style={{ marginTop: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    API Token
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your Cloudflare API token"
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
                  
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Zone ID
                  </label>
                  <input
                    type="text"
                    placeholder="Your domain's zone ID"
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
                  
                  <button style={{
                    marginTop: '8px',
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
                    Connect Account
                  </button>
                </div>
              </div>
              
              {/* Worker Code */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Worker Code (Generated)
                </label>
                <textarea
                  readOnly
                  rows={6}
                  style={{
                    width: 'calc(100% - 24px)',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    background: '#f8f9fa',
                    resize: 'none',
                    outline: 'none'
                  }}
                  defaultValue={`addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Tachi protection logic
  const crawlPrice = 0.01; // USDC
  return new Response('Protected by Tachi')
}`}
                />
              </div>
              
              {/* Protected Paths */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                  margin: 0
                }}>
                  Protected Paths
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
                    <span style={{ fontSize: '14px', color: '#374151' }}>All pages (/)</span>
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
                    <span style={{ fontSize: '14px', color: '#374151' }}>Articles (/articles/)</span>
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
                    <span style={{ fontSize: '14px', color: '#374151' }}>Content (/content/)</span>
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
                    <span style={{ fontSize: '14px', color: '#374151' }}>Blog (/blog/)</span>
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
                    <span style={{ fontSize: '14px', color: '#374151' }}>Exclude public (/public/)</span>
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
                    <span style={{ fontSize: '14px', color: '#374151' }}>Exclude images (/images/)</span>
                  </label>
                </div>
              </div>
              
              {/* Rate Limiting */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    <span style={{ fontSize: '14px', color: '#374151' }}>Enable rate limiting</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: '#374151' }}>Max requests per minute:</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      defaultValue="60"
                      style={{
                        width: '80px',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#066D5A'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>
              </div>
              
              {/* Combined Deployment Status & Time */}
              <div style={{
                background: '#e3f2fd',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #90caf9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>Deployment Status:</strong> Ready to deploy
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      Worker will be deployed to: your-domain.com
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '14px' }}>Deployment Time:</strong> ~30 seconds
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      Global propagation: ~2 minutes
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Deployment Method */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                  margin: 0
                }}>
                  Deployment Method
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="deployMethod"
                      value="auto"
                      defaultChecked
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#066D5A'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Auto-deploy (Recommended)</span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="deployMethod"
                      value="manual"
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#066D5A'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Download code for manual deployment</span>
                  </label>
                </div>
              </div>
              
              {/* Manual Deployment Instructions */}
              <details style={{ marginBottom: '24px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: '500', color: '#374151' }}>
                  Manual Deployment Instructions
                </summary>
                <div style={{
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  marginTop: '8px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  <ol style={{ paddingLeft: '20px', margin: 0 }}>
                    <li>Download the generated worker code</li>
                    <li>Login to your Cloudflare dashboard</li>
                    <li>Navigate to Workers & Pages</li>
                    <li>Create a new Worker</li>
                    <li>Paste the code and deploy</li>
                    <li>Add route: your-domain.com/*</li>
                  </ol>
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

export default OnboardingStep5;
