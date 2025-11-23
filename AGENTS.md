# AGENTS.md - Phlag JavaScript/TypeScript Client

## Project Overview

This is a JavaScript/TypeScript client library for the [Phlag](https://github.com/moonspot/phlag) feature flag management system. It provides a type-safe, performant interface for querying feature flags with built-in caching support.

**Repository**: phlag-js-client  
**Language**: TypeScript (compiles to JavaScript ES modules)  
**License**: BSD 3-Clause  
**Author**: Brian Moon (brian@moonspot.net)  
**Version**: 1.0.0 (Production Ready)

## What is Phlag?

Phlag is a feature flag management system with:
- RESTful API for flag queries
- Web admin interface for flag management
- Temporal control (start/end dates)
- Four flag types: SWITCH (boolean), INTEGER, FLOAT, STRING
- Environment-based flag configuration

This client library connects to a Phlag server to retrieve flag values.

## Project Structure

```
phlag-js-client/
├── src/
│   ├── index.ts              # Main exports
│   ├── PhlagClient.ts        # Primary public API
│   ├── Client.ts             # HTTP wrapper using fetch API
│   ├── cache.ts              # File-based caching utilities (Node.js)
│   ├── types.ts              # TypeScript type definitions
│   └── exceptions/           # Error hierarchy
│       ├── index.ts
│       ├── PhlagError.ts     # Base exception
│       ├── AuthenticationError.ts
│       ├── InvalidFlagError.ts
│       ├── InvalidEnvironmentError.ts
│       └── NetworkError.ts
├── tests/
│   ├── Client.test.ts        # HTTP client tests
│   ├── PhlagClient.test.ts   # Core functionality tests
│   └── PhlagClient.cache.test.ts  # Caching system tests
├── dist/                     # Compiled JavaScript + type declarations
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── LICENSE
└── AGENTS.md                 # This file
```

## Architecture

### Core Components

**1. PhlagClient** (src/PhlagClient.ts)
- Main entry point for developers
- Manages environment, caching, and flag retrieval
- Public methods:
  - `getFlag(name)` - Get any flag value
  - `isEnabled(name)` - Check boolean flags
  - `getEnvironment()` - Get current environment
  - `withEnvironment(env)` - Create new client for different environment
  - `warmCache()` - Preload cache
  - `clearCache()` - Clear cache
  - `isCacheEnabled()`, `getCacheFile()`, `getCacheTtl()` - Cache info

**2. Client** (src/Client.ts)
- HTTP wrapper around fetch API
- Handles authentication (Bearer token)
- Error response mapping to specific exceptions
- Method overloading for single values vs objects
- Timeout handling (default 10 seconds)

**3. Cache System** (src/cache.ts)
- File-based caching for Node.js environments
- Uses MD5 hash of baseUrl + environment for cache filenames
- Lazy-loads Node.js modules (crypto, os, fs) via require()
- TTL-based expiration (default 300 seconds)
- Atomic file writes for data integrity
- Graceful degradation if file operations fail

**4. Exception Hierarchy** (src/exceptions/)
- All extend `PhlagError`
- Specific types for different error conditions
- Makes error handling precise and developer-friendly

### Type System

**FlagValue**: `boolean | number | string | null`
- SWITCH flags return boolean
- INTEGER/FLOAT flags return number or null
- STRING flags return string or null
- Inactive/missing flags return null (or false for SWITCH)

**FlagCache**: `Record<string, FlagValue>`
- Object map of flag names to values
- Used internally for caching all flags

**PhlagClientOptions**: Configuration interface
- baseUrl, apiKey, environment (required)
- timeout, cache, cacheFile, cacheTtl (optional)

## API Endpoints Used

**Single Flag**: `GET /flag/{environment}/{name}`
- Returns scalar value (boolean, number, string, null)
- Used when caching is disabled

**All Flags**: `GET /all-flags/{environment}`
- Returns object with all flags as key-value pairs
- Used when caching is enabled (fetched once per TTL)

**Authentication**: Bearer token in Authorization header
- API key is 64-character cryptographically secure key
- Generated in Phlag admin interface

## Caching Strategy

### When Caching is Disabled (default)
- Each `getFlag()` call makes individual API request
- Network latency: ~10-50ms per call
- No memory overhead
- Always fresh data

### When Caching is Enabled
**First Request:**
1. Client calls `getFlag('some_flag')`
2. Detects cache is null
3. Fetches ALL flags via `/all-flags/{environment}`
4. Stores in memory as `FlagCache` object
5. In Node.js: Writes to file in temp directory
6. Returns requested flag value

**Subsequent Requests:**
1. Client calls `getFlag('another_flag')`
2. Returns value from in-memory cache
3. No API call made
4. Response time: <1ms

**Cache Expiration:**
- File modification time checked against TTL
- If expired, refetch from API
- New cache written to file

**Multi-Process:**
- Each Node.js process can share cache file
- Cache file survives process restarts
- Reduces cold-start API calls

### Cache File Management

**Location**: `{tmpdir}/phlag_cache_{md5hash}.json`
- `tmpdir`: System temp directory (from `os.tmpdir()`)
- `md5hash`: MD5 of `baseUrl|environment`
- Example: `/tmp/phlag_cache_a1b2c3d4e5f6.json`

**Atomic Writes:**
1. Write to temp file: `{cacheFile}.{pid}.tmp`
2. Delete old cache file (if exists)
3. Write to actual cache file
4. Delete temp file
5. Prevents partial writes during concurrent access

**Error Handling:**
- Write failures logged to console.error
- Don't throw exceptions
- Gracefully degrade to in-memory only

## Environment Detection

The library detects Node.js vs browser environments:

```typescript
function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}
```

**In Node.js:**
- File-based caching available
- Uses require() for dynamic module loading

**In Browsers:**
- File caching disabled (useFileCache = false)
- Only in-memory caching available
- Prevents errors from missing Node.js modules

## Testing

**Test Framework**: Vitest (compatible with Jest API)
**Test Count**: 55 passing tests across 3 suites
**Coverage**: All public APIs and major error paths

**Test Suites:**
1. `Client.test.ts` (16 tests)
   - HTTP communication
   - Error response handling
   - Timeout handling
   - Subdirectory URL support

2. `PhlagClient.test.ts` (24 tests)
   - Flag retrieval
   - isEnabled() convenience method
   - Environment switching
   - Error propagation

3. `PhlagClient.cache.test.ts` (15 tests)
   - Cache initialization
   - First request vs subsequent
   - Cache warming/clearing
   - File persistence
   - Multi-instance sharing

**Mocking Strategy:**
- Global `fetch` is mocked via `vi.fn()`
- File system operations tested in Node.js environment
- Cleanup after each test to remove cache files

## Build System

**Compiler**: TypeScript 5.9.3
**Target**: ES2020
**Module**: ESNext (ES modules)
**Output**: dist/ directory

**Generated Files:**
- `.js` - Compiled JavaScript
- `.d.ts` - TypeScript type declarations
- `.map` - Source maps for debugging

**Build Command**: `npm run build`
- Uses npx to run TypeScript compiler
- No local installation of typescript needed (fetched on-demand)

**Type Checking:**
- Strict mode enabled
- All functions have return types
- No unused locals/parameters
- No implicit returns

## Coding Standards

**Style:**
- camelCase for variables, methods, properties
- PascalCase for classes, types, interfaces
- snake_case NOT used (unlike PHP version)
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Max line length: 100 characters

**Documentation:**
- JSDoc comments on all public APIs
- Conversational style (not overly technical)
- Include examples in complex methods
- Use "Note:" or "Heads-up:" for warnings
- Explain "why" not just "what"

**TypeScript:**
- Explicit return types on all functions
- Use `type` for unions, `interface` for objects
- Import types with `import type` syntax
- Avoid `any`, use `unknown` if needed
- Use method overloading for flexible APIs

## Known Limitations

1. **Browser Caching**: Only in-memory, no localStorage implementation yet
2. **Retry Logic**: No automatic retry on network failures
3. **Rate Limiting**: No built-in rate limit handling
4. **Metrics**: No instrumentation/telemetry built-in
5. **Validation**: No client-side flag name validation

## Comparison to PHP Client

This library mirrors the PHP client (`phlag-php-client`) in functionality:

**Similarities:**
- Same API surface (getFlag, isEnabled, withEnvironment)
- Same caching strategy (all-flags endpoint, TTL-based)
- Same error handling approach (specific exception types)
- Same cache file naming (MD5 hash)
- Same defaults (300s TTL, 10s timeout)

**Differences:**
- Async API (JavaScript is async, PHP is sync)
- Uses fetch instead of Guzzle
- No require() at top-level (lazy loaded for Node.js modules)
- camelCase instead of snake_case
- Promise-based instead of direct returns

## Development Workflow

**Install Dependencies:**
```bash
# Note: npm install doesn't work properly in this environment
# Dependencies are fetched on-demand via npx
```

**Build:**
```bash
npm run build
# Runs: npx -y -p typescript@5.9.3 tsc
```

**Test:**
```bash
npm test
# Runs: npx -y vitest@4.0.13 run
```

**Type Check:**
```bash
npx -y -p typescript@5.9.3 tsc --noEmit
```

## Common Issues & Solutions

**Issue**: TypeScript can't find Node.js types
**Solution**: Declare globals in file (see cache.ts)

**Issue**: require() errors in browser
**Solution**: Lazy load with `require()` inside functions, check `isNodeEnvironment()` first

**Issue**: Fetch mocking in tests
**Solution**: Mock `global.fetch` with vitest's `vi.fn()`

**Issue**: Cache files not cleaned up in tests
**Solution**: Use `afterEach` hook to unlink cache files

## Future Enhancements (Not Implemented)

Based on the original plan, these were considered but not implemented:

1. **Browser localStorage caching**
2. **Exponential backoff retry logic**
3. **Request batching**
4. **Metrics/instrumentation hooks**
5. **Debug logging mode**
6. **Integration tests against real Phlag server**
7. **Browser bundle size optimization**

## Important Notes for AI Agents

1. **Do NOT use static imports for Node.js modules** (crypto, os, fs) - use require() and lazy load
2. **Always use async/await** - this is a Promise-based API
3. **Preserve the error hierarchy** - specific exceptions are important for developer experience
4. **Follow existing test patterns** - use vitest globals, mock fetch, cleanup cache files
5. **Keep caching optional** - default should be cache disabled for simplicity
6. **Maintain type safety** - no `any` types, explicit return types
7. **Document in conversational style** - match the tone of existing comments
8. **Build system quirk**: Dependencies don't install normally, use npx -y for on-demand fetching
9. **Cache module uses global declarations** - this is intentional to avoid TypeScript errors
10. **Method overloading in Client.get()** - maintains type safety for scalar vs object returns

## Version History

**1.0.0** (2025-11-23)
- Initial production release
- Phase 1: Core functionality (HTTP client, PhlagClient, error handling)
- Phase 2: Caching system (in-memory + file-based, cache management)
- 55 passing tests
- Complete TypeScript type definitions
- Comprehensive documentation

## Related Projects

- **phlag**: Main Phlag server application (PHP 8.4+)
- **phlag-php-client**: PHP client library (same functionality)

## Contact

**Author**: Brian Moon  
**Email**: brian@moonspot.net  
**License**: BSD 3-Clause
