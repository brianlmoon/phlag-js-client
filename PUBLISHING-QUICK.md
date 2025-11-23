# Quick Publishing Reference

## Automated Publishing (Recommended)

```bash
# 1. Update version
npm version patch    # or minor, or major

# 2. Push tag
git push origin main --tags

# 3. Create GitHub Release
# Go to: https://github.com/moonspot/phlag-js-client/releases
# Click "Draft a new release"
# Select tag, add notes, publish
# GitHub Actions handles the rest!
```

**Prerequisites:** Repository must have `NPM_TOKEN` secret configured.

---

## Manual Publishing

### Before First Publish

1. **Setup npm account and login:**
   ```bash
   npm login
   ```

2. **Verify you have org access:**
   ```bash
   npm access list packages @moonspot
   ```

## Publishing Workflow

### Standard Release

```bash
# 1. Update version
npm version patch    # or minor, or major

# 2. Verify package contents
npm run verify-package

# 3. Publish
npm publish --access public

# 4. Push tags
git push origin main --tags
```

### Pre-release (Beta/RC)

```bash
# 1. Version with tag
npm version 1.1.0-beta.1

# 2. Publish with tag
npm publish --tag beta --access public

# 3. Push tags
git push origin main --tags
```

## Quick Checks

```bash
# What will be published?
npm run publish:dry-run

# Does it build and test?
npm run build && npm test

# Is code formatted?
npm run format:check

# Package stats
npm pack --dry-run
```

## Common Commands

```bash
# Patch: 1.0.0 → 1.0.1 (bug fixes)
npm version patch

# Minor: 1.0.0 → 1.1.0 (new features)
npm version minor

# Major: 1.0.0 → 2.0.0 (breaking changes)
npm version major

# Unpublish (only within 72 hours)
npm unpublish @moonspot/phlag-client@1.0.1

# Deprecate (better than unpublishing)
npm deprecate @moonspot/phlag-client@1.0.1 "Use 1.0.2 instead"
```

## Package Stats

- **Package size**: ~20 KB (gzipped)
- **Unpacked size**: ~68 KB
- **Total files**: 47 files
- **Node.js**: >= 18.0.0

## What Gets Published

✅ **Included:**
- `dist/` - Compiled JavaScript + TypeScript declarations
- `README.md` - Package documentation  
- `LICENSE` - BSD 3-Clause license
- `package.json` - Package metadata

❌ **Excluded:**
- `src/` - Source files
- `tests/` - Test files
- `examples/` - Example code
- Dev configs - `.eslintrc`, `tsconfig.json`, etc.
- `node_modules/`, `.git/`

## Troubleshooting

| Error | Solution |
|-------|----------|
| Not authenticated | `npm login` |
| Version exists | `npm version patch` |
| Tests fail | `npm test` to debug |
| Missing files | Check `.npmignore` and `files` in package.json |
| Org access denied | Contact org owner for permissions |

## See Also

- Full guide: [PUBLISHING.md](PUBLISHING.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- Development: [DEVELOPMENT.md](DEVELOPMENT.md)
