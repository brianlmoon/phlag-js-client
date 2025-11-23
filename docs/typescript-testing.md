# TypeScript Test Configuration

This document explains the TypeScript configuration for test files.

## Overview

The project has two TypeScript configurations:

1. **`tsconfig.json`** - For source code (`src/`)
2. **`tsconfig.test.json`** - For test files (`tests/`)

## Why Separate Configurations?

Test files have different requirements than production code:

- **Less strict**: Tests can use `any` when mocking
- **No output**: Tests don't need to be compiled to `dist/`
- **Broader includes**: Can import from both `src/` and `tests/`
- **Lenient rules**: Allows unused parameters in test utilities

## Configuration Differences

### Production Code (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["tests"]
}
```

**Purpose**: Strict type checking for production code.

### Test Code (`tsconfig.test.json`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,              // Don't compile tests
    "noUnusedLocals": false,     // Allow unused variables in tests
    "noUnusedParameters": false, // Allow unused params in mocks
    "noImplicitReturns": false,  // Test utilities can have implicit returns
    "noImplicitAny": false,      // Can use 'any' when mocking
    "rootDir": ".",              // Include both src and tests
    "moduleResolution": "node"   // Better IDE support
  },
  "include": ["tests/**/*", "src/**/*"]
}
```

**Purpose**: More lenient type checking for test files while maintaining safety.

## Type Checking

### Check Production Code

```bash
npm run build
```

This uses `tsconfig.json` with strict rules.

### Check Test Code

**Requires `npm install` first!**

```bash
npm run test:types
```

This uses `tsconfig.test.json` to type-check test files.

### Check Both

```bash
npm run build && npm run test:types
```

## IDE Support

Most IDEs (VS Code, WebStorm, etc.) will automatically use:

- `tsconfig.json` for files in `src/`
- `tsconfig.test.json` for files in `tests/`

This provides appropriate IntelliSense and error checking for each context.

## Common Patterns in Tests

### Using `any` for Mocks

```typescript
// ✅ Allowed in tests (not in src/)
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => true as any, // OK in tests
});
```

### Unused Parameters in Test Utilities

```typescript
// ✅ Allowed in tests
function setupTest(_config?: any) {
  // Parameter intentionally unused
  return new PhlagClient({ ... });
}
```

### Global Variables

```typescript
// ✅ Tests can use global.fetch, global.process
global.fetch = vi.fn();
```

## Limitations

The `test:types` script requires `npm install` because:

1. TypeScript needs to be installed locally
2. Type definitions for `vitest` and `@types/node` are required
3. npx can't provide these types on-the-fly

**For CI/CD**: The dependencies are already installed, so `npm run test:types` works.

**For local development**: Run `npm install` once to enable type checking.

## Benefits

### For Production Code

- ✅ Strict type checking
- ✅ Catches type errors early
- ✅ No unused code warnings
- ✅ Full type safety

### For Test Code

- ✅ Type-aware IntelliSense
- ✅ Catch major type errors
- ✅ Flexible for mocking
- ✅ Easier to write tests

## Best Practices

### Do Use Strict Types in Tests

```typescript
// ✅ Good - Type-safe even in tests
const client: PhlagClient = new PhlagClient({ ... });
const result: boolean = await client.isEnabled('flag');
```

### Use `any` Only for Mocks

```typescript
// ✅ OK - Mock data can be 'any'
const mockResponse = { data: 'anything' } as any;

// ❌ Avoid - Don't overuse 'any'
const client = new PhlagClient({ ... } as any);
```

### Keep Test Utilities Typed

```typescript
// ✅ Good - Helper has types
function createTestClient(env: string): PhlagClient {
  return new PhlagClient({ ... });
}

// ❌ Avoid - Untyped helper
function createTestClient(env) {
  return new PhlagClient({ ... });
}
```

## Summary

- **Production**: Strict types with `tsconfig.json`
- **Tests**: Lenient types with `tsconfig.test.json`
- **Type checking**: `npm run test:types` (after `npm install`)
- **Purpose**: Balance type safety with test flexibility
