export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      {/* Hero Section */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="neo-card w-32 h-32 flex items-center justify-center p-4">
            <img src="/TachiLogo1.png" alt="Tachi" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Pay-Per-Crawl Protocol
        </h1>
        <p className="text-lg md:text-2xl opacity-70 max-w-3xl mx-auto mb-12">
          Let publishers sell their content to AI agents.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/onboard" className="neo-button neo-button-sage">
            Get Started
          </a>
        </div>
      </div>

      {/* How It Works */}
      <div className="lab-divider mb-12"></div>

      <div className="mb-20">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard
            number="1"
            title="Publishers Set Terms"
            description="Set your full customizable terms and pricing. Protect your content with a few clicks."
          />
          <StepCard
            number="2"
            title="AI Agent Pays"
            description="When a crawler requests a page, it detects 402 Payment Required and automatically sends payment."
          />
          <StepCard
            number="3"
            title="Transparency & Control"
            description="Every access and payment is publicly logged so you can see when and how often your content is crawled."
          />
        </div>
      </div>

      {/* Introducing Tachi */}
      <div className="lab-divider mb-12"></div>

      <div className="mb-20">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Introducing Tachi</h2>
        <p className="text-base md:text-xl text-center max-w-4xl mx-auto mb-12 opacity-80">
          <strong>The Web's Value Layer is Leaking.</strong> Over 60% of searches end up in zero clicks. Tachi makes it easy for a publisher to add a few lines of code to their website to automatically charge AI agents a tiny fee each time an agent accesses a page.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Publishers Column */}
          <div>
            <h3 className="text-2xl font-bold mb-6"><strong>Publishers and Creators</strong></h3>
            <div className="space-y-6">
              <FeatureCard
                title="Monetize AI Traffic"
                description="73% of publishers are blocking AI crawlers. Instead of blocking bots outright, you can charge per request."
                icon=""
              />
              <FeatureCard
                title="Enforce Your Terms"
                description="Define dynamic pricing and usage terms for your content."
                icon=""
              />
            </div>
          </div>

          {/* Developers Column */}
          <div>
            <h3 className="text-2xl font-bold mb-6"><strong>AI Developers</strong></h3>
            <div className="space-y-6">
              <FeatureCard
                title="Instant Access"
                description="Micropayments in USDC on an immutable log eliminate legal uncertainties about using data."
                icon=""
              />
              <FeatureCard
                title="Simple Integration"
                description="3-line SDK that works with any HTTP client or crawler."
                icon=""
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="lab-divider mb-12"></div>

      <div className="mb-20 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-lg opacity-80 leading-relaxed">
              <strong>Scenario:</strong> You run your content and AI crawlers arrive daily. Blocking them protects value but loses opportunity. With Tachi, you keep transactions frictionless and charge crawlers per request with instant USDC payment.
            </p>
          </div>
          <div>
            <CodeSnippet
              title="Publisher Setup"
              code={`<span style="color: #52796F">// Deploy gateway</span>\nnpx tachi deploy\n\n<span style="color: #52796F">// Set price: $0.01 per crawl</span>`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <CodeSnippet
              title="Developer Integration"
              code={`<span style="color: #FF7043">import</span> { TachiClient } <span style="color: #FF7043">from</span> <span style="color: #52796F">'tachi-sdk'</span>\n\n<span style="color: #FF7043">const</span> content = <span style="color: #FF7043">await</span> client.fetch(url)`}
            />
          </div>
          <div className="order-1 md:order-2">
            <p className="text-lg opacity-80 leading-relaxed">
              <strong>Scenario:</strong> You're shipping an agent that needs quality data in real time. Today you hit a paywall, ToS risk, or total block. With Tachi, your agent pays and gets the content in seconds.
            </p>
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
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h3 className="text-xl font-bold mb-2 text-coral">{title}</h3>
      <p className="text-sm opacity-70">{description}</p>
    </div>
  );
}

function CodeSnippet({title, code}: {title: string; code: string}) {
  return (
    <div className="neo-card">
      <div className="flex items-center gap-2 mb-4">
        <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F56'}}></div>
        <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FFBD2E'}}></div>
        <div style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27C93F'}}></div>
      </div>
      <pre style={{margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6, color: '#1A1A1A'}}>
        <code dangerouslySetInnerHTML={{__html: code}}></code>
      </pre>
    </div>
  );
}
