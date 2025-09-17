import * as React from "react";

interface OnboardingStepLayoutProps {
  currentStep: number;
  stepTitle: string;
  stepDescription: string;
  children: React.ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  backDisabled?: boolean;
  continueDisabled?: boolean;
  imageComponent?: React.ReactNode;
}

const StepIndicator = ({ step, isActive, isCompleted }: { step: number, isActive: boolean, isCompleted: boolean }) => (
  <div style={{
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: isActive || isCompleted 
      ? 'linear-gradient(135deg, #066D5A 0%, #048C6F 100%)' 
      : 'white',
    border: `3px solid ${isActive || isCompleted ? '#066D5A' : '#e2e8f0'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isActive || isCompleted 
      ? '0 4px 16px rgba(6, 109, 90, 0.3)' 
      : '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease'
  }}>
    {isActive && (
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: 'white'
      }} />
    )}
    {isCompleted && (
      <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>✓</span>
    )}
  </div>
);

export default function OnboardingStepLayout({
  currentStep,
  stepTitle,
  stepDescription,
  children,
  onBack,
  onContinue,
  backDisabled = false,
  continueDisabled = false,
  imageComponent
}: OnboardingStepLayoutProps) {
  const steps = ['wallet', 'domain', 'pricing', 'mint', 'deploy', 'test', 'success'];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #faf9f6 0%, #f8f7f4 100%)',
      fontFamily: '"Playfair Display", serif'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, white 0%, #f8f9fa 100%)',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(6, 109, 90, 0.1)'
        }}>
          <img 
            src="/images/logos/tachi_logo.svg"
            alt="Tachi Logo"
            style={{
              height: '40px',
              width: 'auto'
            }}
          />
          <div style={{
            marginLeft: '16px',
            color: '#066D5A',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            Onboarding
          </div>
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
              background: 'linear-gradient(135deg, white 0%, #f8f9fa 100%)',
              padding: '32px',
              marginBottom: '32px',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: '1px solid rgba(6, 109, 90, 0.1)'
            }}>
              
              {/* Step Indicators */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                {steps.map((_, index) => (
                  <React.Fragment key={index}>
                    <StepIndicator 
                      step={index + 1}
                      isActive={currentStep === index + 1}
                      isCompleted={currentStep > index + 1}
                    />
                    {index < steps.length - 1 && (
                      <div style={{
                        flex: 1,
                        height: '3px',
                        background: currentStep > index + 1 
                          ? 'linear-gradient(to right, #066D5A, #048C6F)'
                          : '#e2e8f0',
                        margin: '0 12px',
                        borderRadius: '2px',
                        transition: 'all 0.5s ease'
                      }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              {/* Step Labels */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
                fontWeight: '600',
                marginTop: '12px'
              }}>
                {steps.map((step, index) => (
                  <span 
                    key={step}
                    style={{ 
                      color: currentStep === index + 1 
                        ? '#066D5A' 
                        : currentStep > index + 1 
                          ? '#048C6F'
                          : '#94a3b8', 
                      textTransform: 'capitalize' 
                    }}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Main Content Card */}
            <div style={{
              background: 'linear-gradient(135deg, white 0%, #f8f9fa 100%)',
              padding: '40px',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: '1px solid rgba(6, 109, 90, 0.1)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  marginBottom: '12px',
                  color: '#066D5A',
                  textTransform: 'capitalize'
                }}>
                  {stepTitle}
                </h2>
                <p style={{
                  fontSize: '18px',
                  color: '#64748b',
                  margin: '0'
                }}>
                  {stepDescription}
                </p>
              </div>

              {children}
            </div>
            
            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              gap: '20px',
              marginTop: '40px',
              justifyContent: 'space-between'
            }}>
              <button 
                style={{
                  padding: '16px 32px',
                  border: '2px solid #066D5A',
                  borderRadius: '12px',
                  background: 'transparent',
                  color: '#066D5A',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: backDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: '"Playfair Display", serif',
                  opacity: backDisabled ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (!backDisabled) {
                    e.currentTarget.style.background = '#066D5A';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 109, 90, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!backDisabled) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#066D5A';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
                onClick={onBack}
                disabled={backDisabled}
              >
                Back
              </button>
              
              <button 
                style={{
                  padding: '16px 32px',
                  border: 'none',
                  borderRadius: '12px',
                  background: continueDisabled 
                    ? '#94a3b8' 
                    : 'linear-gradient(135deg, #066D5A 0%, #048C6F 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: continueDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: '"Playfair Display", serif',
                  boxShadow: continueDisabled 
                    ? 'none' 
                    : '0 4px 16px rgba(6, 109, 90, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (!continueDisabled) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #048C6F 0%, #066D5A 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 109, 90, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!continueDisabled) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #066D5A 0%, #048C6F 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(6, 109, 90, 0.3)';
                  }
                }}
                onClick={onContinue}
                disabled={continueDisabled}
              >
                Continue
              </button>
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div style={{ flex: 1 }}>
            {imageComponent || (
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 109, 90, 0.1) 0%, rgba(4, 140, 111, 0.2) 100%)',
                borderRadius: '16px',
                border: '2px solid rgba(6, 109, 90, 0.2)',
                overflow: 'hidden',
                position: 'relative',
                height: '600px'
              }}>
                <img 
                  src="/images/onboarding/wave6.png"
                  alt="Tachi Onboarding"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
                {/* Decorative overlay */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '12px',
                  height: '12px',
                  background: '#066D5A',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  width: '8px',
                  height: '8px',
                  background: '#048C6F',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite 1s'
                }}></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}