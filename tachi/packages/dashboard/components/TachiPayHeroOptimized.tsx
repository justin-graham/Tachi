import React, { useState, useEffect, useRef, useMemo } from 'react';

// Types
type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  kind: "agent" | "terminal" | "pay" | "verify";
};

type TerminalScript = { 
  lines: string[]; 
  startDelay?: number; 
};

type PayScript = { 
  code: string; 
  startDelay?: number; 
};

type VerifyScript = { 
  lines: string[]; 
  startDelay?: number; 
};

type HeroFlowProps = {
  nodes: Node[];
  terminal: TerminalScript;
  pay: PayScript;
  verify: VerifyScript;
};

// Optimized typewriter with single interval
function useSimpleTypewriter(text: string, startDelay: number = 0) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) {
          setDisplayText(text.slice(0, i));
          i++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, 30); // Fast typing speed
      
      return () => clearInterval(interval);
    }, startDelay);
    
    return () => clearTimeout(timer);
  }, [text, startDelay]);

  return { displayText, isComplete };
}

// Simple components without heavy animations
function AgentCard({ label }: { label: string }) {
  const formatLabel = (label: string) => {
    if (label.toLowerCase().includes('shopping')) {
      return 'Agent';
    }
    return label;
  };

  return (
    <div className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300" 
         style={{ backgroundColor: 'rgba(248, 244, 230, 0.9)' }}>
      <div className="px-3 py-1.5 rounded-xl flex items-center justify-center">
        <div className="text-sm text-gray-700 font-medium whitespace-nowrap">
          {formatLabel(label)}
        </div>
      </div>
    </div>
  );
}

function TerminalCard({ script }: { script: TerminalScript }) {
  const { displayText, isComplete } = useSimpleTypewriter(
    script.lines.join('\n'), 
    script.startDelay || 0
  );

  return (
    <div className="rounded-xl overflow-hidden shadow-lg border" 
         style={{ backgroundColor: 'rgba(248, 244, 230, 0.9)' }}>
      <div className="px-4 py-2 flex items-center justify-between border-b" 
           style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-gray-700 text-sm font-medium">protect</div>
      </div>
      <div className="p-4">
        <div className="font-mono text-gray-800 text-xs whitespace-pre-wrap min-h-[3rem]">
          {displayText}
          {!isComplete && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </div>
  );
}

function PayPanel({ script }: { script: PayScript }) {
  const { displayText, isComplete } = useSimpleTypewriter(
    script.code, 
    script.startDelay || 0
  );

  return (
    <div className="rounded-xl overflow-hidden shadow-lg border" 
         style={{ backgroundColor: 'rgba(248, 244, 230, 0.9)' }}>
      <div className="px-4 py-2 flex items-center justify-between border-b" 
           style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-gray-700 text-sm font-medium">payment</div>
      </div>
      <div className="p-4">
        <div className="font-mono text-gray-800 text-xs whitespace-pre-wrap min-h-[3rem]">
          {displayText}
          {!isComplete && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </div>
  );
}

function VerifyPanel({ script }: { script: VerifyScript }) {
  const { displayText, isComplete } = useSimpleTypewriter(
    script.lines.join('\n'), 
    script.startDelay || 0
  );

  return (
    <div className="rounded-xl overflow-hidden shadow-lg border" 
         style={{ backgroundColor: 'rgba(248, 244, 230, 0.9)' }}>
      <div className="px-4 py-2 flex items-center justify-between border-b" 
           style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)' }}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-gray-700 text-sm font-medium">verify and serve content</div>
      </div>
      <div className="p-4">
        <div className="font-mono text-gray-800 text-xs whitespace-pre-wrap min-h-[3rem]">
          {displayText}
          {!isComplete && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </div>
  );
}

// Simple CSS-only arrows
function SimpleArrow({ from, to }: { from: Node; to: Node }) {
  const fromX = from.x + (from.width || 128);
  const fromY = from.y + 16;
  const toX = to.x;
  const toY = to.y + 16;
  
  const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
  const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
  
  return (
    <div 
      className="absolute border-t-2 border-teal-600 opacity-60"
      style={{
        left: fromX,
        top: fromY,
        width: length,
        transformOrigin: '0 0',
        transform: `rotate(${angle}deg)`,
      }}
    >
      <div className="absolute right-0 top-0 w-0 h-0 border-l-4 border-t-2 border-b-2 border-l-teal-600 border-t-transparent border-b-transparent transform -translate-y-1/2"></div>
    </div>
  );
}

// Main optimized component
export function HeroFlowOptimized({ nodes, terminal, pay, verify }: HeroFlowProps) {
  const maxX = Math.max(...nodes.map(n => n.x + (n.width || 160)));
  const maxY = Math.max(...nodes.map(n => n.y + 80));

  // Memoize connections to avoid recalculation
  const connections = useMemo(() => {
    const agentNodes = nodes.filter(n => n.kind === 'agent');
    const terminalNode = nodes.find(n => n.kind === 'terminal');
    const payNode = nodes.find(n => n.kind === 'pay');
    const verifyNode = nodes.find(n => n.kind === 'verify');
    
    const arrows = [];
    
    if (terminalNode) {
      agentNodes.forEach(agent => {
        arrows.push(<SimpleArrow key={`${agent.id}-term`} from={agent} to={terminalNode} />);
      });
    }
    
    if (terminalNode && payNode) {
      arrows.push(<SimpleArrow key="term-pay" from={terminalNode} to={payNode} />);
    }
    
    if (payNode && verifyNode) {
      arrows.push(<SimpleArrow key="pay-verify" from={payNode} to={verifyNode} />);
    }
    
    return arrows;
  }, [nodes]);

  return (
    <div className="flex justify-center items-center w-full">
      <div 
        className="relative overflow-hidden rounded-xl"
        style={{ 
          backgroundColor: '#FAF9F6',
          height: maxY + 40,
          width: maxX + 40
        }}
      >
      {/* Simple arrows instead of complex SVG animations */}
      {connections}

      <div className="relative" style={{ zIndex: 2 }}>
        {nodes.map((node) => {
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
                  <AgentCard label={node.label} />
                </div>
              );
            case 'terminal':
              return (
                <div key={node.id} style={{ ...style, width: node.width || 480 }}>
                  <TerminalCard script={terminal} />
                </div>
              );
            case 'pay':
              return (
                <div key={node.id} style={{ ...style, width: node.width || 380 }}>
                  <PayPanel script={pay} />
                </div>
              );
            case 'verify':
              return (
                <div key={node.id} style={{ ...style, width: node.width || 380 }}>
                  <VerifyPanel script={verify} />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
      </div>
    </div>
  );
}

// Demo with same data
function OptimizedDemo() {
  const nodes: Node[] = [
    { id: "openai", label: "OpenAI", x: 30, y: 135, kind: "agent" },
    { id: "gemini", label: "Gemini", x: 30, y: 165, kind: "agent" },
    { id: "anthropic", label: "Anthropic", x: 30, y: 195, kind: "agent" },
    { id: "shopper", label: "Shopping Agent", x: 30, y: 225, kind: "agent" },
    { id: "term", label: "Terminal", x: 200, y: 140, width: 360, kind: "terminal" },
    { id: "pay", label: "Pay", x: 600, y: 140, width: 300, kind: "pay" },
    { id: "verify", label: "Verify & Serve", x: 940, y: 140, width: 300, kind: "verify" },
  ];

  const terminal: TerminalScript = {
    lines: [
      "~ % tachi protect ./premium-article.html --price 0.001",
      "✔ Protection enabled for premium-article.html",
    ],
    startDelay: 1000,
  };

  const pay: PayScript = {
    code: `// one line via SDK (or any wallet)
const tx = await tachi.pay({ price: 10_000n, to:"0x…Processor", usdc:"0x…USDC", rpc: RPC_URL });`,
    startDelay: 3000,
  };

  const verify: VerifyScript = {
    lines: ["[✔ Payment Verified on-chain]", "-> Serving premium-article.html to Agent"],
    startDelay: 5000,
  };

  return (
    <div className="flex justify-center items-center">
      <HeroFlowOptimized 
        nodes={nodes}
        terminal={terminal}
        pay={pay}
        verify={verify}
      />
    </div>
  );
}

export default OptimizedDemo;