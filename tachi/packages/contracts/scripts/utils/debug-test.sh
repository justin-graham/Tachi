#!/bin/bash

# Simple test to verify the issues
echo "Testing individual commands:"

echo -n "1. Observability script: "
[ -f scripts/verify-observability.sh ] && echo "EXISTS" || echo "MISSING"

echo -n "2. Hardhat compilation: "
npx hardhat compile 2>&1 | grep -q -E "(Nothing to compile|Compiled|Successfully generated)" && echo "PASS" || echo "FAIL"

echo -n "3. Security docs: "
[ -f SECURE_OWNERSHIP_IMPLEMENTATION.md ] && echo "EXISTS" || echo "MISSING"

echo -n "4. Test results: "
[ -f TEST_RESULTS_SUMMARY.md ] && echo "EXISTS" || echo "MISSING"

echo ""
echo "Testing with eval and redirection (like in comprehensive-test.sh):"

echo -n "1. Observability script: "
eval "[ -f scripts/verify-observability.sh ]" >/dev/null 2>&1 && echo "PASS" || echo "FAIL"

echo -n "2. Hardhat compilation: "
eval "npx hardhat compile 2>&1 | grep -q -E '(Nothing to compile|Compiled|Successfully generated)'" >/dev/null 2>&1 && echo "PASS" || echo "FAIL"

echo -n "3. Security docs: "
eval "[ -f SECURE_OWNERSHIP_IMPLEMENTATION.md ]" >/dev/null 2>&1 && echo "PASS" || echo "FAIL"

echo -n "4. Test results: "
eval "[ -f TEST_RESULTS_SUMMARY.md ]" >/dev/null 2>&1 && echo "PASS" || echo "FAIL"
