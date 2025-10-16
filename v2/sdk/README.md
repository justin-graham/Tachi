# Tachi SDK

[![npm version](https://img.shields.io/npm/v/@tachiprotocol/sdk)](https://www.npmjs.com/package/@tachiprotocol/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript SDK for the Tachi Protocol - enabling pay-per-crawl access to web content with automatic USDC micropayments on Base.

## Installation

```bash
npm install @tachiprotocol/sdk
```

## Quick Start

```typescript
import { TachiSDK } from '@tachiprotocol/sdk';

const sdk = new TachiSDK({
  network: 'base',
  rpcUrl: 'https://mainnet.base.org',
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  paymentProcessorAddress: '0xf00976864d9dD3c0AE788f44f38bB84022B61a04'
});

// Fetch with automatic payment
const result = await sdk.fetch('https://gateway.tachi.ai/article/ai-training');

console.log(result.content); // Protected content
console.log(result.transactionHash); // Payment tx hash
```

## Features

- 🔄 **Automatic 402 Detection** - Detects payment-required responses
- 💸 **Auto-Payment** - Pays via USDC on Base L2
- ⚡ **Instant Settlement** - ~2 second finality
- 🔒 **Verifiable Logs** - All payments recorded on-chain
- 🛡️ **Type-Safe** - Full TypeScript support

## API Reference

### `new TachiSDK(config)`

Create a new SDK instance.

**Config:**
- `network`: `'base'` or `'base-sepolia'`
- `rpcUrl`: Base RPC endpoint URL
- `privateKey`: Your wallet's private key (as `0x${string}`)
- `usdcAddress`: USDC contract address on Base
- `paymentProcessorAddress`: Tachi PaymentProcessor address
- `debug?`: Enable debug logging (optional)

### `sdk.fetch(url, options?)`

Fetch content with automatic payment handling.

**Returns:** `Promise<TachiResponse>`

```typescript
interface TachiResponse {
  content: string;
  statusCode: number;
  headers: Record<string, string>;
  paymentRequired: boolean;
  paymentAmount?: string;
  transactionHash?: Hash;
}
```

### `sdk.getBalance()`

Get your USDC balance.

**Returns:** `Promise<{wei: bigint, formatted: string}>`

### `sdk.getAddress()`

Get your wallet address.

**Returns:** `Address`

## Advanced Usage

### Custom Headers

```typescript
const result = await sdk.fetch('https://api.example.com/data', {
  method: 'GET',
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### Error Handling

```typescript
try {
  const result = await sdk.fetch(url);
} catch (error) {
  if (error.message.includes('Insufficient USDC')) {
    console.log('Top up your USDC balance');
  }
}
```

## Environment Variables

For security, store your private key in environment variables:

```bash
# .env
PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://mainnet.base.org
```

Then load it:

```typescript
import 'dotenv/config';
import { TachiSDK } from '@tachiprotocol/sdk';

const sdk = new TachiSDK({
  network: 'base',
  rpcUrl: process.env.BASE_RPC_URL!,
  privateKey: `0x${process.env.PRIVATE_KEY}` as `0x${string}`,
  // ... other config
});
```

## Network Addresses

### Base Mainnet
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- PaymentProcessor: `0xf00976864d9dD3c0AE788f44f38bB84022B61a04`

### Base Sepolia (Testnet)
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- PaymentProcessor: `0xf00976864d9dD3c0AE788f44f38bB84022B61a04`

## Examples

See the [demo.mjs](https://github.com/yourusername/tachi/blob/main/v2/demo.mjs) in the main repo for a complete example.

## License

MIT

## Links

- [Protocol Website](https://tachi.ai)
- [Documentation](https://docs.tachi.ai)
- [GitHub](https://github.com/yourusername/tachi)
- [Discord](https://discord.gg/tachi)
