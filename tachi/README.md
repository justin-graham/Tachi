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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes in the appropriate package
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
