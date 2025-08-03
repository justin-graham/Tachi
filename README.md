# Tachi Protocol - Pay-Per-Crawl Web Infrastructure

Tachi Protocol enables website publishers to monetize AI crawlers through micro-payments on the Base network, creating a sustainable revenue model for content creators while providing transparent access costs for AI companies.

## 🌟 Features

- **💰 Micropayments**: USDC payments on Base network for content access
- **🛡️ Edge Protection**: Cloudflare Workers protect content at the edge
- **📊 Real-time Analytics**: Track earnings, crawl activity, and performance
- **🔧 Easy Integration**: SDKs for JavaScript/Python and generated Workers
- **⚡ Low Fees**: Minimal gas costs on Base network
- **🌐 Decentralized**: No central authority controls payments or access

## 🚀 Quick Start

### For Publishers

1. **Get Started**: Visit [Tachi Dashboard](https://dashboard.tachi.network)
2. **Mint License**: Connect wallet and mint your publisher license NFT
3. **Deploy Protection**: Generate and deploy Cloudflare Worker
4. **Earn Revenue**: Start earning from AI crawler access

### For AI Companies

1. **Install SDK**: `npm install @tachi/sdk-js` or `pip install tachi-sdk`
2. **Fund Wallet**: Add USDC to your Base network wallet
3. **Start Crawling**: Handle 402 responses with automatic payments

```python
from tachi_sdk import TachiClient

client = TachiClient(private_key='your-key', network='base-sepolia')
result = client.crawl('https://protected-site.com/api/data')
print(f"Content: {result.content}, Cost: ${result.payment_amount}")
```

## 📚 Complete Documentation

### 📖 Core Guides
- **[📋 Main Documentation](docs/README.md)** - Complete protocol overview
- **[🏢 Publisher Integration Guide](docs/publisher-integration-guide.md)** - Complete setup for publishers
- **[🤖 AI Company Integration Guide](docs/ai-company-integration-guide.md)** - Complete setup for AI companies
- **[☁️ Cloudflare Deployment Guide](docs/cloudflare-deployment-guide.md)** - Step-by-step Worker deployment

### 🔧 Technical References
- **[📚 SDK API Reference](docs/sdk-api-reference.md)** - Complete JavaScript and Python SDK documentation
- **[🏗️ Smart Contract Deployment Guide](docs/smart-contract-deployment-guide.md)** - Contract deployment and management
- **[💻 Integration Examples](docs/integration-examples.md)** - Production-ready code examples

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Crawler    │───▶│ Cloudflare Worker │───▶│   Publisher     │
│  (with SDK)     │    │   (Protection)    │    │   (Content)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        ▲
         ▼                        ▼                        │
┌─────────────────┐    ┌──────────────────┐              │
│ Base Network    │    │ Payment Required │              │
│ (USDC Payment)  │    │ (402 Response)   │              │
└─────────────────┘    └──────────────────┘              │
         │                                                │
         └────────── Payment Verified ───────────────────┘
```

### Core Components

- **🔗 Smart Contracts**: Publisher licensing and payment processing on Base
- **☁️ Cloudflare Workers**: Edge protection returning 402 responses
- **📦 SDKs**: Handle payment flows automatically for developers
- **📊 Dashboard**: Publisher interface for setup and analytics

## 🛠️ Development

This monorepo contains all Tachi Protocol components:

```
tachi/
├── packages/
│   ├── dashboard/          # Next.js dashboard application
│   ├── contracts/          # Hardhat smart contracts
│   ├── sdk-js/            # JavaScript/TypeScript SDK
│   ├── sdk-python/        # Python SDK  
│   ├── gateway-core/      # Core gateway logic
│   ├── gateway-cloudflare/# Cloudflare Worker implementation
│   └── gateway-vercel/    # Vercel Edge Functions implementation
└── docs/                  # Complete documentation
```

### 🚦 Current Status

**✅ Completed Features:**
- Smart contracts deployed on Base Sepolia
- Working Cloudflare Worker protection
- Python SDK with payment handling
- Dashboard for license minting
- Complete documentation and guides

**🔄 In Development:**
- JavaScript SDK final implementation
- Production deployment to Base Mainnet
- Advanced analytics and reporting
- Multi-chain support

## 🌐 Network Information

### Base Sepolia Testnet (Current)
- **Chain ID**: 84532
- **RPC**: `https://sepolia.base.org`
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Smart Contract Addresses
- **CrawlNFT**: `0xa974E189038f5b0dEcEbfCe7B0A108824acF3813`
- **PaymentProcessor**: `0xBbe8D73B6B44652A5Fb20678bFa27b785Bb7Df41`
- **ProofOfCrawlLedger**: `0xA20e592e294FEbb5ABc758308b15FED437AB1EF9`

## 🤝 Community

- **🌐 Website**: [tachi.network](https://tachi.network)
- **📊 Dashboard**: [dashboard.tachi.network](https://dashboard.tachi.network)
- **📖 Documentation**: [docs.tachi.network](https://docs.tachi.network)
- **💬 Discord**: [discord.gg/tachi](https://discord.gg/tachi)
- **🐙 GitHub**: [github.com/justin-graham/Tachi](https://github.com/justin-graham/Tachi)
- **📧 Support**: support@tachi.network

## 🔒 Security

- All smart contracts will undergo professional audits before mainnet
- Private keys and sensitive data should never be committed
- Use environment variables for configuration
- Test thoroughly on Base Sepolia before production

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for the decentralized web**
