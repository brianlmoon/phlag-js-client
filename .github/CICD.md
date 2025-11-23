# GitHub CI/CD Documentation

This project uses GitHub Actions for continuous integration and deployment.

## Workflows

### 1. CI (Continuous Integration)

**File**: `.github/workflows/ci.yml`  
**Triggers**: Push to `main`/`develop`, Pull Requests

**What it does:**
- Tests on multiple Node.js versions (18.x, 20.x, 22.x)
- Tests on multiple operating systems (Ubuntu, Windows, macOS)
- Runs formatting checks (Prettier)
- Runs linting (ESLint)
- Builds the project (TypeScript compilation)
- Runs all tests (Vitest)
- Verifies package contents

**Matrix Testing:**
- **Node.js**: 18.x, 20.x, 22.x on Linux
- **OS**: Windows, macOS (Node.js 20.x)

**Status Badge:**
```markdown
[![CI](https://github.com/moonspot/phlag-js-client/actions/workflows/ci.yml/badge.svg)](https://github.com/moonspot/phlag-js-client/actions/workflows/ci.yml)
```

### 2. Publish to npm

**File**: `.github/workflows/publish.yml`  
**Triggers**: Release published on GitHub

**What it does:**
- Runs all quality checks (format, lint, build, test)
- Verifies package contents
- Publishes to npm with provenance
- Creates deployment summary

**Prerequisites:**
1. Create npm access token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Token type: **Automation** (for CI/CD)
   - Permissions: **Read and write**

2. Add to GitHub secrets:
   - Go to: Settings → Secrets and variables → Actions
   - Name: `NPM_TOKEN`
   - Value: Your npm token

**Usage:**
1. Create a release on GitHub:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
2. Go to GitHub → Releases → Draft a new release
3. Select the tag, add release notes
4. Click "Publish release"
5. GitHub Actions automatically publishes to npm

**Provenance:**
This workflow uses `--provenance` flag to publish with build provenance, adding transparency about how the package was built.

### 3. CodeQL Security Analysis

**File**: `.github/workflows/codeql.yml`  
**Triggers**: 
- Push to `main`
- Pull Requests
- Scheduled (weekly on Mondays)

**What it does:**
- Scans code for security vulnerabilities
- Checks for common coding mistakes
- Analyzes JavaScript/TypeScript code
- Reports findings to GitHub Security tab

**View Results:**
- Go to: Security → Code scanning alerts

### 4. Dependency Review

**File**: `.github/workflows/dependency-review.yml`  
**Triggers**: Pull Requests to `main`

**What it does:**
- Reviews dependency changes in PRs
- Checks for known vulnerabilities
- Fails on moderate+ severity issues
- Posts summary comment on PR

**What it catches:**
- New dependencies with vulnerabilities
- License compliance issues
- Deprecated packages

## Setting Up CI/CD

### For Repository Maintainers

1. **Enable GitHub Actions**
   - Already enabled by default for new repositories
   - Check: Settings → Actions → General

2. **Set up npm publishing**
   - Create npm token (automation type)
   - Add `NPM_TOKEN` to repository secrets

3. **Configure branch protection** (recommended)
   - Settings → Branches → Add rule for `main`
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date
   - Select: `Test on Node.js 20.x`

4. **Enable Dependabot** (optional but recommended)
   - Security → Dependabot → Enable
   - Automatically creates PRs for dependency updates

### For Contributors

No setup needed! When you open a PR:
- CI automatically runs all checks
- You'll see status checks in the PR
- All checks must pass before merge

## Workflow Status

Check the status of workflows:
- **Actions tab**: https://github.com/moonspot/phlag-js-client/actions
- **CI badge**: Shows build status on README
- **PR checks**: Visible in pull request UI

## Troubleshooting

### CI Failing on Format Check

```bash
# Fix locally
npm run format

# Verify
npm run format:check
```

### CI Failing on Lint

```bash
# Fix automatically
npm run lint:fix

# Check manually
npm run lint
```

### CI Failing on Tests

```bash
# Run tests locally
npm test

# Run in watch mode for debugging
npm run test:watch
```

### Publish Workflow Failing

**Common issues:**

1. **NPM_TOKEN not set**
   - Add token to GitHub repository secrets
   - Ensure token has write permissions

2. **Version already exists**
   - Bump version in package.json
   - Create new release with new version tag

3. **Tests failing**
   - Fix tests locally first
   - Push fixes before creating release

### CodeQL Warnings

- Review in: Security → Code scanning
- Most are suggestions, not critical
- Address high-severity findings

## Customization

### Change Node.js Versions

Edit `.github/workflows/ci.yml`:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Modify these
```

### Skip CI on Specific Commits

Add to commit message:
```bash
git commit -m "Update docs [skip ci]"
```

### Run Workflows Manually

1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Choose branch and click "Run workflow"

## Cost Considerations

GitHub Actions is free for public repositories:
- Unlimited minutes for public repos
- All workflows run at no cost

For private repositories:
- 2,000 free minutes/month
- Additional minutes: $0.008 per minute (Linux)

## Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Review dependency changes** - Check Dependency Review results
3. **Keep actions up to date** - Dependabot helps with this
4. **Use provenance** - Enabled in publish workflow
5. **Pin action versions** - Use `@v4` not `@latest`

## Monitoring

### Email Notifications

Configure in: Settings → Notifications
- Get notified on workflow failures
- Recommended for maintainers

### Status Checks

Add badges to README:
```markdown
[![CI](https://github.com/moonspot/phlag-js-client/actions/workflows/ci.yml/badge.svg)](https://github.com/moonspot/phlag-js-client/actions/workflows/ci.yml)
```

## Related Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [PUBLISHING.md](PUBLISHING.md) - Manual publishing guide
- [GitHub Actions Docs](https://docs.github.com/en/actions)
