import { useRef, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useWindowSize } from "../hooks/useWindowSize";

interface DitheredWavesProps {
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  waveColor?: [number, number, number];
  colorNum?: number;
  pixelSize?: number;
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
  width?: number;
  height?: number;
}

const DitheredWaves = ({
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = [0.5, 0.5, 0.5],
  colorNum = 4,
  pixelSize = 2,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 0.3,
  width = 800,
  height = 600
}: DitheredWavesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const animationRef = useRef<number | null>(null);

  const waveVertexShader = `
    precision highp float;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      gl_Position = projectionMatrix * viewPosition;
    }
  `;

  const waveFragmentShader = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;
    uniform float waveSpeed;
    uniform float waveFrequency;
    uniform float waveAmplitude;
    uniform vec3 waveColor;
    uniform vec2 mousePos;
    uniform int enableMouseInteraction;
    uniform float mouseRadius;
    uniform float colorNum;
    uniform float pixelSize;

    vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

    float cnoise(vec2 P) {
      vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
      vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
      Pi = mod289(Pi);
      vec4 ix = Pi.xzxz;
      vec4 iy = Pi.yyww;
      vec4 fx = Pf.xzxz;
      vec4 fy = Pf.yyww;
      vec4 i = permute(permute(ix) + iy);
      vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
      vec4 gy = abs(gx) - 0.5;
      vec4 tx = floor(gx + 0.5);
      gx = gx - tx;
      vec2 g00 = vec2(gx.x, gy.x);
      vec2 g10 = vec2(gx.y, gy.y);
      vec2 g01 = vec2(gx.z, gy.z);
      vec2 g11 = vec2(gx.w, gy.w);
      vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
      g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
      float n00 = dot(g00, vec2(fx.x, fy.x));
      float n10 = dot(g10, vec2(fx.y, fy.y));
      float n01 = dot(g01, vec2(fx.z, fy.z));
      float n11 = dot(g11, vec2(fx.w, fy.w));
      vec2 fade_xy = fade(Pf.xy);
      vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
      return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 1.0;
      float freq = waveFrequency;
      for (int i = 0; i < 4; i++) {
        value += amp * abs(cnoise(p));
        p *= freq;
        amp *= waveAmplitude;
      }
      return value;
    }

    float pattern(vec2 p) {
      vec2 p2 = p - time * waveSpeed;
      return fbm(p + fbm(p2)); 
    }

    float bayerMatrix8x8[64];
    
    void initBayerMatrix() {
      bayerMatrix8x8[0] = 0.0/64.0; bayerMatrix8x8[1] = 48.0/64.0; bayerMatrix8x8[2] = 12.0/64.0; bayerMatrix8x8[3] = 60.0/64.0;
      bayerMatrix8x8[4] = 3.0/64.0; bayerMatrix8x8[5] = 51.0/64.0; bayerMatrix8x8[6] = 15.0/64.0; bayerMatrix8x8[7] = 63.0/64.0;
      bayerMatrix8x8[8] = 32.0/64.0; bayerMatrix8x8[9] = 16.0/64.0; bayerMatrix8x8[10] = 44.0/64.0; bayerMatrix8x8[11] = 28.0/64.0;
      bayerMatrix8x8[12] = 35.0/64.0; bayerMatrix8x8[13] = 19.0/64.0; bayerMatrix8x8[14] = 47.0/64.0; bayerMatrix8x8[15] = 31.0/64.0;
      bayerMatrix8x8[16] = 8.0/64.0; bayerMatrix8x8[17] = 56.0/64.0; bayerMatrix8x8[18] = 4.0/64.0; bayerMatrix8x8[19] = 52.0/64.0;
      bayerMatrix8x8[20] = 11.0/64.0; bayerMatrix8x8[21] = 59.0/64.0; bayerMatrix8x8[22] = 7.0/64.0; bayerMatrix8x8[23] = 55.0/64.0;
      bayerMatrix8x8[24] = 40.0/64.0; bayerMatrix8x8[25] = 24.0/64.0; bayerMatrix8x8[26] = 36.0/64.0; bayerMatrix8x8[27] = 20.0/64.0;
      bayerMatrix8x8[28] = 43.0/64.0; bayerMatrix8x8[29] = 27.0/64.0; bayerMatrix8x8[30] = 39.0/64.0; bayerMatrix8x8[31] = 23.0/64.0;
      bayerMatrix8x8[32] = 2.0/64.0; bayerMatrix8x8[33] = 50.0/64.0; bayerMatrix8x8[34] = 14.0/64.0; bayerMatrix8x8[35] = 62.0/64.0;
      bayerMatrix8x8[36] = 1.0/64.0; bayerMatrix8x8[37] = 49.0/64.0; bayerMatrix8x8[38] = 13.0/64.0; bayerMatrix8x8[39] = 61.0/64.0;
      bayerMatrix8x8[40] = 34.0/64.0; bayerMatrix8x8[41] = 18.0/64.0; bayerMatrix8x8[42] = 46.0/64.0; bayerMatrix8x8[43] = 30.0/64.0;
      bayerMatrix8x8[44] = 33.0/64.0; bayerMatrix8x8[45] = 17.0/64.0; bayerMatrix8x8[46] = 45.0/64.0; bayerMatrix8x8[47] = 29.0/64.0;
      bayerMatrix8x8[48] = 10.0/64.0; bayerMatrix8x8[49] = 58.0/64.0; bayerMatrix8x8[50] = 6.0/64.0; bayerMatrix8x8[51] = 54.0/64.0;
      bayerMatrix8x8[52] = 9.0/64.0; bayerMatrix8x8[53] = 57.0/64.0; bayerMatrix8x8[54] = 5.0/64.0; bayerMatrix8x8[55] = 53.0/64.0;
      bayerMatrix8x8[56] = 42.0/64.0; bayerMatrix8x8[57] = 26.0/64.0; bayerMatrix8x8[58] = 38.0/64.0; bayerMatrix8x8[59] = 22.0/64.0;
      bayerMatrix8x8[60] = 41.0/64.0; bayerMatrix8x8[61] = 25.0/64.0; bayerMatrix8x8[62] = 37.0/64.0; bayerMatrix8x8[63] = 21.0/64.0;
    }

    vec3 dither(vec2 uv, vec3 color) {
      initBayerMatrix();
      vec2 scaledCoord = floor(uv * resolution / pixelSize);
      int x = int(mod(scaledCoord.x, 8.0));
      int y = int(mod(scaledCoord.y, 8.0));
      float threshold = bayerMatrix8x8[y * 8 + x] - 0.25;
      
      // Convert to grayscale intensity
      float intensity = dot(color, vec3(0.299, 0.587, 0.114));
      
      // Create more cream background but still show dithering
      float creamThreshold = 0.75; // Higher threshold for more cream areas
      
      // Only apply dithering if intensity is above threshold
      if (intensity < creamThreshold) {
        // Return pure cream background
        return vec3(0.980, 0.976, 0.965);
      }
      
      // For areas above threshold, apply dithering
      float step = 1.0 / (colorNum - 1.0);
      intensity += threshold * step * 1.2; // Stronger dither for visibility
      intensity = clamp(intensity, 0.0, 1.0);
      float ditherValue = floor(intensity * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
      
      // Apply dithering with good contrast
      return color * ditherValue;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      uv -= 0.5;
      uv.x *= resolution.x / resolution.y;
      
      float f = pattern(uv);
      
      if (enableMouseInteraction == 1) {
        vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
        mouseNDC.x *= resolution.x / resolution.y;
        float dist = length(uv - mouseNDC);
        float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
        f -= 0.5 * effect; // Mouse interaction removes dithering
      }
      
      // Low color intensity mixing with original pattern
      vec3 col = mix(vec3(0.980, 0.976, 0.965), waveColor, f * 0.3);
      
      // Apply sparse dithering
      vec2 pixelUv = gl_FragCoord.xy / resolution.xy;
      col = dither(pixelUv, col);
      
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(width, height) },
    waveSpeed: { value: waveSpeed },
    waveFrequency: { value: waveFrequency },
    waveAmplitude: { value: waveAmplitude },
    waveColor: { value: new THREE.Color(...waveColor) },
    mousePos: { value: new THREE.Vector2(0, 0) },
    enableMouseInteraction: { value: enableMouseInteraction ? 1 : 0 },
    mouseRadius: { value: mouseRadius },
    colorNum: { value: colorNum },
    pixelSize: { value: pixelSize }
  }), []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: false,
      preserveDrawingBuffer: true 
    });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create shader material
    const material = new THREE.ShaderMaterial({
      vertexShader: waveVertexShader,
      fragmentShader: waveFragmentShader,
      uniforms: uniforms
    });

    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    materialRef.current = material;

    // Update resolution uniform
    const dpr = renderer.getPixelRatio();
    uniforms.resolution.value.set(width * dpr, height * dpr);

    // Animation loop
    const animate = () => {
      if (!disableAnimation) {
        uniforms.time.value = performance.now() * 0.001;
      }
      
      // Update other uniforms
      uniforms.waveSpeed.value = waveSpeed;
      uniforms.waveFrequency.value = waveFrequency;
      uniforms.waveAmplitude.value = waveAmplitude;
      uniforms.waveColor.value.setRGB(...waveColor);
      uniforms.enableMouseInteraction.value = enableMouseInteraction ? 1 : 0;
      uniforms.mouseRadius.value = mouseRadius;
      uniforms.colorNum.value = colorNum;
      uniforms.pixelSize.value = pixelSize;
      uniforms.mousePos.value.copy(mouseRef.current);

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [width, height, disableAnimation, waveSpeed, waveFrequency, waveAmplitude, waveColor, enableMouseInteraction, mouseRadius, colorNum, pixelSize, uniforms]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableMouseInteraction || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = rendererRef.current?.getPixelRatio() || 1;
    mouseRef.current.set(
      (e.clientX - rect.left) * dpr,
      (e.clientY - rect.top) * dpr
    );
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: enableMouseInteraction ? 'crosshair' : 'default'
      }}
    />
  );
};

// Wrapper component that handles window sizing
const DitherBackground = (props: Omit<DitheredWavesProps, 'width' | 'height'>) => {
  const windowSize = useWindowSize();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  
  return (
    <DitheredWaves
      {...props}
      width={windowSize.width}
      height={windowSize.height}
    />
  );
};

export default DitherBackground;
export { DitheredWaves };