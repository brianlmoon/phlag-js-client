# Development Guide

## Prerequisites

Node.js 18.0.0 or higher is required.

## Installation

The project uses `npx` for on-demand dependency fetching for most commands. However, **linting requires installing dev dependencies**:

```bash
npm install
```

This installs ESLint and other development tools. Prettier, TypeScript, and Vitest work via `npx` without installation.

## Available Scripts

### Building

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory. Uses `npx` to fetch TypeScript on-demand (no install needed).

### Testing

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Run tests with Vitest UI
npm run test:types      # Type check test files (requires npm install)
```

Tests use `npx` to fetch Vitest on-demand (no install needed). Type checking tests requires installing dev dependencies first.

### Linting

**Requires `npm install` first!**

```bash
npm run lint            # Check for code issues
npm run lint:fix        # Auto-fix code issues
```

ESLint is configured with TypeScript support and will check:
- TypeScript-specific issues
- Unused variables (warnings)
- Code style (semi, quotes)

### Formatting

**Works with `npx` - no install needed!**

```bash
npm run format          # Format all code
npm run format:check    # Check if code is formatted
```

Prettier is configured with:
- Single quotes
- Semicolons required
- 100 character line width
- 2-space indentation
- ES5 trailing commas

## Development Workflow

1. **Make changes**: Edit files in `src/` or `tests/`
2. **Format code**: `npm run format` (no install needed)
3. **Check linting**: `npm run lint:fix` (requires `npm install` first)
4. **Run tests**: `npm test` (no install needed)
5. **Build**: `npm run build` (no install needed)

## Why npx for some but not all?

- **Build, Test & Format**: Use `npx` to avoid local installs - these work immediately
- **Lint**: Requires complex TypeScript parsers/plugins that need `npm install`

This hybrid approach keeps the repo lightweight for CI/CD while still providing full development tools.

## Configuration Files

- `tsconfig.json` - TypeScript compiler options
- `vitest.config.ts` - Test configuration
- `eslint.config.js` - Linting rules (ESLint 9 flat config)
- `.prettierrc` - Code formatting rules
- `.gitignore` - Files excluded from git

## Testing Details

The test suite includes:
- **Client.test.ts**: HTTP client functionality (16 tests)
- **PhlagClient.test.ts**: Core PhlagClient API (24 tests)
- **PhlagClient.cache.test.ts**: Caching system (15 tests)

Total: 55 passing tests with full coverage of public APIs.
