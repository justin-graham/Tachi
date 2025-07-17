# Tachi Dashboard - Development Setup Guide

## Quick Start

### Method 1: Enhanced Safe Script (Recommended)
```bash
# Check for issues first
./npm-safe-enhanced.sh check

# Install dependencies safely
./npm-safe-enhanced.sh install

# Start development server
./npm-safe-enhanced.sh dev 3003
```

### Method 2: Using npm scripts
```bash
# Install dependencies
npm run install:safe

# Start development server
npm run dev:safe
```

### Method 3: Use pnpm (Best for monorepos)
```bash
# From the monorepo root (/Users/justin/Tachi/tachi)
pnpm install

# Start dashboard dev server
pnpm --filter tachi-publisher-dashboard dev
```

## Common Issues and Solutions

### 1. `EUNSUPPORTEDPROTOCOL` - workspace: errors

**Cause**: npm doesn't understand `workspace:*` dependencies used by pnpm/yarn

**Solutions**:
- ✅ Use `./npm-safe-enhanced.sh install --force`
- ✅ Use pnpm instead: `pnpm install`
- ✅ Check `.npmrc` configuration

### 2. Module resolution errors

**Cause**: Conflicting package managers or corrupted node_modules

**Solutions**:
```bash
# Clean and reinstall
./npm-safe-enhanced.sh clean
./npm-safe-enhanced.sh install

# Or manually
rm -rf node_modules package-lock.json
npm install
```

### 3. Next.js not starting

**Cause**: Various Next.js configuration or dependency issues

**Solutions**:
```bash
# Check for issues
./npm-safe-enhanced.sh check

# Try different startup methods
npm run dev:safe
# or
npx next dev --port 3003
# or
./npm-safe-enhanced.sh dev 3003
```

## Development Workflows

### For Local Development
```bash
# 1. Check environment
./npm-safe-enhanced.sh check

# 2. Install/update dependencies
./npm-safe-enhanced.sh install

# 3. Start development server
./npm-safe-enhanced.sh dev 3003

# Open http://localhost:3003
```

### For Production Build
```bash
# 1. Install dependencies
./npm-safe-enhanced.sh install

# 2. Build
./npm-safe-enhanced.sh build

# 3. Start production server
./npm-safe-enhanced.sh start 3003
```

### For Debugging
```bash
# Check for common issues
./npm-safe-enhanced.sh check

# View detailed logs
tail -f /tmp/tachi-npm-debug.log

# Clean everything and start fresh
./npm-safe-enhanced.sh clean
./npm-safe-enhanced.sh install
```

## Directory Structure
```
tachi/packages/dashboard/
├── npm-safe-enhanced.sh    # Enhanced installation script
├── .npmrc                  # npm configuration
├── package.json            # Dependencies and scripts
├── pages/                  # Next.js pages
│   ├── index.tsx          # Main onboarding page
│   └── _app.tsx           # App configuration
└── src/                   # Source code
    ├── components/        # React components
    ├── providers/         # Web3 providers
    └── app/              # App router files
```

## Recommended Approach

For the best development experience with this monorepo:

1. **Use pnpm globally** (handles workspaces natively):
   ```bash
   npm install -g pnpm
   cd /Users/justin/Tachi/tachi
   pnpm install
   pnpm --filter tachi-publisher-dashboard dev
   ```

2. **Or use the enhanced safe script** (handles npm workspace issues):
   ```bash
   cd /Users/justin/Tachi/tachi/packages/dashboard
   ./npm-safe-enhanced.sh install
   ./npm-safe-enhanced.sh dev 3003
   ```

3. **Avoid plain npm commands** in the dashboard directory (will cause workspace errors)

## Troubleshooting

If you still encounter issues:

1. Check the debug log: `cat /tmp/tachi-npm-debug.log`
2. Ensure you're in the correct directory
3. Try cleaning: `./npm-safe-enhanced.sh clean`
4. Check Node.js version: `node --version` (should be 18+)
5. Verify the monorepo structure is intact

## Environment Verification

Run this to verify everything is working:
```bash
./npm-safe-enhanced.sh check
```

This will report any issues and suggest solutions.
