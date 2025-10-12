# Tachi Publisher Dashboard

A Next.js-based onboarding web application for content publishers to join the Tachi pay-per-crawl protocol.

## Features

### 🎯 **Multi-Step Onboarding Wizard**
- **Step 1**: Connect Wallet - Ethereum wallet integration
- **Step 2**: Site Details & Terms - Domain and terms of service configuration
- **Step 3**: Set Pricing - Configure USDC pricing per crawl
- **Step 4**: Create License - Mint Crawl NFT for protocol participation
- **Step 5**: Deploy Gateway - Generate customized Cloudflare Worker script

### 🛠 **Tech Stack**
- **Next.js 15** with App Router for modern React development
- **Tailwind CSS** for rapid UI styling
- **TypeScript** for type safety
- **Client-side rendering** for dApp interactions

### 🔗 **Integration Ready**
- Pre-configured for **RainbowKit + Wagmi + Viem** (when dependencies are installed)
- **Base Network** support (mainnet and Sepolia testnet)
- **USDC payment processing** integration
- **Cloudflare Worker** script generation

## Getting Started

### Prerequisites
```bash
node >= 18
```

### Installation & Development

**⚠️ Important: Due to workspace npm conflicts, use the provided scripts:**

```bash
# Install dependencies safely
./npm-safe.sh install

# Start development server
./npm-safe.sh dev

# Build for production  
./npm-safe.sh build

# Start production server
./npm-safe.sh start
```

The dashboard will be available at `http://localhost:3000`

### Alternative Installation (if needed)
```bash
# If npm-safe.sh doesn't work, install outside workspace:
cd /tmp
cp -r /Users/justin/Tachi/tachi/packages/dashboard temp-dashboard
cd temp-dashboard
npm install
cp -r node_modules package-lock.json /Users/justin/Tachi/tachi/packages/dashboard/
```

### Troubleshooting NPM Errors

#### Common Error: `Cannot read properties of null (reading 'matches')`
This occurs due to workspace configuration conflicts. **Solution**: Use `./npm-safe.sh`

#### Common Error: `Module not found: Can't resolve 'tailwindcss'`
This occurs when Tailwind CSS isn't properly installed. **Solution**:
1. Run `./npm-safe.sh install` to reinstall with Tailwind
2. Ensure `globals.css` uses correct Tailwind v3 syntax:
   ```css
   @tailwind base;
   @tailwind components; 
   @tailwind utilities;
   ```

The `npm-safe.sh` script resolves these issues by:
1. Installing dependencies outside the workspace context
2. Including all required Tailwind CSS packages (tailwindcss, postcss, autoprefixer)
3. Copying successful installations back to the project
4. Running Next.js directly without npm workspace interference

### Development

## Dashboard Flow

### 1. **Connect Wallet** 
Publishers connect their Ethereum wallet to identify themselves on the protocol.

### 2. **Site Configuration**
- Enter website domain (e.g., "example.com")
- Customize terms of service for AI crawlers
- Default terms include payment requirements and usage guidelines

### 3. **Pricing Setup**
- Set price per crawl request in USDC
- Recommended range: $0.005 - $0.01 per request
- Pricing is embedded in the generated Cloudflare Worker

### 4. **License Creation**
- Mint Crawl NFT to officially join the protocol
- NFT serves as the publisher's license
- Token ID is used for tracking and verification

### 5. **Gateway Deployment**
- Receive customized Cloudflare Worker script
- Copy-paste deployment with pre-filled configuration
- Includes payment verification and AI crawler detection

## Generated Cloudflare Worker

The dashboard generates a complete Cloudflare Worker script with:

- **AI Crawler Detection** via User-Agent analysis
- **HTTP 402 Payment Required** enforcement
- **Payment Verification** via transaction hash
- **Dynamic Configuration** with publisher's domain and pricing
- **Base Network Integration** with proper USDC addresses

### Example Configuration
```javascript
const CONFIG = {
  PRICE_PER_CRAWL: 5000, // 0.005 USDC (6 decimals)
  PAYMENT_PROCESSOR_ADDRESS: '0x...',
  USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  NETWORK: 'base',
  CHAIN_ID: 8453,
  RPC_URL: 'https://base.alchemyapi.io/v2/your-api-key'
};
```

## Contract Integration

### Smart Contract Addresses
- **Crawl NFT**: Publisher license management
- **Payment Processor**: USDC payment handling
- **USDC Base**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **USDC Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Functions Used
- `mintLicense(publisherAddress, termsURI)` - Create publisher license
- Payment verification through transaction hash validation

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel with Next.js preset
```

### Self-Hosted
```bash
npm run build
npm start
# Serve on port 3000
```

## Environment Variables

Create `.env.local` for configuration:
```bash
NEXT_PUBLIC_ALCHEMY_API_KEY=your-alchemy-key
NEXT_PUBLIC_CRAWL_NFT_ADDRESS=0x...
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=0x...
NEXT_PUBLIC_NETWORK=base # or base-sepolia for testnet
```

## Development Status

### ✅ **Completed**
- Multi-step wizard UI
- Form validation and state management
- Cloudflare Worker script generation
- Responsive design with Tailwind CSS
- Mock wallet connection flow

### 🔄 **Ready for Integration**
- RainbowKit wallet connection
- Wagmi smart contract interactions
- IPFS terms storage
- Real NFT minting
- Transaction verification

### 🎯 **Future Enhancements**
- Publisher dashboard with analytics
- Crawl logs and revenue tracking
- Advanced pricing models
- Multi-chain support

## Usage Examples

### Basic Publisher Onboarding
1. Publisher visits dashboard
2. Connects MetaMask wallet
3. Enters "myblog.com" as domain
4. Sets $0.005 per crawl pricing
5. Mints license NFT
6. Copies Cloudflare Worker script
7. Deploys to Cloudflare dashboard

### Enterprise Setup
1. Custom terms of service
2. Higher pricing ($0.01+ per crawl)
3. Multiple domain support
4. Advanced analytics integration

## Integration with Tachi Ecosystem

### Smart Contracts (`../contracts/`)
- Deploys and interacts with Tachi protocol contracts
- Handles USDC payments and NFT minting

### Cloudflare Gateway (`../gateway-cloudflare/`)
- Generated scripts use the same payment verification logic
- Consistent AI crawler detection patterns

### SDK Integration (`../sdk-js/`, `../sdk-python/`)
- Publishers' gateways work seamlessly with AI crawler SDKs
- Automatic payment and retry logic

## Contributing

1. Follow Next.js and React best practices
2. Use TypeScript for type safety
3. Maintain responsive design with Tailwind
4. Test wallet connection flows
5. Validate form inputs with Zod

## License

Part of the Tachi pay-per-crawl protocol ecosystem.

---

*Ready for publishers to monetize their content through the decentralized pay-per-crawl protocol.*
