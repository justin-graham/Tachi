#!/bin/bash
# Update Cloudflare Worker secrets for production (Base Mainnet)

set -e

# Load environment variables
source ../.env

echo "🔐 Updating Cloudflare Worker secrets for production..."
echo "This will configure the gateway at: tachi-gateway.jgrahamsport16.workers.dev"
echo ""

cd ../gateway

# Update secrets one by one
echo "Setting SUPABASE_URL..."
echo "$SUPABASE_URL" | npx wrangler secret put SUPABASE_URL

echo "Setting SUPABASE_KEY..."
echo "$SUPABASE_ANON_KEY" | npx wrangler secret put SUPABASE_KEY

echo "Setting BASE_RPC_URL..."
echo "$BASE_MAINNET_RPC" | npx wrangler secret put BASE_RPC_URL

echo "Setting CRAWL_NFT_ADDRESS..."
echo "$CRAWL_NFT_ADDRESS" | npx wrangler secret put CRAWL_NFT_ADDRESS

echo "Setting PROOF_OF_CRAWL_ADDRESS..."
echo "$PROOF_OF_CRAWL_ADDRESS" | npx wrangler secret put PROOF_OF_CRAWL_ADDRESS

echo "Setting PUBLISHER_ADDRESS..."
echo "$PUBLISHER_ADDRESS" | npx wrangler secret put PUBLISHER_ADDRESS

echo "Setting PRICE_PER_REQUEST..."
echo "$PRICE_PER_REQUEST" | npx wrangler secret put PRICE_PER_REQUEST

echo ""
echo "✅ All secrets updated successfully!"
echo ""
echo "Next steps:"
echo "1. Test the gateway: curl https://tachi-gateway.jgrahamsport16.workers.dev/health"
echo "2. Deploy dashboard to Vercel"
echo "3. Run end-to-end test with: node demo.mjs"
