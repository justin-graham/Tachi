#!/bin/bash
# Tachi v2 - Setup Checker
# Verifies all prerequisites are met before running demo

set -e

echo "================================================"
echo "🔍 Tachi v2 Setup Checker"
echo "================================================"
echo ""

# Load environment
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ No .env file found"
  exit 1
fi

# Check 1: SDK built
echo "1️⃣  Checking SDK build..."
if [ -f "sdk/dist/index.js" ]; then
  echo "   ✅ SDK built successfully"
else
  echo "   ❌ SDK not built - run: cd sdk && npm run build"
  exit 1
fi

# Check 2: Contract addresses
echo ""
echo "2️⃣  Checking contract addresses..."
if [ -z "$CRAWL_NFT_ADDRESS" ]; then
  echo "   ❌ CRAWL_NFT_ADDRESS not set in .env"
  exit 1
fi
if [ -z "$PAYMENT_PROCESSOR_ADDRESS" ]; then
  echo "   ❌ PAYMENT_PROCESSOR_ADDRESS not set in .env"
  exit 1
fi
if [ -z "$PROOF_OF_CRAWL_ADDRESS" ]; then
  echo "   ❌ PROOF_OF_CRAWL_ADDRESS not set in .env"
  exit 1
fi
echo "   ✅ All contract addresses configured"

# Check 3: Wallet ETH balance
echo ""
echo "3️⃣  Checking wallet ETH balance..."
ETH_BALANCE=$(cast balance $PUBLISHER_ADDRESS --rpc-url $BASE_SEPOLIA_RPC)
if [ "$ETH_BALANCE" = "0" ]; then
  echo "   ⚠️  Wallet has 0 ETH - need testnet ETH for gas"
  echo "   Get testnet ETH: https://www.alchemy.com/faucets/base-sepolia"
else
  echo "   ✅ Wallet has ETH: $ETH_BALANCE wei"
fi

# Check 4: License minted
echo ""
echo "4️⃣  Checking publisher license..."
HAS_LICENSE=$(cast call $CRAWL_NFT_ADDRESS "hasLicense(address)" $PUBLISHER_ADDRESS --rpc-url $BASE_SEPOLIA_RPC)
if [ "$HAS_LICENSE" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
  echo "   ✅ Publisher license minted"
else
  echo "   ⚠️  No license found - run: cast send to mint"
  echo "   See NEXT_STEPS.md Step 2"
fi

# Check 5: USDC balance
echo ""
echo "5️⃣  Checking USDC balance..."
USDC_BALANCE=$(cast call $USDC_BASE_SEPOLIA "balanceOf(address)" $PUBLISHER_ADDRESS --rpc-url $BASE_SEPOLIA_RPC)
USDC_DECIMAL=$(printf "%d" $USDC_BALANCE)
if [ "$USDC_DECIMAL" -eq 0 ]; then
  echo "   ⚠️  Wallet has 0 USDC - need testnet USDC for payments"
  echo "   Get testnet USDC: https://faucet.circle.com/"
else
  echo "   ✅ Wallet has USDC: $(echo "scale=6; $USDC_DECIMAL/1000000" | bc) USDC"
fi

# Check 6: Supabase connection
echo ""
echo "6️⃣  Checking Supabase connection..."
SUPABASE_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/")
if [ "$SUPABASE_CHECK" = "200" ]; then
  echo "   ✅ Supabase connection working"
else
  echo "   ⚠️  Supabase connection failed (HTTP $SUPABASE_CHECK)"
  echo "   Check SUPABASE_URL and SUPABASE_ANON_KEY in .env"
fi

# Check 7: Services running
echo ""
echo "7️⃣  Checking services..."
API_RUNNING=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "000")
if [ "$API_RUNNING" = "200" ]; then
  echo "   ✅ API running on port 3001"
else
  echo "   ⚠️  API not running - start with: cd api && npm run dev"
fi

DASHBOARD_RUNNING=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$DASHBOARD_RUNNING" = "200" ]; then
  echo "   ✅ Dashboard running on port 3000"
else
  echo "   ⚠️  Dashboard not running - start with: cd dashboard && npm run dev"
fi

# Summary
echo ""
echo "================================================"
echo "📊 Setup Status Summary"
echo "================================================"

READY=true

if [ "$ETH_BALANCE" = "0" ]; then
  READY=false
fi

if [ "$HAS_LICENSE" != "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
  READY=false
fi

if [ "$USDC_DECIMAL" -eq 0 ]; then
  READY=false
fi

if [ "$API_RUNNING" != "200" ]; then
  READY=false
fi

if [ "$READY" = true ]; then
  echo ""
  echo "✅ All systems ready! Run: node demo.mjs"
  echo ""
else
  echo ""
  echo "⚠️  Some prerequisites missing - see warnings above"
  echo "📖 Check NEXT_STEPS.md for detailed instructions"
  echo ""
fi
