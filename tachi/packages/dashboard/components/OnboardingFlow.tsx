import React, { useState, useEffect, useRef } from 'react';
import Background from './Background';
import StandardButton from './StandardButton';
import '../styles/background.css';

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
    cloudflareToken: '',
    deployMethod: 'auto',
    testUrl: ''
  });

  const steps = ['wallet', 'domain', 'pricing', 'mint', 'deploy', 'test', 'success'];

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Connect Wallet';
      case 2: return 'Site Details';
      case 3: return 'Pricing Configuration';
      case 4: return 'License Creation';
      case 5: return 'Gateway Deployment';
      case 6: return 'Testing & Verification';
      case 7: return 'Your Tachi Protection is Live!';
      default: return 'Connect Wallet';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Choose your preferred wallet to continue';
      case 2: return 'Enter the domain for your Tachi implementation';
      case 3: return 'Configure your pricing structure';
      case 4: return 'Ready to mint your content license';
      case 5: return 'Deploy your Cloudflare worker gateway';
      case 6: return 'Test your implementation';
      case 7: return '';
      default: return '';
    }
  };

  // const getContentScale = () => {
  //   // Steps 2 and 4 have more content, so scale them down slightly
  //   switch (currentStep) {
  //     case 2: return 0.9; // Categories grid needs more space
  //     case 4: return 0.9; // Usage rights need more space
  //     default: return 1;
  //   }
  // };

  // Convert 0.75 inches to pixels (assuming 96 DPI)
  const borderSize = '72px'; // 0.75 inch * 96 DPI

  return (
    <div style={{
      height: '100vh',
      position: 'relative',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${borderSize} ${borderSize}`,
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
          fontSize: currentStep === 2 || currentStep === 4 ? '2.2rem' : '2.5rem',
          fontWeight: 'bold',
          color: '#FF7043',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: currentStep === 2 || currentStep === 4 ? '15px' : '20px',
          lineHeight: '1.2'
        }}>
          {getStepTitle()}
        </h1>

        {/* Step Description */}
        <p style={{
          color: '#666',
          fontSize: currentStep === 2 || currentStep === 4 ? '0.9rem' : '1rem',
          marginBottom: currentStep === 2 || currentStep === 4 ? '30px' : '40px',
          lineHeight: '1.5'
        }}>
          {getStepDescription()}
        </p>

        {/* Step Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: currentStep === 2 || currentStep === 4 ? '15px' : '20px',
          width: '70%',
          margin: '0 auto'
        }}>
          
          {/* Step 1: Connect Wallet */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { name: 'MetaMask', icon: '🦊', color: '#f97316', isText: true },
                { name: 'Coinbase Wallet', icon: '/images/coinbase-v2.svg', color: '#FF7043', isText: false },
                { name: 'WalletConnect', icon: '/images/walletconnect.png', color: '#3b82f6', isText: false }
              ].map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleInputChange('wallet', wallet.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px',
                    border: '3px solid #FF7043',
                    backgroundColor: formData.wallet === wallet.name ? '#FF7043' : '#FAF9F6',
                    color: formData.wallet === wallet.name ? 'white' : 'black',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (formData.wallet !== wallet.name) {
                      e.currentTarget.style.backgroundColor = '#e0e0e0';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (formData.wallet !== wallet.name) {
                      e.currentTarget.style.backgroundColor = '#FAF9F6';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: wallet.isText ? wallet.color : 'transparent',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      {wallet.isText ? (
                        wallet.icon
                      ) : (
                        <img
                          src={wallet.icon}
                          alt={wallet.name}
                          style={{
                            width: '32px',
                            height: '32px',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                    </div>
                    <span>{wallet.name}</span>
                  </div>
                  <span>▶</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Site Details */}
          {currentStep === 2 && (
            <>
              <input
                type="text"
                placeholder="Your domain (e.g., your-site.com)"
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '3px solid #FF7043',
                  backgroundColor: '#FAF9F6',
                  fontSize: '16px',
                  color: 'black',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 112, 67, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              
              <input
                type="text"
                placeholder="Site title (e.g., My Blog)"
                value={formData.siteTitle}
                onChange={(e) => handleInputChange('siteTitle', e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '3px solid #FF7043',
                  backgroundColor: '#FAF9F6',
                  fontSize: '16px',
                  color: 'black',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 112, 67, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />

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
              <input
                type="number"
                min="0.0001"
                max="3.00"
                step="0.0001"
                placeholder="Price per crawl (e.g., 0.01)"
                value={formData.pricePerCrawl}
                onChange={(e) => handleInputChange('pricePerCrawl', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '3px solid #FF7043',
                  backgroundColor: '#FAF9F6',
                  fontSize: '16px',
                  color: 'black',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 112, 67, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                style={{
                  width: '100%',
                  padding: '25px',
                  border: '3px solid #FF7043',
                  backgroundColor: '#FAF9F6',
                  fontSize: '16px',
                  color: 'black',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  minHeight: '70px'
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

          {/* Step 4: License Creation */}
          {currentStep === 4 && (
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
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Status: Ready to mint</p>
                <p style={{ fontSize: '14px', color: '#666' }}>Gas Fee: ~$2.50 USD (Base network)</p>
              </div>
            </>
          )}

          {/* Step 5: Gateway Deployment */}
          {currentStep === 5 && (
            <>
              <input
                type="password"
                placeholder="Cloudflare API Token"
                value={formData.cloudflareToken}
                onChange={(e) => handleInputChange('cloudflareToken', e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '3px solid #FF7043',
                  backgroundColor: '#FAF9F6',
                  fontSize: '16px',
                  color: 'black',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 112, 67, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />

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
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Deployment Time: ~30 seconds</p>
                <p style={{ fontSize: '14px', color: '#666' }}>Global propagation: ~2 minutes</p>
              </div>
            </>
          )}

          {/* Step 6: Testing */}
          {currentStep === 6 && (
            <>
              <input
                type="url"
                placeholder="Test URL (e.g., https://your-domain.com/test-page)"
                value={formData.testUrl}
                onChange={(e) => handleInputChange('testUrl', e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '3px solid #FF7043',
                  backgroundColor: '#FAF9F6',
                  fontSize: '16px',
                  color: 'black',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 112, 67, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#FF7043';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              
              <StandardButton
                variant="primary"
                size="md"
              >
                Run Test
              </StandardButton>
            </>
          )}

          {/* Step 7: Success */}
          {currentStep === 7 && (
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
        {currentStep < 7 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '20px',
            marginTop: currentStep === 2 || currentStep === 4 ? '30px' : '40px',
            width: '70%',
            margin: `${currentStep === 2 || currentStep === 4 ? '30px' : '40px'} auto 0 auto`
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