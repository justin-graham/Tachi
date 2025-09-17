import React, { useEffect, useRef } from 'react';

// themes: following intuition, no fixed path, open mind leads forward
// visualization: Points freely follow an unpredictable leader, finding their way through openness

const BouncingPointCloud = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = 440; // 80% of original 550
    const height = 440; // 80% of original 550
    
    // Setup
    ctx.fillStyle = '#F8F4E6'; // cream background
    ctx.fillRect(0, 0, width, height);
    
    // Leader following its intuition
    const ball = {
      x: width / 2,
      y: height / 2,
      radius: 96, // 80% of original 120
      vx: (Math.random() * 2 - 1) * 2,
      vy: (Math.random() * 2 - 1) * 2
    };
    
    // Particle system
    const numPoints = 25000;
    const points = [];
    let time = 0;
    
    // Calculate field value at a point (modified to use single ball)
    const calculateField = (x, y) => {
      const dx = x - ball.x;
      const dy = y - ball.y;
      const distSq = dx * dx + dy * dy;
      return ball.radius * ball.radius / distSq;
    };
    
    // Generate initial points
    for (let i = 0; i < numPoints; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const field = calculateField(x, y);
      
      points.push({
        x,
        y,
        z: Math.random() * 2 - 1, // Depth for 3D effect
        size: (0.5 + Math.random() * 1.5) * 0.8, // Scale particle size by 80%
        field,
        active: field > 1,
        targetX: x,
        targetY: y,
        originalX: x,
        originalY: y,
        phase: Math.random() * Math.PI * 2
      });
    }
    
    // Animation timing control variables
    let lastFrameTime = 0;
    const targetFPS = 18; // Equivalent to 55.56ms interval (18fps)
    const frameInterval = 1000 / targetFPS;
    let animationFrameId = null;
    
    // Animation function with time delta control
    const animate = (currentTime) => {
      // Initialize lastFrameTime on first frame
      if (!lastFrameTime) {
        lastFrameTime = currentTime;
      }
      
      const deltaTime = currentTime - lastFrameTime;
      
      // Only update animation when enough time has passed
      if (deltaTime >= frameInterval) {
        ctx.fillStyle = '#F8F4E6';
        ctx.fillRect(0, 0, width, height);
        
        time += 0.0005; // Set to 10% of original speed
        
        // Update ball position
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        // Bounce off edges with slight randomness
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx) * (0.9 + Math.random() * 0.2);
          ball.vy += (Math.random() * 2 - 1) * 0.5; // Add some randomness to y velocity
        }
        if (ball.x + ball.radius > width) {
          ball.x = width - ball.radius;
          ball.vx = -Math.abs(ball.vx) * (0.9 + Math.random() * 0.2);
          ball.vy += (Math.random() * 2 - 1) * 0.5;
        }
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy) * (0.9 + Math.random() * 0.2);
          ball.vx += (Math.random() * 2 - 1) * 0.5;
        }
        if (ball.y + ball.radius > height) {
          ball.y = height - ball.radius;
          ball.vy = -Math.abs(ball.vy) * (0.9 + Math.random() * 0.2);
          ball.vx += (Math.random() * 2 - 1) * 0.5;
        }
        
        // Ensure minimum velocity
        const minSpeed = 0.75;
        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (currentSpeed < minSpeed) {
          ball.vx = (ball.vx / currentSpeed) * minSpeed;
          ball.vy = (ball.vy / currentSpeed) * minSpeed;
        }
        
        // Cap maximum velocity
        const maxSpeed = 1.5;
        const speedFactor = Math.min(1, maxSpeed / currentSpeed);
        ball.vx *= speedFactor;
        ball.vy *= speedFactor;
        
        // Update and draw points
        for (const point of points) {
          // Calculate new field value
          const field = calculateField(point.x, point.y);
          const prevActive = point.active;
          point.active = field > 1;
          
          // Handle transition between states
          if (point.active !== prevActive) {
            // If becoming active, set target near current position
            if (point.active) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 5 + Math.random() * 10;
              point.targetX = point.x + Math.cos(angle) * dist;
              point.targetY = point.y + Math.sin(angle) * dist;
            } else {
              // If becoming inactive, slowly return to original position
              point.targetX = point.originalX;
              point.targetY = point.originalY;
            }
          }
          
          // Apply organic movement based on state
          if (point.active) {
            // Points following with open minds
            const angle = Math.atan2(point.y - ball.y, point.x - ball.x);
            const distFromCenter = Math.sqrt(
              (point.x - ball.x) * (point.x - ball.x) + 
              (point.y - ball.y) * (point.y - ball.y)
            );
            
            // Circular flow along ball's edge
            const tangentialAngle = angle + Math.PI / 2;
            const flowSpeed = 0.25 * (1 - distFromCenter / ball.radius);
            
            point.x += Math.cos(tangentialAngle) * flowSpeed;
            point.y += Math.sin(tangentialAngle) * flowSpeed;
            
            // Small radial pulsation
            const radialPulse = Math.sin(time * 2 + point.phase) * 0.2;
            point.x += Math.cos(angle) * radialPulse;
            point.y += Math.sin(angle) * radialPulse;
            
            // Keep points inside the field
            if (calculateField(point.x, point.y) < 1) {
              // If drifted outside, pull back toward ball
              point.x = point.x + (ball.x - point.x) * 0.1;
              point.y = point.y + (ball.y - point.y) * 0.1;
            }
          } else {
            // Points outside the ball: drift or follow
            const distToTarget = Math.sqrt(
              (point.targetX - point.x) * (point.targetX - point.x) + 
              (point.targetY - point.y) * (point.targetY - point.y)
            );
            
            // Either drift toward target, or start following the ball
            if (distToTarget > 100 || Math.random() < 0.001) {
              // Follow the ball with some delay
              const dx = ball.x - point.x;
              const dy = ball.y - point.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist < 200 + Math.random() * 100) {
                point.targetX = ball.x + (Math.random() * 2 - 1) * 100;
                point.targetY = ball.y + (Math.random() * 2 - 1) * 100;
              }
            }
            
            // Move toward target with easing
            point.x += (point.targetX - point.x) * 0.01;
            point.y += (point.targetY - point.y) * 0.01;
          }
          
          // Additional gentle flow for all points
          point.x += Math.sin(time * 0.3 + point.y * 0.01) * 0.1;
          point.y += Math.cos(time * 0.3 + point.x * 0.01) * 0.1;
          
          // Wrap around edges
          if (point.x < 0) point.x = width;
          if (point.x > width) point.x = 0;
          if (point.y < 0) point.y = height;
          if (point.y > height) point.y = 0;
          
          // Calculate alpha based on field strength and activity
          let alpha;
          if (point.active) {
            alpha = Math.min(0.9, 0.3 + field * 0.4);
          } else {
            // Calculate distance to ball
            const dx = point.x - ball.x;
            const dy = point.y - ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Points closer to ball are more visible
            const proximity = Math.max(0, 1 - dist / (ball.radius * 2.5));
            alpha = 0.05 + proximity * 0.2;
          }
          
          // Draw point
          ctx.fillStyle = `rgba(51, 51, 51, ${alpha})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
          ctx.fill();
        }
      
        // Update lastFrameTime, accounting for any remainder to prevent drift
        lastFrameTime = currentTime - (deltaTime % frameInterval);
      }
      
      // Continue animation loop
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      // Cancel animation frame to prevent memory leaks
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Clear points array to prevent memory leaks
      points.length = 0;
    };
  }, []);
  
  return (
    <div className="flex justify-center items-center w-full h-full">
      <div style={{
        background: '#ffffff',
        border: '2px solid #000',
        borderRadius: '0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <canvas 
          ref={canvasRef} 
          width={440} 
          height={440} 
          style={{ display: 'block', background: '#F8F4E6' }}
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
    </div>
  );
};

export default BouncingPointCloud;