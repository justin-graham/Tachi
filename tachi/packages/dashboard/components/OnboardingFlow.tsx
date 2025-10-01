import React, { useState, useEffect, useRef } from 'react';
import Background from './Background';
import StandardButton from './StandardButton';
import TermsAndConditionsStep from './TermsAndConditionsStep';
import '../styles/background.css';

// Error display component
const ErrorMessage = ({ error }: { error?: string }) => {
  if (!error) return null;
  return (
    <p style={{
      color: '#dc2626',
      fontSize: '12px',
      marginTop: '4px',
      fontWeight: '500'
    }}>
      {error}
    </p>
  );
};

// HourglassSpiral component for success step
const HourglassSpiral = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import for THREE.js
    const initThreeJS = async () => {
      const THREE = await import('three');

      // Setup scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#FAF9F6');
      
      // Setup camera
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.z = 16;
      camera.position.y = 0;
      
      // Setup renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(400, 400);
      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }
      
      // Create main group
      const pineCone = new THREE.Group();
      
      // Begin with the smallest elements
      const particleCount = 10000;  // The many that arise from one
      const particles = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);  // Space for growth
      const colors = new Float32Array(particleCount * 3);     // Potential for form
      const sizes = new Float32Array(particleCount);          // Room to develop
      
      for (let i = 0; i < particleCount; i++) {
        // Create hourglass shape with particles
        const t = i / particleCount;
        // const layer = t * 40;
        // const angle = layer * 0.3 + Math.random() * 0.2;
        const spiralAngle = t * Math.PI * 40;
        
        let radius;
        if (t < 0.3) {
          // Top bulge
          radius = Math.sin(t * Math.PI / 0.3) * 2.5;
        } else if (t < 0.5) {
          // Middle pinch - create hourglass waist
          radius = 2.5 - (Math.sin((t - 0.3) * Math.PI / 0.2)) * 1.5;
        } else if (t < 0.7) {
          // Begin expansion after pinch
          radius = 1 + (Math.sin((t - 0.5) * Math.PI / 0.2)) * 2;
        } else {
          // Bottom bulge
          radius = 3 - (Math.sin((t - 0.7) * Math.PI / 0.3)) * 1;
        }
        
        // Add some randomness for organic feel
        radius += (Math.random() - 0.5) * 0.1;
        
        const y = t * 16 - 8;
        const x = Math.cos(spiralAngle) * radius;
        const z = Math.sin(spiralAngle) * radius;
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Set all particles to black
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0;
        
        // Vary particle sizes
        sizes[i] = Math.random() * 0.03 + 0.01;
      }
      
      particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      const particleMaterial = new THREE.PointsMaterial({
        size: 0.02,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.NormalBlending
      });
      
      const particleSystem = new THREE.Points(particles, particleMaterial);
      pineCone.add(particleSystem);
      
      // Add some structural lines - keeping these gray
      const lineMaterial = new THREE.LineBasicMaterial({
        color: '#888888',
        transparent: true,
        opacity: 0.3
      });
      
      // Spiral structure
      const spiralPoints: THREE.Vector3[] = [];
      for (let i = 0; i < 200; i++) {
        const t = i / 200;
        const angle = t * Math.PI * 16;
        const y = t * 16 - 8;
        
        let radius;
        if (t < 0.3) {
          // Top bulge
          radius = Math.sin(t * Math.PI / 0.3) * 2.5;
        } else if (t < 0.5) {
          // Middle pinch - create hourglass waist
          radius = 2.5 - (Math.sin((t - 0.3) * Math.PI / 0.2)) * 1.5;
        } else if (t < 0.7) {
          // Begin expansion after pinch
          radius = 1 + (Math.sin((t - 0.5) * Math.PI / 0.2)) * 2;
        } else {
          // Bottom bulge
          radius = 3 - (Math.sin((t - 0.7) * Math.PI / 0.3)) * 1;
        }
        
        spiralPoints.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius
        ));
      }
      
      const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
      const spiralLine = new THREE.Line(spiralGeometry, lineMaterial);
      pineCone.add(spiralLine);
      
      scene.add(pineCone);
      
      let time = 0;
      let animationFrameId: number;
      
      function animate() {
        animationFrameId = requestAnimationFrame(animate);
        
        time += 0.005;  // Halved speed
        
        pineCone.rotation.y = time * 0.45;  // Increased rotation speed
        pineCone.rotation.x = Math.sin(time * 0.25) * 0.05;  // Halved speed
        pineCone.rotation.z = Math.cos(time * 0.35) * 0.03;  // Halved speed
        
        const breathe = 1 + Math.sin(time * 0.25) * 0.02;  // Halved speed
        pineCone.scale.set(breathe, breathe, breathe);
        
        // Animate particles slightly
        const positions = particleSystem.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += Math.sin(time + i) * 0.00005;  // Halved movement
          positions[i + 1] += Math.cos(time + i) * 0.00005;  // Halved movement
          positions[i + 2] += Math.sin(time + i + 1) * 0.00005;  // Halved movement
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
        
        renderer.render(scene, camera);
      }
      
      animate();
      
      // Cleanup function
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        
        // Dispose of geometries
        if (particles) {
          particles.dispose();
        }
        if (spiralGeometry) {
          spiralGeometry.dispose();
        }
        
        // Dispose of materials
        if (particleMaterial) {
          particleMaterial.dispose();
        }
        if (lineMaterial) {
          lineMaterial.dispose();
        }
        
        // Remove objects from scene
        if (pineCone) {
          if (particleSystem) {
            pineCone.remove(particleSystem);
          }
          if (spiralLine) {
            pineCone.remove(spiralLine);
          }
          scene.remove(pineCone);
        }
        
        // Clear scene
        if (scene) {
          scene.clear();
        }
        
        // Dispose of renderer
        if (renderer) {
          if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
            containerRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
          renderer.forceContextLoss();
        }
        
        // Clear arrays to prevent memory leaks
        positions.fill(0);
        colors.fill(0);
        sizes.fill(0);
        spiralPoints.length = 0;
        
        // Reset time variable
        time = 0;
      };
    };

    initThreeJS().catch(console.error);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FAF9F6',
      borderRadius: '8px',
      overflow: 'hidden',
      width: '400px',
      height: '400px',
      margin: '0 auto'
    }}>
      <div 
        ref={containerRef}
        style={{
          width: '400px',
          height: '400px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
    </div>
  );
};

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    wallet: '',
    domain: '',
    siteTitle: '',
    categories: [] as string[],
    pricePerCrawl: 0.01,
    currency: 'USDC',
    usageRights: {
      aiTraining: true,
      commercialUse: true,
      attribution: false,
      derivatives: false
    },
    termsAccepted: false,
    cloudflareToken: '',
    deployMethod: 'auto',
    testUrl: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = ['wallet', 'domain', 'pricing', 'terms', 'mint', 'deploy', 'test', 'success'];

  // Validation functions
  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    switch (step) {
      case 1: // Wallet connection
        if (!formData.wallet) {
          newErrors.wallet = 'Please select a wallet to continue';
        }
        break;
      
      case 2: // Domain and site details
        if (!formData.domain.trim()) {
          newErrors.domain = 'Domain is required';
        } else if (!formData.domain.includes('.') || formData.domain.length < 4) {
          newErrors.domain = 'Please enter a valid domain (e.g., example.com)';
        }
        
        if (!formData.siteTitle.trim()) {
          newErrors.siteTitle = 'Site title is required';
        } else if (formData.siteTitle.trim().length < 2) {
          newErrors.siteTitle = 'Site title must be at least 2 characters';
        }
        break;
      
      case 3: // Pricing
        if (!formData.pricePerCrawl || formData.pricePerCrawl <= 0) {
          newErrors.pricePerCrawl = 'Price must be greater than 0';
        } else if (formData.pricePerCrawl > 10) {
          newErrors.pricePerCrawl = 'Price cannot exceed $10 per crawl';
        } else if (formData.pricePerCrawl < 0.0001) {
          newErrors.pricePerCrawl = 'Price must be at least $0.0001';
        }
        break;
      
      case 4: // Terms & Conditions
        if (!formData.termsAccepted) {
          newErrors.terms = 'You must accept the Terms and Conditions to proceed';
        }
        break;
      
      case 6: // Deployment
        if (!formData.cloudflareToken.trim()) {
          newErrors.cloudflareToken = 'Cloudflare API token is required';
        } else if (formData.cloudflareToken.trim().length < 10) {
          newErrors.cloudflareToken = 'Please enter a valid Cloudflare API token';
        }
        break;
      
      case 7: // Testing
        if (!formData.testUrl.trim()) {
          newErrors.testUrl = 'Test URL is required';
        } else {
          try {
            new URL(formData.testUrl);
          } catch {
            newErrors.testUrl = 'Please enter a valid URL (e.g., https://example.com)';
          }
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Async operation handlers with error handling
  const handleMinting = async () => {
    try {
      setIsProcessing(true);
      setErrors({});
      
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate potential errors
      if (Math.random() < 0.1) { // 10% chance of error for demo
        throw new Error('Minting failed: Insufficient gas fee. Please ensure you have enough ETH on Base network.');
      }
      
      // Success - proceed to next step
      setCurrentStep(currentStep + 1);
    } catch (error) {
      setErrors({ 
        minting: error instanceof Error ? error.message : 'Minting failed. Please try again.' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeployment = async () => {
    try {
      setIsProcessing(true);
      setErrors({});
      
      // Validate before deployment
      if (!validateStep(5)) {
        setIsProcessing(false);
        return;
      }
      
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate potential errors
      if (Math.random() < 0.15) { // 15% chance of error for demo
        throw new Error('Deployment failed: Invalid Cloudflare API token or insufficient permissions. Please check your token.');
      }
      
      // Success - proceed to next step
      setCurrentStep(currentStep + 1);
    } catch (error) {
      setErrors({ 
        deployment: error instanceof Error ? error.message : 'Deployment failed. Please check your Cloudflare settings and try again.' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTesting = async () => {
    try {
      setIsProcessing(true);
      setErrors({});
      
      // Validate before testing
      if (!validateStep(6)) {
        setIsProcessing(false);
        return;
      }
      
      // Simulate testing process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate potential errors
      if (Math.random() < 0.2) { // 20% chance of error for demo
        throw new Error('Test failed: Unable to reach the specified URL. Please check that your domain is correctly configured.');
      }
      
      // Success - proceed to next step
      setCurrentStep(currentStep + 1);
    } catch (error) {
      setErrors({ 
        testing: error instanceof Error ? error.message : 'Test failed. Please verify your URL and try again.' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 7) {
      // Validate current step before proceeding
      if (validateStep(currentStep)) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category)
    }));
  };

  const handleUsageRightChange = (right: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      usageRights: { ...prev.usageRights, [right]: checked }
    }));
  };

  const handleTermsAcceptance = (accepted: boolean) => {
    setFormData(prev => ({
      ...prev,
      termsAccepted: accepted
    }));
    // Clear any existing terms error when user accepts
    if (accepted && errors.terms) {
      setErrors(prev => {
        const { terms, ...rest } = prev;
        return rest;
      });
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Connect Wallet';
      case 2: return 'Site Details';
      case 3: return 'Pricing Configuration';
      case 4: return 'Terms & Conditions';
      case 5: return 'License Creation';
      case 6: return 'Gateway Deployment';
      case 7: return 'Testing & Verification';
      case 8: return 'Your Tachi Protection is Live!';
      default: return 'Connect Wallet';
    }
  };



  return (
    <div style={{
      height: '100vh',
      position: 'relative',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '72px 72px',
      boxSizing: 'border-box'
    }}>
      <Background />
      
      <div style={{
        maxWidth: '1238px',
        width: '100%',
        height: 'calc(110vh - 158px)',
        backgroundColor: '#FAF9F6',
        padding: '40px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FAF9F6 0%, #FAF9F6 70%, #F8F4E6 100%)',
        border: 'none',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)'
      }}>
        
        {/* Progress Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '40px',
          gap: '20px'
        }}>
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: currentStep === index + 1 
                    ? '#52796F' 
                    : currentStep > index + 1 
                      ? '#52796F'
                      : '#888',
                  border: '2px solid #52796F'
                }} />
                <span style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: currentStep === index + 1 || currentStep > index + 1 ? '#52796F' : '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div style={{
                  width: '30px',
                  height: '2px',
                  backgroundColor: currentStep > index + 1 ? '#52796F' : '#888',
                  marginTop: '-20px'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Title */}
        <h1 style={{
          fontSize: currentStep === 2 || currentStep === 4 || currentStep === 5 ? '2.2rem' : '2.5rem',
          fontWeight: 'bold',
          color: '#FF7043',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: currentStep === 2 || currentStep === 4 || currentStep === 5 ? '15px' : '20px',
          lineHeight: '1.2'
        }}>
          {getStepTitle()}
        </h1>

        {/* Step Description */}

        {/* Step Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: currentStep === 2 || currentStep === 4 || currentStep === 5 ? '15px' : '20px',
          width: '70%',
          margin: '0 auto'
        }}>
          
          {/* Step 1: Connect Wallet */}
          {currentStep === 1 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
                {[
                  { name: 'MetaMask', icon: '🦊', color: '#f97316', isText: true },
                  { name: 'Coinbase Wallet', icon: '/images/coinbase.svg', color: '#FF7043', isText: false },
                  { name: 'WalletConnect', icon: '/images/Walletconnect-logo.png', color: '#3b82f6', isText: false }
                ].map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleInputChange('wallet', wallet.name)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '20px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: formData.wallet === wallet.name ? '#FF7043' : '#FF7043',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: '8px',
                      minHeight: '120px'
                    }}
                    onMouseOver={(e) => {
                      if (formData.wallet !== wallet.name) {
                        e.currentTarget.style.backgroundColor = '#FFF5F3';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (formData.wallet !== wallet.name) {
                        e.currentTarget.style.backgroundColor = '#FAF9F6';
                      }
                    }}
                  >
                    <div style={{
                      width: '72px',
                      height: '72px',
                      backgroundColor: wallet.isText ? wallet.color : 'transparent',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '36px',
                      fontWeight: 'bold'
                    }}>
                      {wallet.isText ? (
                        wallet.icon
                      ) : (
                        <img
                          src={wallet.icon}
                          alt={wallet.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                    </div>
                    <span style={{ textAlign: 'center' }}>{wallet.name}</span>
                  </button>
                ))}
              </div>
              <ErrorMessage error={errors.wallet} />
            </>
          )}

          {/* Step 2: Site Details */}
          {currentStep === 2 && (
            <>
              <div>
                <input
                  type="text"
                  placeholder="Your domain (e.g., your-site.com)"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  className="w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 border-[#FF7043] placeholder-[#FF7043]"
                />
                <ErrorMessage error={errors.domain} />
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="Site title (e.g., My Blog)"
                  value={formData.siteTitle}
                  onChange={(e) => handleInputChange('siteTitle', e.target.value)}
                  className="w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 border-[#FF7043] placeholder-[#FF7043]"
                />
                <ErrorMessage error={errors.siteTitle} />
              </div>

              <div style={{ textAlign: 'left' }}>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Content Categories:
                </p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px' 
                }}>
                  {['News & Journalism', 'Blog & Opinion', 'Research & Academic', 'Technical Documentation', 'Creative Content', 'Other'].map((category) => (
                    <label key={category} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      position: 'relative'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={(e) => handleCategoryChange(category, e.target.checked)}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{
                        padding: '8px 12px',
                        border: '2px solid #FF7043',
                        backgroundColor: formData.categories.includes(category) ? '#FF7043' : '#FAF9F6',
                        color: formData.categories.includes(category) ? 'white' : 'black',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        textAlign: 'center'
                      }}>
                        {category}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Pricing */}
          {currentStep === 3 && (
            <>
              <div>
                <input
                  type="number"
                  min="0.0001"
                  max="3.00"
                  step="0.0001"
                  placeholder="Price per crawl (e.g., 0.01)"
                  value={formData.pricePerCrawl}
                  onChange={(e) => handleInputChange('pricePerCrawl', parseFloat(e.target.value))}
                  className="w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 border-[#FF7043] placeholder-[#FF7043]"
                />
                <ErrorMessage error={errors.pricePerCrawl} />
              </div>
              
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '3px solid #FF7043',
                  backgroundColor: '#FAF9F6',
                  fontSize: '16px',
                  color: 'black',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  height: '48px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 112, 67, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="USDC">USDC</option>
                <option value="ETH">ETH</option>
                <option value="MATIC">MATIC</option>
              </select>
            </>
          )}

          {/* Step 4: Terms & Conditions */}
          {currentStep === 4 && (
            <>
              <TermsAndConditionsStep
                onAcceptanceChange={handleTermsAcceptance}
                isAccepted={formData.termsAccepted}
              />
              <ErrorMessage error={errors.terms} />
            </>
          )}

          {/* Step 5: License Creation */}
          {currentStep === 5 && (
            <>
              <div style={{ textAlign: 'left' }}>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Content Usage Rights:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: 'aiTraining', label: 'Allow AI training' },
                    { key: 'commercialUse', label: 'Allow commercial use' },
                    { key: 'attribution', label: 'Require attribution' },
                    { key: 'derivatives', label: 'Limit derivative works' }
                  ].map((right) => (
                    <label key={right.key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      position: 'relative'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.usageRights[right.key as keyof typeof formData.usageRights]}
                        onChange={(e) => handleUsageRightChange(right.key, e.target.checked)}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{
                        padding: '10px 15px',
                        border: '2px solid #FF7043',
                        backgroundColor: formData.usageRights[right.key as keyof typeof formData.usageRights] ? '#FF7043' : '#FAF9F6',
                        color: formData.usageRights[right.key as keyof typeof formData.usageRights] ? 'white' : 'black',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        textAlign: 'center'
                      }}>
                        {right.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{
                padding: '20px',
                border: '3px solid #FF7043',
                backgroundColor: '#B8D4C7',
                textAlign: 'center'
              }}>
                <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>
                  Status: {formData.termsAccepted ? 'Ready to mint' : 'Terms acceptance required'}
                </p>
                <StandardButton
                  onClick={handleMinting}
                  disabled={isProcessing || !formData.termsAccepted}
                  variant="primary"
                  size="md"
                  style={{ 
                    opacity: (isProcessing || !formData.termsAccepted) ? 0.6 : 1,
                    cursor: (isProcessing || !formData.termsAccepted) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isProcessing ? 'Minting...' : 'Mint License NFT'}
                </StandardButton>
              </div>
              <ErrorMessage error={errors.minting} />
            </>
          )}

          {/* Step 6: Gateway Deployment */}
          {currentStep === 6 && (
            <>
              <div>
                <input
                  type="password"
                  placeholder="Cloudflare API Token"
                  value={formData.cloudflareToken}
                  onChange={(e) => handleInputChange('cloudflareToken', e.target.value)}
                  className="w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 border-[#FF7043] placeholder-[#FF7043]"
                />
                <ErrorMessage error={errors.cloudflareToken} />
              </div>

              <div style={{ textAlign: 'left' }}>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Deployment Method:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { value: 'auto', label: 'Auto-deploy (Recommended)' },
                    { value: 'manual', label: 'Download code for manual deployment' }
                  ].map((method) => (
                    <label key={method.value} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      position: 'relative'
                    }}>
                      <input
                        type="radio"
                        name="deployMethod"
                        value={method.value}
                        checked={formData.deployMethod === method.value}
                        onChange={(e) => handleInputChange('deployMethod', e.target.value)}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{
                        padding: '10px 15px',
                        border: '2px solid #FF7043',
                        backgroundColor: formData.deployMethod === method.value ? '#FF7043' : '#FAF9F6',
                        color: formData.deployMethod === method.value ? 'white' : 'black',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        textAlign: 'center'
                      }}>
                        {method.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{
                padding: '20px',
                border: '3px solid #FF7043',
                backgroundColor: '#B8D4C7',
                textAlign: 'center'
              }}>
                <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>Deployment Time: ~30 seconds</p>
                <StandardButton
                  onClick={handleDeployment}
                  disabled={isProcessing}
                  variant="primary"
                  size="md"
                  style={{ 
                    opacity: isProcessing ? 0.6 : 1,
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isProcessing ? 'Deploying...' : 'Deploy to Cloudflare'}
                </StandardButton>
              </div>
              <ErrorMessage error={errors.deployment} />
            </>
          )}

          {/* Step 7: Testing */}
          {currentStep === 7 && (
            <>
              <div>
                <input
                  type="url"
                  placeholder="Test URL (e.g., https://your-domain.com/test-page)"
                  value={formData.testUrl}
                  onChange={(e) => handleInputChange('testUrl', e.target.value)}
                  className="w-full px-0 py-2 text-[#FF7043] bg-transparent border-0 border-b focus:outline-none focus:border-orange-600 border-[#FF7043] placeholder-[#FF7043]"
                />
                <ErrorMessage error={errors.testUrl} />
              </div>
              
              <StandardButton
                onClick={handleTesting}
                disabled={isProcessing}
                variant="primary"
                size="md"
                style={{ 
                  opacity: isProcessing ? 0.6 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing ? 'Testing...' : 'Run Test'}
              </StandardButton>
              <ErrorMessage error={errors.testing} />
            </>
          )}

          {/* Step 8: Success */}
          {currentStep === 8 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '30px'
            }}>
              <HourglassSpiral />
              
              <StandardButton 
                onClick={() => window.location.href = '/dashboard'}
                variant="primary"
                size="lg"
              >
                Go to Dashboard
              </StandardButton>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 8 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '20px',
            marginTop: currentStep === 2 || currentStep === 4 || currentStep === 5 ? '30px' : '40px',
            width: '70%',
            margin: `${currentStep === 2 || currentStep === 4 || currentStep === 5 ? '30px' : '40px'} auto 0 auto`
          }}>
            <StandardButton 
              onClick={handlePrevious}
              disabled={currentStep === 1}
              variant="secondary"
              size="lg"
              style={{
                backgroundColor: currentStep === 1 ? '#888' : undefined,
                color: '#333',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Back
            </StandardButton>
            
            <StandardButton 
              onClick={handleNext}
              variant="primary"
              size="lg"
            >
              Continue
            </StandardButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;