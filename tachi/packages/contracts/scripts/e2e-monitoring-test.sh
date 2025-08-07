#!/bin/bash

# Tachi Protocol - End-to-End Monitoring Integration Test
# This script performs comprehensive testing of all monitoring systems

echo "🚀 Tachi Protocol - End-to-End Monitoring Test"
echo "==============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
DASHBOARD_URL="http://localhost:3003"
SUCCESS_COUNT=0
TOTAL_TESTS=0

# Test tracking
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
}

echo -e "${BLUE}${BOLD}🧪 Running Integration Tests${NC}"
echo ""

# Test 1: Dashboard Health Endpoints
echo -e "${BLUE}Test 1: Dashboard Health Endpoints${NC}"
echo -n "  Main health endpoint... "
curl -s "$DASHBOARD_URL/api/health" | grep -q "healthy"
test_result $?

echo -n "  Database health endpoint... "
curl -s "$DASHBOARD_URL/api/health/database" | grep -q "connected"
test_result $?

echo -n "  Blockchain health endpoint... "
curl -s "$DASHBOARD_URL/api/health/blockchain" | grep -q "connected"
test_result $?

echo ""

# Test 2: Error Capture (if endpoint exists)
echo -e "${BLUE}Test 2: Error Handling${NC}"
echo -n "  Error endpoint response... "
response=$(curl -s -w "%{http_code}" "$DASHBOARD_URL/api/test-error" 2>/dev/null)
if [[ "$response" == *"500"* ]] || [[ "$response" == *"error"* ]]; then
    test_result 0
else
    test_result 1
fi

echo ""

# Test 3: Environment Configuration
echo -e "${BLUE}Test 3: Environment Configuration${NC}"

# Source environment variables from the correct path
if [ -f "../dashboard/.env.local" ]; then
    source "../dashboard/.env.local" 2>/dev/null
elif [ -f "../../dashboard/.env.local" ]; then
    source "../../dashboard/.env.local" 2>/dev/null
fi

echo -n "  Sentry DSN configured... "
if [ -n "$SENTRY_DSN" ]; then
    test_result 0
else
    test_result 1
fi

echo -n "  Better Uptime API key configured... "
if [ -n "$BETTER_UPTIME_API_KEY" ]; then
    test_result 0
else
    test_result 1
fi

echo -n "  Tenderly API key configured... "
if [ -n "$TENDERLY_API_KEY" ]; then
    test_result 0
else
    test_result 1
fi

echo ""

# Test 4: Monitoring Services Connectivity
echo -e "${BLUE}Test 4: External Service Connectivity${NC}"

echo -n "  Sentry API connectivity... "
if curl -s --max-time 5 "https://sentry.io/api/0/" > /dev/null 2>&1; then
    test_result 0
else
    test_result 1
fi

echo -n "  Better Uptime API connectivity... "
if curl -s --max-time 5 "https://betteruptime.com/api/v2/monitors" -H "Authorization: Bearer $BETTER_UPTIME_API_KEY" > /dev/null 2>&1; then
    test_result 0
else
    test_result 1
fi

echo -n "  Tenderly API connectivity... "
if curl -s --max-time 5 "https://api.tenderly.co/api/v1/health" > /dev/null 2>&1; then
    test_result 0
else
    test_result 1
fi

echo ""

# Test 5: File Structure
echo -e "${BLUE}Test 5: Critical File Existence${NC}"

echo -n "  Dashboard .env.local... "
if [ -f "../dashboard/.env.local" ] || [ -f "../../dashboard/.env.local" ]; then
    test_result 0
else
    test_result 1
fi

echo -n "  Worker wrangler.toml... "
if [ -f "../gateway-cloudflare/wrangler.toml" ] || [ -f "../../gateway-cloudflare/wrangler.toml" ]; then
    test_result 0
else
    test_result 1
fi

echo -n "  Setup scripts... "
if [ -f "./scripts/setup-better-uptime.sh" ] && [ -f "./scripts/setup-tenderly.sh" ]; then
    test_result 0
else
    test_result 1
fi

echo ""

# Test 6: Real-time Monitoring Verification
echo -e "${BLUE}Test 6: Real-time Monitoring Data${NC}"

# Test 6: Real-time Monitoring Verification
echo -e "${BLUE}Test 6: Real-time Monitoring Data${NC}"

echo -n "  Health endpoint response time... "
start_time=$(python3 -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo "0")
curl -s "$DASHBOARD_URL/api/health" > /dev/null
end_time=$(python3 -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo "1000")

if [ "$start_time" != "0" ] && [ "$end_time" != "1000" ]; then
    response_time=$((end_time - start_time))
    if [ $response_time -lt 2000 ]; then  # Less than 2 seconds
        test_result 0
    else
        test_result 1
    fi
else
    # Fallback: just test if the endpoint responds
    if curl -s "$DASHBOARD_URL/api/health" > /dev/null; then
        test_result 0
    else
        test_result 1
    fi
fi

echo -n "  Blockchain connectivity... "
blockchain_status=$(curl -s "$DASHBOARD_URL/api/health/blockchain" | grep -o '"rpc_status":"[^"]*"' | cut -d'"' -f4)
if [ "$blockchain_status" = "connected" ]; then
    test_result 0
else
    test_result 1
fi

echo ""

# Summary
echo -e "${BLUE}${BOLD}📊 Test Results Summary${NC}"
echo "=============================="
echo -e "Total Tests: ${BOLD}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}${BOLD}$SUCCESS_COUNT${NC}"
echo -e "Failed: ${RED}${BOLD}$((TOTAL_TESTS - SUCCESS_COUNT))${NC}"

SUCCESS_RATE=$((SUCCESS_COUNT * 100 / TOTAL_TESTS))
echo -e "Success Rate: ${BOLD}$SUCCESS_RATE%${NC}"

echo ""

if [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${GREEN}${BOLD}🎉 MONITORING SYSTEM STATUS: EXCELLENT${NC}"
    echo -e "${GREEN}Your monitoring infrastructure is production-ready!${NC}"
elif [ $SUCCESS_RATE -ge 60 ]; then
    echo -e "${YELLOW}${BOLD}⚠️  MONITORING SYSTEM STATUS: GOOD${NC}"
    echo -e "${YELLOW}Minor issues detected, but core functionality works.${NC}"
else
    echo -e "${RED}${BOLD}❌ MONITORING SYSTEM STATUS: NEEDS ATTENTION${NC}"
    echo -e "${RED}Critical issues detected, please review the failed tests.${NC}"
fi

echo ""
echo -e "${BLUE}${BOLD}🔍 Monitoring Dashboard URLs:${NC}"
echo -e "• Better Uptime: ${BLUE}https://betteruptime.com${NC}"
echo -e "• Sentry: ${BLUE}https://tachi.sentry.io${NC}"
echo -e "• Tenderly: ${BLUE}https://dashboard.tenderly.co/tachi/project${NC}"
echo -e "• Local Health: ${BLUE}$DASHBOARD_URL/api/health${NC}"

echo ""
echo -e "${GREEN}${BOLD}✅ End-to-End Monitoring Test Complete!${NC}"

# Exit with success if most tests passed
if [ $SUCCESS_RATE -ge 80 ]; then
    exit 0
else
    exit 1
fi
