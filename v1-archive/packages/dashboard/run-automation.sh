#!/bin/bash

# Tachi Publisher Onboarding - Quick Start Automation
# This script runs the complete automated test suite

echo "🚀 TACHI PUBLISHER ONBOARDING - AUTOMATED TEST SUITE"
echo "====================================================="
echo ""
echo "This will automatically:"
echo "✅ Start Hardhat network"
echo "✅ Deploy smart contracts"  
echo "✅ Launch publisher dashboard"
echo "✅ Run complete Playwright automation"
echo "✅ Generate comprehensive reports"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "run-automation.mjs" ]; then
    echo "❌ Error: Please run this script from the dashboard package directory"
    echo "   Expected: /Users/justin/Tachi/tachi/packages/dashboard/"
    exit 1
fi

# Check if contracts directory exists
if [ ! -d "../contracts" ]; then
    echo "❌ Error: Contracts directory not found at ../contracts"
    exit 1
fi

# Run the automation
echo "🎬 Starting automation..."
echo ""

node run-automation.mjs

echo ""
echo "🎯 Automation completed!"
echo ""
echo "📊 View your test reports:"
echo "   • JSON Report: test-results/automation-report.json"
echo "   • HTML Report: test-results/automation-report.html"
echo "   • Playwright Report: playwright-report/index.html"
echo ""
echo "💡 To run individual tests:"
echo "   • npm run test           (Run Playwright tests)"
echo "   • npm run test:headed    (Run tests with browser UI)"
echo "   • npm run test:ui        (Interactive test runner)"
echo "   • npm run test:debug     (Debug mode)"
echo ""
