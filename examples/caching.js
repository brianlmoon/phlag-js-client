/**
 * Caching Example
 *
 * Demonstrates using the built-in caching system for improved performance.
 * Shows the difference between cached and non-cached requests.
 */

import { PhlagClient } from '@moonspot/phlag-client';

async function main() {
  console.log('=== Caching Performance Example ===\n');

  // Example 1: Without caching (default)
  console.log('1. Without caching (every call hits the API):');

  const noCacheClient = new PhlagClient({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
    environment: 'production',
    cache: false, // Explicit no caching
  });

  console.log('   Making 3 separate API calls...');
  const start1 = Date.now();

  await noCacheClient.getFlag('feature_checkout');
  await noCacheClient.getFlag('max_items');
  await noCacheClient.getFlag('welcome_message');

  const duration1 = Date.now() - start1;
  console.log(`   Time: ${duration1}ms (3 API requests)\n`);

  // Example 2: With caching enabled
  console.log('2. With caching enabled:');

  const cachedClient = new PhlagClient({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
    environment: 'production',
    cache: true, // Enable caching
    cacheTtl: 300, // Cache for 5 minutes
  });

  console.log('   First request (fetches all flags):');
  const start2 = Date.now();
  await cachedClient.getFlag('feature_checkout');
  const duration2 = Date.now() - start2;
  console.log(`   Time: ${duration2}ms (1 API request for all flags)`);

  console.log('\n   Subsequent requests (from cache):');
  const start3 = Date.now();
  await cachedClient.getFlag('max_items');
  await cachedClient.getFlag('welcome_message');
  await cachedClient.getFlag('price_multiplier');
  const duration3 = Date.now() - start3;
  console.log(`   Time: ${duration3}ms (0 API requests, instant!)\n`);

  // Example 3: Cache information
  console.log('3. Cache information:');
  console.log(`   Enabled: ${cachedClient.isCacheEnabled()}`);
  console.log(`   TTL: ${cachedClient.getCacheTtl()} seconds`);

  const cacheFile = cachedClient.getCacheFile();
  if (cacheFile) {
    console.log(`   File: ${cacheFile}`);
  } else {
    console.log('   File: In-memory only (browser environment)');
  }

  // Example 4: Custom cache location
  console.log('\n4. Custom cache location:');

  const customCacheClient = new PhlagClient({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
    environment: 'production',
    cache: true,
    cacheFile: '/tmp/my-app-phlag-cache.json',
  });

  console.log(`   Custom cache file: ${customCacheClient.getCacheFile()}`);

  // Example 5: Short TTL for near-real-time updates
  console.log('\n5. Short TTL for frequent updates:');

  const shortTtlClient = new PhlagClient({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
    environment: 'production',
    cache: true,
    cacheTtl: 60, // Cache only for 1 minute
  });

  console.log(`   TTL: ${shortTtlClient.getCacheTtl()} seconds`);
  console.log('   Use case: Real-time flag updates with performance boost');

  // Example 6: Clearing cache manually
  console.log('\n6. Manual cache clearing:');

  await cachedClient.getFlag('feature_checkout');
  console.log('   Cache populated with flags');

  await cachedClient.clearCache();
  console.log('   Cache cleared - next request will fetch fresh data');

  // Example 7: Cache recommendations
  console.log('\n7. When to use caching:');
  console.log('   ✓ High-traffic applications');
  console.log('   ✓ Flags checked frequently in the same process');
  console.log('   ✓ Multiple processes sharing cache file');
  console.log('   ✗ Need immediate flag updates');
  console.log('   ✗ Flags change very frequently');
  console.log('   ✗ Temporary/one-off scripts');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
