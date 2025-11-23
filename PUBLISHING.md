# Publishing Guide

This guide explains how to publish `@moonspot/phlag-client` to npm.

## Automated Publishing (Recommended)

The easiest way to publish is using GitHub Actions:

1. **Create and push a git tag:**
   ```bash
   npm version patch  # or minor, or major
   git push origin main --tags
   ```

2. **Create a GitHub Release:**
   - Go to https://github.com/moonspot/phlag-js-client/releases
   - Click "Draft a new release"
   - Select the tag you just pushed
   - Add release notes (see CHANGELOG.md)
   - Click "Publish release"

3. **GitHub Actions automatically:**
   - Runs all quality checks (format, lint, build, test)
   - Publishes to npm with provenance
   - Creates deployment summary

**Prerequisites:**
- Repository must have `NPM_TOKEN` secret configured
- See [.github/CICD.md](.github/CICD.md) for setup instructions

---

## Manual Publishing

If you need to publish manually (not recommended):

## Prerequisites

1. **npm account** - Create one at https://www.npmjs.com/signup
2. **npm authentication** - Run `npm login` and enter your credentials
3. **Organization access** - Must have publish access to the `@moonspot` organization
4. **Clean working directory** - Commit all changes before publishing

## Pre-Publishing Checklist

Before publishing, ensure everything is ready:

### 1. Update Version

Follow semantic versioning (https://semver.org/):

```bash
# Patch release (1.0.0 → 1.0.1) - Bug fixes
npm version patch

# Minor release (1.0.0 → 1.1.0) - New features, backward compatible
npm version minor

# Major release (1.0.0 → 2.0.0) - Breaking changes
npm version major
```

This automatically updates `package.json` and creates a git tag.

### 2. Verify Package Contents

Check what will be published:

```bash
npm run publish:dry-run
```

Or see the actual files:

```bash
npm run verify-package
```

**What should be included:**
- ✅ `dist/` directory (compiled JavaScript + TypeScript declarations)
- ✅ `README.md` (package documentation)
- ✅ `LICENSE` (BSD 3-Clause license)
- ✅ `package.json` (package metadata)

**What should NOT be included:**
- ❌ `src/` (source TypeScript files)
- ❌ `tests/` (test files)
- ❌ `examples/` (example code)
- ❌ Development config files (`.eslintrc`, `tsconfig.json`, etc.)
- ❌ `node_modules/`

### 3. Run Quality Checks

```bash
# Build the package
npm run build

# Run all tests
npm test

# Check code formatting
npm run format:check

# Check linting (requires npm install first)
npm run lint
```

All checks must pass before publishing!

### 4. Test Locally

Install the package locally to verify it works:

```bash
# Create a tarball
npm pack

# In a test project
npm install /path/to/moonspot-phlag-client-1.0.0.tgz

# Test importing
node -e "const { PhlagClient } = require('@moonspot/phlag-client'); console.log('✓ Import works');"
```

## Publishing to npm

### Production Release

```bash
# Publish to npm registry
npm publish --access public
```

The `--access public` flag is required for scoped packages (@moonspot/...).

**What happens automatically:**
1. `prepack` script runs: builds and tests
2. Package is created with only files specified in `files` array and not in `.npmignore`
3. Published to https://www.npmjs.com/package/@moonspot/phlag-client

### Beta/Pre-release

For testing before stable release:

```bash
# Version as beta
npm version 1.1.0-beta.0

# Publish with beta tag
npm publish --tag beta --access public
```

Users install with:
```bash
npm install @moonspot/phlag-client@beta
```

### Next/Canary Releases

For testing latest changes:

```bash
npm version 1.1.0-next.1
npm publish --tag next --access public
```

## Post-Publishing

### 1. Verify Publication

```bash
# Check package page
open https://www.npmjs.com/package/@moonspot/phlag-client

# Install and test
npm install @moonspot/phlag-client@latest
```

### 2. Tag Git Release

```bash
# Push version commit and tag
git push origin main --tags
```

### 3. Create GitHub Release

1. Go to https://github.com/moonspot/phlag-js-client/releases
2. Click "Draft a new release"
3. Select the version tag
4. Add release notes (see CHANGELOG.md)
5. Publish release

## Troubleshooting

### Error: Package already exists

You can't publish the same version twice. Bump the version:

```bash
npm version patch
npm publish --access public
```

### Error: Not authenticated

Login to npm:

```bash
npm login
```

### Error: No access to @moonspot organization

Contact the organization owner to grant publish permissions.

### Error: Tests failed

The `prepublishOnly` script prevents publishing if tests fail. Fix the tests first:

```bash
npm test
```

### Files missing from package

Check `.npmignore` - files may be excluded. Also verify `files` array in `package.json`.

## NPM Scripts Reference

```bash
npm run build              # Compile TypeScript
npm test                   # Run test suite
npm run format             # Format code
npm run lint               # Check code quality
npm run publish:dry-run    # Preview package contents
npm run verify-package     # Create tarball and list files
npm version <type>         # Bump version (patch/minor/major)
npm publish --access public  # Publish to npm
```

## Package Configuration

The package is configured in `package.json`:

- **Name**: `@moonspot/phlag-client` (scoped to @moonspot org)
- **Files**: Only `dist/` directory is published
- **Main**: `./dist/index.js` (ES module)
- **Types**: `./dist/index.d.ts` (TypeScript declarations)
- **License**: BSD-3-Clause
- **Engines**: Node.js >= 18.0.0

## Security

- **Never publish secrets** - API keys, tokens, etc.
- **Review .npmignore** - Ensure no sensitive files are included
- **Enable 2FA** - Protect your npm account with two-factor authentication

## Support

For questions about publishing, contact Brian Moon (brian@moonspot.net).
