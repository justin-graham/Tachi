import { useEffect, useRef } from 'react';

// Themes: power of softness, water's way, universal truth
// Visualization: Bars that yield and flow like water, demonstrating how gentleness overcomes the rigid

const VerticalBarsNoise = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  // Simple noise function
  const noise = (x: number, y: number, t: number) => {
    const n = Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t) + 
             Math.sin(x * 0.015 - t) * Math.cos(y * 0.005 + t);
    return (n + 1) / 2;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 440; // 80% of original 550
    canvas.height = 440; // 80% of original 550
    
    const numLines = 50;
    const lineSpacing = canvas.height / numLines;
    
    const animate = () => {
      timeRef.current += 0.0005; // Reduced from 0.001 to 0.0005
      
      // Clear canvas
      ctx.fillStyle = '#F8F4E6'; // Updated background color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw lines and noise-based bars
      for (let i = 0; i < numLines; i++) {
        const y = i * lineSpacing + lineSpacing / 2;
        
        // Draw horizontal line
        ctx.beginPath();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        
        // Draw bars based on noise
        for (let x = 0; x < canvas.width; x += 8) {
          const noiseVal = noise(x, y, timeRef.current);
          
          if (noiseVal > 0.5) {
            const barWidth = (3 + noiseVal * 10) * 0.8; // Scale bar width by 80%
            const barHeight = (2 + noiseVal * 3) * 0.8; // Scale bar height by 80%
            const animatedX = x + Math.sin(timeRef.current + y * 0.0375) * 20 * noiseVal * 0.8; // Scale movement by 80%
            
            // Use solid black color without opacity variation
            ctx.fillStyle = '#000000';
            ctx.fillRect(animatedX - barWidth/2, y - barHeight/2, barWidth, barHeight);
          }
        }
      }
      
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      timeRef.current = 0;
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
        <canvas ref={canvasRef} style={{ display: 'block' }} />
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

export default VerticalBarsNoise;