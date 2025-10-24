#!/bin/bash
# =============================================================================
# Tachi Gateway - Cloudflare Secrets Sync Script
# =============================================================================
# Syncs environment variables from root .env to Cloudflare Workers
#
# Usage:
#   chmod +x sync-secrets.sh
#   ./sync-secrets.sh
#
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ENV_FILE="../.env"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Tachi Gateway - Cloudflare Secrets Sync                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}⚠️  Error: $ENV_FILE not found${NC}"
  echo "Please create the .env file in the v2 directory first."
  exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo -e "${YELLOW}⚠️  Error: wrangler not found${NC}"
  echo "Install with: npm install -g wrangler"
  exit 1
fi

echo -e "${BLUE}📋 Reading secrets from $ENV_FILE...${NC}"
echo ""

# Function to read env value from .env file
get_env_value() {
  local key=$1
  grep "^${key}=" "$ENV_FILE" | cut -d '=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

# Gateway-relevant secret keys
SECRET_KEYS=(
  "SUPABASE_URL"
  "SUPABASE_KEY"
  "BASE_RPC_URL"
  "CRAWL_NFT_ADDRESS"
  "PROOF_OF_CRAWL_ADDRESS"
  "PAYMENT_PROCESSOR_ADDRESS"
  "PRICE_PER_REQUEST"
  "PUBLISHER_ADDRESS"
  "GATEWAY_PRIVATE_KEY"
)

# Sync each secret
TOTAL=${#SECRET_KEYS[@]}
COUNT=0

for key in "${SECRET_KEYS[@]}"; do
  value=$(get_env_value "$key")

  # Skip if not set or is a comment
  if [ -z "$value" ] || [[ "$value" == \#* ]]; then
    echo -e "${YELLOW}⚠️  Skipping $key (not set in .env)${NC}"
    continue
  fi

  COUNT=$((COUNT+1))
  echo -e "${GREEN}[$COUNT/$TOTAL]${NC} Setting ${BLUE}$key${NC}..."

  # Use echo to pipe value to wrangler secret put
  echo "$value" | wrangler secret put "$key" > /dev/null 2>&1
done

echo ""
echo -e "${GREEN}✅ Successfully synced $COUNT secrets to Cloudflare Workers!${NC}"
echo ""

# Verify secrets
echo -e "${BLUE}📝 Verifying secrets list:${NC}"
wrangler secret list

echo ""
echo -e "${GREEN}🎉 Done!${NC} Your Cloudflare Worker is now configured."
echo ""
echo "Next steps:"
echo "  1. Deploy: wrangler deploy"
echo "  2. Test: curl https://your-gateway.workers.dev/health"
echo ""
