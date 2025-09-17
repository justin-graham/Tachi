import React, { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

const EmptyParticles = ({ count = 45000 }) => {
  const mountRef = useRef(null)
  const animationRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const geometryRef = useRef(null)
  const materialRef = useRef(null)
  const pointsRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const timeoutsRef = useRef([])
  
  useEffect(() => {
    if (!mountRef.current) return
    
    // Fixed dimensions for dashboard
    const width = 440
    const height = 440
    
    const scene = new THREE.Scene()
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    cameraRef.current = camera
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
      depth: true
    })
    rendererRef.current = renderer
    
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)
    
    camera.position.z = 5
    scene.background = new THREE.Color('#F8F4E6')
    
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.4 }
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        
        void main() {
          vColor = customColor;
          vec3 pos = position;
          
          // Create cube-like distribution instead of vessel
          float cubeSize = 1.0;
          
          // Add rotation animation for cube
          float rotY = time * 0.1;
          float rotX = time * 0.05;
          
          // Apply rotation matrices
          mat3 rotationY = mat3(
            cos(rotY), 0.0, sin(rotY),
            0.0, 1.0, 0.0,
            -sin(rotY), 0.0, cos(rotY)
          );
          
          mat3 rotationX = mat3(
            1.0, 0.0, 0.0,
            0.0, cos(rotX), -sin(rotX),
            0.0, sin(rotX), cos(rotX)
          );
          
          pos = rotationY * rotationX * pos;
          
          // Add subtle breathing effect to cube
          float breathe = 1.0 + sin(time * 0.3) * 0.1;
          pos *= breathe;
          
          // Add slight wave distortion
          pos.y += sin(time * 0.5 + pos.x * 2.0) * 0.05;
          pos.x += cos(time * 0.4 + pos.z * 2.0) * 0.03;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (128.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = dot(center, center);
          
          if (dist > 0.25) discard;
          
          float alpha = (1.0 - smoothstep(0.2025, 0.25, dist)) * opacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      vertexColors: true
    })
    materialRef.current = particleMaterial
    
    // Pre-allocate typed arrays for better memory management
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    // Generate particles in cube shape - defining structure through emptiness
    let i3 = 0
    for (let i = 0; i < count; i++) {
      let x, y, z
      
      // Create hollow cube by placing particles on faces and edges
      if (Math.random() < 0.8) {
        // Distribute on cube faces
        const face = Math.floor(Math.random() * 6)
        const u = (Math.random() - 0.5) * 2.4
        const v = (Math.random() - 0.5) * 2.4
        
        switch (face) {
          case 0: // Front face
            x = u; y = v; z = 1.2;
            break;
          case 1: // Back face
            x = u; y = v; z = -1.2;
            break;
          case 2: // Right face
            x = 1.2; y = v; z = u;
            break;
          case 3: // Left face
            x = -1.2; y = v; z = u;
            break;
          case 4: // Top face
            x = u; y = 1.2; z = v;
            break;
          case 5: // Bottom face
            x = u; y = -1.2; z = v;
            break;
        }
      } else {
        // Fill interior sparsely to show structure
        x = (Math.random() - 0.5) * 2.4
        y = (Math.random() - 0.5) * 2.4
        z = (Math.random() - 0.5) * 2.4
        
        // Bias toward edges and faces
        const bias = 0.36  // Scaled proportionally
        if (Math.abs(x) < bias) x = Math.sign(x) * (bias + Math.random() * (1.2 - bias))
        if (Math.abs(y) < bias) y = Math.sign(y) * (bias + Math.random() * (1.2 - bias))
        if (Math.abs(z) < bias) z = Math.sign(z) * (bias + Math.random() * (1.2 - bias))
      }
      
      // Add slight randomness
      x += (Math.random() - 0.5) * 0.1
      y += (Math.random() - 0.5) * 0.1
      z += (Math.random() - 0.5) * 0.1
      
      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z

      // Color based on position in cube
      const distance = Math.sqrt(x*x + y*y + z*z)
      const shade = 0.1 + (1 - distance/2) * 0.15 + Math.random() * 0.02
      colors[i3] = shade
      colors[i3 + 1] = shade
      colors[i3 + 2] = shade

      // Size based on distance from center
      sizes[i] = (1.0 - distance/2) * 0.15 + 0.05
      
      i3 += 3
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    geometryRef.current = geometry
    
    const points = new THREE.Points(geometry, particleMaterial)
    pointsRef.current = points
    scene.add(points)
    
    // Animation loop
    const clock = new THREE.Clock()
    let lastTime = 0
    const targetFPS = 60
    const targetInterval = 1000 / targetFPS
    
    const animate = (currentTime) => {
      animationRef.current = requestAnimationFrame(animate)
      
      const deltaTime = currentTime - lastTime
      if (deltaTime < targetInterval) return
      
      lastTime = currentTime - (deltaTime % targetInterval)
      
      const time = clock.getElapsedTime()
      particleMaterial.uniforms.time.value = time
      
      renderer.render(scene, camera)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      timeoutsRef.current.forEach(clearFn => clearFn())
      timeoutsRef.current = []
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      
      if (sceneRef.current && pointsRef.current) {
        sceneRef.current.remove(pointsRef.current)
      }
      
      if (geometryRef.current) {
        geometryRef.current.dispose()
        geometryRef.current = null
      }
      
      if (materialRef.current) {
        materialRef.current.dispose()
        materialRef.current = null
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (mountRef.current && rendererRef.current.domElement) {
          mountRef.current.removeChild(rendererRef.current.domElement)
        }
        rendererRef.current.forceContextLoss()
        rendererRef.current = null
      }
      
      sceneRef.current = null
      cameraRef.current = null
      pointsRef.current = null
    }
  }, [count])
  
  return <div ref={mountRef} style={{ width: '440px', height: '440px' }} />
}

const ParticleVessel = () => {
  return (
    <div className="flex justify-center items-center h-full w-full">
      <div style={{
        background: '#ffffff',
        border: '2px solid #000',
        borderRadius: '0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <EmptyParticles />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '8px',
          background: '#000'
        }}></div>
      </div>
    </div>
  )
}

const metadata = {
  themes: "impartiality, empty potential, stillness as power",
  visualization: "Particles define a cube through their movement around emptiness, showing how structure contains infinite possibility",
  promptSuggestion: "1. Add subtle void variations\n2. Create empty cube patterns\n3. Vary spatial definitions naturally\n4. Introduce gentle utility waves\n5. Make emptiness follow natural forms"
}

ParticleVessel.metadata = metadata
export default ParticleVessel