#!/bin/bash
# Workspace-safe npm install script for Tachi dashboard

set -e

DASHBOARD_DIR="/Users/justin/Tachi/tachi/packages/dashboard"
TEMP_DIR="/tmp/tachi-dashboard-install"

echo "🔧 Tachi Dashboard - Workspace-Safe NPM"
echo "======================================="

# Function to install dependencies outside workspace
install_outside_workspace() {
    echo "📦 Installing dependencies outside workspace context..."
    
    # Remove workspace problematic files
    rm -f "$DASHBOARD_DIR/.npmrc"
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
    
    # Copy package files
    cp "$DASHBOARD_DIR/package.json" "$TEMP_DIR/"
    
    # Install in temp directory
    cd "$TEMP_DIR"
    npm install
    npm install @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
    npm install react-hook-form @hookform/resolvers zod
    npm install @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-slot @radix-ui/react-separator
    npm install class-variance-authority tailwind-merge
    
    # Copy back to dashboard
    cp -r "$TEMP_DIR/node_modules" "$DASHBOARD_DIR/"
    cp "$TEMP_DIR/package-lock.json" "$DASHBOARD_DIR/"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    echo "✅ Dependencies installed successfully!"
}

# Function to run dev server
run_dev_server() {
    echo "🚀 Starting development server..."
    cd "$DASHBOARD_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "❌ node_modules not found. Installing dependencies first..."
        install_outside_workspace
    fi
    
    # Run Next.js dev server using node directly
    echo "🌐 Starting Next.js on http://localhost:3000"
    exec node node_modules/next/dist/bin/next dev
}

# Main command handling
case "$1" in
    "install"|"")
        install_outside_workspace
        ;;
    "dev")
        run_dev_server
        ;;
    "build")
        cd "$DASHBOARD_DIR"
        node node_modules/next/dist/bin/next build
        ;;
    "start")
        cd "$DASHBOARD_DIR"
        node node_modules/next/dist/bin/next start
        ;;
    *)
        echo "Usage: $0 [install|dev|build|start]"
        echo "  install - Install dependencies safely"
        echo "  dev     - Start development server"
        echo "  build   - Build for production"
        echo "  start   - Start production server"
        exit 1
        ;;
esac
