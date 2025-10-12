export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      {/* Hero Section */}
      <div className="text-center mb-20">
        <div className="inline-block mb-6">
          <div className="stat-badge text-lg px-6 py-3">
            TESTNET • BASE SEPOLIA
          </div>
        </div>
        <h1 className="text-6xl font-bold mb-6">
          Pay-Per-Crawl Protocol
        </h1>
        <p className="text-2xl opacity-70 max-w-3xl mx-auto mb-12">
          Fair compensation for AI training data through blockchain micropayments.
          <br />
          Publishers protect content. AI companies pay in USDC. Everyone wins.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/dashboard" className="neo-button neo-button-sage">
            Open Dashboard →
          </a>
          <a href="https://github.com/yourusername/tachi" className="neo-button bg-white">
            View on GitHub
          </a>
        </div>
      </div>

      {/* How It Works */}
      <div className="lab-divider mb-12"></div>

      <div className="mb-20">
        <h2 className="text-4xl font-bold mb-12 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard
            number="1"
            title="Publisher Registers"
            description="Create a Crawl License NFT with your pricing and terms. Deploy the gateway to protect your content."
          />
          <StepCard
            number="2"
            title="AI Agent Pays"
            description="SDK detects 402 Payment Required, automatically sends USDC payment on Base, and retrieves content."
          />
          <StepCard
            number="3"
            title="Everyone Verified"
            description="Payment logged on-chain and in database. Publishers track revenue in real-time dashboard."
          />
        </div>
      </div>

      {/* Features */}
      <div className="lab-divider mb-12"></div>

      <div className="mb-20">
        <h2 className="text-4xl font-bold mb-12 text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            title="Sub-Cent Payments"
            description="USDC micropayments on Base L2. $0.001 - $1.00 per request."
            icon="💰"
          />
          <FeatureCard
            title="Instant Settlement"
            description="Payments settle in ~2 seconds on Base. No waiting periods."
            icon="⚡"
          />
          <FeatureCard
            title="Verifiable Logs"
            description="Every crawl logged on-chain with immutable proof."
            icon="📝"
          />
          <FeatureCard
            title="Simple Integration"
            description="3-line SDK. Works with any HTTP client or crawler."
            icon="🔌"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="lab-divider mb-12"></div>

      <div className="text-center">
        <h2 className="text-4xl font-bold mb-8">Built for Simplicity</h2>
        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="neo-card">
            <div className="text-5xl font-bold mono-num text-coral">~1,900</div>
            <div className="text-sm uppercase mt-2 opacity-60">Lines of Code</div>
          </div>
          <div className="neo-card">
            <div className="text-5xl font-bold mono-num">3</div>
            <div className="text-sm uppercase mt-2 opacity-60">Smart Contracts</div>
          </div>
          <div className="neo-card">
            <div className="text-5xl font-bold mono-num">~2s</div>
            <div className="text-sm uppercase mt-2 opacity-60">Payment Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({number, title, description}: {number: string; title: string; description: string}) {
  return (
    <div className="neo-card blueprint-corner">
      <div className="w-16 h-16 bg-coral border-[3px] border-black flex items-center justify-center text-3xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="opacity-70">{description}</p>
    </div>
  );
}

function FeatureCard({title, description, icon}: {title: string; description: string; icon: string}) {
  return (
    <div className="neo-card">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-70">{description}</p>
    </div>
  );
}
