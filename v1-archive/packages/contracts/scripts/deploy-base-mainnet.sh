#!/bin/bash

# Tachi Protocol - Base Mainnet Deployment Script
# This script deploys UUPS upgradeable contracts to Base Mainnet with multi-sig security

set -e

echo "🚀 Starting Tachi Protocol Base Mainnet Deployment"
echo "=================================================="

# Environment validation
if [ -z "$BASE_RPC_URL" ]; then
    echo "❌ BASE_RPC_URL environment variable is required"
    exit 1
fi

if [ -z "$BASESCAN_API_KEY" ]; then
    echo "❌ BASESCAN_API_KEY environment variable is required for verification"
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY environment variable is required for deployment"
    exit 1
fi

echo "✅ Environment variables validated"
echo "🌐 Base Mainnet RPC: $BASE_RPC_URL"
echo "📊 BaseScan API configured: ${BASESCAN_API_KEY:0:8}..."

# Base Mainnet Configuration
export NETWORK="base"
export CHAIN_ID="8453"
export USDC_ADDRESS="0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"  # Base Mainnet USDC

echo "📋 Deployment Configuration:"
echo "   Network: Base Mainnet (Chain ID: $CHAIN_ID)"
echo "   USDC Token: $USDC_ADDRESS"

# Step 1: Deploy UUPS Upgradeable Contracts
echo ""
echo "🔨 Step 1: Deploying UUPS Upgradeable Contracts"
echo "================================================"

npx hardhat run scripts/deploy-all-upgradeable.ts --network base

if [ $? -ne 0 ]; then
    echo "❌ Contract deployment failed"
    exit 1
fi

echo "✅ Contracts deployed successfully"

# Step 2: Verify contracts on BaseScan
echo ""
echo "🔍 Step 2: Verifying Contracts on BaseScan"
echo "=========================================="

# Note: Verification addresses will be read from deployment output
# This would typically be handled by the deploy script or a separate verification script

echo "⚠️  Contract verification should be run after deployment"
echo "   Use: npx hardhat verify <CONTRACT_ADDRESS> --network base"

# Step 3: Transfer ownership to multi-sig
echo ""
echo "🔐 Step 3: Multi-Sig Ownership Transfer"
echo "======================================"

echo "⚠️  CRITICAL: After deployment, ownership MUST be transferred to multi-sig wallet"
echo "   1. Deploy/configure multi-sig wallet on Base Mainnet"
echo "   2. Transfer ownership of both contracts to multi-sig"
echo "   3. Verify multi-sig control before going live"

# Step 4: Update environment configurations
echo ""
echo "⚙️  Step 4: Update Production Environment"
echo "========================================"

echo "📝 Update the following files with deployed addresses:"
echo "   - Gateway Cloudflare Worker environment"
echo "   - Dashboard environment variables"
echo "   - SDK configuration files"
echo "   - Subgraph configuration"

# Step 5: Final security checklist
echo ""
echo "🛡️  Step 5: Security Verification Checklist"
echo "==========================================="

echo "Before going live, verify:"
echo "   □ Contracts deployed with correct USDC address"
echo "   □ Ownership transferred to multi-sig wallet"
echo "   □ Multi-sig signers configured and tested"
echo "   □ Contracts verified on BaseScan"
echo "   □ All environment variables updated"
echo "   □ Gateway endpoints updated with mainnet addresses"
echo "   □ Monitoring alerts configured for mainnet"
echo "   □ Emergency pause/unpause procedures tested"

echo ""
echo "🎉 Deployment script completed!"
echo "Follow the post-deployment checklist above before going live."
