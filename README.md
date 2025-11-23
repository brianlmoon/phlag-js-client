# Phlag Client

[![CI](https://github.com/moonspot/phlag-js-client/actions/workflows/ci.yml/badge.svg)](https://github.com/moonspot/phlag-js-client/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@moonspot%2Fphlag-client.svg)](https://www.npmjs.com/package/@moonspot/phlag-client)
[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](LICENSE)

**JavaScript/TypeScript client library for the Phlag feature flag management system**

This library provides a simple, type-safe interface for querying feature flags from a [Phlag](https://github.com/brianlmoon/phlag) server. It handles authentication, environment management, error handling, and caching so you can focus on feature rollouts.

## Features

- 🎯 **Type-safe flag retrieval** - Get boolean, number, or string values with full TypeScript support
- 🌐 **Environment-aware** - Configure once, query a specific environment
- 🔄 **Immutable environment switching** - Easy multi-environment queries
- ⚡ **Simple API** - Clean, fluent interface with convenience methods
- 🛡️ **Robust error handling** - Specific exceptions for different error conditions
- 💾 **Built-in caching** - Optional file-based (Node.js) and in-memory caching
- ✅ **Fully tested** - Comprehensive test coverage with Vitest (55 passing tests)

## Requirements

- Node.js 18.0.0 or higher
- A running Phlag server instance

## Installation

```bash
npm install @moonspot/phlag-client
```

## Quick Start

```typescript
import { PhlagClient } from '@moonspot/phlag-client';

// Create a client for a specific environment
const client = new PhlagClient({
  baseUrl: 'http://localhost:8000',
  apiKey: 'your-64-character-api-key',
  environment: 'production',
});

// Check if a feature is enabled
if (await client.isEnabled('feature_checkout')) {
  // Show the new checkout flow
}

// Get typed configuration values
const maxItems = await client.getFlag('max_items'); // returns number or null
const priceMultiplier = await client.getFlag('price_multiplier'); // returns number or null
const welcomeMessage = await client.getFlag('welcome_message'); // returns string or null
```

## Examples

The `examples/` directory contains practical usage examples:

- **basic.js/ts** - Simple feature flag checks
- **multi-environment.js** - Querying flags across environments
- **caching.js** - Performance optimization with caching
- **cache-warming.js** - Preloading cache at startup
- **error-handling.js** - Handling different error types
- **configuration.js** - Advanced configuration options

See [examples/README.md](examples/README.md) for details on running examples.

## Performance & Caching

For high-traffic applications, enable caching to dramatically reduce API calls:

```typescript
const client = new PhlagClient({
  baseUrl: 'http://localhost:8000',
  apiKey: 'your-api-key',
  environment: 'production',
  cache: true,           // Enable caching
  cacheTtl: 300,         // Cache for 5 minutes (default)
});

// First call fetches all flags from API (1 request)
const enabled = await client.isEnabled('feature_checkout');

// Subsequent calls use cached data (0 requests)
const max = await client.getFlag('max_items');
const price = await client.getFlag('price_multiplier');
```

### How Caching Works

When caching is enabled:
1. **First request**: Client fetches ALL flags for the environment via `/all-flags` endpoint
2. **Cache storage**: Flags stored in memory AND persisted to disk (Node.js)
3. **Subsequent requests**: Served from in-memory cache (no API calls)
4. **Cache expiration**: After TTL expires, next request refreshes from API
5. **Cross-request persistence**: Cache file survives between Node.js process restarts

### Cache Management

**Warming the cache** (preload before first request):

```typescript
await client.warmCache();  // Immediately fetches and caches all flags
```

**Clearing the cache** (force fresh fetch):

```typescript
await client.clearCache();  // Removes cache file and in-memory data

// Next request will fetch fresh from API
const value = await client.getFlag('feature');
```

**Checking cache status:**

```typescript
if (client.isCacheEnabled()) {
  console.log('Cache file:', client.getCacheFile());
  console.log('TTL:', client.getCacheTtl(), 'seconds');
}
```

### When to Use Caching

**✅ Good use cases:**
- High-traffic applications with frequent flag checks
- Flags that change infrequently (hourly, daily)
- Reducing API load and network latency
- Improving response times (sub-millisecond flag checks)

**❌ When to avoid caching:**
- You need real-time flag updates (seconds matter)
- Flags change very frequently
- Low-traffic applications (caching overhead not worth it)
- Single flag check per request

### Performance Impact

**Without caching:**
- API calls: N (one per `getFlag()` call)
- Network overhead: ~10-50ms per call
- Total overhead: N × 10-50ms

**With caching:**
- API calls: 1 per TTL period (default 5 minutes)
- First request: ~10-50ms (fetch all flags)
- Subsequent requests: <1ms (memory lookup)
- Cache file I/O: ~1-2ms on first load per process

**Example savings** (100 flag checks per request, 1000 requests/minute):
- Without cache: 100,000 API calls/minute
- With cache (300s TTL): ~20 API calls/minute (99.98% reduction)

## API Reference

### PhlagClient

#### `constructor(options: PhlagClientOptions)`

Creates a new client instance.

**Parameters:**
- `options.baseUrl` - Base URL of your Phlag server (e.g., `http://localhost:8000`)
- `options.apiKey` - 64-character API key from the Phlag admin panel
- `options.environment` - Environment name (e.g., `production`, `staging`, `development`)
- `options.timeout` - Request timeout in milliseconds (default: `10000`)
- `options.cache` - Enable caching (default: `false`)
- `options.cacheFile` - Custom cache file path (default: auto-generated in temp dir)
- `options.cacheTtl` - Cache time-to-live in seconds (default: `300`)

#### `async getFlag(name: string): Promise<FlagValue>`

Retrieves a flag value.

**Returns:** The flag value (boolean, number, string, or null)

**Throws:**
- `AuthenticationError` - Invalid API key
- `InvalidFlagError` - Flag doesn't exist (cache disabled only)
- `InvalidEnvironmentError` - Environment doesn't exist  
- `NetworkError` - Network communication failed
- `PhlagError` - Other errors

#### `async isEnabled(name: string): Promise<boolean>`

Convenience method for checking SWITCH flags.

**Returns:** `true` if the flag value is boolean `true`, `false` otherwise

#### `getEnvironment(): string`

Gets the current environment name.

#### `withEnvironment(environment: string): PhlagClient`

Creates a new client for a different environment (immutable pattern).

#### `async warmCache(): Promise<void>`

Preloads the flag cache immediately. No-op if caching is disabled.

#### `async clearCache(): Promise<void>`

Clears in-memory and file cache. No-op if caching is disabled.

#### `isCacheEnabled(): boolean`

Checks if caching is enabled.

#### `getCacheFile(): string`

Gets the cache file path (even if file doesn't exist yet).

#### `getCacheTtl(): number`

Gets the cache TTL in seconds.

## Error Handling

The client throws specific exceptions for different error conditions:

```typescript
import {
  PhlagError,
  AuthenticationError,
  InvalidFlagError,
  NetworkError,
} from '@moonspot/phlag-client';

try {
  const value = await client.getFlag('my_flag');
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid API key (401)
    console.error('Bad API key:', error.message);
  } else if (error instanceof InvalidFlagError) {
    // Flag doesn't exist (404) - only when cache disabled
    console.error('Flag not found:', error.message);
  } else if (error instanceof NetworkError) {
    // Connection failed, timeout, etc.
    console.error('Network error:', error.message);
  } else if (error instanceof PhlagError) {
    // Other errors
    console.error('Phlag error:', error.message);
  }
}
```

All exceptions extend `PhlagError`, so you can catch them all with a single block if needed.

## Working with Multiple Environments

You can switch environments without creating new client instances:

```typescript
const prodClient = new PhlagClient({
  baseUrl: 'http://phlag.example.com',
  apiKey: 'your-api-key',
  environment: 'production',
  cache: true,
});

// Create a new client for staging (immutable pattern)
const stagingClient = prodClient.withEnvironment('staging');

// Each has its own cache
console.log(prodClient.getEnvironment());    // "production"
console.log(stagingClient.getEnvironment()); // "staging"

// Query both environments
const prodEnabled = await prodClient.isEnabled('feature_beta');
const stagingEnabled = await stagingClient.isEnabled('feature_beta');
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Project Status

This library is **production-ready** with both Phase 1 and Phase 2 complete:

**Phase 1 - Core Functionality:**
- ✅ TypeScript project setup
- ✅ HTTP client with fetch API
- ✅ Error handling with specific exception types
- ✅ PhlagClient with getFlag() and isEnabled()
- ✅ Comprehensive test suite
- ✅ TypeScript type definitions

**Phase 2 - Caching:**
- ✅ In-memory caching
- ✅ File-based caching (Node.js)
- ✅ Cache management methods
- ✅ TTL configuration
- ✅ Cache tests

## Troubleshooting

### Stale Cache Data

If you're seeing outdated flag values when caching is enabled:

**Problem:** Cache hasn't expired yet  
**Solutions:**
1. Use shorter TTL: `new PhlagClient({ ..., cache: true, cacheTtl: 60 })`
2. Manually clear: `await client.clearCache()`
3. Disable caching if you need real-time updates

### Cache File Permissions

If cache files aren't being created:

**Problem:** No write permission to temp directory or custom cache path  
**Solution:** Ensure Node.js has write access to the cache directory

```typescript
const cacheFile = client.getCacheFile();
const cacheDir = require('path').dirname(cacheFile);
console.log('Cache directory:', cacheDir);
```

Note: Cache write failures are logged but don't throw exceptions. The client gracefully degrades to in-memory-only caching.

## License

BSD 3-Clause License

Copyright (c) 2025, Brian Moon

## Development

This project uses ESLint for linting and Prettier for code formatting. See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development setup, available scripts, and workflow guidelines.

Quick commands:
- `npm run build` - Compile TypeScript
- `npm test` - Run test suite
- `npm run format` - Format code with Prettier
- `npm run lint` - Check code with ESLint (requires `npm install`)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Setting up your development environment
- Coding standards and style guide
- Testing requirements
- Pull request process

## Credits

Built by Brian Moon (brian@moonspot.net)

## Support

For bugs and feature requests, please use the GitHub issue tracker.

For questions, contact brian@moonspot.net.
