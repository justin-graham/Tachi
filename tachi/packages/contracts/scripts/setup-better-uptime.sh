#!/bin/bash

# Better Uptime Configuration Script for Tachi Protocol
# This script sets up monitors using the Better Uptime API

set -e

echo "🔧 Setting up Better Uptime Monitors for Tachi Protocol"
echo "======================================================="
echo ""

API_KEY="iiEYKFoEEm2aQDVQxapQcSfR"
BASE_URL="https://betteruptime.com/api/v2"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📋 Creating HTTP Monitors:${NC}"

# 1. Dashboard Health Monitor
echo -n "  Creating Dashboard Health Monitor... "
DASHBOARD_MONITOR=$(curl -s -X POST "$BASE_URL/monitors" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:3003/api/health",
    "monitor_type": "status",
    "email": true,
    "sms": false,
    "call": false,
    "team_wait": 0,
    "http_method": "GET",
    "request_timeout": 30,
    "recovery_period": 0,
    "request_headers": [],
    "follow_redirects": false,
    "remember_cookies": false,
    "maintenance_timezone": "UTC",
    "confirmation_period": 0,
    "check_frequency": 30,
    "request_body": "",
    "regions": ["us", "eu", "as"],
    "monitor_group_id": null,
    "pronounceable_name": "dashboard-health",
    "recovery_period": 0,
    "verify_ssl": true,
    "domain_expiration": 0,
    "port": null,
    "subdomain": null,
    "policy_id": null
  }')

if echo "$DASHBOARD_MONITOR" | grep -q '"id"'; then
  echo -e "${GREEN}✅ Created${NC}"
else
  echo -e "${YELLOW}⚠️  Error or already exists${NC}"
fi

# 2. Blockchain Health Monitor
echo -n "  Creating Blockchain Health Monitor... "
BLOCKCHAIN_MONITOR=$(curl -s -X POST "$BASE_URL/monitors" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:3003/api/health/blockchain",
    "monitor_type": "status",
    "email": true,
    "sms": false,
    "call": false,
    "team_wait": 0,
    "http_method": "GET",
    "request_timeout": 30,
    "recovery_period": 0,
    "request_headers": [],
    "follow_redirects": false,
    "remember_cookies": false,
    "maintenance_timezone": "UTC",
    "confirmation_period": 0,
    "check_frequency": 60,
    "request_body": "",
    "regions": ["us", "eu", "as"],
    "monitor_group_id": null,
    "pronounceable_name": "blockchain-health",
    "recovery_period": 0,
    "verify_ssl": true,
    "domain_expiration": 0,
    "port": null,
    "subdomain": null,
    "policy_id": null
  }')

if echo "$BLOCKCHAIN_MONITOR" | grep -q '"id"'; then
  echo -e "${GREEN}✅ Created${NC}"
else
  echo -e "${YELLOW}⚠️  Error or already exists${NC}"
fi

# 3. Database Health Monitor
echo -n "  Creating Database Health Monitor... "
DATABASE_MONITOR=$(curl -s -X POST "$BASE_URL/monitors" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:3003/api/health/database",
    "monitor_type": "status",
    "email": true,
    "sms": false,
    "call": false,
    "team_wait": 0,
    "http_method": "GET",
    "request_timeout": 30,
    "recovery_period": 0,
    "request_headers": [],
    "follow_redirects": false,
    "remember_cookies": false,
    "maintenance_timezone": "UTC",
    "confirmation_period": 0,
    "check_frequency": 60,
    "request_body": "",
    "regions": ["us", "eu", "as"],
    "monitor_group_id": null,
    "pronounceable_name": "database-health",
    "recovery_period": 0,
    "verify_ssl": true,
    "domain_expiration": 0,
    "port": null,
    "subdomain": null,
    "policy_id": null
  }')

if echo "$DATABASE_MONITOR" | grep -q '"id"'; then
  echo -e "${GREEN}✅ Created${NC}"
else
  echo -e "${YELLOW}⚠️  Error or already exists${NC}"
fi

echo ""
echo -e "${BLUE}📋 Creating Heartbeat Monitors:${NC}"

# 4. Worker Heartbeat Monitor
echo -n "  Creating Worker Heartbeat Monitor... "
HEARTBEAT_MONITOR=$(curl -s -X POST "$BASE_URL/heartbeats" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": true,
    "sms": false,
    "call": false,
    "team_wait": 0,
    "heartbeat_period": 300,
    "grace_period": 300,
    "heartbeat_group_id": null,
    "pronounceable_name": "tachi-worker-heartbeat",
    "sort_index": null,
    "maintenance_timezone": "UTC",
    "paused": false
  }')

if echo "$HEARTBEAT_MONITOR" | grep -q '"id"'; then
  HEARTBEAT_URL=$(echo "$HEARTBEAT_MONITOR" | grep -o '"ping_url":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✅ Created${NC}"
  echo -e "${YELLOW}   Heartbeat URL: $HEARTBEAT_URL${NC}"
  
  # Update the .env.local file with the heartbeat URL
  if [ -f "/Users/justin/Tachi/tachi/packages/dashboard/.env.local" ]; then
    if grep -q "BETTER_UPTIME_CRAWL_HEARTBEAT_URL" "/Users/justin/Tachi/tachi/packages/dashboard/.env.local"; then
      sed -i '' "s|BETTER_UPTIME_CRAWL_HEARTBEAT_URL=.*|BETTER_UPTIME_CRAWL_HEARTBEAT_URL=$HEARTBEAT_URL|" "/Users/justin/Tachi/tachi/packages/dashboard/.env.local"
    else
      echo "BETTER_UPTIME_CRAWL_HEARTBEAT_URL=$HEARTBEAT_URL" >> "/Users/justin/Tachi/tachi/packages/dashboard/.env.local"
    fi
    echo -e "${GREEN}   Updated .env.local with heartbeat URL${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Error or already exists${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Better Uptime Configuration Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Check your Better Uptime dashboard: https://betteruptime.com"
echo "2. Configure notification preferences"
echo "3. Set up status page (optional)"
echo "4. Test alerts by temporarily stopping services"
echo ""
echo -e "${BLUE}📊 Monitors Created:${NC}"
echo "- Dashboard Health: Checks every 30 seconds"
echo "- Blockchain Health: Checks every 60 seconds"  
echo "- Database Health: Checks every 60 seconds"
echo "- Worker Heartbeat: Expected every 5 minutes"
echo ""
