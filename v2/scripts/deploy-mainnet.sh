#!/bin/bash
# Deploy Tachi contracts to Base Mainnet

set -e

echo "🚀 Deploying Tachi v2 to Base Mainnet..."
echo ""

# Check environment
if [ ! -f "../.env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env from .env.example"
    exit 1
fi

source ../.env

# Check wallet balance
echo "Checking wallet balance..."
BALANCE=$(cast balance $PUBLISHER_ADDRESS --rpc-url $BASE_MAINNET_RPC)
echo "ETH Balance: $BALANCE wei"

if [ "$BALANCE" = "0" ]; then
    echo "❌ Error: Wallet has no ETH for gas fees"
    echo "Please fund wallet: $PUBLISHER_ADDRESS"
    exit 1
fi

echo ""
echo "Deploying contracts..."
echo "Network: Base Mainnet (8453)"
echo "Deployer: $PUBLISHER_ADDRESS"
echo ""

cd ../contracts

# Deploy with forge
export PRIVATE_KEY=0x$PRIVATE_KEY
forge script script/Deploy.s.sol \
    --rpc-url $BASE_MAINNET_RPC \
    --broadcast \
    --slow \
    --verify \
    --etherscan-api-key $BASESCAN_API_KEY

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Contract addresses saved to: contracts/deployments/latest.env"
echo ""
echo "Next steps:"
echo "1. Update .env with new contract addresses"
echo "2. Mint license NFT: ./scripts/mint-license.sh"
echo "3. Update Cloudflare secrets: ./scripts/update-cloudflare-secrets.sh"
