#!/bin/bash
# Mint Tachi publisher license NFT

set -e

source ../.env

echo "🎫 Minting Tachi Publisher License..."
echo ""
echo "Network: Base Mainnet"
echo "Recipient: $PUBLISHER_ADDRESS"
echo "Terms URL: https://tachi.ai/terms/v1"
echo ""

cast send $CRAWL_NFT_ADDRESS \
    "mintLicense(address,string)" \
    $PUBLISHER_ADDRESS \
    "https://tachi.ai/terms/v1" \
    --private-key 0x$PRIVATE_KEY \
    --rpc-url $BASE_MAINNET_RPC

echo ""
echo "✅ License minted successfully!"
echo ""
echo "Verify on Basescan:"
echo "https://basescan.org/address/$CRAWL_NFT_ADDRESS"
