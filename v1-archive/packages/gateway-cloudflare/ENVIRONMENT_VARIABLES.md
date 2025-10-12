# Cloudflare Worker Environment Variables

This document provides a complete reference for all environment variables required to deploy and configure the Tachi Protocol Cloudflare Worker.

## Required Variables

These variables must be set for the worker to function properly:

### `BASE_RPC_URL`
- **Type**: String
- **Required**: Yes
- **Example**: `https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY`
- **Description**: Base network RPC endpoint URL for blockchain interactions including payment verification and crawl logging. Must be a reliable, high-performance RPC endpoint.

### `PAYMENT_PROCESSOR_ADDRESS`
- **Type**: String (Ethereum address)
- **Required**: Yes
- **Example**: `0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7`
- **Description**: Address of the deployed PaymentProcessor smart contract on Base network. This contract handles USDC payments from crawlers to publishers.

### `PROOF_OF_CRAWL_LEDGER_ADDRESS`
- **Type**: String (Ethereum address)
- **Required**: Yes
- **Example**: `0x1234567890abcdef1234567890abcdef12345678`
- **Description**: Address of the ProofOfCrawlLedger contract that logs crawl events on-chain for transparency and analytics.

### `USDC_ADDRESS`
- **Type**: String (Ethereum address)
- **Required**: Yes
- **Example**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Base mainnet)
- **Description**: Address of the USDC token contract used for payments. Must match the target network:
  - **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
  - **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### `WORKER_PRIVATE_KEY`
- **Type**: Secret (Private key)
- **Required**: Yes
- **Example**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- **Security**: 🔒 **Keep this secure!** Used to sign crawl logging transactions.
- **Description**: Private key for the worker's wallet that logs crawl events on-chain. Should have sufficient ETH for gas fees but doesn't need USDC. Set it with `wrangler secret put WORKER_PRIVATE_KEY --env <environment>`. The legacy `PRIVATE_KEY` variable is still read as a fallback but should not be used for new deployments.

### `CRAWL_TOKEN_ID`
- **Type**: String (Number)
- **Required**: Yes
- **Example**: `123`
- **Description**: The token ID of the publisher's CrawlNFT license. Used for crawl logging and payment verification.

### `PRICE_USDC`
- **Type**: String (Decimal)
- **Required**: Yes
- **Example**: `1.50` for $1.50 USD, `0.10` for 10 cents
- **Description**: Price that crawlers must pay to access protected content. Specified in human-readable USDC format (not wei).

### `PUBLISHER_ADDRESS`
- **Type**: String (Ethereum address)
- **Required**: Yes
- **Example**: `0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7`
- **Description**: Address where the publisher receives payments. Used to verify that the PaymentProcessor actually forwarded payments.

## Optional Variables

These variables provide additional functionality and security:

### `USED_TX_HASHES`
- **Type**: KV Namespace binding
- **Required**: No
- **Description**: Cloudflare KV namespace for storing used transaction hashes to prevent replay attacks. Also used for fallback rate limiting if `RATE_LIMITER` is unavailable.
- **Setup**: Configure in `wrangler.toml`:
  ```toml
  [[kv_namespaces]]
  binding = "USED_TX_HASHES"
  id = "your-kv-namespace-id"
  ```

### `RATE_LIMITER`
- **Type**: Rate Limiter binding
- **Required**: No
- **Description**: Cloudflare Workers Rate Limiting API binding for sophisticated rate limiting protection against abuse.
- **Setup**: Configure in `wrangler.toml`:
  ```toml
  [[rate_limiting]]
  binding = "RATE_LIMITER"
  ```

### `RATE_LIMIT_REQUESTS`
- **Type**: String (Number)
- **Required**: No
- **Default**: `100`
- **Example**: `150` for 150 requests per minute
- **Description**: Maximum number of requests allowed per IP address per minute. Helps prevent abuse and ensures fair resource usage.

### `MAX_REQUEST_SIZE`
- **Type**: String (Number)
- **Required**: No
- **Default**: `1048576` (1MB)
- **Example**: `2097152` for 2MB limit
- **Description**: Maximum allowed size for incoming requests in bytes. Prevents large request attacks and resource exhaustion.

### `ENABLE_LOGGING`
- **Type**: String (Boolean)
- **Required**: No
- **Default**: `false`
- **Example**: `true` to enable, `false` or omit to disable
- **Description**: When enabled, logs detailed information about requests and security events. Only recommended for development and debugging.

### `SENTRY_DSN`
- **Type**: String (URL)
- **Required**: No
- **Example**: `https://1234567890abcdef@o123456.ingest.sentry.io/1234567`
- **Description**: Sentry Data Source Name for error tracking and monitoring. When provided, enables automatic error reporting and performance monitoring.

### `ENVIRONMENT`
- **Type**: String
- **Required**: No
- **Default**: `development`
- **Example**: `production`, `staging`, `development`
- **Description**: Environment identifier that controls logging verbosity and error message detail. In `production`, detailed errors are hidden for security.

### `BETTER_UPTIME_HEARTBEAT_URL`
- **Type**: String (URL)
- **Required**: No
- **Example**: `https://uptime.betterstack.com/api/v1/heartbeat/YOUR-UUID`
- **Description**: URL for sending uptime heartbeats to Better Uptime monitoring. The worker will ping this URL on each request to confirm it's operational.

## Environment Setup Examples

### Development Configuration

```bash
# Required variables
BASE_RPC_URL="https://base-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
PAYMENT_PROCESSOR_ADDRESS="0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7"
PROOF_OF_CRAWL_LEDGER_ADDRESS="0x1234567890abcdef1234567890abcdef12345678"
USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
PRIVATE_KEY="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
CRAWL_TOKEN_ID="123"
PRICE_USDC="0.10"
PUBLISHER_ADDRESS="0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7"

# Optional development settings
ENVIRONMENT="development"
ENABLE_LOGGING="true"
RATE_LIMIT_REQUESTS="200"
MAX_REQUEST_SIZE="2097152"
```

### Production Configuration

```bash
# Required variables (use production values)
BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR-PRODUCTION-KEY"
PAYMENT_PROCESSOR_ADDRESS="0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7"
PROOF_OF_CRAWL_LEDGER_ADDRESS="0x1234567890abcdef1234567890abcdef12345678"
USDC_ADDRESS="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
PRIVATE_KEY="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
CRAWL_TOKEN_ID="123"
PRICE_USDC="1.50"
PUBLISHER_ADDRESS="0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7"

# Production security and monitoring
ENVIRONMENT="production"
ENABLE_LOGGING="false"
RATE_LIMIT_REQUESTS="100"
MAX_REQUEST_SIZE="1048576"
SENTRY_DSN="https://1234567890abcdef@o123456.ingest.sentry.io/1234567"
BETTER_UPTIME_HEARTBEAT_URL="https://uptime.betterstack.com/api/v1/heartbeat/YOUR-UUID"
```

## Security Considerations

1. **`PRIVATE_KEY`**: Store securely and never commit to version control. Use Cloudflare's secret management.

2. **`SENTRY_DSN`**: Contains sensitive monitoring access. Treat as confidential.

3. **Environment Separation**: Use different values for development, staging, and production environments.

4. **Rate Limiting**: Configure `RATE_LIMIT_REQUESTS` based on your expected traffic and server capacity.

5. **Logging**: Only enable `ENABLE_LOGGING` in development environments to avoid exposing sensitive information.

## Wrangler Configuration

Set environment variables in `wrangler.toml`:

```toml
[env.production.vars]
BASE_RPC_URL = "https://base-mainnet.g.alchemy.com/v2/YOUR-KEY"
PAYMENT_PROCESSOR_ADDRESS = "0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7"
PROOF_OF_CRAWL_LEDGER_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678"
USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
CRAWL_TOKEN_ID = "123"
PRICE_USDC = "1.50"
PUBLISHER_ADDRESS = "0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7"
ENVIRONMENT = "production"
RATE_LIMIT_REQUESTS = "100"
MAX_REQUEST_SIZE = "1048576"

# Secrets (set via wrangler secret put)
# PRIVATE_KEY
# SENTRY_DSN
# BETTER_UPTIME_HEARTBEAT_URL

[[env.production.kv_namespaces]]
binding = "USED_TX_HASHES"
id = "your-production-kv-namespace-id"

[[env.production.rate_limiting]]
binding = "RATE_LIMITER"
```

For secrets, use the Wrangler CLI:

```bash
wrangler secret put PRIVATE_KEY --env production
wrangler secret put SENTRY_DSN --env production
wrangler secret put BETTER_UPTIME_HEARTBEAT_URL --env production
```

## Validation

The worker validates all environment variables on startup and will provide clear error messages if required variables are missing or invalid.

For questions about configuration, refer to the [deployment documentation](./README.md) or check the [troubleshooting guide](./ENVIRONMENT_SETUP_GUIDE.md).
