#!/bin/bash

# 🔧 Tachi Dashboard - Enhanced Workspace-Safe NPM
# =================================================
# This script prevents workspace-related npm errors by:
# 1. Detecting and fixing workspace: protocol issues
# 2. Running npm outside workspace context when needed
# 3. Providing multiple fallback strategies
# 4. Better error handling and user guidance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DASHBOARD_DIR="/Users/justin/Tachi/tachi/packages/dashboard"
TEMP_DIR="/tmp/tachi-dashboard-npm-$(date +%s)"
LOG_FILE="/tmp/tachi-npm-debug.log"

echo -e "${BLUE}🔧 Tachi Dashboard - Enhanced Workspace-Safe NPM${NC}"
echo "================================================="

# Logging function
log() {
    echo "$(date): $1" >> "$LOG_FILE"
    echo -e "$1"
}

# Function to cleanup on exit
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
    # Restore original package.json if backup exists
    if [ -f "$DASHBOARD_DIR/package.json.backup" ]; then
        mv "$DASHBOARD_DIR/package.json.backup" "$DASHBOARD_DIR/package.json"
        log "${GREEN}🔄 Restored original package.json${NC}"
    fi
}

# Setup cleanup trap
trap cleanup EXIT INT TERM

# Function to check for workspace dependencies
check_workspace_deps() {
    if grep -q "workspace:" "$DASHBOARD_DIR/package.json" 2>/dev/null; then
        log "${YELLOW}⚠️  WARNING: Found workspace: dependencies in package.json${NC}"
        return 1
    fi
    return 0
}

# Function to check if we're in a monorepo
is_monorepo() {
    local current_dir="$DASHBOARD_DIR"
    while [ "$current_dir" != "/" ]; do
        if [ -f "$current_dir/pnpm-workspace.yaml" ] || [ -f "$current_dir/lerna.json" ] || [ -f "$current_dir/rush.json" ]; then
            return 0
        fi
        current_dir=$(dirname "$current_dir")
    done
    return 1
}

# Function to suggest better alternatives
suggest_alternatives() {
    log "${YELLOW}💡 Suggested Solutions:${NC}"
    if is_monorepo; then
        log "   ${GREEN}1. Use pnpm (recommended for this monorepo):${NC}"
        log "      cd $DASHBOARD_DIR && pnpm install"
        log "      pnpm dev"
        log ""
        log "   ${GREEN}2. Use yarn workspaces:${NC}"
        log "      cd $DASHBOARD_DIR && yarn install"
        log "      yarn dev"
    fi
    log ""
    log "   ${GREEN}3. Force npm with this script:${NC}"
    log "      ./npm-safe.sh install --force"
    log ""
    log "   ${GREEN}4. Check for workspace dependencies:${NC}"
    log "      grep 'workspace:' package.json"
}

# Function to fix workspace dependencies temporarily
fix_workspace_deps() {
    local package_file="$DASHBOARD_DIR/package.json"
    if [ -f "$package_file" ]; then
        # Create backup
        cp "$package_file" "$package_file.backup"
        
        # Replace workspace dependencies with latest versions
        sed -i.tmp 's/"workspace:\*"/"latest"/g' "$package_file"
        sed -i.tmp 's/"workspace:[^"]*"/"latest"/g' "$package_file"
        rm -f "$package_file.tmp"
        
        log "${GREEN}📝 Temporarily fixed workspace dependencies${NC}"
        return 0
    fi
    return 1
}

# Function to install dependencies safely
install_dependencies() {
    local force_mode="$1"
    
    log "${BLUE}📦 Starting safe dependency installation...${NC}"
    
    # Check for workspace issues first
    if ! check_workspace_deps && [ "$force_mode" != "--force" ]; then
        log "${RED}❌ Workspace dependencies detected!${NC}"
        suggest_alternatives
        return 1
    fi
    
    # Fix workspace deps if force mode or if they exist
    if ! check_workspace_deps; then
        if [ "$force_mode" = "--force" ]; then
            log "${YELLOW}🔧 Force mode: Fixing workspace dependencies...${NC}"
            fix_workspace_deps
        else
            return 1
        fi
    fi
    
    # Create temporary directory
    log "${BLUE}📁 Creating temporary npm workspace: $TEMP_DIR${NC}"
    mkdir -p "$TEMP_DIR"
    
    # Copy necessary files
    cp "$DASHBOARD_DIR/package.json" "$TEMP_DIR/"
    if [ -f "$DASHBOARD_DIR/package-lock.json" ]; then
        cp "$DASHBOARD_DIR/package-lock.json" "$TEMP_DIR/"
    fi
    
    # Copy npm config files if they exist
    for config_file in .npmrc .nvmrc; do
        if [ -f "$DASHBOARD_DIR/$config_file" ]; then
            cp "$DASHBOARD_DIR/$config_file" "$TEMP_DIR/"
        fi
    done
    
    cd "$TEMP_DIR"
    
    # Install dependencies with error handling
    log "${BLUE}📦 Installing dependencies...${NC}"
    if npm install; then
        log "${GREEN}✅ npm install successful${NC}"
    else
        log "${RED}❌ npm install failed${NC}"
        log "${YELLOW}Check log file: $LOG_FILE${NC}"
        return 1
    fi
    
    # Copy results back
    log "${BLUE}📋 Copying results back to project...${NC}"
    
    if [ -d "node_modules" ]; then
        if [ -d "$DASHBOARD_DIR/node_modules" ]; then
            rm -rf "$DASHBOARD_DIR/node_modules"
        fi
        mv "node_modules" "$DASHBOARD_DIR/"
    fi
    
    if [ -f "package-lock.json" ]; then
        mv "package-lock.json" "$DASHBOARD_DIR/"
    fi
    
    log "${GREEN}✅ Dependencies installed successfully!${NC}"
    return 0
}

# Function to run development server
run_dev_server() {
    local port="${1:-3000}"
    
    cd "$DASHBOARD_DIR"
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        log "${YELLOW}📦 Dependencies not found. Installing first...${NC}"
        if ! install_dependencies; then
            log "${RED}❌ Failed to install dependencies${NC}"
            return 1
        fi
    fi
    
    log "${GREEN}🚀 Starting development server on port $port...${NC}"
    log "${BLUE}🌐 Open http://localhost:$port in your browser${NC}"
    
    # Try different methods to run Next.js
    if command -v npx >/dev/null 2>&1; then
        npx next dev --port "$port"
    elif [ -f "node_modules/.bin/next" ]; then
        ./node_modules/.bin/next dev --port "$port"
    elif [ -f "node_modules/next/dist/bin/next" ]; then
        node node_modules/next/dist/bin/next dev --port "$port"
    else
        log "${RED}❌ Could not find Next.js executable${NC}"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage: $0 [command] [options]${NC}"
    echo ""
    echo -e "${GREEN}Commands:${NC}"
    echo "  install [--force]  - Install dependencies safely"
    echo "  dev [port]         - Start development server (default port: 3000)"
    echo "  build              - Build for production"
    echo "  start [port]       - Start production server"
    echo "  check              - Check for workspace issues"
    echo "  clean              - Clean node_modules and package-lock.json"
    echo ""
    echo -e "${GREEN}Options:${NC}"
    echo "  --force            - Force installation even with workspace deps"
    echo ""
    echo -e "${GREEN}Examples:${NC}"
    echo "  $0 install         - Safe install"
    echo "  $0 install --force - Force install fixing workspace deps"
    echo "  $0 dev 3003        - Start dev server on port 3003"
    echo "  $0 check           - Check for issues"
}

# Function to check for issues
check_issues() {
    log "${BLUE}🔍 Checking for common issues...${NC}"
    
    local issues_found=0
    
    # Check for workspace dependencies
    if ! check_workspace_deps; then
        log "${YELLOW}⚠️  Issue: workspace: dependencies found${NC}"
        issues_found=$((issues_found + 1))
    fi
    
    # Check if in monorepo
    if is_monorepo; then
        log "${YELLOW}ℹ️  Info: This appears to be in a monorepo${NC}"
        log "   Consider using pnpm or yarn instead of npm"
    fi
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    log "${GREEN}✅ Node.js version: $node_version${NC}"
    
    # Check npm version
    local npm_version=$(npm --version)
    log "${GREEN}✅ npm version: $npm_version${NC}"
    
    # Check if dependencies are installed
    if [ -d "$DASHBOARD_DIR/node_modules" ]; then
        log "${GREEN}✅ node_modules directory exists${NC}"
    else
        log "${YELLOW}⚠️  node_modules directory missing${NC}"
        issues_found=$((issues_found + 1))
    fi
    
    if [ $issues_found -eq 0 ]; then
        log "${GREEN}✅ No issues detected!${NC}"
    else
        log "${YELLOW}Found $issues_found potential issues${NC}"
        suggest_alternatives
    fi
    
    return $issues_found
}

# Function to clean project
clean_project() {
    log "${BLUE}🧹 Cleaning project...${NC}"
    
    cd "$DASHBOARD_DIR"
    
    if [ -d "node_modules" ]; then
        rm -rf "node_modules"
        log "${GREEN}✅ Removed node_modules${NC}"
    fi
    
    if [ -f "package-lock.json" ]; then
        rm -f "package-lock.json"
        log "${GREEN}✅ Removed package-lock.json${NC}"
    fi
    
    if [ -d ".next" ]; then
        rm -rf ".next"
        log "${GREEN}✅ Removed .next cache${NC}"
    fi
    
    log "${GREEN}✅ Project cleaned!${NC}"
}

# Main command handling
case "$1" in
    "install")
        install_dependencies "$2"
        ;;
    "dev")
        run_dev_server "$2"
        ;;
    "build")
        cd "$DASHBOARD_DIR"
        if command -v npx >/dev/null 2>&1; then
            npx next build
        else
            node node_modules/next/dist/bin/next build
        fi
        ;;
    "start")
        cd "$DASHBOARD_DIR"
        local port="${2:-3000}"
        if command -v npx >/dev/null 2>&1; then
            npx next start --port "$port"
        else
            node node_modules/next/dist/bin/next start --port "$port"
        fi
        ;;
    "check")
        check_issues
        ;;
    "clean")
        clean_project
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    "")
        install_dependencies
        ;;
    *)
        log "${RED}❌ Unknown command: $1${NC}"
        show_usage
        exit 1
        ;;
esac
