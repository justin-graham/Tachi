# VS Code Performance Optimization Guide

This repository includes several VS Code configurations to optimize performance when working with the Tachi monorepo.

## Quick Start

### Option 1: Multi-Root Workspace (Recommended)
Open the `tachi-development.code-workspace` file in VS Code for the best experience:

```bash
code tachi-development.code-workspace
```

This provides:
- Organized view of all packages
- Pre-configured tasks for common workflows  
- Debug configurations
- Optimized settings for monorepo development

### Option 2: Standard Workspace
Open the root directory normally:

```bash
code .
```

The `.vscode/settings.json` will automatically apply performance optimizations.

## Performance Optimizations Included

### File System Optimizations
- **Excludes heavy directories**: `node_modules`, `dist`, `.next`, `artifacts`, `typechain`, etc.
- **Search exclusions**: Prevents indexing of build artifacts and lock files
- **File watcher exclusions**: Reduces CPU usage by ignoring build outputs

### TypeScript Performance
- **Disabled auto-imports**: Prevents expensive package scanning
- **Limited workspace symbols**: Scopes IntelliSense to current project
- **Incremental compilation**: Faster rebuilds with `.tsbuildinfo` caching
- **Project references**: Optimized monorepo TypeScript setup

### Editor Performance  
- **Large file optimizations**: Better handling of generated files
- **Reduced suggestions**: Limits autocomplete items for faster response
- **Disabled semantic highlighting**: Reduces syntax parsing overhead
- **Optimized bracket colorization**: Disabled for better performance

## Workspace Structure

The multi-root workspace organizes packages as:

- 📁 **Tachi Root** - Repository root with configs
- 🎛️ **Dashboard (Next.js)** - Publisher dashboard application  
- 📦 **SDK JavaScript** - JavaScript SDK for crawlers
- 🌐 **Gateway Core** - Core gateway functionality
- ☁️ **Gateway Cloudflare** - Cloudflare Workers gateway
- 🔗 **Gateway Vercel** - Vercel Edge Functions gateway
- 📋 **Smart Contracts** - Solidity contracts with Hardhat
- 🐍 **SDK Python** - Python SDK for crawlers

## Common Tasks

Available tasks in the multi-root workspace:

- **Install Dependencies** - `pnpm install` for all packages
- **Build All Packages** - Build entire monorepo
- **Run Dashboard Dev** - Start dashboard development server
- **Lint All Packages** - Run linting across all packages
- **Test All Packages** - Run test suites
- **TypeCheck All Packages** - Validate TypeScript across monorepo

## Debug Configurations

Pre-configured debug setups:

- **Debug Dashboard** - Attach debugger to Next.js development server
- **Debug Node.js Package** - Debug any Node.js TypeScript file

## Recommended Extensions

The workspace includes recommendations for essential extensions while excluding performance-heavy ones:

- Prettier (code formatting)
- Tailwind CSS (styling support)
- TypeScript Next (enhanced TS support)  
- Error Lens (inline error display)
- Path IntelliSense (file path completion)
- Auto Rename Tag (HTML/JSX tag sync)
- Playwright (testing framework)
- Hardhat Solidity (smart contract development)

## Troubleshooting

### If VS Code is still slow:
1. Restart VS Code after opening the workspace
2. Check if you have other heavy extensions enabled
3. Consider using the multi-root workspace for better isolation
4. Disable unused language servers in settings

### If TypeScript is not working:
1. Ensure dependencies are installed: `pnpm install`
2. Restart the TypeScript language server: `Ctrl/Cmd + Shift + P` → "TypeScript: Restart TS Server"
3. Check that the correct tsconfig.json is being used for each package

### For large file handling:
The configuration automatically enables large file optimizations, but you can manually exclude additional patterns in `.vscode/settings.json` if needed.

## Customization

You can customize these settings by:

1. **Per-user**: Modify your VS Code user settings
2. **Per-workspace**: Edit `.vscode/settings.json` (applies to all developers)
3. **Per-package**: Add package-specific settings in individual `.vscode` folders

The configurations are designed to be minimal and preserve existing functionality while maximizing performance.