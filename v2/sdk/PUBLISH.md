# Publishing the Tachi SDK to npm

## Prerequisites

1. npm account ([signup here](https://www.npmjs.com/signup))
2. Logged in to npm via CLI: `npm login`
3. SDK built: `npm run build`

## Steps to Publish

### 1. Build the SDK

```bash
cd v2/sdk
npm install
npm run build
```

This creates `dist/index.js` and `dist/index.d.ts`.

### 2. Test Locally

Before publishing, test the package locally:

```bash
# In sdk directory
npm pack

# This creates tachi-sdk-2.0.0.tgz
# Install it in another project to test:
cd ../test-project
npm install ../sdk/tachi-sdk-2.0.0.tgz
```

### 3. Publish to npm

```bash
cd v2/sdk

# First time: make package public (scoped packages are private by default)
npm publish --access public

# Subsequent updates:
npm version patch  # or minor, or major
npm publish
```

### 4. Verify

```bash
npm view @tachi/sdk
```

You should see your package details!

### 5. Test Installation

```bash
npm install @tachi/sdk
```

## Versioning

Follow [Semantic Versioning](https://semver.org/):
- **Patch** (2.0.0 → 2.0.1): Bug fixes
- **Minor** (2.0.0 → 2.1.0): New features, backward compatible
- **Major** (2.0.0 → 3.0.0): Breaking changes

```bash
npm version patch  # 2.0.0 → 2.0.1
npm version minor  # 2.0.0 → 2.1.0
npm version major  # 2.0.0 → 3.0.0
```

## Troubleshooting

### "You must be logged in to publish packages"
```bash
npm login
```

### "Package name already exists"
Make sure the name in `package.json` is unique or scoped (like `@yourorg/tachi-sdk`).

### "403 Forbidden"
You don't have permission to publish under the `@tachi` scope. Either:
1. Request access to the `@tachi` org
2. Change package name to `@your-username/tachi-sdk`

## Post-Publish

1. Update docs with correct npm install command
2. Add npm badge to README:
   ```markdown
   ![npm version](https://img.shields.io/npm/v/@tachi/sdk)
   ```
3. Announce on Discord/Twitter
4. Update example code in main repo

## Automation (Future)

Set up GitHub Actions to auto-publish on version tags:

```yaml
# .github/workflows/publish.yml
name: Publish to npm
on:
  push:
    tags:
      - 'v*'
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
