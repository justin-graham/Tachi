"""
Example usage of Tachi Python SDK
"""

import os
from tachi_sdk import TachiSDK, TachiConfig, create_base_sdk, create_base_sepolia_sdk

def main():
    # Example 1: Basic usage with TachiSDK
    print("=== Example 1: Basic TachiSDK Usage ===")
    
    config = TachiConfig(
        network='base-sepolia',
        rpc_url='https://base-sepolia.alchemyapi.io/v2/your-api-key',
        private_key='your-private-key-here',
        payment_processor_address='0x...',  # Replace with actual address
    )
    
    sdk = TachiSDK(config)
    
    # Check balance
    try:
        balance = sdk.get_usdc_balance()
        print(f"USDC Balance: {balance['formatted']} USDC")
    except Exception as e:
        print(f"Error getting balance: {e}")
    
    # Example 2: Using pre-configured SDK
    print("\n=== Example 2: Pre-configured SDK ===")
    
    sdk_base = create_base_sepolia_sdk(
        rpc_url='https://base-sepolia.alchemyapi.io/v2/your-api-key',
        private_key='your-private-key-here',
        payment_processor_address='0x...'
    )
    
    # Example 3: Fetch content with payment handling
    print("\n=== Example 3: Fetch Content ===")
    
    test_url = 'https://your-gateway.workers.dev/content'
    
    try:
        response = sdk_base.fetch_with_tachi(test_url)
        
        print(f"Status Code: {response['status_code']}")
        print(f"Payment Required: {response['payment_required']}")
        print(f"Content Length: {len(response['content'])} chars")
        
        if response['payment_required']:
            print(f"Payment Amount: {response['payment_amount']} USDC")
            print(f"Transaction Hash: {response['transaction_hash']}")
        
        # Show first 200 characters of content
        print(f"Content Preview: {response['content'][:200]}...")
        
    except Exception as e:
        print(f"Error fetching content: {e}")
    
    # Example 4: Custom headers and POST request
    print("\n=== Example 4: Custom Request ===")
    
    try:
        custom_headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        response = sdk_base.fetch_with_tachi(
            url='https://your-gateway.workers.dev/api/data',
            method='POST',
            headers=custom_headers,
            body='{"query": "example"}'
        )
        
        print(f"Custom request successful: {response['status_code']}")
        
    except Exception as e:
        print(f"Custom request error: {e}")

if __name__ == "__main__":
    main()
