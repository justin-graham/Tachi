# Tachi Python SDK Examples

This directory contains practical examples of how to use the Tachi Python SDK.

## Example Files

### `example_usage.py`
Comprehensive example covering:
- Basic SDK setup and configuration
- Balance checking
- Content fetching with automatic payment
- Custom headers and POST requests
- Error handling patterns

## Running Examples

### Prerequisites
1. Install the SDK dependencies:
   ```bash
   pip install web3>=6.0.0 requests>=2.25.0 eth-account>=0.8.0
   ```

2. Set up environment variables:
   ```bash
   export BASE_SEPOLIA_RPC_URL="https://base-sepolia.alchemyapi.io/v2/your-api-key"
   export PRIVATE_KEY="your-private-key-here"
   export PAYMENT_PROCESSOR_ADDRESS="0x..."
   export GATEWAY_URL="https://your-gateway.workers.dev"
   ```

### Running the Examples
```bash
# From the sdk-python directory
python examples/example_usage.py
```

## Example Patterns

### Basic Setup
```python
from tachi_sdk import create_base_sepolia_sdk

sdk = create_base_sepolia_sdk(
    rpc_url='https://base-sepolia.alchemyapi.io/v2/your-api-key',
    private_key='your-private-key-here',
    payment_processor_address='0x...'
)
```

### Content Fetching
```python
# Fetch content with automatic payment
response = sdk.fetch_with_tachi('https://your-gateway.workers.dev/content')

if response['status_code'] == 200:
    print(f"Content: {response['content']}")
    if response['payment_required']:
        print(f"Paid: {response['payment_amount']} USDC")
```

### Error Handling
```python
try:
    response = sdk.fetch_with_tachi(url)
    # Process response
except Exception as e:
    print(f"Error: {e}")
```

### Balance Management
```python
# Check balance before making requests
balance = sdk.get_usdc_balance()
print(f"Available: {balance['formatted']} USDC")

if float(balance['formatted']) < 1.0:
    print("Low balance - consider funding your wallet")
```

## Real-World Use Cases

### 1. AI Training Data Collection
```python
import json
from tachi_sdk import create_base_sepolia_sdk

def collect_training_data(urls):
    sdk = create_base_sepolia_sdk(...)
    
    data = []
    for url in urls:
        try:
            response = sdk.fetch_with_tachi(url)
            if response['status_code'] == 200:
                data.append({
                    'url': url,
                    'content': response['content'],
                    'payment': response['payment_amount']
                })
        except Exception as e:
            print(f"Failed to fetch {url}: {e}")
    
    return data
```

### 2. Research Data Pipeline
```python
import time
from tachi_sdk import create_base_sepolia_sdk

def research_pipeline(query_urls):
    sdk = create_base_sepolia_sdk(...)
    
    results = []
    for url in query_urls:
        # Rate limiting
        time.sleep(1)
        
        try:
            response = sdk.fetch_with_tachi(url)
            if response['status_code'] == 200:
                results.append(process_content(response['content']))
        except Exception as e:
            print(f"Error processing {url}: {e}")
    
    return results
```

### 3. Automated Content Monitoring
```python
import schedule
from tachi_sdk import create_base_sepolia_sdk

def monitor_content():
    sdk = create_base_sepolia_sdk(...)
    
    urls_to_monitor = [
        'https://site1.com/api/data',
        'https://site2.com/feed',
        # ... more URLs
    ]
    
    for url in urls_to_monitor:
        try:
            response = sdk.fetch_with_tachi(url)
            if response['status_code'] == 200:
                check_for_changes(url, response['content'])
        except Exception as e:
            log_error(f"Monitor failed for {url}: {e}")

# Schedule monitoring
schedule.every(1).hours.do(monitor_content)
```

## Configuration Examples

### Development Configuration
```python
# For testing and development
config = TachiConfig(
    network='base-sepolia',
    rpc_url='https://base-sepolia.alchemyapi.io/v2/your-api-key',
    private_key='your-test-private-key',
    payment_processor_address='0x...',  # Testnet contract
)
```

### Production Configuration
```python
# For production use
config = TachiConfig(
    network='base',
    rpc_url='https://base.alchemyapi.io/v2/your-api-key',
    private_key=os.getenv('PROD_PRIVATE_KEY'),
    payment_processor_address='0x...',  # Mainnet contract
)
```

## Best Practices

1. **Environment Variables**: Always use environment variables for sensitive data
2. **Error Handling**: Implement proper error handling and retries
3. **Rate Limiting**: Respect rate limits to avoid being blocked
4. **Balance Monitoring**: Check balance before making expensive requests
5. **Logging**: Use proper logging for debugging and monitoring

## Additional Resources

- [SDK Documentation](../README.md)
- [Testing Guide](../tests/README.md)
- [Tachi Protocol Documentation](../../../docs/)
