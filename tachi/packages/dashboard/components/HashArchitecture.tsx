import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

// themes: abandonment of the way, rise of rigid rules, loss of intuition
// visualization: Geometric structures that reveal how natural flow becomes constrained by rigid patterns

const metadata = {
  themes: "abandonment of the way, rise of rigid rules, loss of intuition",
  visualization: "Geometric structures that reveal how natural flow becomes constrained by rigid patterns",
  promptSuggestion: "1. Enhance recursive depth\n2. Add more structural layers\n3. Develop clearer pattern progression\n4. Create stronger unity between elements\n5. Increase sense of order"
}

const HashArchitecture: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const animationIdRef = useRef<number | null>(null)

  const createRecursivePattern = (size: number, depth: number, maxDepth: number, opacity: number, position: [number, number, number], rotation: [number, number, number]): THREE.Group => {
    const group = new THREE.Group()
    
    // Create base square
    const baseGeometry = new THREE.BufferGeometry()
    const basePoints = [
      new THREE.Vector3(-size, -size, 0),
      new THREE.Vector3(size, -size, 0),
      new THREE.Vector3(size, size, 0),
      new THREE.Vector3(-size, size, 0),
      new THREE.Vector3(-size, -size, 0)
    ]
    baseGeometry.setFromPoints(basePoints)
    
    const baseMaterial = new THREE.LineBasicMaterial({ 
      color: 0x333333, 
      transparent: true, 
      opacity: opacity 
    })
    const baseLine = new THREE.Line(baseGeometry, baseMaterial)
    group.add(baseLine)
    
    // Create diagonal lines
    const diagonal1Geometry = new THREE.BufferGeometry()
    diagonal1Geometry.setFromPoints([
      new THREE.Vector3(-size, -size, 0),
      new THREE.Vector3(size, size, 0)
    ])
    const diagonal1 = new THREE.Line(diagonal1Geometry, baseMaterial)
    group.add(diagonal1)
    
    const diagonal2Geometry = new THREE.BufferGeometry()
    diagonal2Geometry.setFromPoints([
      new THREE.Vector3(size, -size, 0),
      new THREE.Vector3(-size, size, 0)
    ])
    const diagonal2 = new THREE.Line(diagonal2Geometry, baseMaterial)
    group.add(diagonal2)
    
    // Add child elements recursively
    if (depth < maxDepth) {
      const newSize = size * 0.5
      const offset = size * 0.7
      
      const childPositions = [
        {position: [offset, offset, 0], rotation: [0, 0, Math.PI/4]},
        {position: [-offset, offset, 0], rotation: [0, 0, -Math.PI/4]},
        {position: [offset, -offset, 0], rotation: [0, 0, -Math.PI/4]},
        {position: [-offset, -offset, 0], rotation: [0, 0, Math.PI/4]}
      ]
      
      childPositions.forEach(child => {
        const childElement = createRecursivePattern(newSize, depth + 1, maxDepth, opacity - 0.1, child.position as [number, number, number], child.rotation as [number, number, number])
        childElement.position.set(child.position[0], child.position[1], child.position[2])
        childElement.rotation.set(child.rotation[0], child.rotation[1], child.rotation[2])
        group.add(childElement)
      })
    }
    
    group.position.set(position[0], position[1], position[2])
    group.rotation.set(rotation[0], rotation[1], rotation[2])
    
    return group
  }

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    
    // Setup scene
    sceneRef.current = new THREE.Scene()
    sceneRef.current.background = new THREE.Color(0xF8F4E6)
    
    // Setup camera
    cameraRef.current = new THREE.PerspectiveCamera(
      50,
      440 / 440, // Fixed aspect ratio for 440x440
      0.1,
      1000
    )
    cameraRef.current.position.z = 10
    
    // Setup renderer
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true })
    rendererRef.current.setSize(440, 440)
    container.appendChild(rendererRef.current.domElement)
    
    // Create main group
    groupRef.current = new THREE.Group()
    sceneRef.current.add(groupRef.current)
    
    // Add recursive structures
    const pattern1 = createRecursivePattern(2, 0, 3, 0.6, [0, 0, 0], [0, 0, 0])
    groupRef.current.add(pattern1)
    
    const pattern2 = createRecursivePattern(1, 0, 2, 0.6, [0, 0, 1], [Math.PI/6, Math.PI/6, Math.PI/4])
    groupRef.current.add(pattern2)
    
    const pattern3 = createRecursivePattern(0.8, 0, 2, 0.6, [0, 0, -1], [-Math.PI/6, -Math.PI/6, -Math.PI/4])
    groupRef.current.add(pattern3)
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    sceneRef.current.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(5, 5, 5)
    sceneRef.current.add(directionalLight)
    
    const pointLight = new THREE.PointLight(0xffffff, 0.4)
    pointLight.position.set(-5, 3, -5)
    sceneRef.current.add(pointLight)
    
    // Animation loop
    const clock = new THREE.Clock()
    
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      
      if (groupRef.current) {
        const time = clock.getElapsedTime()
        groupRef.current.rotation.y = Math.sin(time * 0.15) * 0.2
        groupRef.current.rotation.x = Math.cos(time * 0.1) * 0.1
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    
    animate()
    
    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement)
        }
      }
      
      if (sceneRef.current) {
        sceneRef.current.traverse((object: any) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
            if (object.geometry) object.geometry.dispose()
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material: any) => material.dispose())
              } else {
                object.material.dispose()
              }
            }
          }
        })
      }
    }
  }, [])

  return (
    <div style={{
      background: '#ffffff',
      border: '2px solid #000',
      borderRadius: '0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div 
        ref={containerRef}
        style={{ 
          width: '440px',
          height: '440px',
          background: '#F8F4E6',
          overflow: 'hidden',
          position: 'relative'
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '8px',
        background: '#000'
      }}></div>
    </div>
  )
}

export default HashArchitecture