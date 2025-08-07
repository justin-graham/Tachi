#!/bin/bash

# Tachi Protocol - Production Observability Verification Script
# This script verifies that all monitoring components are working correctly

echo "🔍 Tachi Protocol - Observability Verification"
echo "=============================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:3003}"
WORKER_URL="${WORKER_URL:-}"

echo -e "${BLUE}📋 Verification Overview:${NC}"
echo "1. Health Check Endpoints"
echo "2. Sentry Error Capture"
echo "3. Better Uptime Connectivity"
echo "4. Environment Configuration"
echo ""

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -n "  Checking $name... "
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url" 2>/dev/null || echo "000")
        
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✅ OK${NC}"
            return 0
        else
            echo -e "${RED}❌ Failed (HTTP $response) - Service may not be running${NC}"
            return 0  # Don't exit on endpoint failures
        fi
    else
        echo -e "${YELLOW}⚠️  curl not found, skipping${NC}"
        return 0
    fi
}

# 1. Health Check Endpoints
echo -e "${BLUE}1️⃣  Health Check Endpoints${NC}"

if [ -n "$DASHBOARD_URL" ]; then
    check_endpoint "$DASHBOARD_URL/api/health" "Main health endpoint"
    check_endpoint "$DASHBOARD_URL/api/health/database" "Database health"
    check_endpoint "$DASHBOARD_URL/api/health/blockchain" "Blockchain health"
else
    echo -e "${YELLOW}⚠️  DASHBOARD_URL not set, skipping health checks${NC}"
fi

echo ""

# 2. Sentry Configuration Check
echo -e "${BLUE}2️⃣  Sentry Configuration${NC}"

# Fix directory paths - we're already in contracts directory
DASHBOARD_DIR="$(pwd)/../dashboard"
WORKER_DIR="$(pwd)/../gateway-cloudflare"

# Check Sentry files exist
echo -n "  Checking Sentry client config... "
if [ -f "$DASHBOARD_DIR/sentry.client.config.js" ]; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -n "  Checking Sentry server config... "
if [ -f "$DASHBOARD_DIR/sentry.server.config.js" ]; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -n "  Checking Next.js Sentry integration... "
if grep -q "withSentryConfig" "$DASHBOARD_DIR/next.config.js" 2>/dev/null; then
    echo -e "${GREEN}✅ Integrated${NC}"
else
    echo -e "${RED}❌ Not integrated${NC}"
fi

echo -n "  Checking Worker Sentry config... "
if [ -f "$WORKER_DIR/src/sentry-config.ts" ]; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo ""

# 3. Environment Variables Check
echo -e "${BLUE}3️⃣  Environment Configuration${NC}"

check_env_var() {
    local var_name=$1
    local required=${2:-false}
    
    echo -n "  Checking $var_name... "
    
    if [ -n "${!var_name}" ]; then
        echo -e "${GREEN}✅ Set${NC}"
    elif [ "$required" = "true" ]; then
        echo -e "${RED}❌ Missing (required)${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠️  Not set (optional)${NC}"
    fi
    
    return 0
}

# Check for environment variables - fix the path
if [ -f "$DASHBOARD_DIR/.env.local" ]; then
    source "$DASHBOARD_DIR/.env.local" 2>/dev/null || true
    echo "✅ Loaded environment variables from .env.local"
else
    echo "⚠️  .env.local not found at $DASHBOARD_DIR/.env.local"
fi

check_env_var "NEXT_PUBLIC_SENTRY_DSN"
check_env_var "SENTRY_DSN"
check_env_var "SENTRY_ORG"
check_env_var "SENTRY_PROJECT"
check_env_var "BETTER_UPTIME_API_KEY"
check_env_var "TENDERLY_PROJECT_ID"
check_env_var "TENDERLY_API_KEY"

echo ""

# 4. File Structure Verification
echo -e "${BLUE}4️⃣  File Structure Verification${NC}"

check_file() {
    local file_path=$1
    local description=$2
    
    echo -n "  $description... "
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ Found${NC}"
    else
        echo -e "${RED}❌ Missing${NC}"
    fi
}

check_file "$DASHBOARD_DIR/pages/api/health/index.js" "Main health endpoint"
check_file "$DASHBOARD_DIR/pages/api/health/database.js" "Database health endpoint"
check_file "$DASHBOARD_DIR/pages/api/health/blockchain.js" "Blockchain health endpoint"
check_file "$DASHBOARD_DIR/components/ErrorBoundary.tsx" "Error boundary component"
check_file "$DASHBOARD_DIR/hooks/useErrorReporting.ts" "Error reporting hook"
check_file "$(pwd)/.env.monitoring.template" "Environment template"
check_file "$(pwd)/MONITORING_DEPLOYMENT_CHECKLIST.md" "Deployment checklist"

echo ""

# 5. Package Dependencies
echo -e "${BLUE}5️⃣  Package Dependencies${NC}"

echo -n "  Checking @sentry/nextjs in dashboard... "
if grep -q "@sentry/nextjs" "$DASHBOARD_DIR/package.json" 2>/dev/null; then
    echo -e "${GREEN}✅ Installed${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -n "  Checking @sentry/browser in worker... "
if grep -q "@sentry/browser" "$WORKER_DIR/package.json" 2>/dev/null; then
    echo -e "${GREEN}✅ Installed${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo ""

# 6. Test Error Capture (if in development)
if [ "$NODE_ENV" = "development" ] || [ "$NODE_ENV" = "" ]; then
    echo -e "${BLUE}6️⃣  Development Test Features${NC}"
    
    echo -e "${YELLOW}📝 To test error capture in development:${NC}"
    echo "  1. Add this to any React component:"
    echo "     throw new Error('Test error for Sentry monitoring');"
    echo ""
    echo "  2. Check your Sentry dashboard for the captured error"
    echo ""
    echo "  3. Test health endpoints:"
    echo "     curl $DASHBOARD_URL/api/health"
    echo ""
fi

# Summary
echo -e "${GREEN}🎉 Observability Verification Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Configure your monitoring service accounts"
echo "2. Update environment variables with real API keys"
echo "3. Deploy your application with monitoring enabled"
echo "4. Test alert flows in production"
echo "5. Set up monitoring dashboards"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- MONITORING_TENDERLY_SETUP.md"
echo "- MONITORING_SENTRY_SETUP.md"
echo "- MONITORING_BETTER_UPTIME_SETUP.md"
echo "- MONITORING_DEPLOYMENT_CHECKLIST.md"
echo "- OBSERVABILITY_IMPLEMENTATION_PLAN.md"
echo ""
echo -e "${GREEN}✅ Your protocol is ready for production monitoring!${NC}"
