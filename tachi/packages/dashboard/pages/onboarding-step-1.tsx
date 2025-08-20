// Step 1: Wallet Connection - Exact copy of Plasmic UI
import * as React from "react";

function OnboardingStep1() {
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
                {/* Step 1 - Active */}
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
                
                {/* Step 2 - Inactive */}
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
                
                {/* Step 3 - Inactive */}
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
                
                {/* Step 4 - Inactive */}
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
                <span style={{ color: '#CABB9D' }}>domain</span>
                <span style={{ color: '#CABB9D' }}>pricing</span>
                <span style={{ color: '#CABB9D' }}>mint</span>
                <span style={{ color: '#CABB9D' }}>deploy</span>
                <span style={{ color: '#CABB9D' }}>test</span>
                <span style={{ color: '#CABB9D' }}>success</span>
              </div>
            </div>
            
            {/* Wallet Connection Card */}
            <div style={{
              background: '#FAF9F6',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                textAlign: 'left',
                color: '#066D5A'
              }}>
                connect wallet
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* MetaMask */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: '#CABB9D',
                  border: '1px solid #CABB9D',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#066D5A'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#CABB9D'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: '#f97316',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '16px' }}>🦊</span>
                    </div>
                    <span style={{ fontWeight: '500' }}>MetaMask</span>
                  </div>
                  <span style={{ fontSize: '16px', color: '#066D5A' }}>▶</span>
                </div>
                
                {/* CoinBase Wallet */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: '#CABB9D',
                  border: '1px solid #CABB9D',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#066D5A'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#CABB9D'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: '#2563eb',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '16px' }}>C</span>
                    </div>
                    <span style={{ fontWeight: '500' }}>CoinBase Wallet</span>
                  </div>
                  <span style={{ fontSize: '16px', color: '#066D5A' }}>▶</span>
                </div>
                
                {/* WalletConnect */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: '#CABB9D',
                  border: '1px solid #CABB9D',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#066D5A'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#CABB9D'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: '#3b82f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '16px' }}>W</span>
                    </div>
                    <span style={{ fontWeight: '500' }}>WalletConnect</span>
                  </div>
                  <span style={{ fontSize: '16px', color: '#066D5A' }}>▶</span>
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

export default OnboardingStep1;
