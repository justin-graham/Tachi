"""
Testing script for Tachi Python SDK
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from tachi_sdk import TachiSDK, TachiConfig, create_base_sepolia_sdk
import json

def test_basic_functionality():
    """Test basic SDK functionality"""
    print("Testing basic SDK functionality...")
    
    config = TachiConfig(
        network='base-sepolia',
        rpc_url='https://base-sepolia.alchemyapi.io/v2/demo',
        private_key='0x' + '1' * 64,  # Dummy private key for testing
        payment_processor_address='0x' + '1' * 40,  # Dummy address
    )
    
    sdk = TachiSDK(config)
    
    # Test configuration
    assert sdk.config.network == 'base-sepolia'
    assert sdk.config.rpc_url == 'https://base-sepolia.alchemyapi.io/v2/demo'
    print("✓ Configuration test passed")
    
    # Test wallet address generation
    wallet_address = sdk.get_wallet_address()
    assert wallet_address.startswith('0x')
    assert len(wallet_address) == 42
    print(f"✓ Wallet address generated: {wallet_address}")
    
    print("Basic functionality tests passed!\n")

def test_error_handling():
    """Test error handling"""
    print("Testing error handling...")
    
    # Test invalid network
    try:
        config = TachiConfig(
            network='invalid-network',
            rpc_url='https://example.com',
            private_key='0x' + '1' * 64,
            payment_processor_address='0x' + '1' * 40,
        )
        sdk = TachiSDK(config)
        print("✗ Should have failed with invalid network")
    except ValueError as e:
        print(f"✓ Invalid network error caught: {e}")
    
    # Test invalid private key
    try:
        config = TachiConfig(
            network='base-sepolia',
            rpc_url='https://example.com',
            private_key='invalid-key',
            payment_processor_address='0x' + '1' * 40,
        )
        sdk = TachiSDK(config)
        print("✗ Should have failed with invalid private key")
    except ValueError as e:
        print(f"✓ Invalid private key error caught: {e}")
    
    print("Error handling tests passed!\n")

def test_helper_functions():
    """Test helper functions"""
    print("Testing helper functions...")
    
    # Test pre-configured SDK creation
    sdk = create_base_sepolia_sdk(
        rpc_url='https://base-sepolia.alchemyapi.io/v2/demo',
        private_key='0x' + '1' * 64,
        payment_processor_address='0x' + '1' * 40,
    )
    
    assert sdk.config.network == 'base-sepolia'
    assert sdk.config.usdc_address == '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    print("✓ Base Sepolia SDK creation test passed")
    
    print("Helper function tests passed!\n")

def test_payment_amount_parsing():
    """Test payment amount parsing"""
    print("Testing payment amount parsing...")
    
    config = TachiConfig(
        network='base-sepolia',
        rpc_url='https://base-sepolia.alchemyapi.io/v2/demo',
        private_key='0x' + '1' * 64,
        payment_processor_address='0x' + '1' * 40,
    )
    
    sdk = TachiSDK(config)
    
    # Test different payment amount formats
    test_cases = [
        ('1000000', '1.0'),  # 1 USDC in wei
        ('500000', '0.5'),   # 0.5 USDC in wei
        ('10000000', '10.0'), # 10 USDC in wei
    ]
    
    for wei_amount, expected_usdc in test_cases:
        formatted = sdk._format_usdc_amount(int(wei_amount))
        assert formatted == expected_usdc
        print(f"✓ {wei_amount} wei = {formatted} USDC")
    
    print("Payment amount parsing tests passed!\n")

def main():
    """Run all tests"""
    print("Running Tachi Python SDK Tests\n")
    
    try:
        test_basic_functionality()
        test_error_handling()
        test_helper_functions()
        test_payment_amount_parsing()
        
        print("🎉 All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
