import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './FlowSection.module.css';

// Types
type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  kind: "agent" | "terminal" | "pay" | "verify";
};

type Edge = {
  id: string;
  from: string;
  to: string;
  delay: number;
  duration: number;
};

type TerminalScript = { 
  lines: string[]; 
  startDelay?: number; 
  speed?: number; 
};

type PayScript = { 
  code: string; 
  chip: string; 
  startDelay?: number; 
  codeSpeed?: number; 
};

type VerifyScript = { 
  lines: string[]; 
  startDelay?: number; 
  speed?: number; 
};

type HeroFlowProps = {
  nodes: Node[];
  edges: Edge[];
  terminal: TerminalScript;
  pay: PayScript;
  verify: VerifyScript;
  theme?: { primary: string; gray: string; background: string };
};

// Utility function for joining lines (fixes newline bug)
function joinLines(lines: string[]): string {
  return lines.join("\n");
}

// Custom hooks
function useTypewriter(text: string, speed: number = 50, startDelay: number = 0) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const shouldReduce = useReducedMotion();

  const skip = () => {
    setIsSkipped(true);
    setDisplayText(text);
    setIsComplete(true);
  };

  useEffect(() => {
    if (shouldReduce || isSkipped) {
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    const cycle = () => {
      setDisplayText('');
      setIsComplete(false);
      
      const timer = setTimeout(() => {
        let i = 0;
        const interval = setInterval(() => {
          if (i < text.length) {
            setDisplayText(text.slice(0, i + 1));
            i++;
          } else {
            setIsComplete(true);
            clearInterval(interval);
            
            // Restart after completion + pause (20 seconds total cycle - longer due to delays)
            setTimeout(() => {
              if (!isSkipped) {
                cycle();
              }
            }, 20000);
          }
        }, speed);

        return () => clearInterval(interval);
      }, startDelay);

      return () => clearTimeout(timer);
    };

    cycle();
  }, [text, speed, startDelay, shouldReduce, isSkipped]);

  return { displayText, isComplete, skip };
}

function useTypewriterLines(lines: string[], speed: number = 50, startDelay: number = 0) {
  const text = joinLines(lines);
  return useTypewriter(text, speed, startDelay);
}

// Components
function CardShell({ 
  children, 
  className = '', 
  delay = 0,
  pulseDelay = 0
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
  pulseDelay?: number;
}) {
  const shouldReduce = useReducedMotion();
  
  return (
    <motion.div
      className={`rounded-2xl shadow-lg ${className}`}
      initial={{ y: 0, opacity: shouldReduce ? 1 : 0 }}
      animate={{ 
        y: shouldReduce ? 0 : [0, -12, 0], 
        opacity: 1 
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: shouldReduce ? {} : {
          duration: 0.8,
          delay: pulseDelay / 1000,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 20 - 0.8 // 20 second cycle minus animation duration
        }
      }}
      whileHover={shouldReduce ? {} : { y: -12 }}
    >
      {children}
    </motion.div>
  );
}

function AgentCard({ label, delay = 0, pulseDelay = 0 }: { label: string; delay?: number; pulseDelay?: number }) {
  const formatLabel = (label: string) => {
    if (label.toLowerCase().includes('shopping')) {
      return 'Agent';
    }
    return label;
  };

  const displayLabel = formatLabel(label);

  return (
    <CardShell delay={delay} pulseDelay={pulseDelay} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'rgba(250, 249, 246, 0.7)' }}>
      <div className="px-3 py-1.5 rounded-full flex items-center justify-center min-w-fit" style={{ backgroundColor: 'rgba(250, 249, 246, 0.7)' }}>
        <div className="text-sm text-gray-700 font-medium whitespace-nowrap">
          {displayLabel}
        </div>
      </div>
    </CardShell>
  );
}

function TerminalCard({ 
  script, 
  delay = 0 
}: { 
  script: TerminalScript; 
  delay?: number; 
}) {
  const { displayText, skip, isComplete } = useTypewriterLines(
    script.lines, 
    script.speed || 50, 
    (script.startDelay || 0) + delay
  );

  return (
    <CardShell delay={delay} pulseDelay={3500}>
      <div className="rounded-2xl overflow-hidden shadow-lg border" style={{ backgroundColor: 'rgba(250, 249, 246, 0.7)' }}>
        <div className="px-4 py-2 flex items-center justify-between border-b" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-gray-700 text-sm font-medium">protect</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-gray-800 text-sm whitespace-pre-wrap min-h-[3rem]">
            {displayText}
            {!isComplete && <span className="animate-pulse">|</span>}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function PayPanel({ 
  script, 
  delay = 0 
}: { 
  script: PayScript; 
  delay?: number; 
}) {
  const { displayText: codeText, isComplete: codeComplete } = useTypewriter(
    script.code, 
    script.codeSpeed || 30, 
    (script.startDelay || 0) + delay
  );

  return (
    <CardShell delay={delay} pulseDelay={9500}>
      <div className="space-y-4">
        <div className="rounded-2xl overflow-hidden shadow-lg border" style={{ backgroundColor: 'rgba(250, 249, 246, 0.7)' }}>
          <div className="px-4 py-2 flex items-center justify-between border-b" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-gray-700 text-sm font-medium">payment</div>
          </div>
          <div className="p-4">
            <div className="font-mono text-gray-800 text-sm whitespace-pre-wrap min-h-[3rem]">
              {codeText}
              {!codeComplete && <span className="animate-pulse">|</span>}
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function VerifyPanel({ 
  script, 
  delay = 0 
}: { 
  script: VerifyScript; 
  delay?: number; 
}) {
  const { displayText, skip, isComplete } = useTypewriterLines(
    script.lines, 
    script.speed || 50, 
    (script.startDelay || 0) + delay
  );

  return (
    <CardShell delay={delay} pulseDelay={16000}>
      <div className="rounded-2xl overflow-hidden shadow-lg border" style={{ backgroundColor: 'rgba(250, 249, 246, 0.7)' }}>
        <div className="px-4 py-2 flex items-center justify-between border-b" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-gray-700 text-sm font-medium">verify and serve content</div>
        </div>
        <div className="p-4">
          <div className="font-mono text-gray-800 text-sm whitespace-pre-wrap min-h-[3rem]">
            {displayText}
            {!isComplete && <span className="animate-pulse">|</span>}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function Connector({ 
  edge, 
  nodes, 
  theme 
}: { 
  edge: Edge; 
  nodes: Map<string, Node>; 
  theme: { primary: string; gray: string; background: string }; 
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const shouldReduce = useReducedMotion();

  const fromNode = nodes.get(edge.from);
  const toNode = nodes.get(edge.to);

  if (!fromNode || !toNode) return null;

  // Calculate connection points more precisely
  const getConnectionPoint = (node: Node, isSource: boolean) => {
    let nodeWidth, nodeHeight;
    
    if (node.kind === 'agent') {
      nodeWidth = 90; // Smaller width for text-only agent cards
      nodeHeight = 32; // Standard height
    } else {
      nodeWidth = node.width || 160;
      nodeHeight = 80;
    }
    
    if (isSource) {
      return {
        x: node.x + nodeWidth,
        y: node.y + nodeHeight / 2
      };
    } else {
      return {
        x: node.x,
        y: node.y + nodeHeight / 2
      };
    }
  };

  const fromPoint = getConnectionPoint(fromNode, true);
  const toPoint = getConnectionPoint(toNode, false);

  const controlOffset = Math.abs(toPoint.x - fromPoint.x) * 0.3;
  const path = `M ${fromPoint.x} ${fromPoint.y} C ${fromPoint.x + controlOffset} ${fromPoint.y}, ${toPoint.x - controlOffset} ${toPoint.y}, ${toPoint.x} ${toPoint.y}`;

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  if (shouldReduce) {
    return (
      <path
        d={path}
        stroke="#52796F"
        strokeWidth="3"
        fill="none"
        opacity={0.6}
      />
    );
  }

  const pulseLength = pathLength * 0.2;
  const animDuration = edge.duration / 1000;
  const animDelay = edge.delay / 1000;
  const cycleDuration = 20; // 20 second total cycle

  return (
    <g>
      <path
        ref={pathRef}
        d={path}
        stroke="#52796F"
        strokeWidth="3"
        fill="none"
        opacity={0.4}
      />
      
      <motion.path
        d={path}
        stroke="#52796F"
        strokeWidth={4}
        fill="none"
        strokeDasharray={`${pulseLength} ${pathLength}`}
        strokeLinecap="round"
        initial={{ 
          strokeDashoffset: pathLength + pulseLength
        }}
        animate={{ 
          strokeDashoffset: [pathLength + pulseLength, -pulseLength],
          opacity: [0, 1, 1, 0]
        }}
        transition={{
          delay: animDelay,
          duration: animDuration,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: cycleDuration - animDuration,
          times: [0, 0.1, 0.9, 1]
        }}
      />
    </g>
  );
}

// HeroFlow component
function HeroFlow({ 
  nodes, 
  edges, 
  terminal, 
  pay, 
  verify, 
  theme = { 
    primary: '#18c79c', 
    gray: '#d5d8dc', 
    background: '#eef6f7' 
  } 
}: HeroFlowProps) {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  const maxX = Math.max(...nodes.map(n => n.x + (n.width || 160)));
  const maxY = Math.max(...nodes.map(n => n.y + 80));

  return (
    <div 
      className="relative w-full overflow-hidden rounded-xl"
      style={{ 
        backgroundColor: 'transparent',
        minHeight: maxY + 40,
        minWidth: maxX + 40
      }}
    >
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        {edges.map(edge => (
          <Connector 
            key={edge.id} 
            edge={edge} 
            nodes={nodeMap} 
            theme={theme} 
          />
        ))}
      </svg>

      <div className="relative" style={{ zIndex: 2 }}>
        {nodes.map((node, index) => {
          const style = {
            position: 'absolute' as const,
            left: node.x,
            top: node.y,
            width: node.width || (node.kind === 'agent' ? 128 : 'auto')
          };

          switch (node.kind) {
            case 'agent':
              return (
                <div key={node.id} style={style}>
                  <AgentCard 
                    label={node.label} 
                    delay={index * 0.15} 
                    pulseDelay={0}
                  />
                </div>
              );
            case 'terminal':
              return (
                <div key={node.id} style={{ ...style, width: node.width || 480 }}>
                  <TerminalCard script={terminal} delay={index * 0.1} />
                </div>
              );
            case 'pay':
              return (
                <div key={node.id} style={{ ...style, width: node.width || 380 }}>
                  <PayPanel script={pay} delay={index * 0.1} />
                </div>
              );
            case 'verify':
              return (
                <div key={node.id} style={{ ...style, width: node.width || 380 }}>
                  <VerifyPanel script={verify} delay={index * 0.1} />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

// Main FlowSection component
const FlowSection: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <section className={styles.flowSection}>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.header}>
              <h2 className={styles.title}>How Tachi Works</h2>
              <p className={styles.subtitle}>
                Protected content flow demonstration
              </p>
            </div>
            <div className={styles.flowContainer}>
              <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>Loading animation...</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  const nodes: Node[] = [
    { id: "openai", label: "OpenAI", x: 40, y: 40, kind: "agent" },
    { id: "gemini", label: "Gemini", x: 180, y: 60, kind: "agent" },
    { id: "anthropic", label: "Anthropic", x: 60, y: 80, kind: "agent" },
    { id: "shopper", label: "Shopping Agent", x: 160, y: 100, kind: "agent" },
    { id: "term", label: "Terminal", x: 340, y: 60, width: 480, kind: "terminal" },
    { id: "pay", label: "Pay", x: 900, y: 40, width: 380, kind: "pay" },
    { id: "verify", label: "Verify & Serve", x: 900, y: 220, width: 380, kind: "verify" },
  ];

  const edges: Edge[] = [
    { id: "a1-term", from: "openai", to: "term", delay: 2500, duration: 1200 },
    { id: "a2-term", from: "gemini", to: "term", delay: 2650, duration: 1200 },
    { id: "a3-term", from: "anthropic", to: "term", delay: 2800, duration: 1200 },
    { id: "a4-term", from: "shopper", to: "term", delay: 2950, duration: 1200 },
    { id: "term-pay", from: "term", to: "pay", delay: 8000, duration: 1500 },
    { id: "pay-verify", from: "pay", to: "verify", delay: 14500, duration: 1800 },
  ];

  const terminal: TerminalScript = {
    lines: [
      "~ % tachi protect ./premium-article.html --price 0.001",
      "✔ Protection enabled for premium-article.html",
    ],
    startDelay: 4000,
    speed: 23,
  };

  const pay: PayScript = {
    code: `// one line via SDK (or any wallet)
const tx = await tachi.pay({ price: 10_000n, to:"0x…Processor", usdc:"0x…USDC", rpc: RPC_URL });`,
    chip: "",
    startDelay: 10200,
    codeSpeed: 21,
  };

  const verify: VerifyScript = {
    lines: ["[✔ Payment Verified on-chain]", "-> Serving premium-article.html to Agent"],
    startDelay: 17700,
    speed: 26,
  };

  return (
    <section className={styles.flowSection}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>How Tachi Works</h2>
            <p className={styles.subtitle}>
              Protected content flow demonstration
            </p>
          </div>
          
          <div className={styles.flowContainer}>
            <HeroFlow 
              nodes={nodes}
              edges={edges}
              terminal={terminal}
              pay={pay}
              verify={verify}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlowSection;