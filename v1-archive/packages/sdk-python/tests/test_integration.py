"""
Integration testing for Tachi Python SDK
Tests against actual deployed contracts and gateway
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from tachi_sdk import create_base_sepolia_sdk
import json
import time

def test_integration():
    """Test full integration with deployed contracts"""
    print("🧪 Running Integration Tests\n")
    
    # Configuration - replace with actual values
    RPC_URL = os.getenv('BASE_SEPOLIA_RPC_URL', 'https://base-sepolia.alchemyapi.io/v2/your-api-key')
    PRIVATE_KEY = os.getenv('PRIVATE_KEY', 'your-private-key-here')
    PAYMENT_PROCESSOR_ADDRESS = os.getenv('PAYMENT_PROCESSOR_ADDRESS', '0x...')
    GATEWAY_URL = os.getenv('GATEWAY_URL', 'https://your-gateway.workers.dev')
    
    if not all([RPC_URL != 'https://base-sepolia.alchemyapi.io/v2/your-api-key', 
                PRIVATE_KEY != 'your-private-key-here',
                PAYMENT_PROCESSOR_ADDRESS != '0x...',
                GATEWAY_URL != 'https://your-gateway.workers.dev']):
        print("⚠️  Integration tests require environment variables:")
        print("   BASE_SEPOLIA_RPC_URL")
        print("   PRIVATE_KEY")
        print("   PAYMENT_PROCESSOR_ADDRESS")
        print("   GATEWAY_URL")
        print("\nSkipping integration tests...")
        return
    
    # Create SDK
    sdk = create_base_sepolia_sdk(
        rpc_url=RPC_URL,
        private_key=PRIVATE_KEY,
        payment_processor_address=PAYMENT_PROCESSOR_ADDRESS
    )
    
    print(f"Wallet Address: {sdk.get_wallet_address()}")
    
    # Test 1: Check USDC balance
    print("\n1. Testing USDC balance check...")
    try:
        balance = sdk.get_usdc_balance()
        print(f"✓ USDC Balance: {balance['formatted']} USDC")
        
        if float(balance['formatted']) < 1.0:
            print("⚠️  Low USDC balance. You may need to fund your wallet for payment tests.")
    except Exception as e:
        print(f"❌ Balance check failed: {e}")
        return
    
    # Test 2: Fetch content without payment (should get 402)
    print("\n2. Testing content fetch without payment...")
    try:
        response = sdk.fetch_with_tachi(
            url=f"{GATEWAY_URL}/test-content",
            handle_payment=False
        )
        
        if response['status_code'] == 402:
            print("✓ Received 402 Payment Required as expected")
            print(f"  Payment amount: {response.get('payment_amount', 'N/A')} USDC")
        else:
            print(f"⚠️  Expected 402, got {response['status_code']}")
    except Exception as e:
        print(f"❌ Content fetch test failed: {e}")
    
    # Test 3: Fetch content with automatic payment
    print("\n3. Testing content fetch with automatic payment...")
    try:
        response = sdk.fetch_with_tachi(
            url=f"{GATEWAY_URL}/test-content",
            handle_payment=True
        )
        
        if response['status_code'] == 200:
            print("✓ Content fetched successfully after payment")
            print(f"  Payment required: {response['payment_required']}")
            if response['payment_required']:
                print(f"  Transaction hash: {response['transaction_hash']}")
            print(f"  Content length: {len(response['content'])} characters")
        else:
            print(f"⚠️  Expected 200, got {response['status_code']}")
    except Exception as e:
        print(f"❌ Payment test failed: {e}")
    
    # Test 4: Test retry logic
    print("\n4. Testing retry logic...")
    try:
        response = sdk.fetch_with_tachi(
            url=f"{GATEWAY_URL}/nonexistent-endpoint",
            handle_payment=True,
            max_retries=2
        )
        
        if response['status_code'] == 404:
            print("✓ Retry logic handled 404 correctly")
        else:
            print(f"⚠️  Expected 404, got {response['status_code']}")
    except Exception as e:
        print(f"❌ Retry test failed: {e}")
    
    print("\n🎉 Integration tests completed!")

def test_performance():
    """Test performance characteristics"""
    print("\n⚡ Performance Tests\n")
    
    # This is a placeholder for performance testing
    # In a real implementation, you would:
    # 1. Measure payment processing time
    # 2. Test concurrent requests
    # 3. Measure memory usage
    # 4. Test rate limiting
    
    print("✓ Performance tests would go here")

if __name__ == "__main__":
    test_integration()
    test_performance()
