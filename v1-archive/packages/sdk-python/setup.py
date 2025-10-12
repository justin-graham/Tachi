#!/usr/bin/env python3
"""
Setup script for running Tachi Python SDK tests
"""

import os
import sys
import subprocess

def run_command(cmd, description):
    """Run a command and print the result"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            if result.stdout:
                print(f"   Output: {result.stdout.strip()}")
        else:
            print(f"❌ {description} failed")
            print(f"   Error: {result.stderr.strip()}")
        return result.returncode == 0
    except Exception as e:
        print(f"❌ {description} failed with exception: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Setting up Tachi Python SDK Development Environment\n")
    
    # Change to the SDK directory
    sdk_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(sdk_dir)
    print(f"📁 Working directory: {sdk_dir}")
    
    # Check Python version
    python_version = sys.version_info
    print(f"🐍 Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    
    # Install dependencies
    print("\n📦 Installing dependencies...")
    dependencies = [
        "web3>=6.0.0",
        "requests>=2.25.0",
        "eth-account>=0.8.0"
    ]
    
    for dep in dependencies:
        if not run_command(f"pip install {dep}", f"Installing {dep}"):
            print(f"❌ Failed to install {dep}")
            sys.exit(1)
    
    # Run basic tests
    print("\n🧪 Running basic tests...")
    if not run_command("python tests/test_sdk.py", "Running unit tests"):
        print("❌ Unit tests failed")
        sys.exit(1)
    
    # Check if integration test environment is set up
    print("\n🔍 Checking integration test environment...")
    env_vars = [
        'BASE_SEPOLIA_RPC_URL',
        'PRIVATE_KEY',
        'PAYMENT_PROCESSOR_ADDRESS',
        'GATEWAY_URL'
    ]
    
    missing_vars = []
    for var in env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("⚠️  Integration test environment not fully configured")
        print("   Missing environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n   To run integration tests, set these environment variables:")
        print("   export BASE_SEPOLIA_RPC_URL='https://base-sepolia.alchemyapi.io/v2/your-api-key'")
        print("   export PRIVATE_KEY='your-private-key-here'")
        print("   export PAYMENT_PROCESSOR_ADDRESS='0x...'")
        print("   export GATEWAY_URL='https://your-gateway.workers.dev'")
    else:
        print("✅ Integration test environment configured")
        if not run_command("python tests/test_integration.py", "Running integration tests"):
            print("⚠️  Integration tests failed (this may be expected if contracts aren't deployed)")
    
    # Run example
    print("\n📝 Testing example usage...")
    if not run_command("python examples/example_usage.py", "Running example"):
        print("⚠️  Example failed (this may be expected without proper configuration)")
    
    print("\n🎉 Setup completed successfully!")
    print("\n📚 Next steps:")
    print("1. Configure your environment variables for integration testing")
    print("2. Deploy contracts using the contracts package")
    print("3. Test the SDK against your deployed gateway")
    print("4. Import and use the SDK in your projects:")
    print("   from tachi_sdk import create_base_sepolia_sdk")

if __name__ == "__main__":
    main()
