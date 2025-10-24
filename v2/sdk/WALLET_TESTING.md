# Wallet Testing Guide

Guide for testing Tachi SDK with different wallet providers.

---

## Overview

The Tachi SDK uses [viem](https://viem.sh) for Ethereum interactions, which supports all major wallet providers. This guide shows how to test with:

1. **MetaMask** - Browser extension wallet
2. **Coinbase Wallet** - Mobile & browser wallet
3. **WalletConnect** - Mobile wallet protocol
4. **Burner Wallets** - Temporary test wallets

---

## Prerequisites

- Base Mainnet or Sepolia testnet access
- Small amount of ETH for gas (~$0.10)
- USDC for payment tests (~$0.10)

**Get testnet ETH:**
- Base Sepolia faucet: [portal.cdp.coinbase.com/products/faucet](https://portal.cdp.coinbase.com/products/faucet)

**Get testnet USDC:**
- Bridge from Ethereum Sepolia to Base Sepolia

---

## 1. Testing with MetaMask

### Setup

1. Install [MetaMask](https://metamask.io/)
2. Add Base Mainnet network
3. Export private key: Settings > Security & Privacy > Show Private Key

### SDK Configuration

```typescript
import {TachiSDK} from '@tachiprotocol/sdk';
import {createWalletClient, http} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {base} from 'viem/chains';

// Method 1: Direct private key (simplest)
const tachi = new TachiSDK({
  network: 'base',
  privateKey: '0xYOUR_PRIVATE_KEY',
  rpcUrl: 'https://mainnet.base.org'
});

// Method 2: With custom wallet client
const account = privateKeyToAccount('0xYOUR_PRIVATE_KEY');
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http()
});

const tachi = new TachiSDK({
  network: 'base',
  rpcUrl: 'https://mainnet.base.org',
  privateKey: '0xYOUR_PRIVATE_KEY'
});
```

### Test Script

```typescript
// test-metamask.ts
import {TachiSDK} from '@tachiprotocol/sdk';

async function test() {
  const tachi = new TachiSDK({
    network: 'base',
    privateKey: process.env.METAMASK_KEY!,
    rpcUrl: 'https://mainnet.base.org',
    debug: true // Enable detailed logs
  });

  console.log('Wallet:', await tachi.getAddress());
  console.log('Balance:', await tachi.getBalance(), 'USDC');

  // Test payment flow
  const response = await tachi.fetch(
    'https://tachi-gateway.com/article/ai-training'
  );

  console.log('Content:', await response.json());
}

test().catch(console.error);
```

**Run:**
```bash
METAMASK_KEY=0x... npx tsx test-metamask.ts
```

---

## 2. Testing with Coinbase Wallet

### Setup

1. Install [Coinbase Wallet](https://www.coinbase.com/wallet)
2. Fund with ETH and USDC on Base
3. Export private key: Settings > Privacy > Show Private Key

### SDK Configuration

```typescript
// Same as MetaMask - both use EIP-1193 compatible providers
const tachi = new TachiSDK({
  network: 'base',
  privateKey: '0xCOINBASE_WALLET_KEY',
  rpcUrl: 'https://mainnet.base.org'
});
```

### Browser Integration (optional)

For browser-based dApps that want to use Coinbase Wallet:

```typescript
// Install: npm install @coinbase/wallet-sdk
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import {createWalletClient, custom} from 'viem';
import {base} from 'viem/chains';

// Initialize Coinbase Wallet SDK
const coinbaseWallet = new CoinbaseWalletSDK({
  appName: 'Tachi Protocol',
  appLogoUrl: 'https://tachi.ai/logo.png'
});

const ethereum = coinbaseWallet.makeWeb3Provider(
  'https://mainnet.base.org',
  8453 // Base Mainnet chain ID
);

// Request account access
const accounts = await ethereum.request({
  method: 'eth_requestAccounts'
});

// Create viem wallet client
const walletClient = createWalletClient({
  chain: base,
  transport: custom(ethereum)
});

// Use with Tachi SDK (requires manual signing)
const account = accounts[0];
```

---

## 3. Testing with WalletConnect

### Setup

1. Get WalletConnect Project ID: [cloud.walletconnect.com](https://cloud.walletconnect.com/)
2. Install: `npm install @walletconnect/web3-provider`

### SDK Configuration

```typescript
import WalletConnectProvider from '@walletconnect/web3-provider';
import {createWalletClient, custom} from 'viem';
import {base} from 'viem/chains';

// Initialize WalletConnect
const provider = new WalletConnectProvider({
  infuraId: 'YOUR_INFURA_ID', // or any RPC URL
  rpc: {
    8453: 'https://mainnet.base.org' // Base Mainnet
  },
  chainId: 8453
});

// Enable session
await provider.enable();

// Get accounts
const accounts = await provider.request({
  method: 'eth_accounts'
});

console.log('Connected:', accounts[0]);

// Create viem wallet client
const walletClient = createWalletClient({
  chain: base,
  transport: custom(provider)
});

// Use with Tachi SDK
// Note: WalletConnect requires user to approve each transaction on mobile
```

### Mobile Wallet Testing

Test with these WalletConnect-compatible wallets:

- **MetaMask Mobile** - Most popular
- **Rainbow** - User-friendly
- **Trust Wallet** - Multi-chain
- **Coinbase Wallet** - Native USDC support

**Testing steps:**

1. Open wallet app on mobile
2. Scan WalletConnect QR code
3. Approve connection
4. SDK will request transaction approval for each payment
5. Confirm on mobile device

---

## 4. Testing with Burner Wallets

### Generate Test Wallet

```typescript
import {generatePrivateKey, privateKeyToAccount} from 'viem/accounts';

// Generate random wallet
const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('Address:', account.address);
console.log('Private Key:', privateKey);

// Use with SDK
const tachi = new TachiSDK({
  network: 'base-sepolia', // Use testnet for burner wallets
  privateKey,
  rpcUrl: 'https://sepolia.base.org'
});
```

### Automated Testing

```typescript
// test-burner.ts
import {TachiSDK} from '@tachiprotocol/sdk';
import {generatePrivateKey} from 'viem/accounts';

async function testWithBurner() {
  // Generate burner wallet
  const privateKey = generatePrivateKey();

  const tachi = new TachiSDK({
    network: 'base-sepolia',
    privateKey,
    rpcUrl: 'https://sepolia.base.org',
    debug: true
  });

  const address = await tachi.getAddress();
  console.log('Burner wallet:', address);

  // Fund burner wallet (via faucet or transfer)
  console.log('Fund this address with testnet ETH and USDC');
  console.log('Then press Enter to continue...');
  await new Promise(resolve => process.stdin.once('data', resolve));

  // Test payment flow
  const response = await tachi.fetch(
    'https://tachi-gateway-sepolia.workers.dev/article/test'
  );

  console.log('Success:', response.status === 200);
}

testWithBurner();
```

---

## 5. Multi-Wallet Test Suite

Comprehensive test across all wallet types:

```typescript
// test-all-wallets.ts
import {TachiSDK} from '@tachiprotocol/sdk';

const wallets = [
  {name: 'MetaMask', key: process.env.METAMASK_KEY},
  {name: 'Coinbase', key: process.env.COINBASE_KEY},
  {name: 'Test Wallet', key: process.env.TEST_KEY}
];

async function testWallet(name: string, privateKey: string) {
  console.log(`\n=== Testing ${name} ===`);

  const tachi = new TachiSDK({
    network: 'base',
    privateKey,
    rpcUrl: 'https://mainnet.base.org'
  });

  try {
    // Check balance
    const balance = await tachi.getBalance();
    console.log(`✓ Balance: ${balance} USDC`);

    if (parseFloat(balance) < 0.01) {
      console.log('⚠️  Insufficient USDC balance');
      return;
    }

    // Test payment
    const response = await tachi.fetch(
      'https://tachi-gateway.com/article/ai-training'
    );

    if (response.status === 200) {
      console.log('✓ Payment successful');
      const content = await response.json();
      console.log('✓ Content received:', content.content?.title);
    } else {
      console.log('✗ Payment failed:', response.status);
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

async function main() {
  for (const wallet of wallets) {
    if (wallet.key) {
      await testWallet(wallet.name, wallet.key);
    }
  }
}

main();
```

**Run:**
```bash
METAMASK_KEY=0x... \
COINBASE_KEY=0x... \
TEST_KEY=0x... \
npx tsx test-all-wallets.ts
```

---

## Common Issues

### Issue: "Insufficient funds for gas"

**Solution:**
```bash
# Check ETH balance
cast balance 0xYOUR_ADDRESS --rpc-url https://mainnet.base.org

# Need at least 0.001 ETH for gas
```

### Issue: "USDC approval failed"

**Solution:**
```typescript
// Manually approve USDC spending
import {createWalletClient, http} from 'viem';
import {base} from 'viem/chains';
import {privateKeyToAccount} from 'viem/accounts';

const account = privateKeyToAccount('0xYOUR_KEY');
const client = createWalletClient({
  account,
  chain: base,
  transport: http()
});

// Approve USDC
await client.writeContract({
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  abi: [{
    name: 'approve',
    type: 'function',
    inputs: [
      {name: 'spender', type: 'address'},
      {name: 'amount', type: 'uint256'}
    ]
  }],
  functionName: 'approve',
  args: [
    '0xF09C29E5d3a12c0A766e6Dc65E2cb42CCf080abA', // PaymentProcessor
    BigInt(1000000) // 1 USDC (6 decimals)
  ]
});
```

### Issue: WalletConnect QR code not scanning

**Solutions:**
- Ensure mobile wallet app is updated
- Try different wallet app
- Check WiFi/network connection
- Use direct deep link instead of QR code

---

## Best Practices

1. **Never commit private keys** to git
2. **Use burner wallets** for automated testing
3. **Test on testnet first** before mainnet
4. **Check balances** before running tests
5. **Enable debug logging** during development

---

## Test Checklist

Before mainnet launch, test:

- [ ] MetaMask browser extension
- [ ] Coinbase Wallet browser extension
- [ ] MetaMask Mobile (WalletConnect)
- [ ] Coinbase Wallet Mobile (WalletConnect)
- [ ] Burner wallet (automated)
- [ ] Low balance scenario
- [ ] Insufficient gas scenario
- [ ] Network switching
- [ ] Multiple rapid payments
- [ ] Payment verification edge cases

---

## Support

- **SDK Docs:** [README.md](./README.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- **GitHub Issues:** [github.com/tachiprotocol/tachi](https://github.com/tachiprotocol/tachi/issues)
