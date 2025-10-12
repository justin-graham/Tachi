#!/bin/bash

# Tachi Protocol - Placeholder Detection Script
# Identifies all placeholder values that need production configuration

echo "🔍 Scanning for placeholder values in Tachi Protocol..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo "📁 Scanning directory: $BASE_DIR"

# Placeholder patterns to search for
PATTERNS=(
    "YOUR_[A-Z_]*"
    "0x1234567890[a-fA-F0-9]*"
    "0x_YOUR_[A-Z_]*"
    "placeholder"
    "example\.com"
    "test.*\.com"
    "localhost:[0-9]+"
    "127\.0\.0\.1"
    "INSERT_[A-Z_]*"
    "REPLACE_[A-Z_]*"
    "TODO.*[Aa]ddress"
    "TODO.*[Kk]ey"
)

# File types to check
FILE_EXTENSIONS=(
    "*.ts"
    "*.js" 
    "*.json"
    "*.toml"
    "*.md"
    "*.env*"
    "*.yaml"
    "*.yml"
)

FOUND_ISSUES=0

echo ""
echo "🚨 Critical Placeholders (Require immediate attention)"
echo "----------------------------------------------------"

# Check each pattern
for pattern in "${PATTERNS[@]}"; do
    echo -e "${BLUE}Searching for pattern: ${YELLOW}$pattern${NC}"
    
    # Simple grep search across file types
    FILES=$(find "$BASE_DIR" \( -name node_modules -o -name .git -o -name dist -o -name build \) -prune -o \
            \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.toml" -o -name "*.md" -o -name "*.env*" \) \
            -type f -exec grep -l "$pattern" {} \; 2>/dev/null)
    
    if [ -n "$FILES" ]; then
        echo -e "${RED}Found in:${NC}"
        echo "$FILES" | while read -r file; do
            if [ -n "$file" ]; then
                # Get relative path
                REL_PATH=${file#$BASE_DIR/}
                echo -e "  📄 ${REL_PATH}"
                
                # Show matching lines with context
                grep -n "$pattern" "$file" | head -3 | while read -r line; do
                    echo -e "     ${YELLOW}$line${NC}"
                done
                
                FOUND_ISSUES=$((FOUND_ISSUES + 1))
            fi
        done
        echo ""
    fi
done

echo ""
echo "🔐 Environment Variable Checklist"
echo "--------------------------------"

ENV_VARS=(
    "BASE_RPC_URL.*YOUR_"
    "BASESCAN_API_KEY.*YOUR_"
    "PRIVATE_KEY.*YOUR_"
    "SENTRY_DSN.*your-"
    "SLACK_WEBHOOK_URL.*your"
    "ALCHEMY_API_KEY"
    "KV_NAMESPACE_ID.*YOUR_"
)

for var in "${ENV_VARS[@]}"; do
    echo -e "${BLUE}Checking: ${YELLOW}$var${NC}"
    
    FOUND=$(find "$BASE_DIR" \( -name node_modules -o -name .git \) -prune -o \
            \( -name "*.env*" -o -name "*.ts" -o -name "*.js" -o -name "*.toml" \) \
            -type f -exec grep -l "$var" {} \; 2>/dev/null)
    
    if [ -n "$FOUND" ]; then
        echo -e "${RED}  ⚠️  Found placeholder environment variable${NC}"
        echo "$FOUND" | while read -r file; do
            if [ -n "$file" ]; then
                REL_PATH=${file#$BASE_DIR/}
                echo -e "     📄 ${REL_PATH}"
            fi
        done
    else
        echo -e "${GREEN}  ✅ No placeholders found${NC}"
    fi
    echo ""
done

echo ""
echo "🏗️ Contract Address Verification"
echo "-------------------------------"

# Check if contracts have been deployed and addresses propagated
DEPLOYMENT_FILES=$(find "$BASE_DIR/packages/contracts/deployments" -name "*.json" 2>/dev/null)

if [ -n "$DEPLOYMENT_FILES" ]; then
    echo -e "${GREEN}✅ Deployment files found:${NC}"
    echo "$DEPLOYMENT_FILES" | while read -r file; do
        if [ -n "$file" ]; then
            REL_PATH=${file#$BASE_DIR/}
            echo -e "   📄 ${REL_PATH}"
            
            # Check if file has proper contract structure
            if grep -q '"contracts"' "$file" 2>/dev/null; then
                echo -e "      ${GREEN}✅ Contains contract addresses${NC}"
            else
                echo -e "      ${YELLOW}⚠️  May be old format deployment file${NC}"
            fi
        fi
    done
else
    echo -e "${RED}❌ No deployment files found${NC}"
    echo "   Run: npm run deploy:base-sepolia (for testnet)"
fi

echo ""
echo "📊 Summary"
echo "----------"

if [ $FOUND_ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 No critical placeholders found!${NC}"
    echo -e "${GREEN}   Your project appears ready for production deployment.${NC}"
else
    echo -e "${RED}⚠️  Found $FOUND_ISSUES files with placeholder values${NC}"
    echo -e "${YELLOW}   Please review and update before production deployment.${NC}"
fi

echo ""
echo "🚀 Next Steps"
echo "-------------"
echo "1. Replace all placeholder values with production secrets"
echo "2. Run: npm run deploy:base (for mainnet deployment)"
echo "3. Verify: npm run propagate-addresses base 8453"
echo "4. Test: Run end-to-end integration tests"

echo ""
echo "📋 See PRODUCTION_CHECKLIST.md for detailed guidance"
echo "=================================================="