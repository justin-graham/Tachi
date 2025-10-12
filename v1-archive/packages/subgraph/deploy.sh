#!/bin/bash

# Tachi Protocol Subgraph Deployment Script
# This script deploys the subgraph to The Graph Studio

set -e

echo "🚀 Deploying Tachi Protocol Subgraph"
echo "====================================="

# Check required environment variables
if [ -z "$GRAPH_API_KEY" ]; then
    echo "❌ Error: GRAPH_API_KEY environment variable is not set"
    echo "Please set your Graph Studio API key:"
    echo "export GRAPH_API_KEY=your_api_key_here"
    exit 1
fi

# Check if network parameter is provided
NETWORK=${1:-base-sepolia}
echo "📋 Target Network: $NETWORK"

# Validate network
case $NETWORK in
    base|base-sepolia|localhost)
        echo "✅ Valid network: $NETWORK"
        ;;
    *)
        echo "❌ Error: Invalid network '$NETWORK'"
        echo "Supported networks: base, base-sepolia, localhost"
        exit 1
        ;;
esac

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Prepare network-specific configuration
echo "⚙️  Preparing configuration for $NETWORK..."
case $NETWORK in
    base)
        npm run prepare:base
        ;;
    base-sepolia)
        npm run prepare:base-sepolia
        ;;
    localhost)
        npm run prepare:localhost
        ;;
esac

# Generate code from schema
echo "🔧 Generating TypeScript code from GraphQL schema..."
npm run codegen

# Build the subgraph
echo "🏗️  Building subgraph..."
npm run build

# Authenticate with The Graph Studio
echo "🔐 Authenticating with The Graph Studio..."
npm run auth

# Deploy to The Graph Studio
echo "🚀 Deploying to The Graph Studio..."
if [ "$NETWORK" = "localhost" ]; then
    echo "⚠️  Local deployment not supported in this script"
    echo "Please use: npm run deploy:local"
    exit 1
else
    npm run deploy:studio
fi

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Your subgraph will be available at:"
echo "   https://api.studio.thegraph.com/query/tachi-protocol/v1"
echo ""
echo "📊 View your subgraph in The Graph Studio:"
echo "   https://thegraph.com/studio/subgraph/tachi-protocol"
echo ""
echo "🔍 Monitor indexing progress and check for any errors in the Studio dashboard."
echo "📝 It may take a few minutes for the subgraph to fully sync with the blockchain."
