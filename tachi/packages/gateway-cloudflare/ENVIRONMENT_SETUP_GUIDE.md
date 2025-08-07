# Tachi Protocol - Environment Setup Guide

This guide walks you through setting up proper development, staging, and production environments for the Tachi Protocol Cloudflare Gateway.

## 🏗️ Environment Architecture

### Development Environment
- **Purpose**: Local development and testing
- **Domain**: Uses `wrangler dev` (localhost)
- **Network**: Base Sepolia testnet
- **Features**: Debug logging, test contracts, development KV storage

### Staging Environment  
- **Purpose**: Pre-production testing with real domains
- **Domain**: `staging.mydapp.com/*`
- **Network**: Base Sepolia testnet or mainnet (configurable)
- **Features**: Production-like environment for testing

### Production Environment
- **Purpose**: Live application serving real users
- **Domain**: `*.mydapp.com/*` and `mydapp.com/*`
- **Network**: Base mainnet
- **Features**: Optimized logging, production contracts, monitoring

## 🔧 Initial Setup

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare
```bash
wrangler login
```

### 3. Configure Your Domain
In Cloudflare Dashboard:
1. Add your domain (`mydapp.com`)
2. Set up DNS records as needed
3. Enable Cloudflare proxy (orange cloud)

## 🔐 Setting Up Secrets

Secrets must be set for each environment individually:

### Development Secrets
```bash
# Set private key for development (use a test account)
wrangler secret put PRIVATE_KEY --env development
# Enter your development private key when prompted

# Set Alchemy API key for development
wrangler secret put ALCHEMY_API_KEY --env development
# Enter your Alchemy API key for Base Sepolia

# Set Sentry auth token (if using Sentry)
wrangler secret put SENTRY_AUTH_TOKEN --env development
```

### Staging Secrets
```bash
# Set private key for staging (use a dedicated staging account)
wrangler secret put PRIVATE_KEY --env staging

# Set Alchemy API key for staging
wrangler secret put ALCHEMY_API_KEY --env staging

# Set Sentry auth token for staging
wrangler secret put SENTRY_AUTH_TOKEN --env staging
```

### Production Secrets
```bash
# Set private key for production (use secure production account)
wrangler secret put PRIVATE_KEY --env production

# Set Alchemy API key for production
wrangler secret put ALCHEMY_API_KEY --env production

# Set Sentry auth token for production
wrangler secret put SENTRY_AUTH_TOKEN --env production
```

## 📋 Contract Address Configuration

Update the contract addresses in `wrangler.toml` for each environment:

### Development Contracts (Base Sepolia)
```toml
CONTRACT_ADDRESS = "0x5a9c9Aa7feC1DF9f5702BcCEB21492be293E5d5F"
PAYMENT_PROCESSOR_ADDRESS = "0x5a9c9Aa7feC1DF9f5702BcCEB21492be293E5d5F"
PROOF_OF_CRAWL_LEDGER_ADDRESS = "0xeC3311cCd41B450a12404E7D14165D0dfa0725c3"
```

### Staging Contracts
```toml
CONTRACT_ADDRESS = "0x8b3192f5EeBd6c427C3EA0B8EC2cFf31b98C4F80"
PAYMENT_PROCESSOR_ADDRESS = "0x8b3192f5EeBd6c427C3EA0B8EC2cFf31b98C4F80"
PROOF_OF_CRAWL_LEDGER_ADDRESS = "0x9c4283a462F5eEb3C3Fa0B9EC3fF41c41b78D4C90"
```

### Production Contracts (Base Mainnet)
```toml
CONTRACT_ADDRESS = "0xa974E189038f5b0dEcEbfCe7B0A108824acF3813"
PAYMENT_PROCESSOR_ADDRESS = "0xa974E189038f5b0dEcEbfCe7B0A108824acF3813"
PROOF_OF_CRAWL_LEDGER_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
```

## 🚀 Deployment Commands

### Local Development
```bash
# Start local development server
npm run dev
# or
wrangler dev

# Start local development with staging config
wrangler dev --env staging
```

### Deploy to Staging
```bash
# Deploy to staging environment
wrangler deploy --env staging
```

### Deploy to Production
```bash
# Deploy to production environment
wrangler deploy --env production
```

## 🔍 Monitoring & Observability

### Sentry Configuration
1. Create separate Sentry projects for each environment
2. Update `SENTRY_DSN` in each environment's vars
3. Set `SENTRY_AUTH_TOKEN` secret for each environment

### Better Uptime Configuration
1. Create separate heartbeat monitors for each environment
2. Update `BETTER_UPTIME_HEARTBEAT_URL` for each environment
3. Configure appropriate alert thresholds

### Environment Health Checks
Each environment exposes health check endpoints:
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status

## 🛡️ Security Best Practices

### Private Keys
- **Development**: Use test accounts with minimal funds
- **Staging**: Use dedicated staging accounts separate from production
- **Production**: Use hardware wallets or secure key management systems

### API Keys
- Use different Alchemy API keys for each environment
- Monitor API usage to detect anomalies
- Rotate keys regularly

### Secrets Management
- Never commit secrets to version control
- Use environment-specific secrets only
- Regularly audit and rotate secrets

## 🧪 Testing Environments

### Development Testing
```bash
# Test local deployment
curl http://localhost:8787/health

# Test with specific crawler request
curl -X POST http://localhost:8787/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "type": "standard"}'
```

### Staging Testing
```bash
# Test staging deployment
curl https://staging.mydapp.com/health

# Test staging crawler request
curl -X POST https://staging.mydapp.com/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "type": "standard"}'
```

### Production Testing
```bash
# Test production health (minimal testing)
curl https://mydapp.com/health
```

## 🔄 Environment Migration

### Contract Deployment Flow
1. Deploy contracts to development (Base Sepolia)
2. Test thoroughly in development environment
3. Deploy contracts to staging
4. Perform integration testing in staging
5. Deploy contracts to production (Base mainnet)
6. Update production environment configuration
7. Deploy gateway to production

### Configuration Updates
1. Update development configuration first
2. Test changes locally
3. Update staging configuration
4. Test in staging environment
5. Update production configuration
6. Deploy to production with monitoring

## 📝 Environment Variables Reference

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `ENVIRONMENT` | development | staging | production |
| `BASE_RPC_URL` | Base Sepolia | Base Sepolia/Mainnet | Base Mainnet |
| `CONTRACT_ADDRESS` | Dev Contract | Staging Contract | Prod Contract |
| `USDC_ADDRESS` | Sepolia USDC | Sepolia/Mainnet USDC | Mainnet USDC |
| `DEBUG_MODE` | true | false | false |
| `LOG_LEVEL` | debug | info | error |

## 🚨 Troubleshooting

### Common Issues

#### 1. "Worker not found" error
- Ensure you're deploying to the correct environment
- Check that the worker name matches wrangler.toml

#### 2. "Route not configured" error
- Verify DNS settings in Cloudflare
- Check route patterns in wrangler.toml
- Ensure domain is properly proxied through Cloudflare

#### 3. "Secret not found" error
- Verify secrets are set for the correct environment
- Use `wrangler secret list --env <environment>` to check

#### 4. Contract interaction failures
- Verify contract addresses are correct for the network
- Check that private key has sufficient balance
- Ensure RPC URL is accessible and correct

### Debugging Commands
```bash
# List secrets for an environment
wrangler secret list --env staging

# View deployment status
wrangler deployments list

# Check worker logs
wrangler tail --env production

# Test specific environment locally
wrangler dev --env staging --local-protocol https
```

## 📞 Support

For additional support:
1. Check the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
2. Review [Wrangler CLI documentation](https://developers.cloudflare.com/workers/wrangler/)
3. Consult the [Base network documentation](https://docs.base.org/)
4. Reference the main Tachi Protocol documentation
