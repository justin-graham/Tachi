# Tachi Python SDK

A Python SDK for AI crawlers to integrate with the Tachi pay-per-crawl protocol.

## Installation

```bash
pip install tachi-sdk
```

## Quick Start

```python
from tachi_sdk import TachiSDK, TachiConfig

# Configure SDK
config = TachiConfig(
    network='base',
    rpc_url='https://base-mainnet.alchemyapi.io/v2/your-api-key',
    private_key='your-private-key',
    payment_processor_address='0x...'  # PaymentProcessor contract address
)

# Create SDK instance
sdk = TachiSDK(config)

# Fetch content with automatic payment handling
response = sdk.fetch_with_tachi('https://example.com/content')

print(f"Content: {response['content']}")
print(f"Payment required: {response['payment_required']}")
if response['payment_required']:
    print(f"Transaction hash: {response['transaction_hash']}")
```

## Features

- **Automatic Payment Handling**: Detects HTTP 402 responses and processes payments automatically
- **Base Network Support**: Works with Base mainnet and Base Sepolia testnet
- **USDC Payments**: Handles USDC token transfers via PaymentProcessor contract
- **Retry Logic**: Built-in retry mechanism with exponential backoff
- **Error Handling**: Comprehensive error handling with specific error types
- **Balance Management**: Check USDC balance and account status

## Usage Examples

### Basic Usage

```python
from tachi_sdk import fetch_with_tachi, TachiConfig

config = TachiConfig(
    network='base',
    rpc_url='https://base-mainnet.alchemyapi.io/v2/your-api-key',
    private_key='your-private-key'
)

# Simple fetch
response = fetch_with_tachi('https://example.com/api/data', config)
print(response['content'])
```

### Using Pre-configured SDK

```python
from tachi_sdk import create_base_sdk

# Create Base mainnet SDK
sdk = create_base_sdk(
    rpc_url='https://base-mainnet.alchemyapi.io/v2/your-api-key',
    private_key='your-private-key',
    payment_processor_address='0x...'
)

# Check balance
balance = sdk.get_usdc_balance()
print(f"USDC Balance: {balance['formatted']} USDC")

# Fetch content
response = sdk.fetch_with_tachi('https://example.com/content')
```

### Error Handling

```python
from tachi_sdk import TachiSDK, TachiError, PaymentError, NetworkError

try:
    response = sdk.fetch_with_tachi('https://example.com/content')
except PaymentError as e:
    print(f"Payment failed: {e}")
    print(f"Details: {e.details}")
except NetworkError as e:
    print(f"Network error: {e}")
except TachiError as e:
    print(f"Tachi error: {e.code} - {e}")
```

### Custom Configuration

```python
from tachi_sdk import TachiSDK, TachiConfig

config = TachiConfig(
    network='base-sepolia',
    rpc_url='https://base-sepolia.alchemyapi.io/v2/your-api-key',
    private_key='your-private-key',
    payment_processor_address='0x...',
    user_agent='MyBot/1.0',
    timeout=60,
    max_retries=5
)

sdk = TachiSDK(config)
```

## Configuration

### TachiConfig Parameters

- `network`: Network to use ('base' or 'base-sepolia')
- `rpc_url`: RPC endpoint URL
- `private_key`: Private key for payments (optional)
- `payment_processor_address`: PaymentProcessor contract address
- `usdc_address`: USDC token contract address (auto-set based on network)
- `user_agent`: User agent string for requests
- `timeout`: Request timeout in seconds
- `max_retries`: Maximum number of retry attempts

### Network Addresses

#### Base Mainnet
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Chain ID**: 8453

#### Base Sepolia
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Chain ID**: 84532

## API Reference

### TachiSDK Class

#### Methods

- `fetch_with_tachi(url, method='GET', headers=None, body=None)`: Fetch content with automatic payment
- `get_usdc_balance()`: Get USDC balance for account
- `get_account_address()`: Get account address

### Response Format

```python
{
    'content': str,           # Response content
    'status_code': int,       # HTTP status code
    'headers': dict,          # Response headers
    'payment_required': bool, # Whether payment was required
    'payment_amount': str,    # Amount paid (if payment required)
    'transaction_hash': str   # Transaction hash (if payment required)
}
```

### Error Types

- `TachiError`: Base error class
- `PaymentError`: Payment-related errors
- `NetworkError`: Network-related errors

## Development

### Setup

```bash
git clone https://github.com/tachi-ai/tachi
cd tachi/packages/sdk-python
pip install -e ".[dev]"
```

### Testing

```bash
pytest tests/
```

### Code Formatting

```bash
black tachi_sdk/
isort tachi_sdk/
flake8 tachi_sdk/
```

### Type Checking

```bash
mypy tachi_sdk/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: https://docs.tachi.ai
- GitHub Issues: https://github.com/tachi-ai/tachi/issues
- Discord: https://discord.gg/tachi
