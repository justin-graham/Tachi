#!/bin/bash

# Sentry Integration Setup Script for Tachi Protocol
# Run this from the dashboard package directory

echo "🔧 Setting up Sentry for Tachi Protocol Dashboard..."

# Navigate to dashboard directory
cd /Users/justin/Tachi/tachi/packages/dashboard

# Install Sentry Next.js integration
echo "📦 Installing Sentry SDK..."
pnpm add @sentry/nextjs

# Run Sentry wizard for automatic setup
echo "🧙 Running Sentry wizard..."
npx @sentry/wizard@latest -i nextjs

echo "✅ Sentry wizard completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update sentry.client.config.js with custom error filtering"
echo "2. Update sentry.server.config.js with performance monitoring"
echo "3. Add Sentry to Cloudflare Worker"
echo "4. Configure alert rules in Sentry dashboard"
