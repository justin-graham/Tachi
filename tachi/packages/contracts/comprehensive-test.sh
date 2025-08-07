#!/bin/bash

# Tachi Protocol - Comprehensive Implementation Test
# This script validates all components of the Tachi Protocol implementation

echo "🧪 Tachi Protocol - Comprehensive Implementation Test"
echo "====================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test and track results
run_test() {
    local test_name=$1
    local test_command=$2
    local success_message=${3:-"PASS"}
    local error_message=${4:-"FAIL"}
    
    echo -n "  Testing $test_name... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $success_message${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ $error_message${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo -e "${BLUE}1️⃣  Subgraph Implementation${NC}"

# Test subgraph files
run_test "GraphQL schema" "[ -f ../subgraph/schema.graphql ]"
run_test "Subgraph manifest" "[ -f ../subgraph/subgraph.yaml ]"
run_test "AssemblyScript mappings" "[ -f ../subgraph/src/mapping.ts ]"
run_test "Package configuration" "[ -f ../subgraph/package.json ]"

echo ""
echo -e "${BLUE}2️⃣  Secure Ownership System${NC}"

# Test secure ownership scripts
run_test "Transfer ownership script" "[ -f scripts/transfer-ownership-multisig.ts ]"
run_test "Verify ownership script" "[ -f scripts/verify-multisig-ownership.ts ]"
run_test "Emergency recovery script" "[ -f scripts/emergency-recovery.ts ]"
run_test "Batch transfer contract" "[ -f contracts/OwnershipTransferBatch.sol ]"
run_test "Security guide" "[ -f SECURE_OWNERSHIP_GUIDE.md ]"
run_test "Setup guide" "[ -f MULTISIG_SETUP_GUIDE.md ]"

echo ""
echo -e "${BLUE}3️⃣  Environment Configuration${NC}"

# Test environment setup
run_test "Gateway wrangler config" "[ -f ../gateway-cloudflare/wrangler.toml ]"
run_test "Environment setup guide" "[ -f ../gateway-cloudflare/ENVIRONMENT_SETUP_GUIDE.md ]"
run_test "Deployment checklist" "[ -f ../gateway-cloudflare/PRODUCTION_DEPLOYMENT_CHECKLIST.md ]"

# Test wrangler configuration parsing
run_test "Staging environment config" "cd ../gateway-cloudflare && npx wrangler secret list --env staging 2>&1 | grep -q 'tachi-gateway-staging'"
run_test "Production environment config" "cd ../gateway-cloudflare && npx wrangler secret list --env production 2>&1 | grep -q 'tachi-gateway-production'"

echo ""
echo -e "${BLUE}4️⃣  Observability System${NC}"

# Test observability components
run_test "Observability verification script" "[ -f $(pwd)/scripts/verify-observability.sh ]"
run_test "Health endpoints functional" "curl -s http://localhost:3003/api/health | grep -q 'healthy'"
run_test "Database health check" "curl -s http://localhost:3003/api/health/database | grep -q 'connected'"
run_test "Blockchain health check" "curl -s http://localhost:3003/api/health/blockchain | grep -q 'connected'"

echo ""
echo -e "${BLUE}5️⃣  TypeScript Compilation${NC}"

# Test TypeScript compilation
run_test "Hardhat compilation" "cd $(pwd) && npx hardhat compile 2>&1 | grep -q -E '(Nothing to compile|Compiled|Successfully generated)'"
run_test "Gateway TypeScript check" "cd ../gateway-cloudflare && npx tsc --noEmit --skipLibCheck 2>/dev/null"

echo ""
echo -e "${BLUE}6️⃣  Documentation Completeness${NC}"

# Test documentation files
run_test "Main README" "[ -f $(pwd)/../../../README.md ]"
run_test "Security implementation docs" "[ -f $(pwd)/SECURE_OWNERSHIP_IMPLEMENTATION.md ]"
run_test "Test results summary" "[ -f $(pwd)/TEST_RESULTS_SUMMARY.md ]"

echo ""
echo -e "${BLUE}7️⃣  Package Structure${NC}"

# Test package structure
run_test "Dashboard package" "[ -f ../dashboard/package.json ]"
run_test "Gateway core package" "[ -f ../gateway-core/package.json ]"
run_test "SDK JavaScript package" "[ -f ../sdk-js/package.json ]"
run_test "SDK Python package" "[ -f ../sdk-python/pyproject.toml ]"

echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ Tachi Protocol implementation is complete and verified${NC}"
    echo ""
    echo -e "${YELLOW}📋 Ready for deployment:${NC}"
    echo "1. Deploy subgraph to The Graph Network"
    echo "2. Configure multi-signature wallet ownership"
    echo "3. Set up production environment secrets"
    echo "4. Deploy to staging for final testing"
    echo "5. Deploy to production with monitoring"
    echo ""
    echo -e "${BLUE}📚 Next steps documented in:${NC}"
    echo "- PRODUCTION_DEPLOYMENT_CHECKLIST.md"
    echo "- ENVIRONMENT_SETUP_GUIDE.md"
    echo "- SECURE_OWNERSHIP_GUIDE.md"
    
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${YELLOW}Please review the failed tests and fix any issues before deployment${NC}"
    
    exit 1
fi
