# Tachi Monorepo

A comprehensive monorepo infrastructure for tachi services, including smart contracts, gateway services, SDK, and dashboard.

## 🏗️ Architecture

```
tachi/
├─ packages/
│  ├─ contracts/            ── Foundry + Hardhat hybrid smart contracts
│  ├─ gateway-core/         ── Pure fetch-handler logic
│  ├─ gateway-cloudflare/   ── Cloudflare Workers wrapper
│  ├─ gateway-vercel/       ── Vercel Edge Functions wrapper
│  ├─ sdk-js/               ── TypeScript crawler SDK
│  └─ dashboard/            ── Next.js onboarding UI
├─ .vscode/                 ── Shared IDE settings
├─ .devcontainer/           ── Portable dev environment
└─ package.json             ── Root scripts + pnpm workspace list
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Foundry (for smart contracts)

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start development mode for all packages
pnpm dev

# Start specific package
pnpm --filter dashboard dev
pnpm --filter gateway-core dev
```

## 📦 Packages

### Smart Contracts (`packages/contracts`)

Foundry + Hardhat hybrid setup for deploying and testing smart contracts.

```bash
# Build contracts
pnpm contracts:build

# Deploy contracts
pnpm contracts:deploy

# Test contracts
pnpm --filter contracts test
```

### Gateway Core (`packages/gateway-core`)

Pure fetch-handler logic that can be deployed to various serverless platforms.

```bash
# Build gateway core
pnpm --filter gateway-core build

# Test gateway core
pnpm --filter gateway-core test
```

### Platform Wrappers

#### Cloudflare Workers (`packages/gateway-cloudflare`)

```bash
# Deploy to Cloudflare Workers
pnpm --filter gateway-cloudflare deploy
```

#### Vercel Edge Functions (`packages/gateway-vercel`)

```bash
# Deploy to Vercel
pnpm --filter gateway-vercel deploy
```

### SDK (`packages/sdk-js`)

TypeScript SDK for integrating with tachi services.

```bash
# Build SDK
pnpm sdk:build

# Test SDK
pnpm sdk:test
```

### Dashboard (`packages/dashboard`)

Next.js application for user onboarding and management.

```bash
# Start dashboard development
pnpm dashboard:dev

# Build dashboard
pnpm dashboard:build
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter sdk-js test
pnpm --filter contracts test
```

## 🔧 Scripts

- `pnpm build` - Build all packages
- `pnpm dev` - Start development mode for all packages
- `pnpm test` - Run tests for all packages
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean build artifacts
- `pnpm typecheck` - Type check all packages

## 🐳 Development Container

This repository includes a devcontainer configuration for consistent development environments:

```bash
# Open in VS Code with Dev Containers extension
code .
# Then: "Dev Containers: Reopen in Container"
```

## ❓ FAQ & Support

### Quick Start Questions

**Q: What is Tachi Protocol?**
A: Tachi Protocol is a pay-per-crawl system that allows AI companies to fairly compensate content publishers for accessing their data through blockchain-based payments.

**Q: Which blockchain does Tachi use?**
A: Tachi runs on Base Network (Coinbase's Layer 2) for low fees (~$0.01-0.05) and fast transactions (~2 seconds).

**Q: Do I need to understand blockchain to use Tachi?**
A: Not necessarily! Our SDKs handle most complexity, but you'll need a crypto wallet, some ETH for gas fees, and USDC for payments.

### For Publishers

**Q: How do I get started as a publisher?**
A: 1) Set up Base network in your wallet, 2) Get ETH for gas fees, 3) Contact us for CrawlNFT license, 4) Deploy our Cloudflare Worker, 5) Set your pricing.

**Q: Can I change my content pricing later?**
A: Yes! Update the `PRICE_USDC` environment variable in your Cloudflare Worker anytime for immediate pricing changes.

**Q: How quickly do I receive payments?**
A: Immediately! Payments go directly to your wallet through smart contracts with no processing delays or intermediary accounts.

### For AI Companies

**Q: What if my crawler doesn't have enough USDC?**
A: You'll get a 402 Payment Required error. Add USDC to your wallet on Base network through Coinbase, bridging, or DEX swaps.

**Q: How do I handle different publisher pricing?**
A: Our SDK handles this automatically - it detects pricing in 402 responses, processes payment, and retries the request seamlessly.

**Q: What happens if a payment transaction fails?**
A: The SDK includes automatic retry logic. Check your USDC balance, ensure sufficient ETH for gas, and verify network connectivity.

### Technical Issues

**Q: How do I add Base network to MetaMask?**
A: Visit [chainlist.org](https://chainlist.org), search "Base", and click "Add to MetaMask" - or add manually with Chain ID 8453.

**Q: My Cloudflare Worker deployment failed - what now?**
A: Check that all environment variables are set (`wrangler secret list`), verify your KV namespace is created, and ensure your wrangler.toml is configured correctly.

**Q: I'm getting "insufficient funds for gas" errors**
A: You need ETH on Base network for gas fees, even when paying with USDC. Bridge ~$2-5 worth of ETH to Base.

### 📚 Complete Documentation

- **[Comprehensive FAQ](./docs/FAQ.md)** - Detailed answers to common questions
- **[Troubleshooting Guide](./docs/TROUBLESHOOTING.md)** - Debug setup and deployment issues
- **[Integration Examples](./docs/integration-examples.md)** - Code examples for publishers and crawlers
- **[Environment Variables](./packages/gateway-cloudflare/ENVIRONMENT_VARIABLES.md)** - Complete configuration reference

### 💬 Get Help

- **Discord**: [discord.gg/tachi-protocol](https://discord.gg/tachi-protocol) - Real-time community support
- **GitHub Issues**: [Report bugs or request features](https://github.com/tachi-protocol/tachi/issues)
- **Email**: support@tachi.ai - Direct support for complex issues
- **Beta Program**: beta@tachi.ai - Early access and dedicated support

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes in the appropriate package
4. Run tests and linting
5. Submit a pull request

See our [Contributing Guide](./CONTRIBUTING.md) for detailed information about development workflow, coding standards, and how to get your changes merged.

## 📄 License

MIT License - see LICENSE file for details
