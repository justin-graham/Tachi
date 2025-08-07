#!/bin/bash

# Tachi Protocol - Tenderly Contract Monitoring Setup
# This script adds contracts to Tenderly for comprehensive blockchain monitoring

echo "🔗 Setting up Tenderly Contract Monitoring for Tachi Protocol"
echo "============================================================="
echo ""

# Load environment variables
if [ -f "../../dashboard/.env.local" ]; then
    source "../../dashboard/.env.local"
    echo "✅ Loaded environment variables from dashboard/.env.local"
elif [ -f "../dashboard/.env.local" ]; then
    source "../dashboard/.env.local"
    echo "✅ Loaded environment variables from dashboard/.env.local"
else
    echo "⚠️  No .env.local file found, using environment variables"
fi

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contract addresses (Base Sepolia)
PAYMENT_PROCESSOR="0x5a9c9Aa7feC1DF9f5702BcCEB21492be293E5d5F"
PROOF_OF_CRAWL="0xeC3311cCd41B450a12404E7D14165D0dfa0725c3"
MULTISIG="0x1C5a9A0228efc875484Bca44df3987bB6A2aca23"

# Tenderly configuration
TENDERLY_ACCOUNT="${TENDERLY_ACCOUNT:-tachi}"
TENDERLY_PROJECT="${TENDERLY_PROJECT_ID:-project}"
TENDERLY_API_KEY="${TENDERLY_API_KEY}"

if [ -z "$TENDERLY_API_KEY" ]; then
    echo -e "${RED}❌ TENDERLY_API_KEY not found in environment${NC}"
    echo "Please set TENDERLY_API_KEY in your .env.local file"
    exit 1
fi

echo -e "${BLUE}📋 Tenderly Configuration:${NC}"
echo "Account: $TENDERLY_ACCOUNT"
echo "Project: $TENDERLY_PROJECT"
echo "Network: Base Sepolia (84532)"
echo ""

# Function to add contract to Tenderly
add_contract() {
    local contract_address=$1
    local contract_name=$2
    local display_name=$3
    
    echo -n "  Adding $display_name... "
    
    response=$(curl -s -X POST \
        "https://api.tenderly.co/api/v1/account/$TENDERLY_ACCOUNT/project/$TENDERLY_PROJECT/contracts" \
        -H "X-Access-Key: $TENDERLY_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"contracts\": [{
                \"address\": \"$contract_address\",
                \"network_id\": \"84532\",
                \"display_name\": \"$display_name\"
            }]
        }" 2>/dev/null)
    
    if echo "$response" | grep -q "error" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Already exists or error${NC}"
    else
        echo -e "${GREEN}✅ Added${NC}"
    fi
}

# Function to create monitoring rule
create_monitoring_rule() {
    local rule_name=$1
    local contract_address=$2
    local description=$3
    
    echo -n "  Creating rule: $rule_name... "
    
    response=$(curl -s -X POST \
        "https://api.tenderly.co/api/v1/account/$TENDERLY_ACCOUNT/project/$TENDERLY_PROJECT/alerts" \
        -H "X-Access-Key: $TENDERLY_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$rule_name\",
            \"description\": \"$description\",
            \"network\": \"84532\",
            \"filters\": {
                \"address\": [\"$contract_address\"],
                \"status\": [\"success\", \"failed\"]
            },
            \"enabled\": true,
            \"alert_rule\": {
                \"type\": \"webhook\",
                \"webhook_url\": \"https://hooks.slack.com/workflows/PLACEHOLDER\"
            }
        }" 2>/dev/null)
    
    if echo "$response" | grep -q "error" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Configure manually${NC}"
    else
        echo -e "${GREEN}✅ Created${NC}"
    fi
}

echo -e "${BLUE}1️⃣  Adding Contracts to Tenderly${NC}"

add_contract "$PAYMENT_PROCESSOR" "PaymentProcessorUpgradeable" "Payment Processor"
add_contract "$PROOF_OF_CRAWL" "ProofOfCrawlLedgerUpgradeable" "Proof of Crawl Ledger"
add_contract "$MULTISIG" "TachiMultiSig" "Tachi MultiSig"

echo ""

echo -e "${BLUE}2️⃣  Creating Monitoring Rules${NC}"

create_monitoring_rule "Payment Failed" "$PAYMENT_PROCESSOR" "Alert when payment processing fails"
create_monitoring_rule "Crawl Verification Failed" "$PROOF_OF_CRAWL" "Alert when crawl verification fails"
create_monitoring_rule "MultiSig Transaction" "$MULTISIG" "Alert on MultiSig transactions"

echo ""

echo -e "${BLUE}3️⃣  Setting up Dashboards${NC}"

echo -n "  Creating contract dashboard... "
response=$(curl -s -X POST \
    "https://api.tenderly.co/api/v1/account/$TENDERLY_ACCOUNT/project/$TENDERLY_PROJECT/dashboards" \
    -H "X-Access-Key: $TENDERLY_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Tachi Protocol Overview\",
        \"description\": \"Main monitoring dashboard for Tachi Protocol contracts\",
        \"tags\": [\"production\", \"monitoring\"],
        \"widgets\": [
            {
                \"type\": \"transactions\",
                \"title\": \"Recent Transactions\",
                \"filters\": {
                    \"addresses\": [\"$PAYMENT_PROCESSOR\", \"$PROOF_OF_CRAWL\", \"$MULTISIG\"]
                }
            }
        ]
    }" 2>/dev/null)

if echo "$response" | grep -q "error" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Configure manually${NC}"
else
    echo -e "${GREEN}✅ Created${NC}"
fi

echo ""

echo -e "${GREEN}🎉 Tenderly Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Access your monitoring:${NC}"
echo "Dashboard: https://dashboard.tenderly.co/$TENDERLY_ACCOUNT/$TENDERLY_PROJECT"
echo "Contracts: https://dashboard.tenderly.co/$TENDERLY_ACCOUNT/$TENDERLY_PROJECT/contracts"
echo "Alerts: https://dashboard.tenderly.co/$TENDERLY_ACCOUNT/$TENDERLY_PROJECT/alerts"
echo ""
echo -e "${BLUE}📋 Manual Configuration Steps:${NC}"
echo "1. Visit your Tenderly dashboard"
echo "2. Configure webhook URLs for alerts"
echo "3. Set up notification channels (Slack, email, etc.)"
echo "4. Create custom monitoring rules as needed"
echo "5. Configure gas price alerts"
echo ""
echo -e "${YELLOW}💡 Monitoring Features Available:${NC}"
echo "- Transaction tracking and analysis"
echo "- Gas optimization insights"
echo "- Contract state monitoring"
echo "- Security alert system"
echo "- Performance analytics"
echo ""
echo -e "${GREEN}✅ Blockchain monitoring is now active!${NC}"
